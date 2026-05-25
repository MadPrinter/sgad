# Integrations

SGAD is intentionally agent-neutral. It can be used with Codex, Claude Code, Cursor, OpenCode, Gemini CLI, GitHub Copilot CLI, or any assistant that can read repository files.

## Codex

This repository includes a Codex-compatible plugin skeleton:

```text
plugins/sgad/
  .codex-plugin/plugin.json
  skills/sgad/SKILL.md
```

You can also copy the generated project skill from:

```text
.codex/skills/sgad/SKILL.md
```

## Claude Code

This repository includes a Claude Code project configuration and skill:

```text
CLAUDE.md                                  auto-read project instructions
.claude/skills/sgad/SKILL.md               invocable via `/sgad`
```

`CLAUDE.md` is automatically loaded when Claude Code opens the project root. It configures the four-layer SGAD workflow as Claude Code's operational instructions.

The skill at `.claude/skills/sgad/SKILL.md` can be invoked with `/sgad` and provides the same governance workflow for ad-hoc use.

You can also use `sgad init` from the CLI to scaffold governance artifacts in any project, then pair it with a `CLAUDE.md` file:

```bash
sgad init
cat > CLAUDE.md << 'EOF'
---
name: sgad
description: SGAD-governed project.
---
Follow SGAD workflow for all changes.
Classify risk, write specs, maintain evidence.
EOF
```

## Slash Command Shape

SGAD commands are designed to map cleanly to tool-specific slash commands:

| Command | Purpose |
|---|---|
| `/sgad:init` | scaffold governance artifacts |
| `/sgad:propose <idea>` | create a governed change proposal |
| `/sgad:apply` | implement tasks under the current risk gates |
| `/sgad:verify` | run tests and update evidence |
| `/sgad:review` | review risks, tests, rollout, and traceability |
| `/sgad:archive` | close a completed change |

The current repository ships the portable CLI foundation first. Tool-specific slash command adapters can be added without changing the SGAD spec.
