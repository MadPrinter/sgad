# Governance Anti-Patterns

Reusable mistakes to avoid when running SGAD on agent-assisted changes.

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Presence without closure | `sgad check` passes while evidence rows stay `pending` | Validate closure, waivers, and evidence paths |
| Chat as source of truth | Decisions live only in agent history | Persist proposal, design, tasks, and evidence in repo |
| Silent retries | Agent loops on fixes with no checkpoint | Surface progress, warnings, and next actions in CLI output |
| Batch without preflight | Production batch starts before environment/business gates | Run preflight once before batch; see `sgad/templates/rollout-preflight.md` |
| One failure aborts batch | Partial work is lost with no audit trail | Per-item try/catch, audit rows, continue policy |
| Broad experience recall | Irrelevant lessons pollute every task | Scope lessons, use tags, run recall only on R2/R3 or repeated failures |
| Benchmark without gate | Score regresses but CI stays green | Keep `npm run check` min-score gate for `variants/sgad` |

Mapped lessons live in `sgad/experience/lessons.yaml` and `sgad/experience/INDEX.md`.
