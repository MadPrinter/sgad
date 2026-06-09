# Spec: agent-experience-layer

## Requirements

### REQ-EXP-001: Layered experience model

SGAD must define experience artifacts as separate layers:

- Trace: raw task/run data used for audit, not normal prompt injection.
- Episode: a single summarized case with context, problem, root cause, resolution, and evidence.
- Lesson: a reusable rule distilled from one or more episodes.
- Skill/Policy: a stable, repeatable procedure promoted from lessons.

### REQ-EXP-002: Project-first ownership

Project-specific governance, risks, lessons, and evidence must live in the repository. Agent-global experience may be
used as a secondary recall source, but it must not override project SGAD files, AGENTS.md, or the active change spec.

### REQ-EXP-003: Structured lessons

Reusable lessons must include at least:

- id
- title
- scope
- triggers
- advice
- evidence
- confidence
- status
- last_validated

Lessons without scope or evidence must not be eligible for active recall.

### REQ-EXP-004: Bounded recall

Experience recall must default to no prompt injection. When recall is triggered, it must:

- filter by status, scope, and triggers before semantic similarity
- prefer lessons over episodes
- return summaries rather than full bodies by default
- enforce configurable limits for number of lessons, episodes, and estimated tokens

### REQ-EXP-005: Noise and explosion controls

SGAD must define controls for stale, duplicate, conflicting, and low-confidence experience:

- candidate lessons require evidence before activation
- stale lessons can be downgraded or deprecated
- conflicting lessons enter review
- similar episodes can be merged into a lesson
- active lesson count should remain bounded per project or scope

### REQ-EXP-006: Promotion lifecycle

SGAD must define allowed status transitions:

```text
candidate -> active -> stale -> deprecated
candidate -> rejected
active -> review -> active
active -> review -> deprecated
```

Promotion to a skill or policy must require stable scope, repeated usefulness or high-severity evidence, and a
repeatable procedure.

## Scenarios

- A normal low-risk task does not load experience.
- A task touching a file with matching active lessons recalls only the top bounded summaries.
- A pending lesson with no evidence is not recalled.
- A stale lesson can be excluded or marked for review.
- A project SGAD rule overrides conflicting agent-global memory.
