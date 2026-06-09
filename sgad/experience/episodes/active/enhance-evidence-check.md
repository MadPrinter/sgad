# Episode: enhance-evidence-check

## Context

SGAD had a CLI gate named `sgad check` that verified required governance artifacts existed.

## Problem

The check could pass even when evidence rows still said `pending`.

## Root Cause

The gate validated artifact presence rather than closure.

## Resolution

The CLI now parses the evidence matrix, fails unwaived pending rows for stricter risk classes, supports waivers, and
validates evidence paths.

## Evidence

- bin/sgad.js
- test/sgad-check.test.js
- openspec/changes/enhance-evidence-check/spec.md

## Reusable Lesson

Governance gates should validate closure, not just the presence of governance files.

## Applies When

- Changing SGAD checks
- Validating evidence, approvals, or risk gates

## Do Not Apply When

- R0/R1 lightweight projects intentionally allow pending evidence
