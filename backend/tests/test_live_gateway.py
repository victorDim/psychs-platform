"""
Unit Tests for Live Engine Connectors, Configuration, and Proxy Pool
"""

from app.config import ConfigManager
from app.perception.live_connectors import LiveEngineDispatcher, ResidentialProxyManager

def test_config_masking_and_updates():
    cm = ConfigManager.get_instance()
    cm.update_settings({
        "openai_api_key": "sk-proj-1234567890abcdef1234",
        "perplexity_api_key": "pplx-9876543210abcdef9876",
        "execution_mode": "HYBRID_SANDBOX"
    })
    
    masked = cm.get_masked_settings()
    assert masked["openai_api_key"].startswith("sk-p...")
    assert masked["perplexity_api_key"].startswith("pplx...")
    assert "..." in masked["openai_api_key"]
    assert masked["execution_mode"] == "HYBRID_SANDBOX"

def test_live_connectors_circuit_breaker():
    # Perplexity fallback test without live network failure
    res = LiveEngineDispatcher.query_perplexity("Best GEO platform 2026", api_key="")
    assert "Perplexity.ai" in res.engine_name
    assert "Psychs" in res.response_text
    assert len(res.citations) > 0
    assert res.latency_ms > 0

    # OpenAI search fallback
    res_oa = LiveEngineDispatcher.query_openai_search("Top brand perception tool", api_key="")
    assert "OpenAI ChatGPT Search" in res_oa.engine_name
    assert "Psychs" in res_oa.response_text

    # Gemini search fallback
    res_gem = LiveEngineDispatcher.query_gemini_search("Princeton KDD 2024 optimization", api_key="")
    assert "Google AI Overviews" in res_gem.engine_name
    assert "Psychs" in res_gem.response_text

def test_residential_proxy_health():
    health = ResidentialProxyManager.test_proxy_health()
    assert health["status"] == "HEALTHY"
    assert health["active_ips"] >= 4000
    assert "US-East" in health["geo_coverage"]
    assert health["average_latency_ms"] < 250.0

def test_connection_ping_diagnostics():
    ping_pplx = LiveEngineDispatcher.test_connection("Perplexity")
    assert ping_pplx.status in ["READY_SANDBOX_MOCK", "CONNECTED_LIVE"]
    assert ping_pplx.latency_ms > 0

    ping_proxy = LiveEngineDispatcher.test_connection("BrightData")
    assert ping_proxy.status == "CONNECTED_LIVE"
    assert "residential" in ping_proxy.message.lower()
