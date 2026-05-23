import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createServer } from "../src/server.js";

const fixedNow = new Date("2026-05-23T03:00:00.000Z");

describe("Incident Response Center API", () => {
  let server;
  let baseUrl;
  const notifications = [];

  before(async () => {
    server = createServer({
      clock: () => fixedNow,
      notifier: {
        async sendSlaReminder(incident, actor) {
          notifications.push({ incidentId: incident.id, tenantId: incident.tenantId, actor });
        }
      }
    });
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("creates, lists, reads, assigns, resolves, and audits incidents inside one tenant", async () => {
    const created = await request("POST", "/api/incidents", adminHeaders("tenant-a"), {
      title: "Database failover",
      severity: "critical",
      assigneeEmail: "dba@example.com",
      slaDueAt: "2026-05-23T03:45:00.000Z"
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.tenantId, "tenant-a");
    assert.equal(created.body.status, "open");

    const listed = await request("GET", "/api/incidents", adminHeaders("tenant-a"));
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.body.incidents.map((incident) => incident.id), [created.body.id]);

    const read = await request("GET", `/api/incidents/${created.body.id}`, adminHeaders("tenant-a"));
    assert.equal(read.status, 200);
    assert.equal(read.body.title, "Database failover");

    const assigned = await request("PATCH", `/api/incidents/${created.body.id}/assign`, responderHeaders("tenant-a"), {
      assigneeEmail: "primary@example.com"
    });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.assigneeEmail, "primary@example.com");

    const investigating = await request("PATCH", `/api/incidents/${created.body.id}/status`, responderHeaders("tenant-a"), {
      status: "investigating"
    });
    assert.equal(investigating.status, 200);
    assert.equal(investigating.body.status, "investigating");

    const resolved = await request("PATCH", `/api/incidents/${created.body.id}/status`, adminHeaders("tenant-a"), {
      status: "resolved"
    });
    assert.equal(resolved.status, 200);
    assert.equal(resolved.body.resolvedAt, fixedNow.toISOString());

    const audit = await request("GET", "/api/audit-log", adminHeaders("tenant-a"));
    assert.equal(audit.status, 200);
    assert.deepEqual(
      audit.body.entries.map((entry) => entry.action),
      ["create", "assign", "status_change", "status_change"]
    );
  });

  it("validates create payloads and allowed status transitions", async () => {
    const invalidCreate = await request("POST", "/api/incidents", adminHeaders("tenant-a"), {
      title: "",
      severity: "urgent",
      slaDueAt: "not-a-date"
    });
    assert.equal(invalidCreate.status, 400);
    assert.equal(invalidCreate.body.error.code, "VALIDATION_ERROR");

    const incident = await createIncident("tenant-a", "Bad transition", "high", "2026-05-23T03:30:00.000Z");
    const invalidTransition = await request("PATCH", `/api/incidents/${incident.id}/status`, adminHeaders("tenant-a"), {
      status: "open"
    });
    assert.equal(invalidTransition.status, 400);
    assert.equal(invalidTransition.body.error.code, "INVALID_STATUS_TRANSITION");
  });

  it("enforces RBAC for viewer, responder resolve, audit, create, and job operations", async () => {
    const incident = await createIncident("tenant-a", "RBAC incident", "medium", "2026-05-23T03:30:00.000Z");

    const viewerCreate = await request("POST", "/api/incidents", viewerHeaders("tenant-a"), {
      title: "Viewer create",
      severity: "low",
      slaDueAt: "2026-05-23T03:30:00.000Z"
    });
    assert.equal(viewerCreate.status, 403);

    const viewerRead = await request("GET", `/api/incidents/${incident.id}`, viewerHeaders("tenant-a"));
    assert.equal(viewerRead.status, 200);

    const viewerAssign = await request("PATCH", `/api/incidents/${incident.id}/assign`, viewerHeaders("tenant-a"), {
      assigneeEmail: "viewer@example.com"
    });
    assert.equal(viewerAssign.status, 403);

    const responderResolve = await request("PATCH", `/api/incidents/${incident.id}/status`, responderHeaders("tenant-a"), {
      status: "resolved"
    });
    assert.equal(responderResolve.status, 403);

    const responderAudit = await request("GET", "/api/audit-log", responderHeaders("tenant-a"));
    assert.equal(responderAudit.status, 403);

    const responderJob = await request("POST", "/api/jobs/sla-reminders/run", responderHeaders("tenant-a"));
    assert.equal(responderJob.status, 403);
  });

  it("isolates tenants for list, read, audit, and SLA reminders", async () => {
    const tenantAIncident = await createIncident("tenant-a", "Tenant A incident", "high", "2026-05-23T03:30:00.000Z");
    const tenantBIncident = await createIncident("tenant-b", "Tenant B incident", "critical", "2026-05-23T03:30:00.000Z");

    const tenantBList = await request("GET", "/api/incidents", adminHeaders("tenant-b"));
    assert.equal(tenantBList.status, 200);
    assert(tenantBList.body.incidents.every((incident) => incident.tenantId === "tenant-b"));
    assert(tenantBList.body.incidents.some((incident) => incident.id === tenantBIncident.id));
    assert(!tenantBList.body.incidents.some((incident) => incident.id === tenantAIncident.id));

    const crossTenantRead = await request("GET", `/api/incidents/${tenantAIncident.id}`, adminHeaders("tenant-b"));
    assert.equal(crossTenantRead.status, 404);

    const before = notifications.length;
    const tenantBJob = await request("POST", "/api/jobs/sla-reminders/run", adminHeaders("tenant-b"));
    assert.equal(tenantBJob.status, 200);
    assert.equal(tenantBJob.body.incidents.some((incident) => incident.tenantId !== "tenant-b"), false);
    assert(notifications.slice(before).every((notification) => notification.tenantId === "tenant-b"));

    const tenantBAudit = await request("GET", "/api/audit-log", adminHeaders("tenant-b"));
    assert.equal(tenantBAudit.status, 200);
    assert(tenantBAudit.body.entries.every((entry) => entry.tenantId === "tenant-b"));
  });

  it("runs SLA reminder job only for unresolved incidents due within one hour and does not duplicate reminders", async () => {
    const due = await createIncident("tenant-reminders", "Due soon", "critical", "2026-05-23T03:30:00.000Z");
    await createIncident("tenant-reminders", "Later", "medium", "2026-05-23T05:01:00.000Z");
    const resolved = await createIncident("tenant-reminders", "Already resolved", "high", "2026-05-23T03:20:00.000Z");
    await request("PATCH", `/api/incidents/${resolved.id}/status`, adminHeaders("tenant-reminders"), { status: "resolved" });

    const firstRun = await request("POST", "/api/jobs/sla-reminders/run", adminHeaders("tenant-reminders"));
    assert.equal(firstRun.status, 200);
    assert.equal(firstRun.body.reminded, 1);
    assert.deepEqual(firstRun.body.incidents.map((incident) => incident.id), [due.id]);

    const secondRun = await request("POST", "/api/jobs/sla-reminders/run", adminHeaders("tenant-reminders"));
    assert.equal(secondRun.status, 200);
    assert.equal(secondRun.body.reminded, 0);

    assert.equal(notifications.filter((notification) => notification.incidentId === due.id).length, 1);

    const audit = await request("GET", "/api/audit-log", adminHeaders("tenant-reminders"));
    assert.equal(audit.body.entries.filter((entry) => entry.action === "reminder").length, 1);
  });

  it("serves health and the static frontend", async () => {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).variant, "superpowers");

    const frontend = await fetch(`${baseUrl}/`);
    const html = await frontend.text();
    assert.equal(frontend.status, 200);
    assert.match(html, /Incident Response Center/);
    assert.match(html, /Audit Log/);
  });

  async function createIncident(tenantId, title, severity, slaDueAt) {
    const response = await request("POST", "/api/incidents", adminHeaders(tenantId), {
      title,
      severity,
      assigneeEmail: "oncall@example.com",
      slaDueAt
    });
    assert.equal(response.status, 201);
    return response.body;
  }

  async function request(method, path, headers, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const contentType = response.headers.get("content-type") ?? "";
    const parsedBody = contentType.includes("application/json") ? await response.json() : await response.text();
    return { status: response.status, body: parsedBody };
  }
});

function adminHeaders(tenantId) {
  return { "x-tenant-id": tenantId, "x-user-id": `${tenantId}-admin`, "x-role": "admin" };
}

function responderHeaders(tenantId) {
  return { "x-tenant-id": tenantId, "x-user-id": `${tenantId}-responder`, "x-role": "responder" };
}

function viewerHeaders(tenantId) {
  return { "x-tenant-id": tenantId, "x-user-id": `${tenantId}-viewer`, "x-role": "viewer" };
}
