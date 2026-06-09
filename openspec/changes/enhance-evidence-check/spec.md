# Spec: enhance-evidence-check

## Requirements

### REQ-CHECK-001: Evidence closure gate

For R2/R3 projects, `sgad check` must fail when `sgad/evidence-matrix.md` contains pending, TBD, empty, or placeholder
evidence without a valid waiver.

### REQ-CHECK-002: Evidence path validation

For R2/R3 projects, non-pending evidence must cite at least one existing repository file, directory, glob, test path,
URL, or recognized external artifact token.

### REQ-CHECK-003: Waiver support

`sgad/waivers.yaml` must allow a pending evidence row to pass with a warning when it includes matching requirement,
reason, and unexpired expiry date.

### REQ-CHECK-004: Machine-readable output

`sgad check --json` must return JSON with `passed`, `issues`, and `warnings`.

## Scenarios

- Pending evidence without waiver fails.
- Existing test file evidence passes.
- Missing evidence path fails.
- Valid waiver passes with warning.
