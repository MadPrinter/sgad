# Incident Response Center Spec

## API Contract

All API requests require:

```text
x-tenant-id: tenant identifier
x-user-id: user identifier
x-role: admin|responder|viewer
```

Missing headers return `401 MISSING_AUTH`. Unknown roles return `403 INVALID_ROLE`.

## Endpoints

- `POST /api/incidents`: admin only. Creates an incident with `title`, `severity`, optional `assigneeEmail`, and `slaDueAt`.
- `GET /api/incidents`: all roles. Lists only incidents whose `tenantId` matches the request tenant.
- `GET /api/incidents/:id`: all roles. Reads only matching tenant incidents.
- `PATCH /api/incidents/:id/status`: admin and responder. Applies allowed status transitions.
- `PATCH /api/incidents/:id/assign`: admin and responder. Assigns a valid email address.
- `POST /api/jobs/sla-reminders/run`: admin only. Runs the SLA reminder scan for the request tenant.
- `GET /api/audit-log`: all roles. Lists only audit entries for the request tenant.

## Incident Model

- `id`: generated `inc_N` string.
- `tenantId`: request tenant.
- `title`: non-empty string.
- `severity`: `low|medium|high|critical`.
- `status`: `open|investigating|resolved`.
- `assigneeEmail`: email string or `null`.
- `slaDueAt`: ISO timestamp.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.
- `resolvedAt`: ISO timestamp or `null`.

## Audit Model

Each audit entry includes an id, tenant id, actor user id, actor role, action, incident id, details, and creation timestamp. Actions are `incident.created`, `incident.assigned`, `incident.status_changed`, and `incident.sla_reminder_sent`.

## SLA Reminder Rules

The job selects incidents in the request tenant where status is not `resolved`, `slaDueAt <= now + 1h`, and the incident has not already been reminded. The notifier is injected through server options and is the only notification mechanism.
