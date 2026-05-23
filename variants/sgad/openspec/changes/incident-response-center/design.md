# Incident Response Center Design

## Architecture

The implementation is a single zero-dependency Node ESM HTTP server:

- `src/server.js` exports `createServer(options)` and `createMemoryStore()`.
- `public/index.html` is served as a static frontend.
- Tests inject a store, clock, and notifier into `createServer`.

## Storage

The default store is in memory:

- `incidents`: `Map` keyed by incident id.
- `auditLog`: array of immutable audit records.
- `remindedIncidentIds`: set used to prevent duplicate SLA reminders.
- Monotonic counters produce stable incident and audit identifiers.

This is sufficient for the experiment and keeps external services out of runtime and tests.

## Request Flow

1. Parse the URL with the standard `URL` API.
2. Require actor headers and validate role.
3. Check route-specific permission.
4. Parse and validate JSON where required.
5. Find incidents by id and tenant id together.
6. Mutate incident state only after validation.
7. Append audit evidence for required actions.
8. Return JSON responses with explicit error codes.

## Tenant Isolation

Tenant isolation is enforced at every read and write boundary. Incident lookup uses both incident id and `tenantId`; list and audit endpoints filter by `tenantId`; SLA reminder scans are limited to the request tenant.

## Notifier Injection

`createServer({ notifier })` accepts an object with `sendSlaReminder(incident)`. The default notifier is a no-op. Tests use a recording notifier to prove calls without invoking real external services.

## Frontend

The static frontend provides header-driven tenant/user/role controls, a create incident form, an incident table showing severity and status, a manual SLA reminder trigger, and an audit log table.
