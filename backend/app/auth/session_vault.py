"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Enterprise Session & JWT Cryptographic Vault
================================================================================
Mints, verifies, and revokes JWT tokens with cryptographic HMAC-SHA256 signatures,
tenant isolation claims (tenant_id, user_id, role), and instant session killswitches.
================================================================================
"""

import time
import json
import base64
import hmac
import hashlib
import uuid
import threading
from typing import Dict, Any, List, Optional

class SessionVault:
    """Session management and cryptographic token vault."""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SessionVault, cls).__new__(cls)
                cls._instance._init_vault()
            return cls._instance

    def _init_vault(self):
        self._signing_key = "psychs_enterprise_jwt_signing_key_secret_2026"
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
        self._revoked_tokens: set = set()
        
        # Pre-populate sample active sessions
        self.create_session(
            user_id="usr-admin-01",
            user_email="chief.architect@psychs.ai",
            tenant_id="tenant-psychs-master",
            role="SUPER_ADMIN",
            ip_address="192.168.1.42",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0"
        )
        self.create_session(
            user_id="usr-brand-03",
            user_email="brand.director@enterprise-corp.com",
            tenant_id="tenant-enterprise-corp",
            role="BRAND_MANAGER",
            ip_address="10.0.4.19",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        )

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    def _base64url_decode(self, s: str) -> bytes:
        rem = len(s) % 4
        if rem > 0:
            s += '=' * (4 - rem)
        return base64.urlsafe_b64decode(s.encode('utf-8'))

    def mint_jwt(self, payload: Dict[str, Any], expiry_seconds: int = 86400) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        now = int(time.time())
        token_payload = dict(payload)
        token_payload["iat"] = now
        token_payload["exp"] = now + expiry_seconds
        token_payload["jti"] = uuid.uuid4().hex

        header_b64 = self._base64url_encode(json.dumps(header).encode('utf-8'))
        payload_b64 = self._base64url_encode(json.dumps(token_payload).encode('utf-8'))

        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(self._signing_key.encode('utf-8'), message, hashlib.sha256).digest()
        sig_b64 = self._base64url_encode(signature)

        return f"{header_b64}.{payload_b64}.{sig_b64}"

    def verify_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(self._signing_key.encode('utf-8'), message, hashlib.sha256).digest()
        actual_sig = self._base64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = self._base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        # Check expiration & revocation
        if payload.get("exp", 0) < time.time():
            return None
        if payload.get("jti") in self._revoked_tokens:
            return None

        return payload

    def create_session(
        self,
        user_id: str,
        user_email: str,
        tenant_id: str,
        role: str,
        ip_address: str,
        user_agent: str
    ) -> Dict[str, Any]:
        session_id = f"sess-{uuid.uuid4().hex[:8]}"
        now = time.time()
        token = self.mint_jwt({
            "sub": user_id,
            "email": user_email,
            "tenant_id": tenant_id,
            "role": role,
            "session_id": session_id
        })
        
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "user_email": user_email,
            "tenant_id": tenant_id,
            "role": role,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "token": token,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "last_activity": "Just now",
            "status": "ACTIVE"
        }
        self._active_sessions[session_id] = session
        return session

    def list_active_sessions(self) -> List[Dict[str, Any]]:
        return list(self._active_sessions.values())

    def revoke_session(self, session_id: str) -> bool:
        if session_id in self._active_sessions:
            sess = self._active_sessions.pop(session_id)
            verified = self.verify_jwt(sess["token"])
            if verified and "jti" in verified:
                self._revoked_tokens.add(verified["jti"])
            return True
        return False
