import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_ROLES = new Set(["admin", "responder", "viewer"]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_STATUSES = new Set(["open", "investigating", "resolved"]);
const ALLOWED_TRANSITIONS = new Set([
  "open->investigating",
  "investigating->resolved",
  "open->resolved",
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createMemoryStore() {
  return {
    nextIncidentId: 1,
    nextAuditId: 1,
    incidents: new Map(),
    auditLog: [],
    remindedIncidentIds: new Set(),
  };
}

function defaultNotifier() {
  return {
    async sendSlaReminder() {
      return undefined;
    },
  };
}

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function error(res, status, code, message) {
  json(res, status, { error: { code, message } });
}

function getActor(req) {
  const tenantId = req.headers["x-tenant-id"];
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-role"];

  if (!tenantId || !userId || !role) {
    return { error: { status: 401, code: "MISSING_AUTH", message: "tenant, user, and role headers are required" } };
  }
  if (!VALID_ROLES.has(role)) {
    return { error: { status: 403, code: "INVALID_ROLE", message: "role is not allowed" } };
  }
  return { tenantId, userId, role };
}

function can(actor, action) {
  const permissions = {
    create: new Set(["admin"]),
    read: new Set(["admin", "responder", "viewer"]),
    updateStatus: new Set(["admin", "responder"]),
    assign: new Set(["admin", "responder"]),
    runSlaJob: new Set(["admin"]),
    readAudit: new Set(["admin", "responder", "viewer"]),
  };
  return permissions[action]?.has(actor.role) ?? false;
}

function requirePermission(res, actor, action) {
  if (can(actor, action)) return true;
  error(res, 403, "FORBIDDEN", "role is not permitted for this action");
  return false;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const err = new Error("Request body must be valid JSON");
    err.status = 400;
    err.code = "INVALID_JSON";
    throw err;
  }
}

function publicIncident(incident) {
  return { ...incident };
}

function findTenantIncident(store, tenantId, id) {
  const incident = store.incidents.get(id);
  if (!incident || incident.tenantId !== tenantId) return null;
  return incident;
}

function addAudit(store, actor, action, incidentId, details = {}, now) {
  const entry = {
    id: `audit_${store.nextAuditId++}`,
    tenantId: actor.tenantId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action,
    incidentId,
    details,
    createdAt: now().toISOString(),
  };
  store.auditLog.push(entry);
  return entry;
}

function validateEmail(value, fieldName = "assigneeEmail") {
  return typeof value === "string" && EMAIL_RE.test(value) ? null : `${fieldName} must be a valid email`;
}

function validateIncidentInput(body) {
  const errors = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["body must be an object"];
  }
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    errors.push("title is required");
  }
  if (!VALID_SEVERITIES.has(body.severity)) {
    errors.push("severity must be low, medium, high, or critical");
  }
  const due = new Date(body.slaDueAt);
  if (typeof body.slaDueAt !== "string" || Number.isNaN(due.getTime())) {
    errors.push("slaDueAt must be an ISO date string");
  }
  if (body.assigneeEmail !== undefined) {
    const emailError = validateEmail(body.assigneeEmail);
    if (emailError) errors.push(emailError);
  }
  return errors;
}

async function handleApi(req, res, options) {
  const { store, notifier, now } = options;
  const actor = getActor(req);
  if (actor.error) {
    error(res, actor.error.status, actor.error.code, actor.error.message);
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const incidentMatch = path.match(/^\/api\/incidents\/([^/]+)$/);
  const statusMatch = path.match(/^\/api\/incidents\/([^/]+)\/status$/);
  const assignMatch = path.match(/^\/api\/incidents\/([^/]+)\/assign$/);

  try {
    if (req.method === "POST" && path === "/api/incidents") {
      if (!requirePermission(res, actor, "create")) return;
      const body = await readJson(req);
      const errors = validateIncidentInput(body);
      if (errors.length > 0) {
        error(res, 400, "VALIDATION_ERROR", errors.join("; "));
        return;
      }

      const timestamp = now().toISOString();
      const incident = {
        id: `inc_${store.nextIncidentId++}`,
        tenantId: actor.tenantId,
        title: body.title.trim(),
        severity: body.severity,
        status: "open",
        assigneeEmail: body.assigneeEmail ?? null,
        slaDueAt: new Date(body.slaDueAt).toISOString(),
        createdAt: timestamp,
        updatedAt: timestamp,
        resolvedAt: null,
      };
      store.incidents.set(incident.id, incident);
      addAudit(store, actor, "incident.created", incident.id, { severity: incident.severity }, now);
      json(res, 201, { incident: publicIncident(incident) });
      return;
    }

    if (req.method === "GET" && path === "/api/incidents") {
      if (!requirePermission(res, actor, "read")) return;
      const incidents = [...store.incidents.values()]
        .filter((incident) => incident.tenantId === actor.tenantId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(publicIncident);
      json(res, 200, { incidents });
      return;
    }

    if (req.method === "GET" && incidentMatch) {
      if (!requirePermission(res, actor, "read")) return;
      const incident = findTenantIncident(store, actor.tenantId, incidentMatch[1]);
      if (!incident) {
        error(res, 404, "NOT_FOUND", "incident was not found");
        return;
      }
      json(res, 200, { incident: publicIncident(incident) });
      return;
    }

    if (req.method === "PATCH" && statusMatch) {
      if (!requirePermission(res, actor, "updateStatus")) return;
      const incident = findTenantIncident(store, actor.tenantId, statusMatch[1]);
      if (!incident) {
        error(res, 404, "NOT_FOUND", "incident was not found");
        return;
      }
      const body = await readJson(req);
      if (!VALID_STATUSES.has(body.status)) {
        error(res, 400, "VALIDATION_ERROR", "status must be open, investigating, or resolved");
        return;
      }
      const transition = `${incident.status}->${body.status}`;
      if (incident.status === body.status || !ALLOWED_TRANSITIONS.has(transition)) {
        error(res, 409, "INVALID_STATUS_TRANSITION", `cannot transition ${incident.status} to ${body.status}`);
        return;
      }
      const previousStatus = incident.status;
      incident.status = body.status;
      incident.updatedAt = now().toISOString();
      if (body.status === "resolved") {
        incident.resolvedAt = incident.updatedAt;
      }
      addAudit(store, actor, "incident.status_changed", incident.id, { from: previousStatus, to: body.status }, now);
      json(res, 200, { incident: publicIncident(incident) });
      return;
    }

    if (req.method === "PATCH" && assignMatch) {
      if (!requirePermission(res, actor, "assign")) return;
      const incident = findTenantIncident(store, actor.tenantId, assignMatch[1]);
      if (!incident) {
        error(res, 404, "NOT_FOUND", "incident was not found");
        return;
      }
      const body = await readJson(req);
      const emailError = validateEmail(body.assigneeEmail);
      if (emailError) {
        error(res, 400, "VALIDATION_ERROR", emailError);
        return;
      }
      const previousAssigneeEmail = incident.assigneeEmail;
      incident.assigneeEmail = body.assigneeEmail;
      incident.updatedAt = now().toISOString();
      addAudit(store, actor, "incident.assigned", incident.id, { from: previousAssigneeEmail, to: body.assigneeEmail }, now);
      json(res, 200, { incident: publicIncident(incident) });
      return;
    }

    if (req.method === "POST" && path === "/api/jobs/sla-reminders/run") {
      if (!requirePermission(res, actor, "runSlaJob")) return;
      const cutoff = new Date(now().getTime() + 60 * 60 * 1000);
      const candidates = [...store.incidents.values()].filter((incident) => (
        incident.tenantId === actor.tenantId
        && incident.status !== "resolved"
        && new Date(incident.slaDueAt) <= cutoff
        && !store.remindedIncidentIds.has(incident.id)
      ));

      const reminded = [];
      for (const incident of candidates) {
        await notifier.sendSlaReminder(publicIncident(incident));
        store.remindedIncidentIds.add(incident.id);
        reminded.push(incident.id);
        addAudit(store, actor, "incident.sla_reminder_sent", incident.id, { slaDueAt: incident.slaDueAt }, now);
      }
      json(res, 200, { remindedCount: reminded.length, remindedIncidentIds: reminded });
      return;
    }

    if (req.method === "GET" && path === "/api/audit-log") {
      if (!requirePermission(res, actor, "readAudit")) return;
      const entries = store.auditLog
        .filter((entry) => entry.tenantId === actor.tenantId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      json(res, 200, { auditLog: entries });
      return;
    }

    error(res, 404, "NOT_FOUND", "route was not found");
  } catch (err) {
    if (err.status && err.code) {
      error(res, err.status, err.code, err.message);
      return;
    }
    error(res, 500, "INTERNAL_ERROR", "unexpected server error");
  }
}

export function createServer(options = {}) {
  const runtime = {
    store: options.store ?? createMemoryStore(),
    notifier: options.notifier ?? defaultNotifier(),
    now: options.now ?? (() => new Date()),
  };

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = await readFile(join(__dirname, "../public/index.html"), "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, variant: "sgad" }));
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, runtime);
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "NOT_FOUND" } }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(3000, () => console.log("sgad listening on http://localhost:3000"));
}
