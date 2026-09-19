# OIDC staging identity validation

Run this gate against the exact identity provider, public browser client, API
audience, and claim mappings intended for production. Do not promote a release
based only on locally signed tokens.

## Provider contract

Access tokens must be asymmetrically signed and contain:

- `iss`, `aud`, `sub`, `iat`, and `exp` with a lifetime no longer than
  `PSYCHS_OIDC_MAX_TOKEN_LIFETIME_SECONDS`;
- a cryptographically random, globally unique, non-empty `jti` for emergency
  revocation that is never reused;
- a tenant UUID in `tenant_id` (or `tid`);
- API permissions in `scope` (or `scp`);
- `auth_time` plus either an accepted `acr` or an accepted `amr` value for
  sensitive human operations;
- `principal_type=human|service`, or a provider-native service marker
  (`gty=client-credentials` or `idtyp=app|service`).

Provision browser applications as public Authorization Code + PKCE clients.
Register exact `/auth/callback` and post-logout URLs, disallow implicit and
password grants, and never issue a client secret to the browser. Configure the
frontend `VITE_OIDC_STEP_UP_ACR_VALUES` to request the provider's assurance
class; the API remains authoritative and validates the returned `auth_time`,
`acr`, and `amr` claims.

Each subject must map to one active `users` row and one active tenant
membership. Set `users.principal_type` explicitly to `service` for workload
identities. A human token cannot authenticate as that service row, and a
client-credentials token cannot authenticate as a human row.

## Release exercise

Capture request IDs and sanitized results in the release record. Never attach
tokens, authorization headers, `jti` values, or token hashes.

1. Sign in through the deployed frontend and confirm the authorization request
   uses `response_type=code` and PKCE. Verify tokens are stored only in browser
   session storage and disappear after sign-out/browser-session closure.
2. Call `GET /api/v2/projects` with the human token. Confirm the expected tenant
   succeeds and a token whose tenant claim does not match its membership is
   denied.
3. Try an expired token, an over-lifetime token, a token without `jti`, a wrong
   audience/issuer token, and a token signed by an unknown key. Every request
   must return `401` without disclosing validation internals.
4. Exercise the same-tenant human and service subjects. Confirm each succeeds
   only when the database principal type matches the signed token type. Confirm
   a service identity is denied from human-only domain ownership operations.
5. Attempt a domain ownership operation with password-only or stale
   authentication. Confirm `403 step_up_authentication_required`, perform the
   frontend step-up redirect, then retry deliberately after the callback. The
   client must not automatically replay the original write.
6. As a stepped-up tenant administrator, call
   `POST /api/v2/security/revoked-tokens` with the target token's `jti`, `exp`,
   and a reason. Confirm the target token immediately returns `401`, another
   tenant cannot observe the record, and the response never returns a token ID
   or hash.
7. Rotate the provider signing key. Confirm tokens signed by both advertised
   keys work during overlap, the JWKS cache refreshes, and tokens signed by the
   retired key fail after the provider removes it.
8. Confirm provider logout and refresh-token rotation/reuse detection. Access
   tokens can remain valid until their short expiry unless explicitly revoked;
   record that maximum exposure window.
9. Review authentication, authorization, revocation, and domain-verification
   audit events together with API latency/error telemetry. Confirm no bearer
   token or raw `jti` appears in application, proxy, identity-provider, or
   telemetry logs.

## Revocation retention

Active revocations are immutable, including to the database owner. The API role
has no delete permission. A restricted maintenance task running with migration
owner credentials may periodically remove only expired rows:

```sql
DELETE FROM revoked_access_tokens
WHERE expires_at <= clock_timestamp() - interval '30 seconds';
```

Alert on cleanup failure or sustained table growth. Do not place owner
credentials in the API or worker runtime to perform this maintenance.

## Promotion evidence

The gate passes only when every negative test fails closed, human and service
identity separation is demonstrated, step-up and revocation work with the real
provider, signing-key rotation is observed, and sanitized evidence is attached
to the release approval.
