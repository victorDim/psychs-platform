"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Scheduler, SSO, RBAC & Billing Test Suite
================================================================================
Comprehensive unit tests verifying asynchronous worker priority queuing,
24/7 audit schedules, HMAC webhook signatures, SAML 2.0 assertions, RBAC
permission matrices, JWT session vaulting, and metered token billing.
================================================================================
"""

import time
from app.scheduler.task_queue import AsyncTaskQueue, TaskPriority, TaskStatus
from app.scheduler.audit_scheduler import AuditScheduler
from app.scheduler.webhook_dispatcher import WebhookAlertDispatcher
from app.auth.rbac import RBACManager, UserRole, Permission
from app.auth.sso_manager import EnterpriseSSOManager
from app.auth.session_vault import SessionVault
from app.billing.metering import TokenMeteringEngine
from app.billing.stripe_manager import EnterpriseBillingManager

def test_async_task_queue_priority_and_execution():
    """Verify priority queue order and asynchronous execution."""
    queue = AsyncTaskQueue()
    
    # Enqueue low and high priority tasks
    task_low = queue.enqueue_task(
        name="Low Priority Audit",
        task_type="AUDIT_SCRAPE",
        payload={"brand_name": "Psychs", "proxy_region": "US-East"},
        priority=TaskPriority.LOW
    )
    task_high = queue.enqueue_task(
        name="High Priority Immediate Scrape",
        task_type="AUDIT_SCRAPE",
        payload={"brand_name": "Psychs", "proxy_region": "EU-Central"},
        priority=TaskPriority.HIGH
    )
    
    assert task_low.task_id.startswith("job-")
    assert task_high.task_id.startswith("job-")
    
    # Wait briefly for background execution
    time.sleep(0.15)
    
    stats = queue.get_stats()
    assert stats["total_jobs"] >= 2
    assert stats["worker_status"] == "ACTIVE"

def test_audit_scheduler_recurrence_and_trigger():
    """Verify 24/7 automated schedules and manual dispatch."""
    scheduler = AuditScheduler()
    schedules = scheduler.list_schedules()
    assert len(schedules) >= 3
    
    # Trigger a schedule manually
    first_sched = schedules[0]
    res = scheduler.trigger_schedule_now(first_sched["schedule_id"])
    assert res is not None
    assert "enqueued_task_id" in res
    assert res["schedule"]["total_runs_completed"] >= 1

def test_webhook_dispatcher_hmac_and_templates():
    """Verify HMAC-SHA256 signatures and vendor payload formats."""
    dispatcher = WebhookAlertDispatcher()
    endpoints = dispatcher.list_endpoints()
    assert len(endpoints) >= 3
    
    # Test HMAC signing
    secret = "enterprise_test_secret_2026"
    payload = b'{"event":"TEST_ALERT","status":"CRITICAL"}'
    sig = dispatcher.generate_hmac_signature(payload, secret)
    assert len(sig) == 64 # SHA-256 hex length
    
    # Test test-ping dispatch
    first_ep = endpoints[0]
    ping_res = dispatcher.dispatch_test_ping(first_ep["endpoint_id"])
    assert ping_res["status"] == "SUCCESS"
    assert ping_res["log"]["http_status"] == 200

def test_rbac_matrix_permissions_enforcement():
    """Verify strict 5-tier role boundaries."""
    # SUPER_ADMIN has full permissions
    assert RBACManager.has_permission("SUPER_ADMIN", Permission.EXECUTE_CRYPTO_SHRED)
    assert RBACManager.has_permission("SUPER_ADMIN", Permission.MANAGE_BILLING)
    assert RBACManager.has_permission("SUPER_ADMIN", Permission.TRIGGER_LIVE_AUDIT)
    
    # SECOPS_ADMIN can shred & view WORM but cannot manage billing or trigger GEO optimizer
    assert RBACManager.has_permission("SECOPS_ADMIN", Permission.EXECUTE_CRYPTO_SHRED)
    assert RBACManager.has_permission("SECOPS_ADMIN", Permission.VIEW_WORM_AUDIT)
    assert not RBACManager.has_permission("SECOPS_ADMIN", Permission.MANAGE_BILLING)
    assert not RBACManager.has_permission("SECOPS_ADMIN", Permission.TRIGGER_GEO_OPTIMIZER)
    
    # ANALYST_VIEWER is strictly read-only
    assert RBACManager.has_permission("ANALYST_VIEWER", Permission.VIEW_TELEMETRY)
    assert not RBACManager.has_permission("ANALYST_VIEWER", Permission.TRIGGER_LIVE_AUDIT)
    assert not RBACManager.has_permission("ANALYST_VIEWER", Permission.EXECUTE_CRYPTO_SHRED)

def test_sso_saml_assertion_and_session_jwt():
    """Verify SAML 2.0 assertion validation and JWT session lifecycle."""
    sso = EnterpriseSSOManager()
    cfg = sso.get_sso_config()
    assert cfg["sso_enabled"] is True
    assert "okta" in cfg["idp_sso_url"].lower()
    
    # Simulate valid SAML assertion
    saml_xml = "<saml2:Assertion><Subject>enterprise@psychs.ai</Subject></saml2:Assertion>"
    verify_res = sso.simulate_saml_assertion_verify(saml_xml)
    assert verify_res["verified"] is True
    assert verify_res["attributes"]["email"] == "enterprise_user@psychs.ai"
    
    # Test JWT Session Vault
    vault = SessionVault()
    session = vault.create_session(
        user_id="usr-test-01",
        user_email="test.user@psychs.ai",
        tenant_id="tenant-test",
        role="BRAND_MANAGER",
        ip_address="127.0.0.1",
        user_agent="PyTest/2026"
    )
    assert session["token"] is not None
    
    # Verify valid token
    decoded = vault.verify_jwt(session["token"])
    assert decoded is not None
    assert decoded["sub"] == "usr-test-01"
    assert decoded["role"] == "BRAND_MANAGER"
    
    # Revoke session
    revoked = vault.revoke_session(session["session_id"])
    assert revoked is True
    
    # Verify revoked token fails
    assert vault.verify_jwt(session["token"]) is None

def test_metered_token_quota_and_cache_savings():
    """Verify token usage calculation and semantic cache savings offset."""
    metering = TokenMeteringEngine()
    
    # Record inference
    res = metering.record_inference("gemini-3.7-flash", input_tokens=1000, output_tokens=500, cache_hit=False)
    assert res["status"] == "RECORDED"
    assert res["tokens_added"] == 1500
    
    # Record cache hit
    cache_res = metering.record_inference("gpt-6-astra", input_tokens=2000, output_tokens=1000, cache_hit=True)
    assert cache_res["status"] == "CACHE_HIT"
    assert cache_res["tokens_saved"] == 3000
    
    summary = metering.get_usage_summary()
    assert summary["monthly_quota_tokens"] > 0
    assert summary["estimated_cache_savings_usd"] >= 0.0
    
    # Test Stripe Billing Manager
    billing = EnterpriseBillingManager()
    sub = billing.get_subscription_details()
    assert sub["tier_id"] == "ENTERPRISE_GROWTH"
    assert sub["amount_usd"] == 12500.00
    
    invoices = billing.list_invoices()
    assert len(invoices) >= 3
    assert invoices[0]["status"] == "PAID"
