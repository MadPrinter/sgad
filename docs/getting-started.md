# Getting Started

SGAD can be used as a lightweight project convention or as a CLI-assisted workflow.

## Install From This Repository

```bash
git clone https://github.com/MadPrinter/sgad.git
cd sgad
npm link
```

Then initialize SGAD in another project:

```bash
cd your-project
sgad init
```

## Use Without Installing

```bash
node /path/to/sgad/bin/sgad.js init
```

## Recommended Agent Prompt

```text
Use SGAD for this change. Classify risk, create or update openspec/changes/<change-id>,
write tests, update sgad/evidence-matrix.md, and run sgad check before final response.
```

## First Change

```bash
sgad init
mkdir -p openspec/changes/add-audit-log
```

Create:

- `proposal.md`: why the change exists
- `design.md`: architecture and tradeoffs
- `tasks.md`: implementation checklist
- `spec.md`: requirements and scenarios
- `test-plan.md`: verification plan

Then implement the change and run:

```bash
sgad check
```
