# Test Plan: enhance-evidence-check

| ID | Coverage | Evidence |
|---|---|---|
| UT-01 | Pending evidence without waiver fails | test/sgad-check.test.js |
| UT-02 | Existing evidence path passes | test/sgad-check.test.js |
| UT-03 | Valid waiver passes with warning | test/sgad-check.test.js |
| UT-04 | Missing evidence path fails | test/sgad-check.test.js |

Run:

```bash
node --test test/sgad-check.test.js
node bin/sgad.js check --json
```
