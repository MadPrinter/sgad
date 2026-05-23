# Proposal: Incident Response Center

## Summary

Implement a zero-dependency Node ESM Incident Response Center for a multi-tenant SaaS product.

The change adds a REST API, role-based access control, tenant isolation, audit logging, SLA reminder execution with an injectable notifier, and a static frontend for incident operations.

## Goals

- Allow tenants to create, list, read, assign, and resolve incidents according to role permissions.
- Prevent every role from reading or mutating incidents outside the request tenant.
- Record audit events for incident creation, assignment, status changes, and reminder delivery.
- Provide an SLA reminder job that finds unresolved incidents due within one hour and avoids duplicate reminders.
- Keep runtime and tests free of external services and third-party dependencies.

## Non-Goals

- Persistent database storage.
- Real email, chat, or paging integration.
- Authentication beyond the required request headers.
- Background scheduling outside the explicit job endpoint.

## Impact

- Replaces the seed health-only server with a complete in-memory application.
- Adds `node:test` coverage for API behavior, RBAC, tenant isolation, auditing, and notifier injection.
- Adds a static HTML frontend served by the same Node server.
