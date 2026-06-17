# Agent Replay (L3)

Deterministic replay scenarios measure whether SGAD governance behavior matches expected agent workflows without calling a live LLM.

## What It Measures

| Metric | Meaning |
|---|---|
| `pass_rate` | Share of replay scenarios that behave as expected |
| `CHECK-*` | Evidence closure gates block or allow correctly |
| `RECALL-*` | Experience recall hits relevant lessons and rejects noise |
| `SOP-*` | Consumer-style strict vs relaxed governance fixtures |
| `AUDIT-*` | Experience INDEX sync enforcement |

## Run

```bash
npm run evaluate:replay
node tools/agent-replay.js --json --min-pass-rate 1
```

`npm run check` also runs agent replay before governance gates.

## Scenarios

Scenario definitions live in `tools/agent-replay-scenarios.json`.

## Limits

This is not a substitute for live agent evaluation. It validates CLI governance behavior on fixed seeds. Human review and real task replay remain necessary for production adoption claims.
