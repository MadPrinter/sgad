# Test Plan: enhance-ci-experience-from-sop

| ID | Case | Test |
|---|---|---|
| UT-CI-01 | fixture: evidence passes when path exists | test/sgad-ci.test.js |
| UT-CI-02 | fixture: evidence fails when path missing | test/sgad-ci.test.js |
| UT-CI-03 | experience index returns lessons | test/sgad-ci.test.js |
| UT-CI-04 | recall filters by tags | test/sgad-ci.test.js |
| UT-CI-05 | benchmark min-score gate passes at 95 | test/sgad-ci.test.js |
| UT-CI-06 | benchmark min-score gate fails above max | test/sgad-ci.test.js |
| UT-CI-07 | benchmark/smoke typed evidence resolves | test/sgad-ci.test.js |
| UT-CI-08 | SOP-3 strict fixture fails on pending | test/sgad-ci.test.js |
| UT-CI-09 | SOP-3 relaxed fixture passes pending budget | test/sgad-ci.test.js |
| UT-CI-10 | recall rejects tag-only noise | test/sgad-ci.test.js |
| UT-CI-11 | audit fails stale INDEX | test/sgad-experience.test.js, test/sgad-ci.test.js |
| UT-CI-12 | framework evaluator score >= 98 | tools/evaluate-framework.js, test/sgad-ci.test.js |
| UT-REP-01 | all agent replay scenarios pass | test/agent-replay.test.js |
| UT-REP-02 | replay enforces min pass rate | test/agent-replay.test.js |

Run:

```bash
npm run check
```
