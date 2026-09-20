# Verified source snapshot runbook

Source snapshots are immutable, tenant-isolated records of bytes fetched from a verified authoritative source. The feature is disabled by default because it creates outbound worker traffic and retained customer data.

The capture history compares each snapshot with the preceding retained snapshot of the same source. A changed SHA-256 digest indicates changed response bytes, including HTML markup; it does not establish a change in factual meaning. Identical bytes with a different final URL, status, content type, or charset are reported as a metadata change. If retention removed the baseline, the UI reports that no earlier retained capture is available. Comparisons load metadata only and never fetch the live source.

## Staging enablement

Daily policy is opt-in per source. With the snapshot feature enabled, workers check every 60 seconds and enqueue up to 100 jobs per pass. Each active tenant is capped at 30 scheduled captures per UTC calendar day; tenants with more daily sources should reduce their daily selections to this limit. A source gets at most one scheduled job per UTC day, including failed or cancelled jobs, and an existing active capture postpones scheduling. Missed days are not backfilled. Manual capture remains subject to the API rate limit. Disable a source or change it to manual to stop future daily fetches; already started network requests may finish.

Apply migration `0011_daily_source_captures` and reprovision worker grants before upgrading workers. The worker receives execution permission on a bounded scheduling function, not general job insertion privileges. Enqueue and audit insertion occur atomically. The default feature gate remains off.

1. Apply migration `0010_source_snapshots` and rerun role provisioning. Do not grant the API role direct mutation access to either snapshot table.
2. Restrict worker egress at the infrastructure boundary to public TCP ports 80 and 443 plus the approved DNS resolver. Deny cloud metadata, RFC1918, loopback, link-local, multicast, and internal service networks.
3. Set `PSYCHS_SOURCE_SNAPSHOTS_ENABLED=true` on both API and worker. Configure the rate, timeout, maximum bytes, and retention values from `.env.example`.
4. Verify a project domain through DNS ownership and register an exact-domain or subdomain source. Cross-domain and unverified sources must remain ineligible.
5. Capture a source in the product. Confirm that the job succeeds, the final redirect URL is expected, the byte count is bounded, and a 64-character SHA-256 digest is visible.
6. Retrieve the stored body and independently hash the original response bytes in a controlled test fixture. The values must match.
7. Test a redirect to loopback, private space, and the cloud metadata address. Each job must dead-letter without making a connection. Test HTTP 429/5xx and confirm bounded retry behavior.
8. Attempt an update and early deletion through the owner credential. The immutable trigger must reject both. After expiry, run `purge_expired_source_snapshots` and confirm an append-only retention receipt is created.

## Incident response

- Disable `PSYCHS_SOURCE_SNAPSHOTS_ENABLED` on the API first to stop new jobs, then on workers after in-flight jobs settle.
- Preserve job attempts, dead letters, audit events, snapshot hashes, and retention receipts. Never copy stored bodies into tickets or logs.
- If an internal-network request is suspected, isolate worker egress, rotate any potentially exposed service credentials, and inspect DNS, proxy, and network-flow logs before reenabling the feature.
- A failed or disabled capture must never generate placeholder content. The customer-visible state remains failed or unavailable until a real snapshot is stored.
