"""Bounded DNS TXT verification for project ownership challenges."""

import hashlib
import hmac
from typing import Protocol
from urllib.parse import urlparse

import dns.asyncresolver
import dns.exception
import dns.resolver


TOKEN_PREFIX = "psychs-verification="
DNS_QUERY_TIMEOUT_SECONDS = 3.0


class DnsVerificationUnavailable(RuntimeError):
    """Raised when the configured recursive resolver cannot answer reliably."""


class TxtResolver(Protocol):
    async def resolve(self, name: str, rdtype: str, **kwargs): ...


def source_belongs_to_domain(canonical_url: str, canonical_domain: str) -> bool:
    """Return true only for the verified apex or one of its subdomains."""
    hostname = (urlparse(canonical_url).hostname or "").lower().rstrip(".")
    domain = canonical_domain.lower().rstrip(".")
    return bool(domain) and (hostname == domain or hostname.endswith(f".{domain}"))


async def dns_txt_matches(
    record_name: str,
    expected_token_hash: str,
    resolver: TxtResolver | None = None,
) -> bool:
    """Check a challenge using a bounded DNS query and constant-time hashes."""
    active_resolver = resolver or dns.asyncresolver.Resolver()
    try:
        answer = await active_resolver.resolve(
            record_name,
            "TXT",
            lifetime=DNS_QUERY_TIMEOUT_SECONDS,
            search=False,
        )
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        return False
    except (
        dns.exception.Timeout,
        dns.resolver.NoNameservers,
        dns.resolver.NoResolverConfiguration,
    ) as exc:
        raise DnsVerificationUnavailable("DNS verification service is temporarily unavailable") from exc

    for record in answer:
        try:
            value = b"".join(record.strings).decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            continue
        if not value.startswith(TOKEN_PREFIX):
            continue
        token = value.removeprefix(TOKEN_PREFIX)
        candidate_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        if hmac.compare_digest(candidate_hash, expected_token_hash):
            return True
    return False
