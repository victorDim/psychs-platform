# Observed evidence collector contract

The production control plane supports two real, fail-closed ingestion paths:
the built-in durable OpenAI collection worker and an external collector using
a dedicated OIDC service identity. Neither path creates synthetic fallback
records. Browser users can read the resulting ledger but cannot directly label
client-supplied data as observed.

## Built-in durable collection

1. Keep `PSYCHS_EVIDENCE_COLLECTION_ENABLED=false` until the staging privacy,
   cost, and provider-identity review is complete.
2. Store `OPENAI_API_KEY` only in the worker secret. Do not expose it to the
   API, browser bundle, logs, or general runtime secret set.
3. Select the operator-approved model with `PSYCHS_OPENAI_MODEL`; bound request time
   and output with `PSYCHS_OPENAI_TIMEOUT_SECONDS` and
   `PSYCHS_OPENAI_MAX_OUTPUT_TOKENS`.
4. Enable the same feature gate on the API and worker. The API then accepts
   `POST /api/v2/projects/{project_id}/evidence-collection-jobs` from authorized
   human users, subject to the Redis-backed collection rate limit.

The worker calls the Responses API with web search and `store=false`, records
the exact returned text, model, provider response ID, and validated URL
citations, then hashes the canonical evidence payload. Network, provider, and
contract failures remain visible as retry or dead-letter states. No placeholder
response is ever persisted. Once a collection job is terminal, its prompt is
removed from the job payload; the immutable evidence copy remains governed by
`PSYCHS_EVIDENCE_RETENTION_DAYS`.

## External collector provisioning

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
The API role cannot update or delete them. The dedicated worker calls a
database-owned function every `PSYCHS_RETENTION_CLEANUP_INTERVAL_SECONDS` and
deletes at most `PSYCHS_RETENTION_CLEANUP_BATCH_SIZE` expired records per run.
The worker has no direct `DELETE` grant; the function uses ordered
`FOR UPDATE SKIP LOCKED` batches and atomically writes an append-only,
tenant-visible receipt. The database trigger rejects deletion before
`retention_expires_at`. Configure and approve retention against contractual,
privacy, litigation-hold, and regional deletion requirements before collecting
production data.

The migration owner that creates `purge_expired_evidence` must be permitted to
bypass forced RLS; the function explicitly fails closed otherwise. Never change
the function owner to the API or worker role. Tenants can inspect receipts at
`GET /api/v2/evidence-retention-events`.

## Operating checks

- Alert on sustained `401`, `403`, `409`, or `422` responses and on ingestion
  lag approaching the configured maximum age.
- Treat `429` as backpressure and wait for `Retry-After` before retrying. The
  default shared collector budget is 120 requests per 60 seconds and is
  configured with `PSYCHS_EVIDENCE_INGEST_RATE_LIMIT` and
  `PSYCHS_EVIDENCE_INGEST_RATE_WINDOW_SECONDS`. A Redis outage intentionally
  fails ingestion closed with `503`; do not bypass the limiter.
- Correlate provider request IDs, Psychs request IDs, and content hashes, but
  never log bearer tokens or provider credentials.
- Sample provider responses against their stored hashes and source request IDs.
- Alert on failed retention runs and reconcile deletion counts with the
  append-only receipt ledger.
- Confirm cross-tenant reads and writes remain denied after every migration.
- Treat prompts and responses as customer data: apply the tenant's retention,
  export, and deletion policy before expanding collection beyond staging.
