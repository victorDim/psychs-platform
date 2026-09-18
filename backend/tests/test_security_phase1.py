"""
Unit Tests for Phase 1: Security & Authentication Hardening
Tests SSRF validation, RBAC Bearer token permissions, dynamic cryptographic salts, and payload bounds.
"""
import unittest
import asyncio
import os
import hmac
import hashlib
import socket
from unittest.mock import patch
from app.ingestion.ssrf_guard import is_safe_public_url
from app.ingestion.crawler import IngestionPipeline
from app.auth.session_vault import SessionVault
from app.auth.rbac import RBACManager, UserRole, Permission
from app.database.audit_vault import ImmutableAuditVault
from app.optimization.cms_webhooks import CmsWebhookManager, PublishDeploymentRequest
from server import PsychsAPIHandler


class TestSecurityPhase1(unittest.TestCase):
    def test_ssrf_blocks_private_and_loopback_ips(self):
        """Verify SSRF defense blocks localhost, private IPs, and cloud metadata."""
        blocked_targets = [
            "http://localhost:8000",
            "http://127.0.0.1:8080/secret",
            "http://10.0.0.5/internal",
            "http://192.168.1.100/admin",
            "http://172.16.0.1/db",
            "http://169.254.169.254/latest/meta-data/",  # Cloud metadata
            "http://metadata.google.internal/computeMetadata/v1/",
            "http://[::1]:8000",
            "file:///etc/passwd",
            "https://user:password@example.com/private",
            "https://example.com:8443/admin",
        ]
        for target in blocked_targets:
            is_safe, reason = is_safe_public_url(target)
            self.assertFalse(is_safe, f"Target {target} should be blocked by SSRF defense but passed: {reason}")

    def test_ssrf_allows_public_domains(self):
        """Verify valid public domains pass SSRF inspection."""
        public_targets = [
            "https://psychs.ai",
            "https://forbes.com",
            "https://gartner.com"
        ]
        public_dns_result = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]
        with patch("app.ingestion.ssrf_guard.socket.getaddrinfo", return_value=public_dns_result):
            for target in public_targets:
                is_safe, reason = is_safe_public_url(target)
                self.assertTrue(is_safe, f"Public target {target} was unexpectedly blocked: {reason}")

    def test_crawler_ssrf_defense_integration(self):
        """Verify the ingestion crawler aborts with SSRF_BLOCKED when given internal IPs."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            res = loop.run_until_complete(IngestionPipeline.crawl_and_extract("http://127.0.0.1:9000/internal"))
            self.assertEqual(res.get("status"), "SSRF_BLOCKED")
            self.assertIn("SSRF_RESTRICTED_IP_DETECTED", res["sanitization"]["security_flags"])
        finally:
            loop.close()

    def test_jwt_mint_verify_and_rbac_permission(self):
        """Verify SessionVault mints valid JWTs and RBACManager enforces roles correctly."""
        vault = SessionVault()
        
        # 1. Super Admin Token
        admin_jwt = vault.mint_jwt({
            "user_id": "usr-sec-01",
            "user_email": "secops@psychs.ai",
            "role": "SUPER_ADMIN",
            "tenant_id": "ten_enterprise_prod_01"
        })
        payload = vault.verify_jwt(admin_jwt)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["role"], "SUPER_ADMIN")
        self.assertTrue(RBACManager.has_permission(payload["role"], Permission.EXECUTE_CRYPTO_SHRED))
        self.assertTrue(RBACManager.has_permission(payload["role"], Permission.ROTATE_API_KEYS))

        # 2. Analyst Viewer Token (Restricted)
        analyst_jwt = vault.mint_jwt({
            "user_id": "usr-analyst-02",
            "user_email": "analyst@psychs.ai",
            "role": "ANALYST_VIEWER",
            "tenant_id": "ten_enterprise_prod_01"
        })
        analyst_payload = vault.verify_jwt(analyst_jwt)
        self.assertIsNotNone(analyst_payload)
        self.assertEqual(analyst_payload["role"], "ANALYST_VIEWER")
        self.assertTrue(RBACManager.has_permission(analyst_payload["role"], Permission.VIEW_TELEMETRY))
        self.assertFalse(RBACManager.has_permission(analyst_payload["role"], Permission.EXECUTE_CRYPTO_SHRED))
        self.assertFalse(RBACManager.has_permission(analyst_payload["role"], Permission.ROTATE_API_KEYS))

        # Session inventory must never expose the raw bearer token.
        session = vault.create_session(
            user_id="usr-safe-session",
            user_email="safe-session@psychs.ai",
            tenant_id="ten_enterprise_prod_01",
            role="ANALYST_VIEWER",
            ip_address="127.0.0.1",
            user_agent="SecurityTest"
        )
        self.assertIn("token", session)
        listed = next(s for s in vault.list_active_sessions() if s["session_id"] == session["session_id"])
        self.assertNotIn("token", listed)
        self.assertIn("token_jti", listed)

    def test_authentication_fails_closed_and_route_policies_are_centralized(self):
        handler = object.__new__(PsychsAPIHandler)
        handler.headers = {}
        old_environment = os.environ.get("PSYCHS_ENVIRONMENT")
        old_demo_auth = os.environ.get("PSYCHS_ALLOW_INSECURE_DEMO_AUTH")
        try:
            os.environ["PSYCHS_ENVIRONMENT"] = "development"
            os.environ["PSYCHS_ALLOW_INSECURE_DEMO_AUTH"] = "false"
            self.assertIsNone(handler._authenticate_request())

            os.environ["PSYCHS_ALLOW_INSECURE_DEMO_AUTH"] = "true"
            self.assertEqual(handler._authenticate_request()["auth_mode"], "INSECURE_LOCAL_DEMO")

            os.environ["PSYCHS_ENVIRONMENT"] = "production"
            self.assertIsNone(handler._authenticate_request())

            self.assertIsNone(handler._permission_for_request("GET", "/api/v1/health"))
            self.assertEqual(
                handler._permission_for_request("GET", "/api/v1/auth/sessions"),
                Permission.MANAGE_USERS,
            )
            self.assertEqual(
                handler._permission_for_request("POST", "/api/v1/security/crypto-shred"),
                Permission.EXECUTE_CRYPTO_SHRED,
            )
            self.assertEqual(
                handler._permission_for_request("POST", "/api/v1/optimization/publish"),
                Permission.MERGE_GITOPS_PR,
            )
        finally:
            if old_environment is None:
                os.environ.pop("PSYCHS_ENVIRONMENT", None)
            else:
                os.environ["PSYCHS_ENVIRONMENT"] = old_environment
            if old_demo_auth is None:
                os.environ.pop("PSYCHS_ALLOW_INSECURE_DEMO_AUTH", None)
            else:
                os.environ["PSYCHS_ALLOW_INSECURE_DEMO_AUTH"] = old_demo_auth

    def test_dynamic_cryptographic_salts(self):
        """Verify WORM audit vault and CMS Webhooks generate tamper-evident signatures."""
        # 1. Audit Vault Log with Dynamic Salt
        log = ImmutableAuditVault.log_event(
            tenant_id="tenant-security-test",
            actor_id="secops_audit_runner",
            action_type="SECURITY_AUDIT_VERIFY",
            evidence_tier="OBSERVED",
            resource_target="KMS_TDK",
            details={"test": "pass"}
        )
        self.assertTrue(log.log_id.startswith("AUD-"))
        self.assertEqual(len(log.payload_hash), 64)
        self.assertEqual(len(log.hmac_signature), 64)

        # 2. CMS Webhook with Dynamic Secret
        approval_secret = "test-only-cms-approval-secret-at-least-32-chars"
        os.environ["CMS_APPROVAL_SECRET"] = approval_secret
        unsigned_req = PublishDeploymentRequest(
            diff_id="DIFF-SEC-01",
            platform_name="WordPress",
            target_environment="PRODUCTION",
            approver_signature="",
            approver_email="secops@psychs.ai",
            content_payload="Sample Hardened Content Payload"
        )
        signature = hmac.new(
            approval_secret.encode("utf-8"),
            CmsWebhookManager.approval_payload(unsigned_req),
            hashlib.sha256,
        ).hexdigest()
        deploy_req = PublishDeploymentRequest(
            **{**unsigned_req.model_dump(), "approver_signature": signature}
        )
        res = CmsWebhookManager.publish_diff(deploy_req)
        self.assertTrue(res.hmac_signature_verified)
        self.assertEqual(res.status, "APPROVED_NOT_DISPATCHED")

        invalid_req = PublishDeploymentRequest(
            **{**unsigned_req.model_dump(), "approver_signature": "invalid"}
        )
        with self.assertRaises(PermissionError):
            CmsWebhookManager.publish_diff(invalid_req)


if __name__ == "__main__":
    unittest.main()
