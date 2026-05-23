# 快速开始

SGAD 既可以作为轻量项目约定使用，也可以作为 CLI 辅助流程使用。

## 从当前仓库安装

```bash
git clone https://github.com/MadPrinter/sgad.git
cd sgad
npm link
```

然后在另一个项目中初始化：

```bash
cd your-project
sgad init
```

## 不安装直接使用

```bash
node /path/to/sgad/bin/sgad.js init
```

## 推荐给 Agent 的提示词

```text
Use SGAD for this change. Classify risk, create or update openspec/changes/<change-id>,
write tests, update sgad/evidence-matrix.md, and run sgad check before final response.
```

## 第一个变更

```bash
sgad init
mkdir -p openspec/changes/add-audit-log
```

创建：

- `proposal.md`：为什么要做
- `design.md`：架构和取舍
- `tasks.md`：实现清单
- `spec.md`：需求和场景
- `test-plan.md`：验证计划

实现后运行：

```bash
sgad check
```

## UI 工作

涉及 UI 的变更，可以启用可选 Design Track：

```bash
sgad init --with-design
```

然后更新 `design/DESIGN.md`，并在 `sgad/design-review.md` 中记录证据。
