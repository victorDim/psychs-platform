# Psychs Platform

Psychs is an AI brand-perception and Generative Engine Optimization platform. The repository is undergoing a production-readiness program covering identity, tenant isolation, evidence provenance, secure crawling, durable data services, observability, and controlled delivery.

## Current status

This codebase is **not yet approved for production traffic**. The production control-plane foundation, browser OIDC authentication, telemetry, and signed release pipeline are in place. Remaining domain migrations, a provider-specific staging identity exercise, durable background processing, and end-to-end staging validation remain release blockers. PostgreSQL migrations, cross-tenant RLS, and logical backup restoration are exercised against PostgreSQL 16 in CI.

The software now fails closed by default:

- protected API routes require a valid bearer token and RBAC permission;
- production requires an explicit JWT signing key and CORS allowlist;
- synthetic AI/provider results are labeled `SYNTHETIC_FALLBACK` and never reported as live;
- crawler DNS failures and unsafe/redirected targets are rejected;
- CMS publishing validates an HMAC approval but does not claim publication until a real adapter exists;
- `/livez` reports process liveness, while `/readyz` blocks production promotion until the runtime is genuinely ready;
- Kubernetes secrets are not committed to Git, and CI publishes immutable commit-tagged candidate images without pretending to deploy them.

The new `/api/v2` foundation adds:

- asymmetric OIDC/JWKS token verification;
- database-confirmed tenant membership and immutable request context;
- centralized role-and-scope authorization;
- SQLAlchemy repositories with transaction-local tenant identity;
- Alembic migrations with forced PostgreSQL RLS and append-only audit events;
- tenant-scoped project creation with idempotency and audit records;
- tenant-scoped authoritative-source registration with canonical URL and SSRF validation;
- one-time, hashed DNS ownership challenges with bounded TXT verification and audit history;
- browser OIDC Authorization Code + PKCE with session-scoped token storage;
- a production control-plane UI that renders only authenticated `/api/v2` records;
- vendor-neutral OTLP/HTTP tracing correlated with structured request logs;
- OCI SBOM/provenance attestations, fixable high/critical image scanning, and keyless Cosign signatures;
- CodeQL extended security analysis and full-history secret scanning before candidate images are built;
- dependency-aware startup/readiness and structured request logs.

## Local verification

Backend tests use only the Python standard library compatibility path and can be run with:

```bash
python3 -m compileall -q backend
python3 backend/run_tests.py
```

The compatibility suite currently contains 117 tests, supplemented by dependency-backed v2 security tests and live PostgreSQL isolation tests in CI. Some legacy tests write JSON fixtures, so run them in a disposable checkout when preserving the working tree matters.

Frontend verification requires Node.js 24:

```bash
cd frontend
npm ci
npm run build
```

Production frontend builds require the public `VITE_OIDC_AUTHORITY`,
`VITE_OIDC_CLIENT_ID`, and optional audience/scope values documented in
`.env.example`. Never place a client secret in a `VITE_*` variable. The legacy
simulation UI is available only from the Vite development server when
`VITE_ENABLE_LEGACY_DEMO_UI=true`; production builds exclude that path and its
synthetic fixtures. Configure the identity provider with exact callback and
post-logout URLs, refresh-token rotation for the public client, and access-token
claims for `sub`, `tenant_id`, `aud`, and the requested `scope` values.

## Local development API

The legacy API is retained only as a migration bridge. Start it locally with an explicit development configuration:

```bash
export PSYCHS_ENVIRONMENT=development
export PSYCHS_ALLOW_INSECURE_DEMO_AUTH=true
export PSYCHS_ALLOW_LEGACY_SERVER=true
python3 backend/server.py 8000
```

`PSYCHS_ALLOW_INSECURE_DEMO_AUTH` must never be enabled outside local development. For authenticated testing, set a random `PSYCHS_JWT_SIGNING_KEY` of at least 32 characters and mint a scoped session token through `SessionVault`.

## Container configuration

Copy `.env.example` to `.env`, replace every required value, and then run:

```bash
docker compose config
docker compose build
```

The production Compose profile runs the FastAPI v2 control plane. Startup fails unless PostgreSQL, Redis, an exact CORS allowlist, and the managed OIDC issuer/audience/JWKS settings are configured. Its migration service uses the owner credential once, provisions a non-owner application role, and never exposes the owner credential to the API container.

Before starting Compose, generate separate strong values for `POSTGRES_PASSWORD`, `DATABASE_APP_PASSWORD`, `REDIS_PASSWORD`, and any remaining signing/approval secrets. URL-encode credentials when constructing URLs manually.

## Production release gates

Before production promotion, all of the following are mandatory:

1. Migrate remaining in-memory/class-level domain state to tenant-scoped PostgreSQL repositories and Redis-backed coordination.
2. Exercise the selected OIDC provider in staging, including service identities, revocation, and step-up authentication.
3. Add idempotent background jobs, retry policy, and dead-letter handling; continue scheduled restore drills using [the PostgreSQL recovery runbook](docs/runbooks/postgres-recovery.md).
4. Add actionable metrics, SLOs, dashboards, and alert runbooks on top of the existing structured logs, request IDs, and OpenTelemetry traces.
5. Keep CodeQL, full-history secret scanning, dependency locks, SBOMs, signed images, provenance attestations, and container scanning green; triage security alerts before promotion.
6. Exercise staging smoke tests, rollback, disaster recovery, load tests, and a third-party penetration test.
7. Confirm that every customer-visible metric distinguishes observed, inferred, and synthetic evidence.

The detailed audit, PRD, and architectural roadmap are maintained as project planning artifacts outside this repository working tree.
