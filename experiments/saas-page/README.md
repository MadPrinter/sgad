# SaaS Page Experiment

This experiment compares OpenSpec, Superpowers, and SGAD v0.3 on the same UI-heavy task:

> Build a polished AI Ops SaaS dashboard for teams monitoring autonomous agents, incidents, governance gates, and rollout evidence.

The goal is not only visual polish. The evaluator checks whether each workflow leaves durable design context, accessibility evidence, responsive behavior, and governance artifacts.

## Run

```bash
npm run evaluate:saas
```

Run one variant:

```bash
cd experiments/saas-page/variants/sgad
node --test
```

Open a page directly in the browser:

```text
experiments/saas-page/variants/openspec/public/index.html
experiments/saas-page/variants/superpowers/public/index.html
experiments/saas-page/variants/sgad/public/index.html
```

## Results

| Variant | Score | Percent |
|---|---:|---:|
| OpenSpec | 95/110 | 86% |
| Superpowers | 95/110 | 86% |
| SGAD v0.3 | 105/110 | 95% |

See [REPORT.md](REPORT.md).

## Variants

| Variant | Primary Discipline |
|---|---|
| OpenSpec | proposal, design, specs, tasks |
| Superpowers | execution plan, TDD, review, verification |
| SGAD v0.3 | spec + execution + governance + evidence + optional Design Track |
