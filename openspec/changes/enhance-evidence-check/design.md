# Design: enhance-evidence-check

## Approach

The CLI keeps its zero-dependency design. It parses the subset of YAML and Markdown tables that SGAD itself emits,
then reports structured issues and warnings.

## Evidence Rules

`sgad/governance.yaml` may define:

```yaml
evidence:
  allow_pending: false
  pending_max: 0
  require_evidence_paths: true
```

For R2/R3 projects these strict defaults apply even if the block is omitted. R0/R1 projects remain permissive unless
they opt in.

## Waivers

`sgad/waivers.yaml` allows time-boxed exceptions:

```yaml
waivers:
  - requirement: REQ-003
    reason: "UAT blocked on schedule"
    expires: 2026-06-15
    approved_by: human
```

A valid waiver turns a pending evidence row from an error into a warning.

## Output

Human output remains concise. `--json` emits:

```json
{
  "passed": false,
  "issues": [],
  "warnings": []
}
```

This supports CI and agent loops without scraping terminal text.
