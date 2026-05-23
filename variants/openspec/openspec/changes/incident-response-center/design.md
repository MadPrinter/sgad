# Design: Incident Response Center

## Runtime

The implementation uses only Node built-in modules and ESM. The HTTP API is implemented with `node:http`; tests use `node:test` and global `fetch`.

## Storage

The application uses an in-memory store:

- `incidents`: `Map<string, Incident>`
- `auditLog`: append-only array
- `remindedIncidentIds`: set used to prevent duplicate SLA reminders
- monotonic counters for incident and audit ids

The store is injectable so tests can create isolated instances without global state.

## Authorization

Authorization is request-header based because the specification defines the identity contract. The server validates required headers and maps roles to permissions:

- `admin`: create, read, assign, status, audit, reminder
- `responder`: read, assign, status
- `viewer`: read

Tenant isolation is enforced at the data-access function. Incident lookups return `404` when an incident is missing or belongs to a different tenant, preventing cross-tenant existence disclosure.

## Status Model

The status transition table is explicit:

- `open`: `investigating`, `resolved`
- `investigating`: `resolved`
- `resolved`: none

Invalid transitions return `409`.

## SLA Reminder Job

The reminder endpoint computes `now + 1h` using an injectable clock and selects unresolved incidents in the request tenant whose SLA is due before or at that boundary.

The notifier is injected through `createServer({ notifier })`. The default notifier is a no-op, so the server never calls external services. After a successful notifier call, the incident id is stored in `remindedIncidentIds` and a reminder audit event is written.

## Frontend

The static frontend is a single HTML file served by the Node server. It exposes request-context controls for tenant, user, and role, then uses the REST API to render:

- incident list with status and severity badges
- create incident form
- assignment and status controls
- audit log section
- SLA reminder execution button

## Error Handling

API errors return JSON with `error.code` and `error.message`. Validation errors use `400`, missing auth uses `401`, forbidden operations use `403`, missing or cross-tenant incidents use `404`, and invalid status transitions use `409`.
