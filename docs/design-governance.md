# Design Governance Track

The Design Governance Track is optional. It is activated only when a change affects UI, UX, visual language, component behavior, accessibility, or responsive layout.

It is inspired by `DESIGN.md` repositories such as `awesome-design-md`, but SGAD treats design as evidence-bearing engineering context rather than a style prompt alone.

## Why It Is Optional

SGAD core must remain lightweight for backend services, CLIs, SDKs, and infrastructure work. Design governance is useful when UI quality is part of the product risk. It should not make non-UI changes heavier.

## When To Enable It

Enable the track for:

- new screens or flows
- dashboard, SaaS, CRM, admin, or operational UI work
- forms, tables, navigation, modals, and destructive actions
- mobile or responsive behavior
- accessibility-sensitive interactions
- UI around payment, deletion, permissions, compliance, or user trust

## UI Risk Classes

| Class | Scope | Required Evidence |
|---|---|---|
| R1-UI | isolated component or low-risk visual change | DESIGN.md check, focused screenshot or inspection note |
| R2-UI | core flow, dashboard, form, responsive layout | design review, screenshots across key viewports, accessibility notes |
| R3-UI | payment, deletion, auth, permission, compliance, high-trust UI | R2-UI + human approval + copy review + rollback plan |

## Required Artifacts

```text
design/
  DESIGN.md
  components.md
  screenshots/

sgad/
  design-review.md
  evidence-matrix.md
```

## Evidence Rules

For UI-impacting changes, the evidence matrix should include:

- requirement
- design source
- implementation task
- test or inspection method
- risk class
- screenshot or visual review evidence
- responsive and accessibility notes

## Agent Rules

AI agents must:

- read `design/DESIGN.md` before UI edits
- reuse existing components and tokens where possible
- avoid inventing a new visual style without a recorded decision
- capture screenshot or inspection evidence for R2-UI/R3-UI
- flag text overflow, overlap, inaccessible focus states, and mobile breakage as defects

AI agents must not:

- treat `DESIGN.md` as a decorative prompt only
- replace a real design system without approval
- introduce one-off styles when a reusable pattern exists
- hide destructive or permission-sensitive actions behind unclear UI

## Relationship To SGAD Core

Design Track extends SGAD's evidence layer. It does not replace product design tools, Figma, brand systems, or human design review.

```text
SGAD Core = Spec + Execution + Governance + Evidence
Design Track = optional UI/UX governance attached to SGAD Core
```
