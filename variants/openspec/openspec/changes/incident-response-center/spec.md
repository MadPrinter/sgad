# Specification: Incident Response Center

## Actors and Headers

Every API request MUST include:

- `x-tenant-id`
- `x-user-id`
- `x-role`

The supported roles are `admin`, `responder`, and `viewer`.

## Role Permissions

- `admin` MUST be able to create, read, assign, change status, run SLA reminders, and read audit log entries for its tenant.
- `responder` MUST be able to read, assign, and change status for incidents in its tenant.
- `viewer` MUST be able to read incidents in its tenant.
- No role MAY access incidents or audit events from another tenant.

## Incident Resource

An incident MUST include:

- `id`
- `tenantId`
- `title`
- `severity`: `low`, `medium`, `high`, or `critical`
- `status`: `open`, `investigating`, or `resolved`
- `assigneeEmail`
- `slaDueAt`
- `createdAt`
- `updatedAt`
- `resolvedAt`

## API Requirements

### `POST /api/incidents`

Creates an incident in the request tenant.

Validation:

- `title` MUST be at least three non-whitespace characters.
- `severity` MUST be one of the supported severity values.
- `assigneeEmail`, when present, MUST be a valid email.
- `slaDueAt`, when present, MUST be a valid ISO date string.

The created status MUST be `open`.

### `GET /api/incidents`

Returns only incidents in the request tenant.

### `GET /api/incidents/:id`

Returns the incident only when it belongs to the request tenant.

### `PATCH /api/incidents/:id/status`

Updates incident status when the incident belongs to the request tenant and the transition is allowed.

Allowed transitions:

- `open -> investigating`
- `investigating -> resolved`
- `open -> resolved`

When an incident becomes `resolved`, `resolvedAt` MUST be populated.

### `PATCH /api/incidents/:id/assign`

Updates `assigneeEmail` when the incident belongs to the request tenant.

### `POST /api/jobs/sla-reminders/run`

Finds unresolved incidents in the request tenant where `slaDueAt <= now + 1h`.

The job MUST call an injectable notifier.

The job MUST NOT send duplicate reminders for the same incident.

### `GET /api/audit-log`

Returns only audit events in the request tenant.

## Audit Requirements

Audit events MUST be written for:

- incident create
- incident assign
- incident status change
- incident SLA reminder

Each audit event MUST include tenant, user, role, action, incident id, details, and creation time.

## Frontend Requirements

The static frontend MUST include:

- incident list
- create incident form
- status and severity display
- audit log section
