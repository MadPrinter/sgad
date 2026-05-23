# SGAD：规格治理型 AI 开发规范

SGAD 是一套 AI 开发治理框架，融合了：

- **OpenSpec 风格的规格与变更管理**
- **Superpowers 风格的 Agent 执行纪律**
- **工程治理层：风险、证据、评审、发布、CI 门禁**

这个仓库同时包含 SGAD v2 规范，以及一个真实可运行的对比实验：同一个中型项目分别用 OpenSpec、Superpowers、SGAD 三种方式实现，并统一评分。

English: [README.md](README.md)

## 为什么需要 SGAD

AI coding agent 很会写代码，但生产工程需要的不只是代码：

- 需求必须可追踪
- 测试必须能证明行为
- 高风险变更必须被评审
- 数据库迁移需要回滚方案
- 权限/RBAC/安全变更需要门禁
- AI 自治必须有边界

SGAD 把 AI 开发视为一个受治理的工程过程，而不是一次聊天。

## 核心公式

```text
SGAD v2 = 规格层 + 执行层 + 治理层 + 证据层

规格层 = OpenSpec 风格 proposal/spec/design/tasks
执行层 = Superpowers 风格 TDD/review/verification
治理层 = 风险分级 + policy + rollout gate
证据层 = 需求-设计-任务-测试-风险的可追踪矩阵
```

## 风险分级

| 级别 | 范围 | 所需流程 |
|---|---|---|
| R0 | 文案、文档、小配置 | task + verification |
| R1 | 单模块普通功能 | spec + tasks + tests |
| R2 | API、数据库、后台任务、外部副作用 | 完整 SGAD |
| R3 | 认证、RBAC、支付、删除、合规 | 完整 SGAD + 人工审批 + 发布门禁 |

## 仓库结构

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
  统一起始项目

variants/
  openspec/
  superpowers/
  sgad/

tools/
  evaluate-variant.js
  evaluate-all.js
```

## 真实实验

实验项目是一个中型系统：

**多租户 Incident Response Center**

包含：

- REST API
- 静态前端
- 多租户隔离
- RBAC
- incident 状态流转
- 审计日志
- SLA reminder 后台任务
- injectable notifier
- 测试
- 各自规范要求的文档产物

最终评分：

| 方案 | 分数 | 测试 |
|---|---:|---:|
| OpenSpec | 83/100 | 5 个通过 |
| Superpowers | 78/100 | 6 个通过 |
| SGAD v2 | 95/100 | 6 个通过 |

详见：[docs/zh-CN/evaluation.md](docs/zh-CN/evaluation.md)

## 运行实验

```bash
node tools/evaluate-all.js
```

运行单个版本：

```powershell
cd variants\sgad
node --test
node src\server.js
```

打开：

```text
http://localhost:3000
```

如果端口被占用：

```powershell
$env:PORT=3001
node src\server.js
```

## 版本

当前版本：`v0.1.0`

详见：[CHANGELOG.md](CHANGELOG.md)

