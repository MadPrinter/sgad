# Design: agent-experience-layer

## Architecture

The experience layer is a project-local governance track with optional agent-global recall.

```text
Current task context
  -> local project rules
  -> optional experience recall
  -> bounded lesson summaries
  -> implementation / verification
  -> optional episode capture
  -> lesson promotion / audit
```

SGAD should not make experience part of the default prompt. Experience is treated as an indexed repository artifact that
is recalled only when the task has a clear match.

## Repository Layout

```text
sgad/experience/
  index.json
  lessons.yaml
  episodes/
    active/
    archived/
  runs/
  review-queue.md
```

`index.json` is the small machine-readable recall surface. It contains ids, titles, scopes, triggers, confidence,
status, and short summaries. Full episode and run bodies are read only for audit, summarization, or explicit user
requests.

## Artifact Types

### Trace

Trace captures raw execution metadata:

- task goal
- commands run
- test results
- changed files
- failures and retries
- final evidence links

Trace is audit data. It is not normally injected into the agent prompt.

### Episode

Episode captures a single reusable case:

```md
# Episode: <name>

## Context
## Problem
## Root Cause
## Resolution
## Evidence
## Reusable Lesson
## Applies When
## Do Not Apply When
```

### Lesson

Lessons are compact, structured, and eligible for recall only when active:

```yaml
- id: LESSON-001
  title: Governance gates must validate closure, not presence
  scope:
    repos: [sgad]
    files: [bin/sgad.js, sgad/evidence-matrix.md]
    task_types: [cli-check, governance-gate]
  triggers:
    keywords: [sgad check, evidence, pending, waiver]
    commands: [node bin/sgad.js check]
  advice: Validate artifact closure, not only artifact existence.
  evidence:
    episodes: [episodes/active/enhance-evidence-check.md]
    tests: [test/sgad-check.test.js]
  confidence: high
  status: active
  last_validated: 2026-06-09
```

## Recall Rules

Recall uses hard filters before relevance scoring:

1. Keep only `status: active`.
2. Match project, file scope, task type, command, error, or keyword trigger.
3. Rank by confidence, freshness, and relevance.
4. Return bounded summaries.

Default limits:

```yaml
experience:
  recall:
    enabled: true
    max_lessons: 3
    max_episodes: 1
    max_tokens: 800
    min_score: 0.72
```

If no active lesson matches, the recall result should be empty and should not add explanatory noise to the prompt.

## Ownership Rules

Priority order:

```text
current user instruction
> project AGENTS.md / SGAD governance
> active change spec
> project lessons
> agent-global skills
> agent-global personal memory
```

Agent-global memory may suggest candidates, but project SGAD controls whether they are used.

## Noise Controls

- Default is no capture beyond normal SGAD evidence.
- Capture an episode only for failed attempts, user corrections, R2/R3 work, repeated defects, or clearly reusable
  decisions.
- Do not activate a lesson without evidence.
- Do not recall lessons without scope.
- Deprecate stale or contradicted lessons.
- Merge similar episodes before creating new lessons.

## Future CLI Surface

```bash
sgad experience recall --query "<task>" --files "bin/sgad.js" --limit 3 --json
sgad experience add-episode --change "<change-id>"
sgad experience propose-lesson --episode "<episode-id>"
sgad experience audit
sgad experience promote --lesson "<lesson-id>" --to skill
```

The first implementation should be file-backed. Vector search, mem0, Redis Agent Memory Server, or another backend can
be added later behind the same recall contract.
