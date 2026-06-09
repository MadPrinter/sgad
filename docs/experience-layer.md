# SGAD Experience Layer

The Experience Layer lets a project accumulate agent lessons without turning chat history into prompt bloat.

Experience is opt-in. It is stored in the repository, recalled only when relevant, and audited like any other SGAD
governance artifact.

## Goals

- Preserve reusable project lessons after a task ends.
- Avoid injecting irrelevant memory into normal work.
- Require scope and evidence before a lesson can influence future work.
- Keep stale, duplicate, or conflicting lessons out of the active recall path.

## Artifact Model

```text
Trace    -> raw run data for audit
Episode  -> one summarized case
Lesson   -> reusable scoped rule
Skill    -> stable repeatable procedure
```

Most work should not create long-term experience. Capture an episode when a task includes failed attempts, user
corrections, R2/R3 risk, repeated defects, or a clearly reusable decision.

## Repository Layout

```text
sgad/experience/
  lessons.yaml
  review-queue.md
  episodes/
    active/
    archived/
  runs/
```

Initialize the optional track:

```bash
sgad init --with-experience
```

## Lesson Requirements

Active lessons must be scoped and evidence-backed:

```yaml
lessons:
  - id: LESSON-001
    title: Governance gates must validate closure, not presence
    scope:
      files: [bin/sgad.js, sgad/evidence-matrix.md]
      task_types: [cli-check, governance-gate]
    triggers:
      keywords: [sgad check, evidence, pending, waiver]
      commands: [node bin/sgad.js check]
    advice: Validate artifact closure, not only artifact existence.
    summary: For R2/R3 governance gates, validate evidence closure rather than file presence.
    evidence:
      episodes: [sgad/experience/episodes/active/enhance-evidence-check.md]
      tests: [test/sgad-check.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-09
```

Supported statuses:

```text
candidate, active, stale, deprecated, rejected, review
```

Only `active` lessons are eligible for recall.

## Recall

Recall is zero-default: SGAD does not load experience into every task. Run recall only for R2/R3 work, repeated
failures, or when current files/errors match known lesson triggers.

```bash
sgad experience recall --query "evidence gate" --files "bin/sgad.js" --limit 3 --max-tokens 800 --json
```

Recall filters by:

- status
- scope
- trigger match
- evidence presence
- token budget

The output is a bounded summary, not a full episode or trace.

## Operating Protocol

Use experience only when it can improve the current task without adding broad context noise.

Run recall when at least one condition is true:

- the change is R2 or R3
- the same command, test, or error failed more than once
- touched files are known to have active lessons
- the user asks about prior experience or previous handling
- a governance gate, approval, evidence, migration, auth, or external side effect is involved

Do not run recall for routine R0/R1 edits unless the user asks or a repeated failure appears.

Create a candidate when a task produces reusable learning:

```bash
sgad experience template --title "Retry flaky CLI checks" --change "<change-id>" --files "bin/sgad.js" --task-type "cli-check" --json
```

The template writes to `sgad/experience/review-queue.md`. It does not activate recall. A candidate can move to
`lessons.yaml` only after scope, triggers, advice, evidence, confidence, and review are filled.

Do not record:

- secrets, credentials, private customer data, or personal data
- one-off workarounds with no expected reuse
- advice that conflicts with project SGAD rules
- broad preferences without file, task, command, or error scope
- unverified claims without evidence

## Audit

Run audit when experience files change:

```bash
sgad experience audit --json
```

Audit fails active lessons that lack scope, triggers, or evidence. It also validates required fields and status values.

## Precedence

When experience conflicts with current instructions, use this order:

```text
current user instruction
> project AGENTS.md / SGAD governance
> active change spec
> project lessons
> agent-global skills
> agent-global memory
```

Project SGAD rules always override agent-global memory.
