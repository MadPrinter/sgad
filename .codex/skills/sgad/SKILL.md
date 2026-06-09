---
name: sgad
description: Use SGAD when implementing AI-assisted software changes that need specs, tests, risk controls, evidence, or review gates.
---

# SGAD

Use this workflow before changing production code:

1. Classify the change as R0, R1, R2, or R3.
2. For R1 and above, create or update `openspec/changes/<change-id>/`.
3. Write tests before or alongside implementation.
4. Update `openspec/changes/<change-id>/tasks.md` so checkboxes match reality.
5. Fill `sgad/evidence-matrix.md` with concrete paths/tests/artifacts, or add a time-boxed `sgad/waivers.yaml`.
6. For R2/R3, update `sgad/risk-register.md` and require explicit review before rollout.
7. For UI changes, read `design/DESIGN.md`, classify R1-UI/R2-UI/R3-UI, and update `sgad/design-review.md`.
8. For R2/R3 work, repeated failures, matching touched files, or user requests about prior experience, run `sgad experience recall --json` with the task and touched files, then apply only relevant active lessons.
9. When a task creates reusable learning, run `sgad experience template --json` to add a candidate to `sgad/experience/review-queue.md`; do not promote it to active without scope, triggers, evidence, and review.
10. Run `sgad check`; if it fails, fix the reported issues or obtain a human waiver.
11. If project experience files changed, run `sgad experience audit --json`.
12. Never claim SGAD passed when evidence rows are still pending without a valid waiver.

Never treat chat history as the source of truth. Persist decisions in the repo.
