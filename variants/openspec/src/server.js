import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const STATUSES = new Set(["open", "investigating", "resolved"]);
const ROLES = new Set(["admin", "responder", "viewer"]);
const STATUS_TRANSITIONS = {
  open: new Set(["investigating", "resolved"]),
  investigating: new Set(["resolved"]),
  resolved: new Set([])
};

const ROLE_PERMISSIONS = {
  admin: new Set(["create", "read", "assign", "status", "audit", "reminder"]),
  responder: new Set(["read", "assign", "status"]),
  viewer: new Set(["read"])
};

const DEFAULT_SLA_HOURS = {
  low: 72,
  medium: 24,
  high: 4,
  critical: 1
};

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

export function createMemoryStore() {
  return {
    incidents: new Map(),
    auditLog: [],
    remindedIncidentIds: new Set(),
    nextIncidentId: 1,
    nextAuditId: 1
  };
}

export function createServer(options = {}) {
  const store = options.store ?? createMemoryStore();
  const now = options.now ?? (() => new Date());
  const notifier = options.notifier ?? {
    async sendSlaReminder() {}
  };

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        await sendStatic(res, "index.html");
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, variant: "openspec" });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        await handleApi({ req, res, url, store, now, notifier });
        return;
      }

      sendJson(res, 404, { error: { code: "NOT_FOUND" } });
    } catch (error) {
      sendJson(res, error.statusCode ?? 500, {
        error: {
          code: error.code ?? "INTERNAL_ERROR",
          message: error.message ?? "Unexpected error"
        }
      });
    }
  });
}

async function handleApi(context) {
  const { req, res, url } = context;
  const auth = parseAuth(req);
  const parts = url.pathname.split("/").filter(Boolean);

  if (req.method === "POST" && url.pathname === "/api/incidents") {
    requirePermission(auth, "create");
    const body = await readJson(req);
    const incident = createIncident(context, auth, body);
    sendJson(res, 201, { incident });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/incidents") {
    requirePermission(auth, "read");
    const incidents = [...context.store.incidents.values()]
      .filter((incident) => incident.tenantId === auth.tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    sendJson(res, 200, { incidents });
    return;
  }

  if (req.method === "GET" && parts.length === 3 && parts[0] === "api" && parts[1] === "incidents") {
    requirePermission(auth, "read");
    const incident = getTenantIncident(context.store, auth.tenantId, parts[2]);
    sendJson(res, 200, { incident });
    return;
  }

  if (
    req.method === "PATCH" &&
    parts.length === 4 &&
    parts[0] === "api" &&
    parts[1] === "incidents" &&
    parts[3] === "status"
  ) {
    requirePermission(auth, "status");
    const body = await readJson(req);
    const incident = updateIncidentStatus(context, auth, parts[2], body);
    sendJson(res, 200, { incident });
    return;
  }

  if (
    req.method === "PATCH" &&
    parts.length === 4 &&
    parts[0] === "api" &&
    parts[1] === "incidents" &&
    parts[3] === "assign"
  ) {
    requirePermission(auth, "assign");
    const body = await readJson(req);
    const incident = assignIncident(context, auth, parts[2], body);
    sendJson(res, 200, { incident });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs/sla-reminders/run") {
    requirePermission(auth, "reminder");
    const result = await runSlaReminderJob(context, auth);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/audit-log") {
    requirePermission(auth, "audit");
    const events = context.store.auditLog
      .filter((event) => event.tenantId === auth.tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    sendJson(res, 200, { events });
    return;
  }

  sendJson(res, 404, { error: { code: "NOT_FOUND" } });
}

function createIncident({ store, now }, auth, body) {
  const title = validateTitle(body.title);
  const severity = validateSeverity(body.severity);
  const assigneeEmail = body.assigneeEmail === undefined ? null : validateEmail(body.assigneeEmail, "assigneeEmail");
  const createdAt = now().toISOString();
  const slaDueAt = validateOptionalDate(body.slaDueAt) ?? addHours(createdAt, DEFAULT_SLA_HOURS[severity]);
  const incident = {
    id: String(store.nextIncidentId++),
    tenantId: auth.tenantId,
    title,
    severity,
    status: "open",
    assigneeEmail,
    slaDueAt,
    createdAt,
    updatedAt: createdAt,
    resolvedAt: null
  };

  store.incidents.set(incident.id, incident);
  writeAudit(store, now, auth, "incident.created", incident.id, {
    title: incident.title,
    severity: incident.severity
  });
  return incident;
}

function updateIncidentStatus({ store, now }, auth, id, body) {
  const nextStatus = validateStatus(body.status);
  const incident = getTenantIncident(store, auth.tenantId, id);
  const allowed = STATUS_TRANSITIONS[incident.status]?.has(nextStatus);
  if (!allowed) {
    throw httpError(409, "INVALID_STATUS_TRANSITION", `Cannot transition from ${incident.status} to ${nextStatus}`);
  }

  const previousStatus = incident.status;
  const updatedAt = now().toISOString();
  incident.status = nextStatus;
  incident.updatedAt = updatedAt;
  incident.resolvedAt = nextStatus === "resolved" ? updatedAt : null;

  writeAudit(store, now, auth, "incident.status_changed", incident.id, {
    from: previousStatus,
    to: nextStatus
  });
  return incident;
}

function assignIncident({ store, now }, auth, id, body) {
  const assigneeEmail = validateEmail(body.assigneeEmail, "assigneeEmail");
  const incident = getTenantIncident(store, auth.tenantId, id);
  const previousAssigneeEmail = incident.assigneeEmail;
  incident.assigneeEmail = assigneeEmail;
  incident.updatedAt = now().toISOString();

  writeAudit(store, now, auth, "incident.assigned", incident.id, {
    from: previousAssigneeEmail,
    to: assigneeEmail
  });
  return incident;
}

async function runSlaReminderJob({ store, now, notifier }, auth) {
  const runAt = now();
  const reminderWindowEnd = new Date(runAt.getTime() + 60 * 60 * 1000);
  const candidates = [...store.incidents.values()]
    .filter((incident) => incident.tenantId === auth.tenantId)
    .filter((incident) => incident.status !== "resolved")
    .filter((incident) => !store.remindedIncidentIds.has(incident.id))
    .filter((incident) => new Date(incident.slaDueAt).getTime() <= reminderWindowEnd.getTime())
    .sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt));

  const reminded = [];
  for (const incident of candidates) {
    await notifier.sendSlaReminder({
      tenantId: incident.tenantId,
      incidentId: incident.id,
      title: incident.title,
      assigneeEmail: incident.assigneeEmail,
      severity: incident.severity,
      slaDueAt: incident.slaDueAt
    });
    store.remindedIncidentIds.add(incident.id);
    reminded.push(incident.id);
    writeAudit(store, now, auth, "incident.sla_reminder_sent", incident.id, {
      slaDueAt: incident.slaDueAt
    });
  }

  return { remindedCount: reminded.length, remindedIncidentIds: reminded };
}

function parseAuth(req) {
  const tenantId = parseRequiredHeader(req, "x-tenant-id");
  const userId = parseRequiredHeader(req, "x-user-id");
  const role = parseRequiredHeader(req, "x-role");
  if (!ROLES.has(role)) {
    throw httpError(403, "INVALID_ROLE", "x-role must be admin, responder, or viewer");
  }
  return { tenantId, userId, role };
}

function parseRequiredHeader(req, name) {
  const value = req.headers[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw httpError(401, "MISSING_AUTH_HEADER", `${name} header is required`);
  }
  return value.trim();
}

function requirePermission(auth, permission) {
  if (!ROLE_PERMISSIONS[auth.role].has(permission)) {
    throw httpError(403, "FORBIDDEN", `${auth.role} may not ${permission}`);
  }
}

function getTenantIncident(store, tenantId, id) {
  const incident = store.incidents.get(String(id));
  if (!incident || incident.tenantId !== tenantId) {
    throw httpError(404, "INCIDENT_NOT_FOUND", "Incident not found");
  }
  return incident;
}

function writeAudit(store, now, auth, action, incidentId, details = {}) {
  store.auditLog.push({
    id: String(store.nextAuditId++),
    tenantId: auth.tenantId,
    userId: auth.userId,
    role: auth.role,
    action,
    incidentId,
    details,
    createdAt: now().toISOString()
  });
}

function validateTitle(title) {
  if (typeof title !== "string" || title.trim().length < 3) {
    throw httpError(400, "VALIDATION_ERROR", "title must be at least 3 characters");
  }
  return title.trim();
}

function validateSeverity(severity) {
  if (!SEVERITIES.has(severity)) {
    throw httpError(400, "VALIDATION_ERROR", "severity must be low, medium, high, or critical");
  }
  return severity;
}

function validateStatus(status) {
  if (!STATUSES.has(status)) {
    throw httpError(400, "VALIDATION_ERROR", "status must be open, investigating, or resolved");
  }
  return status;
}

function validateEmail(email, fieldName) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw httpError(400, "VALIDATION_ERROR", `${fieldName} must be a valid email`);
  }
  return email.trim().toLowerCase();
}

function validateOptionalDate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw httpError(400, "VALIDATION_ERROR", "slaDueAt must be an ISO date string");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, "VALIDATION_ERROR", "slaDueAt must be an ISO date string");
  }
  return date.toISOString();
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.trim() === "") {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw httpError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

function addHours(isoDate, hours) {
  return new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function sendStatic(res, filename) {
  const filePath = join(__dirname, "../public", filename);
  const body = await readFile(filePath);
  const contentType = CONTENT_TYPES[extname(filename)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": contentType });
  res.end(body);
}

function httpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(3000, () => console.log("openspec listening on http://localhost:3000"));
}
