# 集成

SGAD 不绑定具体 Agent。Codex、Claude Code、Cursor、OpenCode、Gemini CLI、GitHub Copilot CLI，或者任何能读写仓库文件的助手都可以使用。

## Codex

仓库包含 Codex 兼容插件骨架：

```text
plugins/sgad/
  .codex-plugin/plugin.json
  skills/sgad/SKILL.md
```

也可以直接使用 `sgad init` 生成的项目级 skill：

```text
.codex/skills/sgad/SKILL.md
```

## Claude Code

仓库包含 Claude Code 项目配置和 skill：

```text
CLAUDE.md                                 自动读取的项目指令
.claude/skills/sgad/SKILL.md              可通过 `/sgad` 调用
```

`CLAUDE.md` 在 Claude Code 打开项目根目录时自动加载，将 SGAD 四层工作流配置为 Claude Code 的操作指令。

`.claude/skills/sgad/SKILL.md` 可通过 `/sgad` 调用，提供同样的治理工作流。

## Slash Command 形态

SGAD 命令可以自然映射到不同工具的 slash command：

| 命令 | 用途 |
|---|---|
| `/sgad:init` | 生成治理产物 |
| `/sgad:propose <idea>` | 创建受治理的变更提案 |
| `/sgad:apply` | 在当前风险门禁下实现任务 |
| `/sgad:verify` | 运行测试并更新证据 |
| `/sgad:review` | 审查风险、测试、发布和可追溯性 |
| `/sgad:archive` | 归档已完成变更 |

当前版本先提供可移植 CLI 和 Codex skill，后续可以在不改变 SGAD 规范的前提下增加更多工具适配器。
