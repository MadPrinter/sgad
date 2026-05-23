# SGAD v2 Specification

## Definition

SGAD means **Spec-Governed Agentic Development**.

It is a governance framework for AI-assisted software development. It is not a replacement for OpenSpec or Superpowers. SGAD uses them as layers:

```text
SGAD v2 = OpenSpec-style specs
        + Superpowers-style execution discipline
        + governance-as-code
        + risk-adaptive workflow
        + optional governance tracks
```

## Principles

1. **Repository over chat**  
   Requirements, decisions, risks, tasks, and evidence must live in the repository.

2. **Risk determines process weight**  
   Small changes should not pay the cost of high-risk governance. High-risk changes must not bypass it.

3. **AI autonomy is bounded**  
   Agents can operate freely inside their assigned scope. They must ask before crossing risk boundaries.

4. **Evidence beats claims**  
   “It should work” is not acceptable. Every meaningful change needs tests, review notes, or verification evidence.

5. **Governance must be executable**  
   Important rules should become CI gates, policy files, or automated checks.

6. **Optional tracks must not bloat the core**  
   Design, security, data, and release tracks attach only when the change risk requires them.

## Risk Classes

| Class | Examples | Required Artifacts |
|---|---|---|
| R0 | copy, docs, minor style, tiny config | task note, verification |
| R1 | single-module feature, local refactor | spec, tasks, tests, verification |
| R2 | API, DB migration, background job, external service | proposal, spec, design, tasks, test plan, risk register, rollout, evidence |
| R3 | auth, RBAC, payment, deletion, compliance, data export | full R2 + human approval + CODEOWNERS + rollback gate |

## Optional Governance Tracks

SGAD core remains:

```text
Spec + Execution + Governance + Evidence
```

Optional tracks attach specialized evidence requirements without making every change heavier.

| Track | Trigger | Example Artifacts |
|---|---|---|
| Design | UI, UX, visual system, responsive layout, accessibility | `design/DESIGN.md`, `sgad/design-review.md`, screenshots |
| Security | auth, secrets, threat model, abuse cases | threat notes, approval, security test evidence |
| Data | schema, migration, retention, privacy | migration plan, rollback, data validation |
| Release | rollout, flags, staged deploy, rollback | rollout checklist, monitoring, rollback notes |

### Design Track

Design Track is inspired by `DESIGN.md` style guides, but SGAD treats design as governed evidence rather than a style prompt only.

Use UI-specific risk classes:

| Class | Scope | Required Evidence |
|---|---|---|
| R1-UI | isolated component or low-risk visual change | DESIGN.md check, focused screenshot or inspection note |
| R2-UI | core flow, dashboard, form, responsive layout | design review, key viewport screenshots, accessibility notes |
| R3-UI | payment, deletion, auth, permission, compliance, high-trust UI | R2-UI + human approval + copy review + rollback plan |

See [design-governance.md](design-governance.md).

## Required Artifacts

For R2/R3 changes:

```text
openspec/changes/<change-id>/
  proposal.md
  spec.md
  design.md
  tasks.md
  test-plan.md

sgad/
  risk-register.md
  evidence-matrix.md
  autonomy-budget.md
  rollout.md
  policies/
    quality-gates.yaml
```

## Evidence Matrix

Every requirement should map to:

- design decision
- implementation task
- test case
- risk item
- verification status

Example:

| Requirement | Design | Task | Test | Risk | Status |
|---|---|---|---|---|---|
| Tenant isolation | request context + repository filter | T-004 | IT-tenant-001 | RISK-tenant-leak | verified |

## Autonomy Budget

Agents may:

- draft specs
- implement assigned tasks
- write tests
- update verification evidence
- propose alternatives

Agents must not silently:

- expand product scope
- alter authentication or RBAC
- change destructive migration history
- call real external services in tests
- edit unrelated modules
- bypass failing tests

## Governance Gates

Recommended gates:

- spec approved
- tasks complete
- tests pass
- lint/typecheck pass
- migration reviewed
- security scan pass
- risk register has no unresolved high risk
- rollout and rollback documented

## Relationship to OpenSpec and Superpowers

OpenSpec answers:

```text
What should be built, why, and how should the change be specified?
```

Superpowers answers:

```text
How should the agent execute implementation safely and rigorously?
```

SGAD answers:

```text
How do we make the whole AI-driven change traceable, risk-aware, reviewable, and releasable?
```
