# Kubernetes deployment contract

These manifests are deployment templates, not a one-command production release.

Before applying them:

1. Replace every `sha-REPLACE_WITH_COMMIT_SHA` image tag with the exact candidate image tag produced by CI, then resolve and pin its registry digest in the reviewed GitOps change.
2. Provision `psychs-runtime-secrets` externally. It must supply `database-url` for a non-owner/non-`BYPASSRLS` role, `redis-url`, exact CORS origins, and OIDC issuer/audience/JWKS settings consumed by the backend deployment. Environment-style secret keys may be supplied through `envFrom`; database owner credentials are forbidden.
   The provider must issue short-lived tokens with unique `jti` values and the human/service and step-up claims defined in [the OIDC staging runbook](../../docs/runbooks/oidc-staging-validation.md). Set provider-specific accepted ACR values in `PSYCHS_OIDC_STEP_UP_ACR_VALUES` when AMR alone is insufficient.
3. Provision `psychs-migration-secrets` separately with `database-url`, `database-app-password`, and `database-worker-password`. The owner URL should be short-lived; the migration Job provisions distinct least-privileged API and trusted worker roles.
4. Provision `psychs-worker-secrets` with `database-worker-url`. When live evidence collection is enabled, also supply `openai-api-key` to this secret only. The database credential has narrow table grants but intentionally bypasses RLS so a trusted worker can atomically claim jobs across tenants; never mount either worker secret in an API or frontend pod.
5. When telemetry is enabled, provision `psychs-observability-secrets` with HTTPS `otlp-endpoint`, optional `otlp-metrics-endpoint`, and `otlp-headers`. Configure alerting against the [SLO and alert runbook](../../docs/runbooks/slo-alerts.md).
6. If using the integration-only in-cluster data manifest, provision `psychs-datastore-secrets` with `postgres-admin-user`, `postgres-admin-password`, `postgres-database`, and `redis-password`. Never mount this Secret into API pods.
7. Prefer managed PostgreSQL and Redis with multi-zone failover, encryption, backups, point-in-time recovery, monitoring, and tested restore procedures. The bundled single-node data manifests are for integration environments only. Schedule the [PostgreSQL recovery drill](../../docs/runbooks/postgres-recovery.md) against a disposable staging restore target.
8. Apply the migration Job as a reviewed pre-deployment step and confirm its revision before rolling out API and worker pods.
9. Add environment-specific network policies or CNI FQDN policies for DNS, OIDC/JWKS, PostgreSQL, Redis, telemetry, and approved provider endpoints.
10. Validate admission policy, image signatures, resource quotas, Pod Security Standards, rollback, and disaster recovery in staging.

The ingress and API currently enforce a matching 1 MiB request-body limit. If
an approved workload requires a different limit, update both
`nginx.ingress.kubernetes.io/proxy-body-size` and
`PSYCHS_MAX_REQUEST_BODY_BYTES` in the same reviewed deployment change; the
application limit must never be higher than the trusted edge limit.

The API deployment deliberately fails startup/readiness if its secure production configuration or required data services are unavailable.
