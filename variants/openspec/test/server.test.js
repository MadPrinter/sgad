import test from "node:test";
import assert from "node:assert/strict";
import { createServer, createMemoryStore } from "../src/server.js";

const fixedNow = new Date("2026-05-23T03:00:00.000Z");

async function withServer(t, options = {}) {
  const server = createServer({
    store: createMemoryStore(),
    now: () => fixedNow,
    notifier: {
      async sendSlaReminder() {}
    },
    ...options
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  return {
    request(path, { tenantId = "tenant-a", userId = "user-1", role = "admin", method = "GET", body } = {}) {
      return fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId,
          "x-role": role
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    }
  };
}

async function json(response) {
  return response.json();
}

test("creates, lists, reads, and audits incidents within one tenant", async (t) => {
  const client = await withServer(t);

  const createResponse = await client.request("/api/incidents", {
    method: "POST",
    body: { title: "Payments outage", severity: "critical", assigneeEmail: "Lead@Example.com" }
  });
  assert.equal(createResponse.status, 201);
  const { incident } = await json(createResponse);
  assert.equal(incident.tenantId, "tenant-a");
  assert.equal(incident.status, "open");
  assert.equal(incident.assigneeEmail, "lead@example.com");
  assert.equal(incident.slaDueAt, "2026-05-23T04:00:00.000Z");

  const listResponse = await client.request("/api/incidents");
  assert.equal(listResponse.status, 200);
  const { incidents } = await json(listResponse);
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].id, incident.id);

  const readResponse = await client.request(`/api/incidents/${incident.id}`);
  assert.equal(readResponse.status, 200);
  assert.equal((await json(readResponse)).incident.title, "Payments outage");

  const auditResponse = await client.request("/api/audit-log");
  assert.equal(auditResponse.status, 200);
  const { events } = await json(auditResponse);
  assert.deepEqual(events.map((event) => event.action), ["incident.created"]);
});

test("enforces tenant isolation for reads, writes, and audit log", async (t) => {
  const client = await withServer(t);

  const createA = await client.request("/api/incidents", {
    tenantId: "tenant-a",
    method: "POST",
    body: { title: "Tenant A issue", severity: "high" }
  });
  const incidentA = (await json(createA)).incident;

  const createB = await client.request("/api/incidents", {
    tenantId: "tenant-b",
    userId: "user-2",
    method: "POST",
    body: { title: "Tenant B issue", severity: "low" }
  });
  const incidentB = (await json(createB)).incident;

  const listA = await json(await client.request("/api/incidents", { tenantId: "tenant-a" }));
  assert.deepEqual(listA.incidents.map((incident) => incident.id), [incidentA.id]);

  const crossRead = await client.request(`/api/incidents/${incidentB.id}`, { tenantId: "tenant-a" });
  assert.equal(crossRead.status, 404);

  const crossAssign = await client.request(`/api/incidents/${incidentB.id}/assign`, {
    tenantId: "tenant-a",
    method: "PATCH",
    body: { assigneeEmail: "wrong@example.com" }
  });
  assert.equal(crossAssign.status, 404);

  const auditA = await json(await client.request("/api/audit-log", { tenantId: "tenant-a" }));
  assert.equal(auditA.events.length, 1);
  assert.equal(auditA.events[0].incidentId, incidentA.id);
});

test("applies RBAC for admin, responder, and viewer", async (t) => {
  const client = await withServer(t);
  const created = await json(await client.request("/api/incidents", {
    method: "POST",
    body: { title: "Database failover", severity: "medium" }
  }));

  const viewerCreate = await client.request("/api/incidents", {
    role: "viewer",
    method: "POST",
    body: { title: "Blocked create", severity: "low" }
  });
  assert.equal(viewerCreate.status, 403);

  const viewerRead = await client.request(`/api/incidents/${created.incident.id}`, { role: "viewer" });
  assert.equal(viewerRead.status, 200);

  const viewerAssign = await client.request(`/api/incidents/${created.incident.id}/assign`, {
    role: "viewer",
    method: "PATCH",
    body: { assigneeEmail: "viewer@example.com" }
  });
  assert.equal(viewerAssign.status, 403);

  const responderAssign = await client.request(`/api/incidents/${created.incident.id}/assign`, {
    role: "responder",
    method: "PATCH",
    body: { assigneeEmail: "responder@example.com" }
  });
  assert.equal(responderAssign.status, 200);

  const responderCreate = await client.request("/api/incidents", {
    role: "responder",
    method: "POST",
    body: { title: "Blocked responder create", severity: "low" }
  });
  assert.equal(responderCreate.status, 403);

  const responderAudit = await client.request("/api/audit-log", { role: "responder" });
  assert.equal(responderAudit.status, 403);
});

test("validates create payload and allowed status transitions", async (t) => {
  const client = await withServer(t);

  const invalid = await client.request("/api/incidents", {
    method: "POST",
    body: { title: "no", severity: "urgent" }
  });
  assert.equal(invalid.status, 400);

  const created = await json(await client.request("/api/incidents", {
    method: "POST",
    body: { title: "Cache saturation", severity: "high" }
  }));

  const investigating = await client.request(`/api/incidents/${created.incident.id}/status`, {
    method: "PATCH",
    body: { status: "investigating" }
  });
  assert.equal(investigating.status, 200);
  assert.equal((await json(investigating)).incident.status, "investigating");

  const invalidTransition = await client.request(`/api/incidents/${created.incident.id}/status`, {
    method: "PATCH",
    body: { status: "open" }
  });
  assert.equal(invalidTransition.status, 409);

  const resolved = await client.request(`/api/incidents/${created.incident.id}/status`, {
    method: "PATCH",
    body: { status: "resolved" }
  });
  assert.equal(resolved.status, 200);
  assert.equal((await json(resolved)).incident.resolvedAt, "2026-05-23T03:00:00.000Z");
});

test("runs SLA reminder job with injectable notifier and no duplicate reminders", async (t) => {
  const sent = [];
  const client = await withServer(t, {
    notifier: {
      async sendSlaReminder(message) {
        sent.push(message);
      }
    }
  });

  const dueSoon = await json(await client.request("/api/incidents", {
    method: "POST",
    body: {
      title: "Critical API incident",
      severity: "critical",
      assigneeEmail: "ops@example.com",
      slaDueAt: "2026-05-23T03:30:00.000Z"
    }
  }));
  await client.request("/api/incidents", {
    method: "POST",
    body: {
      title: "Later incident",
      severity: "low",
      slaDueAt: "2026-05-23T06:30:00.000Z"
    }
  });

  const firstRun = await client.request("/api/jobs/sla-reminders/run", { method: "POST", body: {} });
  assert.equal(firstRun.status, 200);
  assert.deepEqual(await json(firstRun), {
    remindedCount: 1,
    remindedIncidentIds: [dueSoon.incident.id]
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].tenantId, "tenant-a");
  assert.equal(sent[0].incidentId, dueSoon.incident.id);

  const secondRun = await json(await client.request("/api/jobs/sla-reminders/run", { method: "POST", body: {} }));
  assert.equal(secondRun.remindedCount, 0);
  assert.equal(sent.length, 1);

  const audit = await json(await client.request("/api/audit-log"));
  assert.ok(audit.events.some((event) => event.action === "incident.sla_reminder_sent"));
});
