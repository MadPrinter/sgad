# Implementation Plan

## Scope

Build the required API, RBAC, tenant isolation, audit log, SLA reminder job, injectable notifier, static frontend, and node:test coverage inside `variants/superpowers`.

## Steps

1. Add a core incident service with in-memory incidents, audit entries, role permissions, validation, and status transition rules.
2. Update `src/server.js` to route all required REST endpoints, parse JSON bodies, authenticate headers, and serve the static frontend.
3. Replace the seed HTML with a usable static frontend for request context, incident creation, incident list, status/assign actions, SLA job run, and audit log.
4. Add HTTP-level tests using Node's built-in test runner and fetch.
5. Add workflow documentation required by the Superpowers variant.
6. Run `node --test` and record results in `workflow/verification.md`.

## Data Model

Incident fields match the SPEC:

- `id`
- `tenantId`
- `title`
- `severity`
- `status`
- `assigneeEmail`
- `slaDueAt`
- `createdAt`
- `updatedAt`
- `resolvedAt`

Audit fields:

- `id`
- `tenantId`
- `userId`
- `role`
- `action`
- `incidentId`
- `details`
- `createdAt`
