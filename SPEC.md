# Experiment Specification

## Product

Build an Incident Response Center for a multi-tenant SaaS product.

## Roles

- `admin`: can create, update, assign, and resolve incidents in its tenant.
- `responder`: can update and assign incidents in its tenant.
- `viewer`: can read incidents in its tenant.

No role may access another tenant.

## Required API

All API requests use headers:

```text
x-tenant-id: tenant-a
x-user-id: user-1
x-role: admin|responder|viewer
```

Endpoints:

- `POST /api/incidents`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `PATCH /api/incidents/:id/status`
- `PATCH /api/incidents/:id/assign`
- `POST /api/jobs/sla-reminders/run`
- `GET /api/audit-log`

## Incident Fields

- `id`
- `tenantId`
- `title`
- `severity`: `low|medium|high|critical`
- `status`: `open|investigating|resolved`
- `assigneeEmail`
- `slaDueAt`
- `createdAt`
- `updatedAt`
- `resolvedAt`

## Required Behavior

- Create incident with validation.
- List only incidents in request tenant.
- Read only incidents in request tenant.
- Update status with allowed transitions:
  - `open -> investigating`
  - `investigating -> resolved`
  - `open -> resolved`
- Assign incident to an email.
- Write audit log for create, assign, status change, reminder.
- SLA reminder job finds unresolved incidents with `slaDueAt <= now + 1h`.
- Reminder job uses injectable notifier and never calls real external services in tests.
- Reminder job must not duplicate reminders for the same incident.

## Frontend

Static frontend must provide:

- incident list
- create incident form
- status and severity display
- audit log view or section

## Required Documentation Per Variant

OpenSpec:

- `openspec/changes/incident-response-center/proposal.md`
- `openspec/changes/incident-response-center/spec.md`
- `openspec/changes/incident-response-center/design.md`
- `openspec/changes/incident-response-center/tasks.md`
- `openspec/changes/incident-response-center/test-plan.md`

Superpowers:

- `workflow/brainstorming.md`
- `workflow/implementation-plan.md`
- `workflow/tdd-plan.md`
- `workflow/subagent-tasks.md`
- `workflow/review-checklist.md`
- `workflow/verification.md`

SGAD:

- all OpenSpec files
- `sgad/risk-register.md`
- `sgad/evidence-matrix.md`
- `sgad/autonomy-budget.md`
- `sgad/rollout.md`
- `sgad/policies/quality-gates.yaml`

