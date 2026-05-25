---
name: sgad
description: Use SGAD when implementing AI-assisted software changes that need specs, tests, risk controls, evidence, or review gates.
---

# SGAD — Spec-Governed Agentic Development

SGAD is a four-layer governance workflow for AI-assisted development:

1. **Spec layer** — capture proposal, design, requirements, and tasks in `openspec/changes/<change-id>/`
2. **Execution layer** — plan, TDD, implement, verify, and review
3. **Governance layer** — classify risk (R0–R3), apply policies, define rollout gates, bound autonomy
4. **Evidence layer** — link requirement → task → code → test → risk → verification

## Required Behavior

- Classify every change as R0, R1, R2, or R3 **before** editing production code
- For R1+: maintain `openspec/changes/<change-id>/` with proposal, design, and tasks
- For R2/R3: maintain `sgad/risk-register.md` and require explicit human review before rollout
- For UI changes: read `design/DESIGN.md`, classify as R1-UI/R2-UI/R3-UI, update `sgad/design-review.md`
- Maintain `sgad/evidence-matrix.md` for full traceability
- Run tests and `sgad check` before final response

Do not rely on chat history as the durable source of truth.
