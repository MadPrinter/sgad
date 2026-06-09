# Proposal: agent-experience-layer

## Why

SGAD currently governs a single change well: specs, risk, tests, evidence, and rollout gates are durable in the
repository. It does not yet govern how an agent learns from completed work.

Without an experience mechanism, useful lessons remain in chat history or disappear after a session. A naive memory
mechanism is also risky: it can create stale advice, duplicate lessons, irrelevant context injection, and token bloat.

SGAD needs an experience layer that accumulates validated lessons without turning every task into long-term memory.

## What Changes

- Define a project-local experience model under `sgad/experience/`.
- Separate raw runs, episodes, lessons, and promoted skills/policies.
- Require scope, triggers, evidence, confidence, status, and lifecycle metadata for reusable lessons.
- Add recall rules that default to zero context injection and only return bounded summaries when relevant.
- Add promotion and retirement rules so experience can be validated, merged, deprecated, or rejected.
- Define how project experience interacts with agent-global memory and skills.

## Impact

- Risk class: R2
- Affected areas: SGAD workflow, repository governance model, future CLI commands, agent instructions
- Compatibility: existing SGAD projects can ignore the experience layer until they opt in
