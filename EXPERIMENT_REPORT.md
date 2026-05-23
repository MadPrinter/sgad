# Real Experiment Report

## Summary

This experiment compares three AI development governance workflows on the same implementation task and seed codebase.

Task: build a multi-tenant Incident Response Center with REST API, static frontend, RBAC, tenant isolation, audit log, SLA reminder job, injectable notifier, tests, and workflow-specific documentation.

## Variants

| Variant | Directory | Workflow |
|---|---|---|
| OpenSpec | `variants/openspec` | spec-first change package |
| Superpowers | `variants/superpowers` | TDD, subagent planning, review, verification |
| SGAD v2 | `variants/sgad` | OpenSpec-style spec + Superpowers-style execution + governance-as-code |

## Final Scores

| Variant | Score |
|---|---:|
| OpenSpec | 83/100 |
| Superpowers | 78/100 |
| SGAD v2 | 95/100 |

## Test Results

All variants pass their own `node --test` suites.

| Variant | Tests | Result |
|---|---:|---|
| OpenSpec | 5 | pass |
| Superpowers | 6 | pass |
| SGAD v2 | 6 | pass |

## Implemented Features

All variants implemented:

- incident creation
- incident listing
- incident read by id
- assignment
- status transitions
- RBAC
- tenant isolation
- audit log
- SLA reminder job
- injectable notifier
- static frontend
- tests

## Key Differences

### OpenSpec

OpenSpec produced the clearest specification package:

- `proposal.md`
- `spec.md`
- `design.md`
- `tasks.md`
- `test-plan.md`

Strength: requirements and design are easy to review before implementation.

Weakness: execution discipline and governance gates are not as strong unless added separately.

### Superpowers

Superpowers produced the strongest execution workflow:

- brainstorming notes
- implementation plan
- TDD plan
- subagent tasks
- review checklist
- verification

Strength: code execution, TDD, and verification discipline.

Weakness: long-lived product spec and governance-as-code are weaker than SGAD.

### SGAD v2

SGAD produced the broadest governance package:

- OpenSpec-style change docs
- risk register
- evidence matrix
- autonomy budget
- rollout plan
- quality gates policy

Strength: highest traceability and governance coverage.

Weakness: highest documentation overhead.

## Evaluator Notes

The evaluator checks:

- tests pass
- API implementation signals
- tenant isolation signals
- RBAC signals
- audit log signals
- SLA reminder/notifier signals
- frontend signals
- required documentation by workflow

The score is not a substitute for human code review. It is a repeatable engineering-process score for this experiment.

## Conclusion

For this medium-sized project:

- OpenSpec is best for requirements clarity.
- Superpowers is best for implementation discipline.
- SGAD v2 is best when risk, traceability, release safety, and governance matter.

SGAD v2 wins this experiment because it combines specification, execution, and governance artifacts while still delivering working code and passing tests.

