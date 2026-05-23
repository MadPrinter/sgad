# Review Checklist

## Functional

- [x] `POST /api/incidents`
- [x] `GET /api/incidents`
- [x] `GET /api/incidents/:id`
- [x] `PATCH /api/incidents/:id/status`
- [x] `PATCH /api/incidents/:id/assign`
- [x] `POST /api/jobs/sla-reminders/run`
- [x] `GET /api/audit-log`
- [x] Static frontend served from `/`

## Security and Isolation

- [x] Required headers enforced.
- [x] Unknown roles rejected.
- [x] Role permissions enforced.
- [x] Tenant isolation enforced for list, read, audit, and reminders.
- [x] Viewer is read-only.
- [x] Responder cannot resolve.

## Reliability

- [x] Create payload validation.
- [x] Status transition validation.
- [x] Audit entries for create, assign, status change, and reminder.
- [x] SLA reminder job uses injectable notifier.
- [x] SLA reminder job does not duplicate reminders.
- [x] No external dependencies added.

## Verification

- [x] `node --test` passes.
