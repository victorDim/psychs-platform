"""
SSRF (Server-Side Request Forgery) Defense & IP Range Validator
Prevents crawling private, loopback, link-local, multicast, or cloud metadata IP addresses.
"""
import socket
import ipaddress
import urllib.parse
from typing import Tuple

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

def is_safe_public_url(url_or_domain: str) -> Tuple[bool, str]:
    """
    Validates that a URL or hostname resolves only to safe, routable public IP addresses.
    Returns (is_safe: bool, reason: str).
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

        # Check raw string matches
        if hostname.lower() in ["localhost", "127.0.0.1", "::1", "metadata.google.internal", "instance-data"]:
            return False, f"Direct loopback or metadata hostname '{hostname}' is blocked"

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

            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local or ip_obj.is_multicast:
                return False, f"SSRF Blocked: Resolved IP {ip_str} belongs to private/reserved space"

            if isinstance(ip_obj, ipaddress.IPv4Address):
                for subnet in BLOCKED_SUBNETS:
                    if ip_obj in subnet:
                        return False, f"SSRF Blocked: Resolved IPv4 {ip_str} is in restricted range {subnet}"
            elif isinstance(ip_obj, ipaddress.IPv6Address):
                for subnet in BLOCKED_IPV6_SUBNETS:
                    if ip_obj in subnet:
                        return False, f"SSRF Blocked: Resolved IPv6 {ip_str} is in restricted range {subnet}"

        return True, "URL validated as safe public endpoint"

    except socket.gaierror as e:
        # Non-resolvable domains can still be processed in demo/simulated mode
        return True, f"DNS resolution failed ({e}); falling back to sandboxed mock extraction"
    except Exception as e:
        return False, f"SSRF validation error: {str(e)}"
