# Competitive Analysis

This analysis was written after reviewing Superpowers and OpenSpec as reference projects.

## What Superpowers Gets Right

- It is an installable agent behavior system, not only documentation.
- It gives agents a clear operating discipline: brainstorm, plan, TDD, implement, review, verify.
- It treats skills as composable units that can be adapted across tools.
- Its README explains what to do immediately instead of starting with theory.

## What OpenSpec Gets Right

- It has a memorable one-line identity: spec-driven development for AI coding assistants.
- It provides CLI and slash-command workflows.
- It keeps artifacts simple: proposal, specs, design, tasks, archive.
- It emphasizes brownfield adoption and low ceremony.
- It documents supported tools, installation, commands, and contribution flow.

## SGAD's Position

SGAD should not compete by adding more Markdown. It should compete by adding the missing engineering governance layer:

- risk classification
- autonomy budgets
- evidence matrices
- rollout gates
- human approval policy
- requirement-to-test-to-risk traceability

## Product Requirements For SGAD

- A first-time user must understand SGAD in 30 seconds.
- A project must be initializable in one command.
- Agents must receive durable instructions through a skill or plugin.
- Governance artifacts must be machine-checkable.
- The repository must contain a real benchmark, not only claims.
- Documentation must be bilingual enough for English and Chinese users.

## Current Gap Closed In v0.2.0

- Added `sgad` CLI.
- Added Codex-compatible skill and plugin skeleton.
- Added JSON schemas for governance and change records.
- Reworked README positioning and quickstart.
- Added contribution, security, and integration docs.
