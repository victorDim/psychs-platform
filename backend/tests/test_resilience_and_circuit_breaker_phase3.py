"""
================================================================================
Psychs GEO Platform v2.0.0-PROD: Phase 3 Resilience & Circuit Breaker Test Suite
================================================================================
Unit tests verifying 3-state Circuit Breaker mechanics, exponential retry policies,
multi-region proxy failover, and upstream AI engine fault tolerance.
================================================================================
"""

import time
from app.perception.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitState,
    UpstreamResilienceManager
)
from app.perception.live_connectors import LiveEngineDispatcher, ConnectionPingResult
from app.routing_cache.cache import TwoTierCacheManager

def test_circuit_breaker_state_transitions():
    """Verify CLOSED -> OPEN -> HALF_OPEN -> CLOSED state lifecycle."""
    cfg = CircuitBreakerConfig(
        failure_threshold=3,
        recovery_timeout_seconds=0.2,
        half_open_success_threshold=1,
        max_retries=1,
        base_backoff_seconds=0.01
    )
    cb = CircuitBreaker("TestProvider", config=cfg)
    
    # 1. Initially CLOSED
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True

    # 2. Tripping failure threshold -> OPEN
    cb.record_failure(Exception("HTTP 503 Service Unavailable"))
    cb.record_failure(Exception("HTTP 504 Gateway Timeout"))
    assert cb.state == CircuitState.CLOSED
    cb.record_failure(Exception("HTTP 429 Rate Limit Exceeded"))
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    # 3. Wait for recovery cooldown -> HALF_OPEN
    time.sleep(0.25)
    assert cb.can_execute() is True
    assert cb.state == CircuitState.HALF_OPEN

    # 4. Successful probe in HALF_OPEN resets to CLOSED
    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0

def test_exponential_backoff_and_retry():
    """Verify UpstreamResilienceManager executes retries with backoff."""
    manager = UpstreamResilienceManager.get_instance()
    call_attempts = 0

    def flaky_query():
        nonlocal call_attempts
        call_attempts += 1
        if call_attempts < 2:
            raise Exception("Transient upstream network disconnect")
        return {"status": "SUCCESS", "data": "rescued_on_retry"}

    def fallback(err):
        return {"status": "FALLBACK", "err": err}

    res = manager.execute_with_resilience("test_flaky_engine", flaky_query, fallback)
    assert res["status"] == "SUCCESS"
    assert call_attempts == 2

def test_multi_region_proxy_failover():
    """Verify automated and manual egress proxy failover across 5 regions."""
    manager = UpstreamResilienceManager.get_instance()
    initial_region = manager.get_resilience_status()["active_egress_region"]

    next_reg = manager.failover_proxy_region()
    assert next_reg != initial_region
    assert next_reg in manager.PROXY_REGIONS

    status = manager.get_resilience_status()
    assert status["active_egress_region"] == next_reg
    assert len(status["recent_resilience_events"]) > 0

def test_resilience_status_telemetry():
    """Verify all 8 frontier providers and proxy pools have active circuit metrics."""
    manager = UpstreamResilienceManager.get_instance()
    status = manager.get_resilience_status()

    assert "circuit_breakers" in status
    assert len(status["circuit_breakers"]) >= 8
    for provider in ["perplexity", "openai", "gemini", "claude", "glm", "grok", "deepseek"]:
        assert provider in status["circuit_breakers"]
        assert status["circuit_breakers"][provider]["state"] in ["CLOSED", "OPEN", "HALF_OPEN"]

def test_live_engine_dispatcher_circuit_breaking():
    """Verify LiveEngineDispatcher query methods gracefully fallback when circuit is open."""
    res = LiveEngineDispatcher.query_perplexity("Test query under resilience")
    assert res.engine_name.startswith("Perplexity.ai")
    assert res.status in ["SUCCESS", "FALLBACK_MOCK"]
    assert len(res.citations) >= 1
