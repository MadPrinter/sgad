# SGAD: Spec-Governed Agentic Development

SGAD is an AI development governance framework that combines:

- **OpenSpec-style specification management**
- **Superpowers-style agent execution discipline**
- **Governance-as-code for risk, evidence, review, rollout, and CI gates**

This repository contains both the SGAD v2 specification and a real runnable experiment comparing SGAD with OpenSpec and Superpowers on the same medium-sized project.

中文文档: [README.zh-CN.md](README.zh-CN.md)

## Why SGAD

AI coding agents are good at producing code, but production engineering needs more than code:

- requirements must be traceable
- tests must prove behavior
- risky changes must be reviewed
- database migrations need rollback plans
- security and RBAC changes need gates
- AI autonomy must have boundaries

SGAD treats AI development as a governed engineering process, not a chat transcript.

## Core Formula

```text
SGAD v2 = Spec Layer + Execution Layer + Governance Layer + Evidence Layer

Spec Layer       = OpenSpec-style proposal/spec/design/tasks
Execution Layer  = Superpowers-style TDD/review/verification
Governance Layer = risk classification + policies + rollout gates
Evidence Layer   = requirement-to-test-to-risk traceability
```

## Risk Classes

| Class | Scope | Required Process |
|---|---|---|
| R0 | copy, docs, tiny config | task + verification |
| R1 | single-module feature | spec + tasks + tests |
| R2 | API, DB, background jobs, external side effects | full SGAD workflow |
| R3 | auth, RBAC, payment, deletion, compliance | full SGAD + human approval + rollout gates |

## Repository Layout

```text
docs/
  sgad-v2.md
  design-history.md
  evaluation.md
  zh-CN/
    sgad-v2.md
    design-history.md
    evaluation.md

seed/
  minimal starting project

variants/
  openspec/
  superpowers/
  sgad/

tools/
  evaluate-variant.js
  evaluate-all.js
```

## Real Experiment

The experiment implements the same medium-sized system three times:

**Incident Response Center**

- REST API
- static frontend
- multi-tenant isolation
- RBAC
- incident status workflow
- audit log
- SLA reminder background job
- injectable notifier
- tests
- workflow-specific documentation

Final score:

| Variant | Score | Tests |
|---|---:|---:|
| OpenSpec | 83/100 | 5 passing |
| Superpowers | 78/100 | 6 passing |
| SGAD v2 | 95/100 | 6 passing |

See [docs/evaluation.md](docs/evaluation.md).

## Run the Experiment

```bash
node tools/evaluate-all.js
```

Run one variant:

```bash
cd variants/sgad
node --test
node src/server.js
```

Open:

```text
http://localhost:3000
```

Use a different port:

```bash
PORT=3001 node src/server.js
```

On PowerShell:

```powershell
$env:PORT=3001
node src\server.js
```

## Version

Current version: `v0.1.0`

See [CHANGELOG.md](CHANGELOG.md).

