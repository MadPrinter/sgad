# SGAD Evidence Matrix

| Requirement | Implementation Evidence | Test Evidence |
| --- | --- | --- |
| REST API | `src/server.js` route handlers under `/api` | `test/server.test.js` API requests |
| RBAC | `can()` and `requirePermission()` | `enforces role permissions` |
| Tenant isolation | `findTenantIncident()` and tenant filters | `enforces tenant isolation for list and read operations` |
| Audit log | `addAudit()` for create, assign, status, reminder | create audit and reminder audit assertions |
| SLA reminder job | `POST /api/jobs/sla-reminders/run` handler | `runs SLA reminders with injectable notifier and no duplicates` |
| Injectable notifier | `createServer({ notifier })` | recording notifier in harness |
| Static frontend | `public/index.html` | Manual verification via served root |
| Zero external dependencies | `package.json` has no dependencies | `node --test` only |

## Evidence Policy

Each high-risk requirement must have both code evidence and executable test evidence before the change is considered complete.
