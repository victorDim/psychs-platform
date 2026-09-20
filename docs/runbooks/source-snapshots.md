# Verified source snapshot runbook

Source snapshots are immutable, tenant-isolated records of bytes fetched from a verified authoritative source. The feature is disabled by default because it creates outbound worker traffic and retained customer data.

## Staging enablement

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
