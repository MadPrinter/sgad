# DESIGN.md

Durable design context for SentinelOps Control Plane.

## Product Feel

- Category: operational SaaS dashboard for AI platform teams.
- Audience: engineering managers, release owners, governance reviewers.
- Personality: dense, controlled, premium, audit-ready.
- Avoid: marketing hero pages, generic purple gradients, low-density cards, decorative-only visuals.

## Tokens

| Token | Value | Usage |
|---|---|---|
| color.page | #f6f8fb | application background |
| color.nav | #101820 | persistent navigation |
| color.surface | #ffffff | panels and cards |
| color.blue | #2563eb | primary actions |
| color.cyan | #0891b2 | evidence and timeline accents |
| color.green | #16803c | pass and confidence |
| color.amber | #b45309 | review states |
| color.red | #b91c1c | blocked states |
| radius.control | 8px | controls, cards, tables |
| shadow.panel | 0 18px 46px rgba(15, 23, 42, .11) | primary surfaces |

## Components

- Sidebar: persistent navigation, dark neutral, active state visible.
- Hero: product and live operational state in first viewport.
- KPI card: label, value, evidence note, colored state dot.
- Agent table: dense operational table with status, task, risk, evidence.
- Governance gate: two-line label plus status pill.
- Timeline: timestamp plus evidence summary.

## Responsive Rules

- Desktop uses sidebar and two-column workspace.
- Tablet collapses to single-column content with nav grid.
- Mobile stacks actions, KPI cards, and timeline without text overlap.

## Accessibility

- Interactive controls require visible `:focus-visible`.
- Search and buttons require accessible labels.
- Color states must include text labels.

## Evidence Required

- R2-UI classification.
- Design review record.
- Requirement-to-design-to-evidence mapping.
- Desktop and mobile viewport inspection notes.
