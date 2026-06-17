# Proposal: enhance-ci-experience-from-sop

## Why

SGAD CI only ran `sgad check` and a non-gating benchmark. SOP project lessons (closure gates, visible retries, preflight batching) were not encoded as recallable governance experience.

## What Changes

- Harden `npm run check` with unit tests, experience audit, and benchmark min-score gate
- Add `sgad experience index`, recall `--tags`, and typed evidence prefixes (`fixture:`, `benchmark:`, `smoke:`)
- Add governance anti-patterns, rollout preflight template, and SOP-derived active lessons

## Impact

- Risk class: R2
- Affected areas: CLI, CI, experience layer, policies, tests
