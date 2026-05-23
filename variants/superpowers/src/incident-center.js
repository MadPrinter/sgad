const severities = new Set(["low", "medium", "high", "critical"]);
const statuses = new Set(["open", "investigating", "resolved"]);
const statusTransitions = {
  open: new Set(["investigating", "resolved"]),
  investigating: new Set(["resolved"]),
  resolved: new Set([])
};

const rolePermissions = {
  admin: new Set(["create", "read", "update", "assign", "resolve", "audit", "runJobs"]),
  responder: new Set(["read", "update", "assign"]),
  viewer: new Set(["read"])
};

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createIncidentCenter(options = {}) {
  const clock = options.clock ?? (() => new Date());
  const notifier = options.notifier ?? {
    async sendSlaReminder() {}
  };
  const incidents = new Map();
  const auditLog = [];
  const remindedIncidentIds = new Set();
  let nextIncidentId = 1;
  let nextAuditId = 1;

  function authenticate(headers) {
    const tenantId = headerValue(headers, "x-tenant-id");
    const userId = headerValue(headers, "x-user-id");
    const role = headerValue(headers, "x-role");

    if (!tenantId || !userId || !role) {
      throw new AppError(401, "AUTH_REQUIRED", "x-tenant-id, x-user-id, and x-role headers are required");
    }
    if (!rolePermissions[role]) {
      throw new AppError(403, "ROLE_FORBIDDEN", "role is not allowed");
    }
    return { tenantId, userId, role };
  }

  function authorize(actor, permission) {
    if (!rolePermissions[actor.role]?.has(permission)) {
      throw new AppError(403, "FORBIDDEN", "insufficient permissions");
    }
  }

  function createIncident(actor, payload) {
    authorize(actor, "create");
    const data = validateCreatePayload(payload);
    const now = clock().toISOString();
    const incident = {
      id: `inc-${nextIncidentId++}`,
      tenantId: actor.tenantId,
      title: data.title,
      severity: data.severity,
      status: "open",
      assigneeEmail: data.assigneeEmail ?? null,
      slaDueAt: data.slaDueAt,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null
    };

    incidents.set(incident.id, incident);
    writeAudit(actor, "create", incident.id, { title: incident.title, severity: incident.severity });
    return copyIncident(incident);
  }

  function listIncidents(actor) {
    authorize(actor, "read");
    return [...incidents.values()]
      .filter((incident) => incident.tenantId === actor.tenantId)
      .map(copyIncident);
  }

  function readIncident(actor, id) {
    authorize(actor, "read");
    return copyIncident(findTenantIncident(actor, id));
  }

  function updateStatus(actor, id, payload) {
    authorize(actor, "update");
    const incident = findTenantIncident(actor, id);
    const nextStatus = payload?.status;
    if (!statuses.has(nextStatus)) {
      throw new AppError(400, "VALIDATION_ERROR", "status must be open, investigating, or resolved");
    }
    if (nextStatus === incident.status) {
      throw new AppError(400, "INVALID_STATUS_TRANSITION", "status is already set");
    }
    if (!statusTransitions[incident.status].has(nextStatus)) {
      throw new AppError(400, "INVALID_STATUS_TRANSITION", `${incident.status} cannot transition to ${nextStatus}`);
    }
    if (nextStatus === "resolved") {
      authorize(actor, "resolve");
    }

    const previousStatus = incident.status;
    const now = clock().toISOString();
    incident.status = nextStatus;
    incident.updatedAt = now;
    if (nextStatus === "resolved") {
      incident.resolvedAt = now;
    }
    writeAudit(actor, "status_change", incident.id, { from: previousStatus, to: nextStatus });
    return copyIncident(incident);
  }

  function assignIncident(actor, id, payload) {
    authorize(actor, "assign");
    const incident = findTenantIncident(actor, id);
    const assigneeEmail = payload?.assigneeEmail;
    if (!isEmail(assigneeEmail)) {
      throw new AppError(400, "VALIDATION_ERROR", "assigneeEmail must be a valid email");
    }

    const previousAssigneeEmail = incident.assigneeEmail;
    incident.assigneeEmail = assigneeEmail;
    incident.updatedAt = clock().toISOString();
    writeAudit(actor, "assign", incident.id, { from: previousAssigneeEmail, to: assigneeEmail });
    return copyIncident(incident);
  }

  async function runSlaReminderJob(actor) {
    authorize(actor, "runJobs");
    const now = clock();
    const threshold = new Date(now.getTime() + 60 * 60 * 1000);
    const reminders = [];

    for (const incident of incidents.values()) {
      if (incident.tenantId !== actor.tenantId) continue;
      if (incident.status === "resolved") continue;
      if (remindedIncidentIds.has(incident.id)) continue;
      if (new Date(incident.slaDueAt) > threshold) continue;

      await notifier.sendSlaReminder(copyIncident(incident), actor);
      remindedIncidentIds.add(incident.id);
      writeAudit(actor, "reminder", incident.id, { slaDueAt: incident.slaDueAt });
      reminders.push(copyIncident(incident));
    }

    return { reminded: reminders.length, incidents: reminders };
  }

  function listAuditLog(actor) {
    authorize(actor, "audit");
    return auditLog
      .filter((entry) => entry.tenantId === actor.tenantId)
      .map((entry) => ({ ...entry, details: { ...entry.details } }));
  }

  function findTenantIncident(actor, id) {
    const incident = incidents.get(id);
    if (!incident || incident.tenantId !== actor.tenantId) {
      throw new AppError(404, "INCIDENT_NOT_FOUND", "incident was not found");
    }
    return incident;
  }

  function writeAudit(actor, action, incidentId, details = {}) {
    auditLog.push({
      id: `audit-${nextAuditId++}`,
      tenantId: actor.tenantId,
      userId: actor.userId,
      role: actor.role,
      action,
      incidentId,
      details,
      createdAt: clock().toISOString()
    });
  }

  return {
    authenticate,
    createIncident,
    listIncidents,
    readIncident,
    updateStatus,
    assignIncident,
    runSlaReminderJob,
    listAuditLog,
    _state: { incidents, auditLog, remindedIncidentIds }
  };
}

function validateCreatePayload(payload) {
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const severity = payload?.severity;
  const assigneeEmail = payload?.assigneeEmail;
  const slaDueAt = payload?.slaDueAt;

  const errors = [];
  if (!title) errors.push("title is required");
  if (!severities.has(severity)) errors.push("severity must be low, medium, high, or critical");
  if (!isIsoDate(slaDueAt)) errors.push("slaDueAt must be a valid ISO date");
  if (assigneeEmail !== undefined && assigneeEmail !== null && assigneeEmail !== "" && !isEmail(assigneeEmail)) {
    errors.push("assigneeEmail must be a valid email");
  }

  if (errors.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "invalid incident payload", errors);
  }

  return {
    title,
    severity,
    assigneeEmail: assigneeEmail || null,
    slaDueAt: new Date(slaDueAt).toISOString()
  };
}

function headerValue(headers, name) {
  if (headers?.get) return headers.get(name);
  return headers?.[name] ?? headers?.[name.toLowerCase()];
}

function isIsoDate(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function copyIncident(incident) {
  return { ...incident };
}
