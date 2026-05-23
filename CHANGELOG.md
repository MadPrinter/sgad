# Changelog

## Unreleased

### Added

- SaaS Page Experiment comparing OpenSpec, Superpowers, and SGAD v0.3 on a UI-heavy AI Ops dashboard.
- `npm run evaluate:saas` evaluator.
- Three runnable static pages under `experiments/saas-page/variants/`.
- Experiment report showing SGAD v0.3 at 105/110 versus 95/110 for OpenSpec and Superpowers.

## v0.3.0 - 2026-05-23

Added optional Design Governance Track inspired by `DESIGN.md` workflows.

### Added

- `sgad init --with-design` for UI/UX governance scaffolding.
- `docs/design-governance.md` and Chinese translation.
- `templates/DESIGN.md` for durable AI design context.
- UI risk classes: `R1-UI`, `R2-UI`, `R3-UI`.
- Design evidence fields in the change schema.
- Optional governance tracks in the governance schema.

### Changed

- Updated README, quickstart, skills, evidence matrix, and governance config to show Design Track as optional rather than core bloat.

## v0.2.0 - 2026-05-23

Open-source readiness upgrade inspired by Superpowers and OpenSpec.

### Added

- Portable `sgad` CLI with `init` and `check`.
- Codex-compatible plugin and SGAD skill skeleton.
- Governance and change JSON schemas.
- Integration guide, getting started guide, competitive analysis, contribution guide, security policy, and CI workflow.
- Bilingual quickstart and clearer project positioning.

### Changed

- Reworked README and Chinese README around installability, agent usage, benchmark evidence, and the governance-layer differentiator.
- Updated package metadata, scripts, keywords, repository URL, and Node engine.

## v0.1.0 - 2026-05-23

Initial public version.

### Added

- SGAD v2 specification.
- Chinese and English documentation.
- Design history with five dialectical iterations.
- Real experiment comparing OpenSpec, Superpowers, and SGAD.
- Runnable Incident Response Center variants.
- Unified evaluator and final results.
