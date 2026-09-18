# Security policy

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, personal data, or customer evidence in a public issue. Contact the private security channel designated by the repository owner and include the affected revision, impact, reproduction steps, and any suggested mitigation.

Until a private reporting address is published, contact the repository owner directly through GitHub without including exploit details in the initial public message.

## Supported code

Only the latest protected `main` revision is eligible for security fixes. The legacy v1 server and explicitly synthetic/demo modes are not approved for production or customer data.

## Credential handling

- Never place tokens or secrets in issues, commits, chat messages, logs, screenshots, fixtures, or container images.
- Revoke an exposed credential immediately; deleting the visible text is not sufficient.
- Production secrets must come from an external secret manager through workload identity.
- Database migration credentials must never be mounted into API or worker pods.

## Security release gates

Production promotion requires passing authentication/authorization tests, cross-tenant PostgreSQL RLS tests, secret scanning, dependency and container scanning, signed artifact verification, staging smoke tests, rollback validation, and security-owner approval.
