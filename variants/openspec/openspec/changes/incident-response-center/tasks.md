# Tasks: Incident Response Center

## Implementation

- [x] Replace seed server with zero-dependency Node ESM REST API.
- [x] Add request-header identity parsing.
- [x] Implement RBAC permissions for admin, responder, and viewer.
- [x] Enforce tenant isolation for list, read, assign, status, reminders, and audit log.
- [x] Implement incident creation with validation and default SLA windows.
- [x] Implement allowed status transitions and `resolvedAt`.
- [x] Implement assignment endpoint with email validation.
- [x] Implement tenant-scoped audit log.
- [x] Implement SLA reminder job with injectable notifier and duplicate prevention.
- [x] Serve static frontend from `public/index.html`.

## Documentation

- [x] Add OpenSpec proposal.
- [x] Add OpenSpec specification.
- [x] Add OpenSpec design notes.
- [x] Add OpenSpec tasks.
- [x] Add OpenSpec test plan.

## Verification

- [x] Add `node:test` coverage for create/list/read/audit.
- [x] Add `node:test` coverage for tenant isolation.
- [x] Add `node:test` coverage for RBAC.
- [x] Add `node:test` coverage for status transition validation.
- [x] Add `node:test` coverage for SLA reminder notifier injection and no duplicate reminders.
- [x] Run `node --test`.
