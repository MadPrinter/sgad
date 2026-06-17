# Episode: repository-over-chat

## Context

SOP automation projects migrated from recorded flows (Shadowbot) and agent chat sessions.

## Problem

XPath and step order copied from recordings became the spec. Small DOM changes broke unrelated steps.

## Root Cause

Recordings and chat were treated as durable requirements instead of samples.

## Resolution

SGAD requires proposal, design, tasks, and evidence in the repository. Domain selectors stay project-local; governance stays in openspec and sgad.

## Evidence

- sgad/policies/governance-anti-patterns.md
- docs/experience-layer.md

## Reusable Lesson

Persist decisions in the repo; treat recordings and chat as inputs only.

## Applies When

- Migrating recorded automation
- Handing work between agents or humans

## Do Not Apply When

- R0 exploratory spikes with explicit throwaway scope
