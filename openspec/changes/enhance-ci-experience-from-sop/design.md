# Design: enhance-ci-experience-from-sop

## CI Pipeline

```text
npm run check =
  npm test
  && sgad check
  && sgad experience audit   # includes INDEX sync validation
  && evaluate-all --min-score 95 --min-framework-score 98
```

## Framework Evaluator

`tools/evaluate-framework.js` scores the SGAD package itself (anti-patterns, INDEX, lessons, preflight template, CI script). Deleting these artifacts lowers the framework score and fails CI even when `variants/sgad` stays at 95.

## Experience Additions

- `sgad experience index [--write]` for searchable lesson inventory
- recall `--tags` filter with tag score boost
- typed evidence tokens resolve paths after prefix strip

## SOP-Derived Lessons

| Lesson | Source pattern |
|---|---|
| LESSON-002 | recordings/chat not source of truth |
| LESSON-003 | visible retries and CI gate output |
| LESSON-004 | preflight before batch, per-item resilience |

## Alternatives Rejected

- Merging sop-rpa skill into SGAD core — keeps domain skill separate
- Auto-running recall on every task — stays zero-default
