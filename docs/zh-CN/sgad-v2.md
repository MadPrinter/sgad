# SGAD v2 规范

## 定义

SGAD 是 **Spec-Governed Agentic Development**，中文可称为“规格治理型 Agent 开发”。

它不是 OpenSpec 或 Superpowers 的替代品，而是把两者纳入一个更完整的工程治理框架：

```text
SGAD v2 = OpenSpec 风格规格层
        + Superpowers 风格执行层
        + Governance-as-Code
        + 风险自适应流程
```

## 原则

1. **仓库优先于聊天**  
   需求、决策、风险、任务和验证证据必须落到仓库。

2. **风险决定流程重量**  
   小改动不应承担高风险流程成本，高风险改动也不能绕过治理。

3. **AI 自治必须有边界**  
   Agent 可以在任务范围内自主行动，但越过风险边界前必须确认。

4. **证据优先于声明**  
   “应该好了”不算完成。必须有测试、审查或验证证据。

5. **治理必须可执行**  
   重要规则应转化为 CI gate、policy 文件或自动检查。

## 风险分级

| 级别 | 示例 | 必要产物 |
|---|---|---|
| R0 | 文案、文档、轻微样式、小配置 | task note, verification |
| R1 | 单模块功能、本地重构 | spec, tasks, tests, verification |
| R2 | API、数据库迁移、后台任务、外部服务 | proposal, spec, design, tasks, test plan, risk register, rollout, evidence |
| R3 | 认证、RBAC、支付、删除、合规、数据导出 | 完整 R2 + 人工审批 + CODEOWNERS + rollback gate |

## R2/R3 产物

```text
openspec/changes/<change-id>/
  proposal.md
  spec.md
  design.md
  tasks.md
  test-plan.md

sgad/
  risk-register.md
  evidence-matrix.md
  autonomy-budget.md
  rollout.md
  policies/
    quality-gates.yaml
```

## 证据矩阵

每个需求都应关联：

- 设计决策
- 实施任务
- 测试用例
- 风险项
- 验证状态

示例：

| 需求 | 设计 | 任务 | 测试 | 风险 | 状态 |
|---|---|---|---|---|---|
| 租户隔离 | request context + repository filter | T-004 | IT-tenant-001 | RISK-tenant-leak | verified |

## AI 自治预算

Agent 可以：

- 起草规格
- 实现已分配任务
- 编写测试
- 更新验证证据
- 提出替代方案

Agent 不得静默：

- 扩大产品范围
- 修改认证或 RBAC
- 修改破坏性迁移历史
- 在测试中调用真实外部服务
- 编辑无关模块
- 绕过失败测试

## 治理门禁

推荐 gate：

- spec approved
- tasks complete
- tests pass
- lint/typecheck pass
- migration reviewed
- security scan pass
- risk register 无未解决高风险
- rollout 和 rollback 已记录

