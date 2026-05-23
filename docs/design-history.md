# Design History

This document records five dialectical iterations that shaped SGAD.

## Iteration 1: Against “More Process Is Always Better”

Thesis: every change should include proposal, requirements, design, tasks, tests, risk, review, verification, and rollout.

Antithesis: this becomes documentation bureaucracy. Small changes will bypass the process.

Synthesis: introduce risk classes R0-R3.

Change: process weight is determined by risk.

Core idea: governance should match risk, not maximize ceremony.

## Iteration 2: Against “Spec Is Absolute Truth”

Thesis: the repository spec is the only source of truth.

Antithesis: implementation often reveals hidden constraints. Treating spec as sacred suppresses feedback.

Synthesis: specs are auditable consensus, not immutable truth.

Change: add spec drift protocol.

Core idea: implementation may correct the spec, but it must do so explicitly.

## Iteration 3: Against “AI Must Be Fully Controlled”

Thesis: AI may only execute exact tasks.

Antithesis: AI is useful because it can notice adjacent problems and propose improvements.

Synthesis: introduce autonomy budget.

Change: define green/yellow/red zones for agent autonomy.

Core idea: AI needs bounded autonomy, not unlimited freedom or total lockdown.

## Iteration 4: Against “TDD Covers Everything”

Thesis: every change should be strict TDD.

Antithesis: UI, docs, migration, integration, and exploratory work do not always fit red-green-refactor.

Synthesis: use evidence matrix.

Change: require verification evidence appropriate to the change type.

Core idea: the goal is proof, not a ritual.

## Iteration 5: Against “Documentation Alone Is Governance”

Thesis: a good written standard is enough.

Antithesis: written standards are bypassed under pressure.

Synthesis: governance must be executable.

Change: add policy files, gates, CI checks, CODEOWNERS, and review rules.

Core idea: a standard that cannot be checked becomes advice.

