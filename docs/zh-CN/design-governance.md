# Design Governance Track

Design Governance Track 是可选轨道。只有当变更影响 UI、UX、视觉语言、组件行为、可访问性或响应式布局时才启用。

它借鉴 `awesome-design-md` 这类 `DESIGN.md` 仓库，但 SGAD 不把设计规范只当成风格提示词，而是把它作为可以留下证据的工程上下文。

## 为什么是可选

SGAD Core 必须对后端服务、CLI、SDK、基础设施项目保持轻量。设计治理只在 UI 质量本身构成产品风险时启用，不应该让非 UI 变更变重。

## 什么时候启用

适用于：

- 新页面或新流程
- dashboard、SaaS、CRM、管理后台、运营工具
- 表单、表格、导航、弹窗、危险操作
- 移动端或响应式布局
- 可访问性敏感交互
- 支付、删除、权限、合规、用户信任相关 UI

## UI 风险分级

| 级别 | 范围 | 必需证据 |
|---|---|---|
| R1-UI | 独立组件或低风险视觉调整 | DESIGN.md 检查、局部截图或检查说明 |
| R2-UI | 核心流程、dashboard、表单、响应式布局 | 设计评审、多视口截图、可访问性说明 |
| R3-UI | 支付、删除、认证、权限、合规、高信任 UI | R2-UI + 人工审批 + 文案审查 + 回滚方案 |

## 必需产物

```text
design/
  DESIGN.md
  components.md
  screenshots/

sgad/
  design-review.md
  evidence-matrix.md
```

## 证据规则

涉及 UI 的变更，证据矩阵应包含：

- 需求
- 设计来源
- 实现任务
- 测试或检查方式
- 风险等级
- 截图或视觉评审证据
- 响应式和可访问性说明

## Agent 规则

AI Agent 必须：

- UI 编辑前读取 `design/DESIGN.md`
- 优先复用已有组件和 token
- 不在无记录决策的情况下发明新视觉风格
- 对 R2-UI/R3-UI 留下截图或检查证据
- 把文字溢出、重叠、焦点不可见、移动端破版视为缺陷

AI Agent 不得：

- 只把 `DESIGN.md` 当装饰性提示词
- 未经审批替换真实设计系统
- 已有复用模式时引入一次性样式
- 用不清晰 UI 隐藏危险操作或权限敏感操作

## 与 SGAD Core 的关系

Design Track 扩展的是 SGAD 的证据层。它不替代产品设计工具、Figma、品牌系统或人工设计评审。

```text
SGAD Core = Spec + Execution + Governance + Evidence
Design Track = optional UI/UX governance attached to SGAD Core
```
