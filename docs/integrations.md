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
