---
name: sgad
description: Spec-Governed Agentic Development — AI governance framework with spec, execution, governance, and evidence layers.
---

# SGAD Workflow

This project implements **SGAD (Spec-Governed Agentic Development)**. Always follow the four-layer model below when making changes.

## Risk Classification

Classify every change **before** writing production code:

| Class | Scope | Required |
|-------|-------|----------|
| R0 | Copy, docs, tiny config | task + verification |
| R1 | Single-module feature | spec + tasks + tests |
| R2 | API, DB, background jobs, external side effects | full SGAD workflow |
| R3 | Auth, RBAC, payment, deletion, compliance | full SGAD + human approval + rollout gates |

For UI-impacting work, append `-UI` suffix (e.g., R2-UI) and follow the Design Track.

## Workflow

### 1. Spec Layer
- Create `openspec/changes/<change-id>/proposal.md` — what and why
- Create `openspec/changes/<change-id>/design.md` — architecture and alternatives
- Create `openspec/changes/<change-id>/tasks.md` — actionable checklist

### 2. Execution Layer
- Write tests before or alongside implementation (TDD)
- Implement behavior
- Verify all tests pass

### 3. Governance Layer
- Update `sgad/governance.yaml` with the correct risk class
- For R2/R3: update `sgad/risk-register.md`, require human review
- Respect autonomy budget: max 8 files without review, max 30 min without checkpoint

### 4. Evidence Layer
- Update `sgad/evidence-matrix.md` — link requirement → design → task → test → risk → evidence
- For R2/R3: update `sgad/design-review.md` if UI-impacting
- Run `sgad check` before final response

## Commands

- `/sgad:init` — scaffold governance artifacts
- `/sgad:propose <idea>` — create a governed change proposal
- `/sgad:apply` — implement tasks under current risk gates
- `/sgad:verify` — run tests and update evidence
- `/sgad:review` — review risks, tests, rollout, and traceability
- `/sgad:archive` — close a completed change

## Rules

- Never treat chat history as the source of truth. Persist decisions in the repo.
- Always classify risk before editing production code.
- Always run `sgad check` before final response.
- Evidence > claims. Link to artifacts, don't summarize them.
