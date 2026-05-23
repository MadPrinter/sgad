# SGAD Rollout

## Phase 1: Local Experiment

- Run `node --test`.
- Start with `npm start`.
- Use default header values in the static frontend to create and review incidents.

## Phase 2: Controlled Evaluation

- Execute evaluator against only the `sgad` variant.
- Confirm required OpenSpec and SGAD documents are present.
- Confirm no external dependencies are installed.

## Phase 3: Production Hardening Backlog

- Replace in-memory storage with durable tenant-partitioned persistence.
- Replace header-only identity with trusted authentication middleware.
- Move SLA reminders to a scheduler with distributed de-duplication.
- Add structured logs and metrics for API and job execution.
- Add CSRF and origin protections if browser sessions are introduced.

## Rollback

Because this variant is isolated, rollback is reverting the `variants/sgad` directory to the seed state or selecting a different sibling variant for evaluation.
