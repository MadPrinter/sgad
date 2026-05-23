# 评估报告

## 实验设计

同一个中型项目从同一个 seed 开始实现三次：

- OpenSpec 变体
- Superpowers 变体
- SGAD v2 变体

项目：多租户 Incident Response Center。

必需能力：

- REST API
- 静态前端
- 租户隔离
- RBAC
- incident 状态流转
- 审计日志
- SLA reminder 后台任务
- injectable notifier
- 测试
- 各自流程要求的文档产物

## 结果

| 方案 | 分数 | 测试 |
|---|---:|---:|
| OpenSpec | 83/100 | 5 个通过 |
| Superpowers | 78/100 | 6 个通过 |
| SGAD v2 | 95/100 | 6 个通过 |

## 解读

OpenSpec 的规格产物最清晰，适合需求和设计评审。

Superpowers 的执行纪律和测试覆盖很强，但长期治理产物较少。

SGAD v2 得分最高，因为它同时包含：

- OpenSpec 风格变更文档
- 可运行实现
- 测试
- 风险登记
- 证据矩阵
- AI 自治预算
- 发布计划
- 治理 policy

## 公平性说明

评估器同时检查代码行为和流程产物。Superpowers 不是治理文档框架，所以在 OpenSpec/SGAD 类产物上失分；这不代表它的代码测试质量弱。

## 运行

```bash
node tools/evaluate-all.js
```

单独测试：

```bash
cd variants/openspec && node --test
cd variants/superpowers && node --test
cd variants/sgad && node --test
```

