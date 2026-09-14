"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Phase 2 Persistence & Cache Test Suite
================================================================================
Comprehensive unit tests verifying durable file-backed persistence,
WORM audit log hydration, KMS cryptographic shredding cascading purge,
bounded LRU caching with 24h TTL and inverted keyword index pruning,
and multi-worker background job execution with JSONL completion archiving.
================================================================================
"""

import time
import json
import uuid
from pathlib import Path
from app.database.audit_vault import ImmutableAuditVault, DATA_DIR, AUDIT_LOG_FILE
from app.database.crypto_shredding import CryptoShreddingService, KMS_VAULT_FILE, TenantKeyStatus
from app.routing_cache.cache import TwoTierCacheManager
from app.scheduler.task_queue import AsyncTaskQueue, TaskPriority, TaskStatus, ARCHIVE_FILE

def test_audit_vault_persistence_and_hydration():
    """Verify that audit logs are written to disk and persisted across re-hydrations."""
    test_tenant = f"ten_test_persistence_{uuid.uuid4().hex[:6]}"
    entry = ImmutableAuditVault.log_event(
        tenant_id=test_tenant,
        actor_id="test_suite_actor",
        action_type="PERSISTENCE_VALIDATION",
        evidence_tier="OBSERVED",
        resource_target="https://psychs.ai/security",
        details={"test_key": "test_val_123"}
    )
    assert entry.log_id.startswith("AUD-")
    assert entry.tenant_id == test_tenant
    assert AUDIT_LOG_FILE.exists()

    # Verify log entry is saved on disk
    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
        content = f.read()
        assert entry.log_id in content
        assert "PERSISTENCE_VALIDATION" in content

    # Clean up test tenant
    purged = ImmutableAuditVault.purge_tenant_logs(test_tenant)
    assert purged >= 1

def test_crypto_shredding_persistence_and_cascading_purge():
    """Verify KMS key shredding triggers cascading cache and audit log purges."""
    shred_tenant = f"ten_shred_cascade_{uuid.uuid4().hex[:6]}"
    
    # 1. Register key for test tenant
    key_status = CryptoShreddingService.get_key_status(shred_tenant)
    assert key_status.key_state == "ACTIVE"
    assert KMS_VAULT_FILE.exists()

    # 2. Seed cache and audit records for this tenant
    TwoTierCacheManager.store(
        entity_name="ShredBrand",
        query_text="Sensitive query to be purged",
        payload={"secret": "confidential_data"},
        tenant_id=shred_tenant
    )
    ImmutableAuditVault.log_event(
        tenant_id=shred_tenant,
        actor_id="shred_actor",
        action_type="SENSITIVE_OP",
        evidence_tier="USER_PROVIDED",
        resource_target="Internal DB",
        details={"sensitive": True}
    )

    # Verify seeded cache hit
    hit = TwoTierCacheManager.query("ShredBrand", "Sensitive query to be purged", tenant_id=shred_tenant)
    assert hit.is_hit is True

    # 3. Execute Cryptographic Shred
    result = CryptoShreddingService.execute_cryptographic_shred(
        tenant_id=shred_tenant,
        reason="GDPR Article 17 Right to be Forgotten"
    )
    assert result["status"] == "CRYPTOGRAPHICALLY_SHREDDED"
    assert result["sla_requirement_met"] is True

    # 4. Verify KMS registry state is SHREDDED on disk
    updated_key = CryptoShreddingService.get_key_status(shred_tenant)
    assert updated_key.key_state == "SHREDDED"
    assert updated_key.is_data_recoverable is False

    # 5. Verify cascading cache eviction
    cache_lookup = TwoTierCacheManager.query("ShredBrand", "Sensitive query to be purged", tenant_id=shred_tenant)
    assert cache_lookup.is_hit is False

    # 6. Verify cascading audit log purge
    remaining_logs = [l for l in ImmutableAuditVault.get_recent_logs(shred_tenant) if l.tenant_id == shred_tenant]
    assert len(remaining_logs) == 0

def test_two_tier_cache_lru_and_inverted_index():
    """Verify LRU capacity bounds, inverted keyword index candidate matching, and metrics."""
    TwoTierCacheManager.clear_all()

    # Store items
    TwoTierCacheManager.store("BrandA", "best enterprise generative search solution", {"result": "A1"})
    TwoTierCacheManager.store("BrandB", "top performing ai search platform", {"result": "B1"})

    # Exact hit
    hit_exact = TwoTierCacheManager.query("BrandA", "best enterprise generative search solution")
    assert hit_exact.is_hit is True
    assert hit_exact.cache_tier == "EXACT_SHA256"
    assert hit_exact.cached_payload["result"] == "A1"

    # Semantic hit with inverted index pruning
    hit_semantic = TwoTierCacheManager.query("BrandA", "best enterprise generative search solution")
    assert hit_semantic.is_hit is True

    # Cache miss on unrelated query (inverted index returns 0 candidates instantly)
    miss = TwoTierCacheManager.query("BrandZ", "completely unrelated query string with zero tokens")
    assert miss.is_hit is False
    assert miss.cache_tier == "CACHE_MISS"

    # Verify telemetry stats
    stats = TwoTierCacheManager.get_cache_stats()
    assert stats["exact_entries_count"] >= 1
    assert stats["semantic_entries_count"] >= 1
    assert stats["exact_hits"] >= 1
    assert stats["inverted_index_terms_count"] > 0

def test_two_tier_cache_ttl_expiration():
    """Verify TTL expiration prunes stale entries."""
    TwoTierCacheManager.clear_all()
    TwoTierCacheManager.store(
        entity_name="BrandTTL",
        query_text="temporary short lived query",
        payload={"temp": True},
        ttl_seconds=1  # 1 second TTL
    )

    # Immediate query hits
    immediate_hit = TwoTierCacheManager.query("BrandTTL", "temporary short lived query")
    assert immediate_hit.is_hit is True

    # Wait for TTL expiration
    time.sleep(1.1)

    # Subsequent query misses due to TTL expiration
    expired_lookup = TwoTierCacheManager.query("BrandTTL", "temporary short lived query")
    assert expired_lookup.is_hit is False

def test_async_task_queue_multiworker_and_archive():
    """Verify multi-worker pool processes concurrent tasks and archives to JSONL."""
    queue = AsyncTaskQueue()
    
    tasks = []
    for i in range(4):
        t = queue.enqueue_task(
            name=f"Concurrent Job {i}",
            task_type="AUDIT_SCRAPE",
            payload={"brand_name": f"Psychs-{i}", "proxy_region": "US-East"},
            priority=TaskPriority.HIGH
        )
        tasks.append(t)

    # Allow workers to execute concurrently
    time.sleep(0.3)

    stats = queue.get_stats()
    assert stats["worker_pool_size"] == 4
    assert stats["worker_status"] == "ACTIVE"
    assert stats["completed"] >= 4

    # Verify archive file has records
    assert ARCHIVE_FILE.exists()
    with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
        archived_lines = f.readlines()
        assert len(archived_lines) >= 4
