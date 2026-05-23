# Test Plan: Incident Response Center

## Automated Tests

Run:

```sh
node --test
```

## Coverage Areas

- Create incident succeeds with valid title, severity, optional assignee, generated ids, tenant id, timestamps, `open` status, and SLA due time.
- Create incident rejects invalid title and severity.
- List endpoint returns only incidents in the request tenant.
- Read endpoint hides cross-tenant incidents with `404`.
- Assignment endpoint rejects cross-tenant writes and invalid roles.
- Status endpoint allows only:
  - `open -> investigating`
  - `investigating -> resolved`
  - `open -> resolved`
- Invalid status transitions return `409`.
- Viewer can read but cannot create or assign.
- Responder can read, assign, and update status but cannot create or read audit log.
- Admin can run SLA reminders and read audit log.
- Audit log is tenant-scoped and includes create, assign, status change, and reminder events.
- SLA reminder job calls the injected notifier for unresolved incidents due within one hour.
- SLA reminder job does not duplicate reminders for the same incident.

## Manual Smoke Test

1. Start the server with `npm start`.
2. Open `http://localhost:3000`.
3. Create an incident as `tenant-a` admin.
4. Switch role to `viewer` and verify the incident list is readable while mutation controls return forbidden errors.
5. Switch tenant to `tenant-b` and verify `tenant-a` incidents disappear.
6. Switch back to `tenant-a`, run SLA reminders for a due incident, and verify an audit event appears.
