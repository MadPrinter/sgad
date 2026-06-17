# Rollout Preflight Template

Use for R2/R3 changes with batch jobs, external side effects, or operator-run workflows.

## Preflight Gates (run once before batch)

| Gate | Owner | Pass Criteria | Evidence |
|---|---|---|---|
| daily-ready / environment | operator | required config present | pending |
| business preflight | operator | rules validated | pending |
| human confirmation | operator | explicit ack for production mode | pending |

## Per-Item Resilience (during batch)

| Rule | Requirement |
|---|---|
| isolate failures | one item failure must not abort the whole batch |
| audit each item | success, skip, and error states are recorded |
| visible progress | operator sees current item and retry state |
| no silent rollback | partial success remains auditable |

## Rollback

Describe how to stop safely and revert partial batch effects.
