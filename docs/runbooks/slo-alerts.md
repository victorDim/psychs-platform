# Service-level objectives and alert response

This runbook defines the minimum production telemetry contract. OTLP metrics
must be exported over HTTPS to the organization's approved collector. Raw URL
paths, tenant identifiers, user identifiers, job identifiers, and exception
messages are deliberately excluded from metric attributes to prevent cardinality
and data-exposure incidents.

## Objectives

Evaluate these objectives over rolling 30-day windows, excluding only reviewed
maintenance periods:

| Signal | Objective | Metric |
| --- | --- | --- |
| API availability | 99.9% of non-health requests are below HTTP 500 | `psychs.http.server.requests` |
| API latency | 95% below 500 ms and 99% below 2 s | `psychs.http.server.duration` |
| Job reliability | 99.5% of terminal executions succeed | `psychs.jobs.completions` |
| Worker health | No sustained loop failures | `psychs.worker.loop.failures` |
| Retry pressure | Retry outcomes below 5% of job outcomes | `psychs.jobs.completions{job.outcome="retry"}` |
| Retention health | No failed scheduled retention runs | `psychs.evidence.retention.runs{retention.outcome="failure"}` |

The deployment must also collect PostgreSQL availability, connection saturation,
replication and backup freshness, and the age and count of `queued` and
`retry_wait` jobs. Those are datastore signals and intentionally are not derived
from individual application processes.

## Paging policy

- Page on a 14.4x burn rate over both 5-minute and 1-hour windows, or a 6x burn
  rate over both 30-minute and 6-hour windows.
- Page immediately when dead-letter outcomes occur for security-sensitive jobs,
  the oldest runnable job exceeds 15 minutes, the worker loop fails continuously
  for 5 minutes, retention automation fails twice consecutively, or database
  backup freshness exceeds the approved RPO.
- Create a ticket—not a page—for a single transient retry, isolated 4xx growth,
  or latency degradation that consumes less than 10% of the monthly error budget.

## Triage

1. Confirm impact using request rate, status code, route template, job type, and
   outcome. Never add tenant or job IDs as metric labels.
2. Correlate the time window with structured logs and trace IDs. Inspect the
   append-only `job_attempts`, `job_dead_letters`, `audit_events`, and
   `evidence_retention_events` records for scoped diagnosis.
3. Check PostgreSQL, Redis, DNS, OIDC/JWKS, and OTLP collector health before
   restarting workloads. Preserve evidence before manual job intervention.
4. Stop further rollout when error-budget burn began after a release. Roll back
   the immutable image digest through the reviewed GitOps path; do not reverse a
   forward-only schema migration.
5. For dead letters, correct the cause and create a new idempotent request. Never
   mutate or delete attempt/dead-letter history.

## Release evidence

Before production promotion, attach a dashboard screenshot or export showing all
objectives, a synthetic authenticated transaction, an alert-routing test, and a
documented rollback exercise. The absence of telemetry is a release failure, not
evidence of healthy operation.
