import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer, createMemoryStore } from "../src/server.js";

const ADMIN = {
  "x-tenant-id": "tenant-a",
  "x-user-id": "admin-1",
  "x-role": "admin",
};
const RESPONDER = {
  "x-tenant-id": "tenant-a",
  "x-user-id": "responder-1",
  "x-role": "responder",
};
const VIEWER = {
  "x-tenant-id": "tenant-a",
  "x-user-id": "viewer-1",
  "x-role": "viewer",
};
const TENANT_B_ADMIN = {
  "x-tenant-id": "tenant-b",
  "x-user-id": "admin-2",
  "x-role": "admin",
};

function makeHarness(options = {}) {
  const sentReminders = [];
  const store = createMemoryStore();
  const server = createServer({
    store,
    now: options.now ?? (() => new Date("2026-05-23T03:00:00.000Z")),
    notifier: options.notifier ?? {
      async sendSlaReminder(incident) {
        sentReminders.push(incident);
      },
    },
  });

  return {
    store,
    sentReminders,
    server,
    async start() {
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const { port } = server.address();
      return `http://127.0.0.1:${port}`;
    },
    async stop() {
      await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

async function request(baseUrl, method, path, headers, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...headers,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function createIncident(baseUrl, headers = ADMIN, overrides = {}) {
  return request(baseUrl, "POST", "/api/incidents", headers, {
    title: "Database failover",
    severity: "critical",
    assigneeEmail: "ops@example.com",
    slaDueAt: "2026-05-23T03:30:00.000Z",
    ...overrides,
  });
}

describe("Incident Response Center API", () => {
  let harness;
  let baseUrl;

  before(async () => {
    harness = makeHarness();
    baseUrl = await harness.start();
  });

  after(async () => {
    await harness.stop();
  });

  it("reports health for the sgad variant", async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, variant: "sgad" });
  });

  it("creates an incident with validation and writes audit evidence", async () => {
    const invalid = await request(baseUrl, "POST", "/api/incidents", ADMIN, {
      title: "",
      severity: "urgent",
      slaDueAt: "not-a-date",
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.data.error.code, "VALIDATION_ERROR");

    const created = await createIncident(baseUrl);
    assert.equal(created.status, 201);
    assert.equal(created.data.incident.tenantId, "tenant-a");
    assert.equal(created.data.incident.status, "open");

    const audit = await request(baseUrl, "GET", "/api/audit-log", ADMIN);
    assert.equal(audit.status, 200);
    assert.equal(audit.data.auditLog.length, 1);
    assert.equal(audit.data.auditLog[0].action, "incident.created");
  });

  it("enforces tenant isolation for list and read operations", async () => {
    const tenantB = await createIncident(baseUrl, TENANT_B_ADMIN, {
      title: "Tenant B incident",
      severity: "medium",
      assigneeEmail: "b@example.com",
    });
    assert.equal(tenantB.status, 201);

    const listA = await request(baseUrl, "GET", "/api/incidents", ADMIN);
    assert.equal(listA.status, 200);
    assert.ok(listA.data.incidents.every((incident) => incident.tenantId === "tenant-a"));
    assert.ok(!listA.data.incidents.some((incident) => incident.id === tenantB.data.incident.id));

    const crossTenantRead = await request(baseUrl, "GET", `/api/incidents/${tenantB.data.incident.id}`, ADMIN);
    assert.equal(crossTenantRead.status, 404);
  });

  it("enforces role permissions", async () => {
    const viewerCreate = await createIncident(baseUrl, VIEWER, { title: "Viewer attempt" });
    assert.equal(viewerCreate.status, 403);

    const created = await createIncident(baseUrl, ADMIN, { title: "Viewer read target" });
    const viewerRead = await request(baseUrl, "GET", `/api/incidents/${created.data.incident.id}`, VIEWER);
    assert.equal(viewerRead.status, 200);

    const viewerAssign = await request(baseUrl, "PATCH", `/api/incidents/${created.data.incident.id}/assign`, VIEWER, {
      assigneeEmail: "new@example.com",
    });
    assert.equal(viewerAssign.status, 403);
  });

  it("updates assignee and status only through allowed transitions", async () => {
    const created = await createIncident(baseUrl, ADMIN, { title: "Status transition target" });
    const id = created.data.incident.id;

    const assigned = await request(baseUrl, "PATCH", `/api/incidents/${id}/assign`, RESPONDER, {
      assigneeEmail: "responder@example.com",
    });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.data.incident.assigneeEmail, "responder@example.com");

    const invalid = await request(baseUrl, "PATCH", `/api/incidents/${id}/status`, RESPONDER, {
      status: "open",
    });
    assert.equal(invalid.status, 409);

    const investigating = await request(baseUrl, "PATCH", `/api/incidents/${id}/status`, RESPONDER, {
      status: "investigating",
    });
    assert.equal(investigating.status, 200);
    assert.equal(investigating.data.incident.status, "investigating");

    const resolved = await request(baseUrl, "PATCH", `/api/incidents/${id}/status`, ADMIN, {
      status: "resolved",
    });
    assert.equal(resolved.status, 200);
    assert.equal(resolved.data.incident.status, "resolved");
    assert.ok(resolved.data.incident.resolvedAt);

    const audit = await request(baseUrl, "GET", "/api/audit-log", ADMIN);
    const actionsForIncident = audit.data.auditLog
      .filter((entry) => entry.incidentId === id)
      .map((entry) => entry.action);
    assert.deepEqual(actionsForIncident, [
      "incident.created",
      "incident.assigned",
      "incident.status_changed",
      "incident.status_changed",
    ]);
  });

  it("runs SLA reminders with injectable notifier and no duplicates", async () => {
    const dedicated = makeHarness();
    const dedicatedBaseUrl = await dedicated.start();
    try {
      const due = await createIncident(dedicatedBaseUrl, ADMIN, {
        title: "Due soon",
        slaDueAt: "2026-05-23T03:45:00.000Z",
      });
      const later = await createIncident(dedicatedBaseUrl, ADMIN, {
        title: "Due later",
        slaDueAt: "2026-05-23T05:30:00.000Z",
      });
      assert.equal(due.status, 201);
      assert.equal(later.status, 201);

      const firstRun = await request(dedicatedBaseUrl, "POST", "/api/jobs/sla-reminders/run", ADMIN, {});
      assert.equal(firstRun.status, 200);
      assert.deepEqual(firstRun.data.remindedIncidentIds, [due.data.incident.id]);
      assert.equal(dedicated.sentReminders.length, 1);

      const secondRun = await request(dedicatedBaseUrl, "POST", "/api/jobs/sla-reminders/run", ADMIN, {});
      assert.equal(secondRun.status, 200);
      assert.equal(secondRun.data.remindedCount, 0);
      assert.equal(dedicated.sentReminders.length, 1);

      const audit = await request(dedicatedBaseUrl, "GET", "/api/audit-log", ADMIN);
      assert.ok(audit.data.auditLog.some((entry) => entry.action === "incident.sla_reminder_sent"));
    } finally {
      await dedicated.stop();
    }
  });
});
