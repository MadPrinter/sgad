# Subagent Tasks

This variant was implemented in isolation inside `variants/superpowers`. No sibling variant or evaluator files were modified.

## API Worker

- Implement REST routes in `src/server.js`.
- Normalize JSON success and error responses.
- Preserve zero external dependencies.

## Domain Worker

- Implement incident validation, status transitions, RBAC, tenant isolation, audit logging, and reminder de-duplication in `src/incident-center.js`.
- Provide clock and notifier injection points for tests.

## Frontend Worker

- Replace the seed page with a static incident center UI.
- Include incident list, create form, severity/status display, assign/status actions, SLA job trigger, and audit log section.

## Test Worker

- Add `node:test` coverage for required behavior.
- Verify tests run with `node --test`.
