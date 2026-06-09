# Proposal: enhance-evidence-check

## Why

Consumer projects reported that `sgad check` could pass while evidence rows still said `pending`.
That makes the gate trustworthy only as a file-existence check, not as proof that requirements,
tests, risks, and evidence are closed.

## What Changes

- Make `sgad check` validate evidence matrix rows for R2/R3 projects.
- Fail naked pending evidence unless a valid time-boxed waiver exists.
- Validate that non-pending evidence points at an existing repo path, glob, test path, URL, or recognized external artifact.
- Add `sgad check --json` output for CI and agent repair loops.
- Update the SGAD skill prompt so agents fill evidence or waivers before claiming done.

## Impact

- Risk class: R2
- Affected areas: CLI gate behavior, generated governance defaults, agent workflow text
- Compatibility: R0/R1 projects remain light by default unless they opt into stricter evidence settings.
