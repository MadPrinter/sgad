# Episode: preflight-batch-resilience

## Context

SOP-3 processes many inbound emails per batch with external SMTP side effects.

## Problem

A single message failure could abort the whole batch; preflight checks repeated mid-batch.

## Root Cause

No separation between batch-start gates and per-item error handling.

## Resolution

Run daily-ready and business preflight once before the batch. Wrap each item in try/catch, audit outcomes, and continue.

## Evidence

- sgad/templates/rollout-preflight.md
- sgad/policies/governance-anti-patterns.md

## Reusable Lesson

Preflight gates run once before batch; per-item failures are isolated and audited.

## Applies When

- Batch jobs with external side effects
- Operator-run production modes

## Do Not Apply When

- Single-request APIs with transactional all-or-nothing semantics
