# SGAD Risk Register

| Risk | Impact | Likelihood | Mitigation | Evidence |
| --- | --- | --- | --- | --- |
| Tenant data leakage | High | Medium | Every lookup and list filters by `tenantId`; cross-tenant reads return 404. | `test/server.test.js` tenant isolation case |
| Privilege escalation | High | Medium | Header role is validated and each route has explicit permission checks. | `test/server.test.js` role permission case |
| Invalid lifecycle state | Medium | Medium | Status transitions use an allow-list. | `test/server.test.js` status transition case |
| Duplicate reminders | Medium | Medium | `remindedIncidentIds` suppresses repeated notifications. | `test/server.test.js` SLA duplicate case |
| External notification side effects in tests | Medium | Low | Notifier is injected; default notifier is no-op. | `createServer({ notifier })` tests |
| Missing audit evidence | Medium | Medium | Mutating operations append audit records. | create, assign, status, and reminder tests |

## Residual Risk

The implementation uses in-memory storage. Data is lost on process restart and duplicate reminder suppression is not shared across processes. This is accepted for the experiment and should be revisited before production rollout.
