# Brainstorming

## Goal

Implement a zero-dependency Node ESM Incident Response Center for a multi-tenant SaaS product.

## Product Shape

- Keep state in memory because the seed project has no database and the evaluator focuses on behavior.
- Separate business logic from HTTP routing so tests can inject a clock and notifier.
- Treat tenant isolation as a data access invariant: every incident and audit entry is filtered by the authenticated tenant.
- Use request headers as the authentication boundary because the SPEC defines them as the only identity inputs.

## Core Risks

- Cross-tenant reads or reminders could leak incident data.
- Responder status updates could accidentally include resolve privileges.
- SLA reminders could duplicate if the job is run repeatedly.
- Tests must not call real external services, so notifier must be injectable.

## Decisions

- Implement `createIncidentCenter` as the core service.
- Use Node's `http` module and static file serving only.
- Represent reminders with an in-memory `remindedIncidentIds` set.
- Return consistent JSON errors with `error.code`.
