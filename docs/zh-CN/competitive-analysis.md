# 竞品分析

本分析基于对 Superpowers 和 OpenSpec 的仓库结构、README、安装路径和工作流的复盘。

## Superpowers 做对了什么

- 它不是单纯文档，而是可安装的 Agent 行为系统。
- 它给 Agent 明确纪律：头脑风暴、计划、TDD、实现、审查、验证。
- 它把能力拆成可组合 skill，便于跨工具迁移。
- README 先告诉用户怎么开始，而不是先讲大理论。

## OpenSpec 做对了什么

- 定位一句话清楚：面向 AI coding assistant 的规格驱动开发。
- 有 CLI 和 slash command 工作流。
- 产物简单：proposal、specs、design、tasks、archive。
- 强调 brownfield、低仪式感、可迭代。
- 文档覆盖安装、命令、工具支持和贡献方式。

## SGAD 的位置

SGAD 不应该靠更多 Markdown 竞争，而应该补上工程治理层：

- 风险分级
- 自主性预算
- 证据矩阵
- 发布门禁
- 人工审批策略
- 需求到测试到风险的可追溯性

## SGAD 的产品要求

- 新用户 30 秒内理解 SGAD。
- 一个命令初始化项目。
- Agent 通过 skill 或 plugin 获得持久指令。
- 治理产物可被机器检查。
- 仓库里必须有真实 benchmark，而不是只靠口号。
- 中英文文档都能独立阅读。

## v0.2.0 已补齐的差距

- 增加 `sgad` CLI。
- 增加 Codex 兼容 skill 和 plugin 骨架。
- 增加 governance 与 change record JSON schema。
- 重写 README 定位和 quickstart。
- 增加贡献、安全和集成文档。
