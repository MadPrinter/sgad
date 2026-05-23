# TDD Plan

## Test Strategy

Use `node:test` against a real in-process HTTP server so coverage includes routing, header authentication, JSON parsing, RBAC, tenant isolation, and response codes.

## Required Coverage

- Create incident with valid payload.
- Reject invalid create payloads.
- List and read incidents only inside the request tenant.
- Enforce role permissions:
  - admin can create, assign, update, resolve, read audit, and run jobs.
  - responder can assign and update but cannot resolve, create, read audit, or run jobs.
  - viewer can read only.
- Enforce status transitions:
  - `open -> investigating`
  - `investigating -> resolved`
  - `open -> resolved`
- Reject invalid or repeated transitions.
- Write audit entries for create, assign, status change, and reminder.
- Run SLA reminders for unresolved incidents due within one hour.
- Do not duplicate reminders for the same incident.
- Use an injected notifier spy instead of real external services.
- Serve `/health` and the static frontend.

## Test Data

Use an injected fixed clock at `2026-05-23T03:00:00.000Z` to make SLA tests deterministic.
