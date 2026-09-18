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
import os
import secrets
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
        environment = os.environ.get("PSYCHS_ENVIRONMENT", "development").strip().lower()
        configured_key = os.environ.get("PSYCHS_JWT_SIGNING_KEY", "")
        if environment in {"production", "staging"} and len(configured_key) < 32:
            raise RuntimeError(
                "PSYCHS_JWT_SIGNING_KEY must be configured with at least 32 characters "
                f"when PSYCHS_ENVIRONMENT={environment}"
            )

        # Development gets an ephemeral process-local key. It is intentionally not
        # stable across restarts and must never be treated as a production secret.
        self._signing_key = configured_key or secrets.token_urlsafe(48)
        self._issuer = os.environ.get("PSYCHS_JWT_ISSUER", "psychs-platform")
        self._audience = os.environ.get("PSYCHS_JWT_AUDIENCE", "psychs-api")
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
        self._revoked_tokens: set = set()

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
        token_payload.setdefault("iss", self._issuer)
        token_payload.setdefault("aud", self._audience)

        header_b64 = self._base64url_encode(json.dumps(header).encode('utf-8'))
        payload_b64 = self._base64url_encode(json.dumps(token_payload).encode('utf-8'))

        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(self._signing_key.encode('utf-8'), message, hashlib.sha256).digest()
        sig_b64 = self._base64url_encode(signature)

        return f"{header_b64}.{payload_b64}.{sig_b64}"

    def verify_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None

            header_b64, payload_b64, sig_b64 = parts
            header = json.loads(self._base64url_decode(header_b64).decode('utf-8'))
            if header.get("alg") != "HS256" or header.get("typ") != "JWT":
                return None

            message = f"{header_b64}.{payload_b64}".encode('utf-8')
            expected_sig = hmac.new(self._signing_key.encode('utf-8'), message, hashlib.sha256).digest()
            actual_sig = self._base64url_decode(sig_b64)
            if not hmac.compare_digest(expected_sig, actual_sig):
                return None

            payload_bytes = self._base64url_decode(payload_b64)
            payload = json.loads(payload_bytes.decode('utf-8'))
        except (ValueError, TypeError, UnicodeDecodeError, json.JSONDecodeError):
            return None

        now = time.time()
        if payload.get("exp", 0) < now or payload.get("iat", now + 1) > now + 60:
            return None
        if payload.get("iss") != self._issuer or payload.get("aud") != self._audience:
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
            # Raw bearer tokens are returned once to the caller, but never kept in
            # objects exposed by session-list APIs.
            "token_jti": self.verify_jwt(token).get("jti"),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "last_activity": "Just now",
            "status": "ACTIVE"
        }
        self._active_sessions[session_id] = session
        return {**session, "token": token}

    def list_active_sessions(self) -> List[Dict[str, Any]]:
        return [dict(session) for session in self._active_sessions.values()]

    def revoke_session(self, session_id: str) -> bool:
        if session_id in self._active_sessions:
            sess = self._active_sessions.pop(session_id)
            if sess.get("token_jti"):
                self._revoked_tokens.add(sess["token_jti"])
            return True
        return False
