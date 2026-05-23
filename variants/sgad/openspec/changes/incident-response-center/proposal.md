# Incident Response Center Proposal

## Summary

Implement a zero-dependency Node ESM Incident Response Center for a multi-tenant SaaS product. The service exposes REST endpoints for incident lifecycle operations, tenant-scoped audit evidence, and an SLA reminder job that uses an injectable notifier.

## Goals

- Provide create, list, read, assign, status transition, SLA reminder, and audit log APIs.
- Enforce RBAC for `admin`, `responder`, and `viewer` roles from request headers.
- Enforce tenant isolation for every incident and audit query.
- Keep tests deterministic with in-memory storage, injectable time, and injectable notification.
- Ship a static frontend for incident creation, incident list display, severity/status visibility, and audit log review.

## Non-Goals

- Persistent storage, authentication tokens, and third-party notification providers.
- Background scheduling outside the explicit `POST /api/jobs/sla-reminders/run` endpoint.
- Multi-process coordination for reminder de-duplication.

## Acceptance Criteria

- All required endpoints return JSON and validate request headers.
- Incidents cannot be read or mutated across tenants.
- Unauthorized roles receive `403`.
- Status transitions are limited to `open -> investigating`, `investigating -> resolved`, and `open -> resolved`.
- Audit log entries are written for create, assign, status change, and reminder.
- SLA reminder job identifies unresolved incidents due within one hour and does not duplicate reminders.
- `node --test` passes without external dependencies.
