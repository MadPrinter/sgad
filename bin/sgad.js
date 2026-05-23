#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const files = {
  "sgad/governance.yaml": `version: 0.3.0
risk_class: R1
optional_tracks:
  design: false
autonomy:
  max_files_without_review: 8
  max_minutes_without_checkpoint: 30
gates:
  require_spec: true
  require_tests: true
  require_evidence_matrix: true
  require_risk_review_for: [R2, R3]
approvals:
  R3: human
`,
  "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | pending | R1 | pending |
`,
  "sgad/risk-register.md": `# Risk Register

| Risk | Class | Mitigation | Owner | Status |
|---|---|---|---|---|
| Unclassified change | R1 | Complete governance review before implementation | AI + human | open |
`,
  "openspec/changes/example-change/proposal.md": `# Proposal: example-change

## Why

Describe the user or business problem.

## What Changes

- Add the smallest valuable behavior.
- Keep scope explicit.

## Impact

- Risk class: R1
- Affected areas: TBD
`,
  "openspec/changes/example-change/design.md": `# Design: example-change

## Architecture

Describe the selected approach and rejected alternatives.

## Data / API / Security

Record any API, persistence, RBAC, privacy, or side-effect implications.
`,
  "openspec/changes/example-change/tasks.md": `# Tasks: example-change

- [ ] Classify risk
- [ ] Write or update tests
- [ ] Implement behavior
- [ ] Update evidence matrix
- [ ] Run verification
`,
  ".codex/skills/sgad/SKILL.md": `---
name: sgad
description: Use SGAD when implementing AI-assisted software changes that need specs, tests, risk controls, evidence, or review gates.
---

# SGAD

Use this workflow before changing production code:

1. Classify the change as R0, R1, R2, or R3.
2. For R1 and above, create or update \`openspec/changes/<change-id>/\`.
3. Write tests before or alongside implementation.
4. Maintain \`sgad/evidence-matrix.md\` with requirement, design, task, test, risk, and evidence links.
5. For R2/R3, update \`sgad/risk-register.md\` and require explicit review before rollout.
6. Run \`sgad check\` before final response.

Never treat chat history as the source of truth. Persist decisions in the repo.
`
};

const designFiles = {
  "design/DESIGN.md": `# DESIGN.md

This file is the durable design context for AI-generated UI work.

## Product Feel

- Describe the product category, audience, and desired interface personality.
- Prefer concrete UI rules over vague adjectives.

## Tokens

| Token | Value | Usage |
|---|---|---|
| color.background | #ffffff | page background |
| color.text | #111827 | primary text |
| color.accent | #2563eb | primary action |
| radius.control | 8px | buttons and inputs |
| space.grid | 8px | spacing rhythm |

## Components

Document reusable rules for:

- navigation
- buttons
- forms
- tables
- cards
- modals
- empty states
- destructive actions

## Responsive Rules

- Define desktop, tablet, and mobile behavior.
- Text must not overlap, truncate critical content, or resize layout unpredictably.
- Core actions must remain reachable on mobile.

## Accessibility

- Keyboard navigation must work for interactive controls.
- Color alone must not communicate state.
- Focus states must be visible.

## Evidence Required

For UI-impacting changes, attach or link:

- screenshot or visual inspection notes
- responsive viewport checks
- accessibility notes
- component reuse notes
`,
  "design/components.md": `# Components

| Component | Source / Pattern | Allowed Variants | Notes |
|---|---|---|---|
| Button | DESIGN.md | primary, secondary, destructive, icon | Keep labels short and actions clear. |
| Form field | DESIGN.md | text, select, checkbox, radio | Pair validation with visible errors. |
| Table | DESIGN.md | dense, standard | Preserve scanability and sorting affordances. |
`,
  "design/screenshots/.gitkeep": ``,
  "sgad/design-review.md": `# Design Review

| Change | UI Risk | DESIGN.md Followed | Responsive Checked | Accessibility Checked | Evidence |
|---|---|---|---|---|---|
| example-change | R1-UI | pending | pending | pending | pending |
`
};

function mkdirp(file) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
}

function writeFile(file, body, force = false) {
  const target = path.join(root, file);
  if (fs.existsSync(target) && !force) return false;
  mkdirp(file);
  fs.writeFileSync(target, body, "utf8");
  return true;
}

function init() {
  const force = process.argv.includes("--force");
  const withDesign = process.argv.includes("--with-design");
  const written = [];
  const skipped = [];
  const selectedFiles = withDesign ? { ...files, ...designFiles } : files;
  for (const [file, body] of Object.entries(selectedFiles)) {
    if (writeFile(file, body, force)) written.push(file);
    else skipped.push(file);
  }
  console.log("SGAD project initialized.");
  if (written.length) console.log(`created: ${written.join(", ")}`);
  if (skipped.length) console.log(`skipped existing: ${skipped.join(", ")}`);
}

function check() {
  const required = [
    "sgad/governance.yaml",
    "sgad/evidence-matrix.md",
    "sgad/risk-register.md",
    "openspec/changes"
  ];
  const missing = required.filter((item) => !fs.existsSync(path.join(root, item)));
  if (missing.length) {
    console.error("SGAD check failed. Missing:");
    for (const item of missing) console.error(`- ${item}`);
    process.exit(1);
  }
  const hasDesignTrack =
    fs.existsSync(path.join(root, "design/DESIGN.md")) ||
    fs.existsSync(path.join(root, "sgad/design-review.md"));
  if (hasDesignTrack) {
    const designRequired = ["design/DESIGN.md", "sgad/design-review.md"];
    const designMissing = designRequired.filter((item) => !fs.existsSync(path.join(root, item)));
    if (designMissing.length) {
      console.error("SGAD design track check failed. Missing:");
      for (const item of designMissing) console.error(`- ${item}`);
      process.exit(1);
    }
  }
  console.log("SGAD check passed.");
}

function help() {
  console.log(`SGAD: Spec-Governed Agentic Development

Usage:
  sgad init [--force]                 Scaffold SGAD governance files
  sgad init --with-design [--force]   Scaffold SGAD plus optional Design Track
  sgad check                          Verify required SGAD governance artifacts
  sgad help                           Show this message

Typical flow:
  sgad init
  create openspec/changes/<change-id>/
  implement with tests
  sgad check

For UI work:
  sgad init --with-design
  update design/DESIGN.md
  record UI evidence in sgad/design-review.md
`);
}

const command = process.argv[2] ?? "help";
if (command === "init") init();
else if (command === "check") check();
else help();
