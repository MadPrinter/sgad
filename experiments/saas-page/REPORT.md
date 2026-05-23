# SaaS Page Experiment Report

## Question

Does SGAD v0.3's optional Design Governance Track improve a UI-heavy AI development task compared with OpenSpec and Superpowers alone?

## Task

Build a polished operational SaaS dashboard for AI platform teams:

- product identity and live operational state in the first viewport
- KPI strip
- agent activity table
- governance gates
- rollout evidence timeline
- responsive behavior
- accessibility basics
- durable workflow artifacts

## Results

| Variant | Score | Percent | Main Strength | Main Gap |
|---|---:|---:|---|---|
| OpenSpec | 95/110 | 86% | strong requirements and change artifacts | no dedicated design governance evidence |
| Superpowers | 95/110 | 86% | strong execution, TDD, and review workflow | no durable DESIGN.md or UI evidence matrix |
| SGAD v0.3 | 105/110 | 95% | design context, R2-UI risk, evidence matrix, design review | higher ceremony for UI work |

## Visual Output

| OpenSpec | Superpowers | SGAD v0.3 |
|---|---|---|
| [![OpenSpec SaaS page](screenshots/openspec.png)](variants/openspec/public/index.html) | [![Superpowers SaaS page](screenshots/superpowers.png)](variants/superpowers/public/index.html) | [![SGAD SaaS page](screenshots/sgad.png)](variants/sgad/public/index.html) |

## Interpretation

All three variants can produce a competent SaaS page when the requirements are clear.

OpenSpec performs well because the desired behavior is captured in proposal, spec, design, and tasks. Its weakness is that visual consistency and UI evidence remain implicit.

Superpowers performs well because the implementation is guided by execution discipline: brainstorming, TDD plan, implementation plan, review, and verification. Its weakness is that UI decisions are not preserved as a reusable design system.

SGAD v0.3 scores higher because it activates the optional Design Track:

- `design/DESIGN.md`
- `design/components.md`
- `sgad/design-review.md`
- `sgad/evidence-matrix.md`
- `R2-UI` risk classification
- responsive and accessibility inspection notes

The important result is not only that the SGAD page is more polished. It is that the design decisions are inspectable and repeatable.

## Run

```bash
npm run evaluate:saas
```

Open the pages:

```text
experiments/saas-page/compare.html
experiments/saas-page/variants/openspec/public/index.html
experiments/saas-page/variants/superpowers/public/index.html
experiments/saas-page/variants/sgad/public/index.html
```

`compare.html` embeds all three interfaces side by side with scores and notes.
