# ADR 0001: FastAPI v2 strangler path with PostgreSQL RLS

- Status: accepted
- Date: 2026-09-18

## Context

The original application combines a handwritten HTTP server, process-local state, repository JSON files, synthetic provider responses, and broad route logic. Repairing it in place would preserve unsafe coupling and make tenant-isolation failures difficult to reason about.

## Decision

Build production capabilities under `/api/v2` using FastAPI, strict Pydantic commands, managed OIDC, SQLAlchemy, PostgreSQL, Alembic, and Redis. Migrate one complete vertical slice at a time. The v1 server remains a development-only demo bridge and is not the production container entry point.

Every authenticated transaction sets `app.current_tenant_id` using PostgreSQL `set_config(..., true)`. Tenant tables enable and force row-level security with both `USING` and `WITH CHECK` policies. The API connects using a non-owner role without `BYPASSRLS`; migrations use a separately mounted owner credential.

Authorization requires both an active database membership role and a permitted token scope. Tenant IDs are never accepted in project commands.

## Consequences

- New features must be implemented in v2 and must have an explicit authorization policy.
- Cross-tenant isolation is enforced twice: repository predicates and PostgreSQL RLS.
- Production startup requires PostgreSQL, Redis, OIDC, and exact CORS configuration.
- The frontend must migrate module by module and cannot treat v1 synthetic output as live evidence.
- Migration jobs require stronger credentials and therefore run separately from application pods.
