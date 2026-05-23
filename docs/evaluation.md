# Evaluation

## Experiment

The same medium-sized project was implemented three times from the same seed:

- OpenSpec variant
- Superpowers variant
- SGAD v2 variant

Project: multi-tenant Incident Response Center.

Required features:

- REST API
- static frontend
- tenant isolation
- RBAC
- incident status workflow
- audit log
- SLA reminder job
- injectable notifier
- tests
- workflow-specific documentation

## Results

| Variant | Score | Tests |
|---|---:|---:|
| OpenSpec | 83/100 | 5 passing |
| Superpowers | 78/100 | 6 passing |
| SGAD v2 | 95/100 | 6 passing |

## Interpretation

OpenSpec produced strong specification artifacts and clear design boundaries.

Superpowers produced strong execution discipline and test coverage, but fewer long-term governance artifacts.

SGAD v2 scored highest because it combined:

- OpenSpec-style change documentation
- working implementation
- tests
- risk register
- evidence matrix
- autonomy budget
- rollout plan
- governance policy

## Important Fairness Note

The evaluator measures both code behavior and workflow artifacts. Superpowers is not primarily a governance documentation framework, so it loses points on OpenSpec/SGAD-specific artifacts even though its implementation tests are strong.

## Run

```bash
node tools/evaluate-all.js
```

Individual tests:

```bash
cd variants/openspec && node --test
cd variants/superpowers && node --test
cd variants/sgad && node --test
```

