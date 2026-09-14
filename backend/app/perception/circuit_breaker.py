"""
================================================================================
Psychs GEO Platform v2.0.0-PROD: Upstream AI Resilience & Circuit Breaker Engine
================================================================================
Implements 3-state Circuit Breakers (CLOSED / OPEN / HALF_OPEN), exponential backoff
with jitter retries, and dynamic multi-region residential proxy failover.
================================================================================
"""

import time
import random
import threading
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from ..compat import BaseModel, Field

class CircuitState(Enum):
    CLOSED = "CLOSED"          # Normal operation - traffic passes to upstream
    OPEN = "OPEN"              # Fail fast - short-circuit upstream calls to local cache/mock
    HALF_OPEN = "HALF_OPEN"    # Probing upstream with limited single-flight requests

class CircuitBreakerConfig(BaseModel):
    failure_threshold: int = 3
    recovery_timeout_seconds: float = 20.0
    half_open_success_threshold: int = 1
    max_retries: int = 2
    base_backoff_seconds: float = 0.2
    max_backoff_seconds: float = 2.0
    jitter_factor: float = 0.1

class CircuitBreakerMetrics(BaseModel):
    provider_name: str
    state: str
    failure_count: int
    success_count: int
    total_requests: int
    total_failures: int
    total_short_circuits: int
    last_error: Optional[str] = None
    last_state_change: str
    active_proxy_region: str

class CircuitBreaker:
    def __init__(self, provider_name: str, config: Optional[CircuitBreakerConfig] = None):
        self.provider_name = provider_name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.total_requests = 0
        self.total_failures = 0
        self.total_short_circuits = 0
        self.last_error: Optional[str] = None
        self.last_state_change_time = time.time()
        self.active_proxy_region = "US-East (IAD)"
        self._lock = threading.Lock()

    def can_execute(self) -> bool:
        with self._lock:
            now = time.time()
            if self.state == CircuitState.OPEN:
                if now - self.last_state_change_time >= self.config.recovery_timeout_seconds:
                    self._transition_to_unlocked(CircuitState.HALF_OPEN)
                    return True
                self.total_short_circuits += 1
                return False
            return True

    def record_success(self):
        with self._lock:
            self.total_requests += 1
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.half_open_success_threshold:
                    self._transition_to_unlocked(CircuitState.CLOSED)
            elif self.state == CircuitState.CLOSED:
                self.failure_count = 0

    def record_failure(self, error: Exception):
        with self._lock:
            self.total_requests += 1
            self.total_failures += 1
            self.last_error = str(error)
            self.failure_count += 1

            if self.state == CircuitState.HALF_OPEN:
                self._transition_to_unlocked(CircuitState.OPEN)
            elif self.state == CircuitState.CLOSED:
                if self.failure_count >= self.config.failure_threshold:
                    self._transition_to_unlocked(CircuitState.OPEN)

    def _transition_to_unlocked(self, new_state: CircuitState):
        self.state = new_state
        self.last_state_change_time = time.time()
        if new_state == CircuitState.CLOSED:
            self.failure_count = 0
            self.success_count = 0
        elif new_state == CircuitState.HALF_OPEN:
            self.success_count = 0

    def get_metrics(self) -> CircuitBreakerMetrics:
        with self._lock:
            ts = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(self.last_state_change_time))
            return CircuitBreakerMetrics(
                provider_name=self.provider_name,
                state=self.state.value,
                failure_count=self.failure_count,
                success_count=self.success_count,
                total_requests=self.total_requests,
                total_failures=self.total_failures,
                total_short_circuits=self.total_short_circuits,
                last_error=self.last_error,
                last_state_change=ts,
                active_proxy_region=self.active_proxy_region
            )

class UpstreamResilienceManager:
    _instance: Optional['UpstreamResilienceManager'] = None
    _lock = threading.Lock()

    PROXY_REGIONS = [
        "US-East (IAD - Residential)",
        "US-West (PDX - Residential)",
        "EU-Central (FRA - Residential)",
        "AP-Southeast (SIN - Residential)",
        "Direct Egress (Cloud Gateway)"
    ]

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {
            "perplexity": CircuitBreaker("Perplexity Sonar-Pro"),
            "openai": CircuitBreaker("OpenAI ChatGPT Search"),
            "gemini": CircuitBreaker("Google AI Overviews"),
            "claude": CircuitBreaker("Anthropic Claude"),
            "glm": CircuitBreaker("Zhipu AI GLM-4"),
            "grok": CircuitBreaker("xAI Grok-3"),
            "deepseek": CircuitBreaker("DeepSeek R1"),
            "residential_proxy": CircuitBreaker("BrightData Proxy Pool")
        }
        self._current_proxy_idx = 0
        self._events: List[Dict[str, Any]] = []
        self._log_event("INITIALIZED", "Resilience manager started with 8 active circuit breakers.")

    @classmethod
    def get_instance(cls) -> 'UpstreamResilienceManager':
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def get_breaker(self, provider_key: str) -> CircuitBreaker:
        key = provider_key.lower()
        for k in self._breakers:
            if k in key:
                return self._breakers[k]
        if key not in self._breakers:
            self._breakers[key] = CircuitBreaker(provider_key)
        return self._breakers[key]

    def execute_with_resilience(
        self,
        provider_key: str,
        query_fn: Callable[[], Any],
        fallback_fn: Callable[[Optional[str]], Any]
    ) -> Any:
        breaker = self.get_breaker(provider_key)
        
        if not breaker.can_execute():
            self._log_event(
                "CIRCUIT_SHORT_CIRCUITED",
                f"Fast-failover to local cache/mock for {breaker.provider_name} (Circuit State: {breaker.state.value})."
            )
            return fallback_fn("CIRCUIT_BREAKER_OPEN_FAST_FAILOVER")

        # Retry loop with exponential backoff & proxy failover
        retries = breaker.config.max_retries
        for attempt in range(retries + 1):
            try:
                result = query_fn()
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure(e)
                if attempt < retries:
                    # Failover proxy region and retry
                    self.failover_proxy_region()
                    backoff = breaker.config.base_backoff_seconds * (2 ** attempt) + random.uniform(0, breaker.config.jitter_factor)
                    time.sleep(backoff)
                else:
                    self._log_event(
                        "UPSTREAM_ERROR_MAX_RETRIES",
                        f"Provider {breaker.provider_name} exhausted {retries} retries: {str(e)[:60]}"
                    )
                    return fallback_fn(str(e))

    def failover_proxy_region(self) -> str:
        with self._lock:
            self._current_proxy_idx = (self._current_proxy_idx + 1) % len(self.PROXY_REGIONS)
            new_region = self.PROXY_REGIONS[self._current_proxy_idx]
            for breaker in self._breakers.values():
                breaker.active_proxy_region = new_region
            self._log_event("PROXY_FAILOVER", f"Egress route shifted to {new_region}")
            return new_region

    def get_resilience_status(self) -> Dict[str, Any]:
        with self._lock:
            breakers_data = {k: b.get_metrics().model_dump() for k, b in self._breakers.items()}
            healthy_count = sum(1 for b in self._breakers.values() if b.state == CircuitState.CLOSED)
            open_count = sum(1 for b in self._breakers.values() if b.state == CircuitState.OPEN)
            half_open_count = sum(1 for b in self._breakers.values() if b.state == CircuitState.HALF_OPEN)
            return {
                "status": "HEALTHY" if open_count == 0 else ("DEGRADED" if healthy_count > 0 else "CRITICAL"),
                "total_circuit_breakers": len(self._breakers),
                "healthy_closed_count": healthy_count,
                "open_tripped_count": open_count,
                "half_open_probing_count": half_open_count,
                "active_egress_region": self.PROXY_REGIONS[self._current_proxy_idx],
                "available_egress_regions": self.PROXY_REGIONS,
                "circuit_breakers": breakers_data,
                "recent_resilience_events": self._events[:15]
            }

    def _log_event(self, event_type: str, message: str):
        event = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "type": event_type,
            "message": message
        }
        self._events.insert(0, event)
        if len(self._events) > 50:
            self._events = self._events[:50]
