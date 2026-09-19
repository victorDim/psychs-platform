# Observed evidence collector contract

The production control plane accepts observed AI responses only from a
dedicated OIDC service identity. Browser users can read the resulting ledger
but cannot label data as observed.

## Provisioning

1. Create an OIDC client-credentials application for the collector. Configure
   the API audience, a unique `sub`, cryptographically random `jti` values,
   `principal_type=service` (or a supported provider service marker), the
   tenant UUID, and `projects:read evidence:write` scopes.
2. Provision a matching active `users` row with `principal_type=service` and an
   active tenant membership with role `collector`. Never reuse a human subject
   for this row.
3. Store the client credential in the deployment secret manager and expose it
   only to the collector workload. Do not mount it in the browser, API, or
   general-purpose worker.

## Ingestion

Send each provider response to
`POST /api/v2/projects/{project_id}/evidence-observations` with a stable,
high-entropy `Idempotency-Key`. The body contains the provider, exact model
identifier, optional provider request ID, prompt, response, citations, and the
timezone-aware instant at which the response was observed.

The API rejects observations that are too old or more than five minutes in the
future. The default accepted age is 24 hours and is bounded by
`PSYCHS_EVIDENCE_MAX_OBSERVATION_AGE_SECONDS`. Retry the same payload with the
same key after timeouts; reusing a key with different content returns `409`.

The API assigns `evidence_class=observed`, calculates a canonical SHA-256
content hash, writes an audit event, and stores the record in an immutable,
tenant-RLS-protected ledger. Collectors cannot submit inferred or synthetic
records through this endpoint.

Records are retained for `PSYCHS_EVIDENCE_RETENTION_DAYS` (90 days by default).
The API role cannot update or delete them. A narrowly scoped maintenance task
using migration-owner credentials may delete rows only after
`retention_expires_at`; the database trigger rejects earlier deletion. Configure
and approve this value against contractual, privacy, and litigation-hold needs
before collecting production data.

## Operating checks

- Alert on sustained `401`, `403`, `409`, or `422` responses and on ingestion
  lag approaching the configured maximum age.
- Correlate provider request IDs, Psychs request IDs, and content hashes, but
  never log bearer tokens or provider credentials.
- Sample provider responses against their stored hashes and source request IDs.
- Confirm cross-tenant reads and writes remain denied after every migration.
- Treat prompts and responses as customer data: apply the tenant's retention,
  export, and deletion policy before expanding collection beyond staging.
