# Psychs Platform

Psychs is an AI brand-perception and Generative Engine Optimization platform. The repository is undergoing a production-readiness program covering identity, tenant isolation, evidence provenance, secure crawling, durable data services, observability, and controlled delivery.

## Current status

This codebase is **not yet approved for production traffic**. The production control-plane foundation, browser OIDC authentication, telemetry, signed release pipeline, and durable tenant-scoped PostgreSQL worker are in place. Remaining domain migrations, a provider-specific staging identity exercise, and end-to-end staging validation remain release blockers. PostgreSQL migrations, cross-tenant RLS, worker retry/dead-letter behavior, and logical backup restoration are exercised against PostgreSQL 16 in CI.

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
- bounded token lifetimes, mandatory token IDs, tenant-scoped revocation, human/service principal separation, and step-up enforcement for domain ownership;
- database-confirmed tenant membership and immutable request context;
- centralized role-and-scope authorization;
- SQLAlchemy repositories with transaction-local tenant identity;
- Alembic migrations with forced PostgreSQL RLS and append-only audit events;
- durable jobs with idempotent enqueueing, atomic `SKIP LOCKED` leases, bounded retries, cancellation, and append-only dead-letter history;
- tenant-scoped project creation with idempotency and audit records;
- tenant-scoped authoritative-source registration with canonical URL and SSRF validation;
- one-time, hashed DNS ownership challenges with bounded TXT verification and audit history;
- a service-identity-only observed-evidence ingestion API with idempotency, provenance hashes, immutable tenant-RLS storage, and a non-synthetic production UI;
- bounded, lock-safe evidence expiry with least-privilege worker execution and append-only tenant-visible retention receipts;
- optional real OpenAI web-search evidence collection through a rate-limited durable job, with worker-only credentials, provider provenance, `store=false`, prompt minimization, and no synthetic fallback;
- browser OIDC Authorization Code + PKCE with session-scoped token storage;
- a production control-plane UI for real tenant project onboarding, authoritative sources, observed evidence, and retention receipts, backed only by authenticated `/api/v2` records;
- vendor-neutral OTLP/HTTP tracing correlated with structured request logs;
- low-cardinality OTLP metrics for HTTP traffic and durable-job outcomes, with an SLO and alert runbook;
- OCI SBOM/provenance attestations, fixable high/critical image scanning, and keyless Cosign signatures;
- CodeQL extended security analysis and full-history secret scanning before candidate images are built;
- dependency-aware startup/readiness and structured request logs.
- ingress-aligned application request-body limits that reject oversized declared and chunked payloads before route execution.
- fail-closed, Redis-backed collector rate limits shared across horizontally scaled API replicas.

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
simulation UI is not reachable from the application entry point; production
builds exclude that code and its synthetic fixtures. Configure the identity provider with exact callback and
post-logout URLs, refresh-token rotation for the public client, and access-token
claims for `sub`, `tenant_id`, `aud`, `jti`, `iat`, `exp`, and the requested
`scope` values. Sensitive human operations additionally require recent
`auth_time` and an accepted `acr` or `amr` value. Validate the complete provider
contract with [the OIDC staging runbook](docs/runbooks/oidc-staging-validation.md).

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

The production Compose profile runs the FastAPI v2 control plane and a separate background worker. Startup fails unless PostgreSQL, Redis, an exact CORS allowlist, and the managed OIDC issuer/audience/JWKS settings are configured. Its migration service uses the owner credential once, provisions distinct API and trusted cross-tenant worker roles, and never exposes the owner credential to either runtime container.

Before starting Compose, generate separate strong values for `POSTGRES_PASSWORD`, `DATABASE_APP_PASSWORD`, `DATABASE_WORKER_PASSWORD`, `REDIS_PASSWORD`, and any remaining signing/approval secrets. URL-encode credentials when constructing URLs manually.

## Production release gates

Before production promotion, all of the following are mandatory:

1. Migrate remaining in-memory/class-level domain state to tenant-scoped PostgreSQL repositories and Redis-backed coordination.
2. Exercise the selected OIDC provider in staging, including service identities, revocation, key rotation, and step-up authentication, using [the identity runbook](docs/runbooks/oidc-staging-validation.md).
3. Continue scheduled restore drills using [the PostgreSQL recovery runbook](docs/runbooks/postgres-recovery.md), and load/chaos test durable job retry and dead-letter behavior.
4. Connect the existing metrics and traces to production dashboards/paging, then validate the alert paths with [the SLO runbook](docs/runbooks/slo-alerts.md).
5. Keep CodeQL, full-history secret scanning, dependency locks, SBOMs, signed images, provenance attestations, and container scanning green; triage security alerts before promotion.
6. Exercise staging smoke tests, rollback, disaster recovery, load tests, and a third-party penetration test.
7. Confirm that every customer-visible metric distinguishes observed, inferred, and synthetic evidence.

Production collectors must follow [the observed evidence collector contract](docs/runbooks/evidence-collector.md). The current ledger intentionally accepts only observed records; inferred and synthetic data require separate, explicitly labeled pipelines before they may appear in the production UI.

Provision the first real tenant administrator with the guarded [tenant bootstrap runbook](docs/runbooks/tenant-bootstrap.md). Psychs does not trust token claims to create tenants or privileged memberships automatically.

The detailed audit, PRD, and architectural roadmap are maintained as project planning artifacts outside this repository working tree.
