---
name: sgad
description: Use SGAD when implementing AI-assisted software changes that need specs, tests, risk controls, evidence, or review gates.
---

# SGAD

Use this workflow before changing production code:

1. Classify the change as R0, R1, R2, or R3.
2. For R1 and above, create or update `openspec/changes/<change-id>/`.
3. Write tests before or alongside implementation.
4. Maintain `sgad/evidence-matrix.md` with requirement, design, task, test, risk, and evidence links.
5. For R2/R3, update `sgad/risk-register.md` and require explicit review before rollout.
6. For UI changes, read `design/DESIGN.md`, classify R1-UI/R2-UI/R3-UI, and update `sgad/design-review.md`.
7. Run `sgad check` before final response.

Never treat chat history as the source of truth. Persist decisions in the repo.
