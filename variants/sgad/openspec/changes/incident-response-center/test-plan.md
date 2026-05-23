# Incident Response Center Test Plan

## Scope

Use built-in `node:test` and `assert/strict`. No external test libraries or network services are required.

## Cases

- Health endpoint returns the SGAD variant marker.
- Invalid incident create payload returns `400 VALIDATION_ERROR`.
- Valid incident create returns `201` and writes `incident.created` audit evidence.
- Tenant A list excludes Tenant B incidents.
- Tenant A cannot read Tenant B incident ids.
- Viewer cannot create or assign incidents.
- Viewer can read tenant-scoped incidents.
- Responder can assign incidents.
- Invalid same-state status transition returns `409 INVALID_STATUS_TRANSITION`.
- Valid `open -> investigating -> resolved` transition updates state and `resolvedAt`.
- SLA job sends exactly one reminder for unresolved incidents due within one hour.
- SLA job does not notify incidents outside the due window.
- A second SLA job run does not duplicate reminders.
- Reminder audit evidence is recorded.

## Command

```sh
node --test
```
