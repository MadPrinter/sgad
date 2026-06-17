# Risk Register

| Risk | Class | Mitigation | Owner | Status |
|---|---|---|---|---|
| Unclassified change | R1 | Complete governance review before implementation | AI + human | mitigated |
| Evidence check false positives block existing Lite projects | R2 | Default strict evidence enforcement only for R2/R3 unless configured; add tests for R2 behavior | AI | mitigated |
| Evidence check false negatives allow naked pending rows | R2 | Add pending detection, pending_max enforcement, and no-waiver failure coverage | AI | mitigated |
| Benchmark regression slips through CI | R2 | Gate `variants/sgad` score with `--min-score 95` in `npm run check` | AI | mitigated |
| Experience lessons without audit reach recall | R2 | Run `sgad experience audit` in CI; require scope, triggers, evidence | AI | mitigated |
| Agent governance utility unmeasured | R2 | Add deterministic L3 replay harness in `tools/agent-replay.js` | AI | mitigated |
