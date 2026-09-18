"""
SSRF (Server-Side Request Forgery) Defense & IP Range Validator
Prevents crawling private, loopback, link-local, multicast, or cloud metadata IP addresses.
"""
import socket
import ipaddress
import urllib.parse
import urllib.request
import urllib.error
from typing import Optional, Tuple

MAX_CRAWL_BYTES = 5 * 1024 * 1024
MAX_REDIRECTS = 3
ALLOWED_CONTENT_TYPES = ("text/html", "application/xhtml+xml", "text/plain")

BLOCKED_SUBNETS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),       # AWS/GCP/Azure link-local & metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),          # Multicast
    ipaddress.ip_network("240.0.0.0/4"),          # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
]

BLOCKED_IPV6_SUBNETS = [
    ipaddress.ip_network("::1/128"),              # Loopback
    ipaddress.ip_network("::/128"),               # Unspecified
    ipaddress.ip_network("fc00::/7"),             # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),            # Link-Local
    ipaddress.ip_network("ff00::/8"),             # Multicast
]

def _blocked_ip_reason(ip_obj: ipaddress._BaseAddress) -> Optional[str]:
    ip_str = str(ip_obj)
    if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local or ip_obj.is_multicast:
        return f"SSRF Blocked: IP {ip_str} belongs to private/reserved space"

    subnets = BLOCKED_SUBNETS if isinstance(ip_obj, ipaddress.IPv4Address) else BLOCKED_IPV6_SUBNETS
    for subnet in subnets:
        if ip_obj in subnet:
            return f"SSRF Blocked: IP {ip_str} is in restricted range {subnet}"
    return None


def validate_public_url_syntax(url_or_domain: str) -> Tuple[bool, str]:
    """Validate URL structure and reject unsafe literal targets without DNS.

    This is suitable for caller-supplied content that will not cause a network
    request. Any actual fetch must additionally call ``is_safe_public_url``.
    """
    clean_input = url_or_domain.strip()
    if not clean_input.startswith("http://") and not clean_input.startswith("https://"):
        target_url = f"https://{clean_input}"
    else:
        target_url = clean_input

    try:
        parsed = urllib.parse.urlparse(target_url)
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid or missing hostname in URL"
        if parsed.scheme not in {"http", "https"}:
            return False, f"URL scheme '{parsed.scheme}' is not permitted"
        if parsed.username or parsed.password:
            return False, "Credentials embedded in crawl URLs are not permitted"
        if parsed.port and parsed.port not in {80, 443}:
            return False, f"Port {parsed.port} is not permitted"

        if hostname.lower() in ["localhost", "127.0.0.1", "::1", "metadata.google.internal", "instance-data"]:
            return False, f"Direct loopback or metadata hostname '{hostname}' is blocked"

        try:
            literal_ip = ipaddress.ip_address(hostname)
        except ValueError:
            literal_ip = None
        if literal_ip:
            blocked_reason = _blocked_ip_reason(literal_ip)
            if blocked_reason:
                return False, blocked_reason

        return True, "URL syntax validated"
    except ValueError as exc:
        return False, f"Invalid URL: {exc}"
    except Exception as exc:
        return False, f"URL validation error: {exc}"


def is_safe_public_url(url_or_domain: str) -> Tuple[bool, str]:
    """Validate that a URL resolves only to safe, routable public addresses."""
    syntax_safe, syntax_reason = validate_public_url_syntax(url_or_domain)
    if not syntax_safe:
        return False, syntax_reason

    clean_input = url_or_domain.strip()
    target_url = clean_input if clean_input.startswith(("http://", "https://")) else f"https://{clean_input}"

    try:
        parsed = urllib.parse.urlparse(target_url)
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid or missing hostname in URL"

        # Resolve IP addresses via DNS
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == 'https' else 80))
        if not addr_info:
            return False, f"Hostname '{hostname}' failed DNS resolution"

        for entry in addr_info:
            sockaddr = entry[4]
            ip_str = sockaddr[0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
            except ValueError:
                return False, f"Invalid IP address resolved: {ip_str}"

            blocked_reason = _blocked_ip_reason(ip_obj)
            if blocked_reason:
                return False, blocked_reason

        return True, "URL validated as safe public endpoint"

    except socket.gaierror as e:
        return False, f"DNS resolution failed ({e})"
    except Exception as e:
        return False, f"SSRF validation error: {str(e)}"


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_public_text(url: str, timeout_seconds: float = 5.0) -> Tuple[str, str]:
    """Fetch a bounded public text response while validating every redirect hop.

    Network-level egress isolation remains mandatory in production; application
    validation is defense in depth, not a replacement for it.
    """
    opener = urllib.request.build_opener(_NoRedirectHandler())
    current_url = url

    for redirect_count in range(MAX_REDIRECTS + 1):
        is_safe, reason = is_safe_public_url(current_url)
        if not is_safe:
            raise ValueError(reason)

        request = urllib.request.Request(
            current_url,
            headers={"User-Agent": "Psychs-GEO-Bot/2.0 (+https://psychs.ai/crawler)"}
        )
        try:
            response = opener.open(request, timeout=timeout_seconds)
        except urllib.error.HTTPError as exc:
            if exc.code not in {301, 302, 303, 307, 308}:
                raise
            if redirect_count >= MAX_REDIRECTS:
                raise ValueError("Crawl redirect limit exceeded")
            location = exc.headers.get("Location", "")
            if not location:
                raise ValueError("Redirect response did not include a Location header")
            current_url = urllib.parse.urljoin(current_url, location)
            continue

        with response:
            content_type = response.headers.get_content_type().lower()
            if not any(content_type.startswith(item) for item in ALLOWED_CONTENT_TYPES):
                raise ValueError(f"Unsupported crawl content type: {content_type}")
            declared_length = response.headers.get("Content-Length")
            if declared_length and int(declared_length) > MAX_CRAWL_BYTES:
                raise ValueError("Crawl response exceeds maximum permitted size")
            body = response.read(MAX_CRAWL_BYTES + 1)
            if len(body) > MAX_CRAWL_BYTES:
                raise ValueError("Crawl response exceeds maximum permitted size")
            charset = response.headers.get_content_charset() or "utf-8"
            return body.decode(charset, errors="replace"), current_url

    raise ValueError("Crawl redirect limit exceeded")
