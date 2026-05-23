# 贡献指南

SGAD 接受三类贡献：

- 文档修正和示例。
- 让 AI Agent 更安全或更有效的工作流改进。
- 面向具体助手和 IDE 的工具适配器。

## 小变更

文档拼写、链接、示例等小修正可以直接提交。

## 较大变更

如果变更会影响工作流、治理策略、schema 或 CLI 行为：

1. 创建 `openspec/changes/<change-id>/`。
2. 添加 `proposal.md`、`design.md`、`tasks.md` 和测试说明。
3. 标记风险等级。
4. 如果行为变化，更新 `sgad/evidence-matrix.md`。
5. 运行：

```bash
npm run check
```

## AI 生成贡献

欢迎 AI 生成代码，但贡献需要说明：

- 使用的助手和模型
- 提示词或工作流摘要
- 已运行的测试
- 已知限制

SGAD 重视证据，而不是只看声明。
