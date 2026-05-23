---
name: sgad
description: Use SGAD for AI-assisted code changes that need requirements traceability, tests, risk controls, rollout checks, or human review gates.
---

# SGAD

SGAD is a four-layer workflow:

1. Spec layer: capture proposal, design, requirements, and tasks.
2. Execution layer: plan, test, implement, verify, and review.
3. Governance layer: classify risk, apply policies, define rollout gates, and bound autonomy.
4. Evidence layer: link requirement, task, code, test, risk, and verification evidence.

Optional tracks attach specialized governance when needed. Use the Design Track only for UI-impacting work.

Required behavior:

- Classify every change as R0, R1, R2, or R3 before editing production code.
- For R1+, maintain `openspec/changes/<change-id>/`.
- For R2/R3, maintain `sgad/risk-register.md` and require explicit human review before rollout.
- For UI changes, read `design/DESIGN.md`, classify R1-UI/R2-UI/R3-UI, and update `sgad/design-review.md`.
- Maintain `sgad/evidence-matrix.md` for traceability.
- Run tests and `sgad check` before final response.

Do not rely on chat history as the durable source of truth.
