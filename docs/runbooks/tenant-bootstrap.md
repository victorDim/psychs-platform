# First tenant bootstrap

Psychs never creates tenants or privileged memberships from untrusted token
claims. An operator must explicitly bind the first human OIDC subject to a
tenant before that user signs in. Later membership administration should use a
separately reviewed tenant-management workflow.

## Prerequisites

1. Complete the database migration job.
2. Register the public frontend client and API audience with the approved OIDC
   provider.
3. Copy the exact immutable OIDC `sub` value for the initial human administrator.
4. Obtain a short-lived migration-owner database credential from the secret
   manager. Never mount this credential in API, worker, or frontend workloads.

## Execute once

Set `MIGRATION_DATABASE_URL`, `PSYCHS_ENVIRONMENT`,
`PSYCHS_BOOTSTRAP_TENANT_SLUG`, `PSYCHS_BOOTSTRAP_TENANT_NAME`,
`PSYCHS_BOOTSTRAP_EXTERNAL_SUBJECT`, `PSYCHS_BOOTSTRAP_EMAIL`, and
`PSYCHS_BOOTSTRAP_ROLE`. In staging and production,
`PSYCHS_BOOTSTRAP_CONFIRM` must exactly match the tenant slug.

Run:

```bash
python -m app.database.bootstrap_tenant
```

The operation is idempotent. It refuses to change an existing tenant name,
principal type, membership role, or inactive record. A newly created membership
produces an append-only `tenant.bootstrap_completed` audit event. Remove the
owner credential from the execution environment immediately afterward.

With Docker Compose, use the explicitly gated profile:

```bash
docker compose --profile bootstrap run --rm bootstrap
```

After the administrator signs in, the production UI can create the first real
project through `POST /api/v2/projects`; no sample tenant or synthetic project
is inserted.
