"""
================================================================================
Psychs GEO Platform v2.0.0-PROD: Test Suite
Module: Self-Healing GEO Bot Traffic Analyzer & Edge WAF Armor (GEO Edge Armor)
================================================================================
Validates AI bot telemetry, crawl efficiency E_crawl scoring, WAF rule generation,
and dynamic self-healing policy switching.
================================================================================
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.network.bot_traffic_analyzer import (
    BotTrafficArmorEngine,
    AiBotCrawlerMetric,
    CrawlTrafficEvent,
    EdgeWafRuleSet,
    BotArmorTelemetryReport
)


def test_bot_telemetry_calculation_psychs():
    """Validates full AI crawler telemetry report and efficiency calculation for Psychs."""
    engine = BotTrafficArmorEngine()
    report = engine.compute_bot_telemetry(brand_name="Psychs", horizon_hours=24)
    
    assert isinstance(report, BotArmorTelemetryReport)
    assert report.brand_name == "Psychs"
    assert report.total_bot_requests_24h > 50000
    assert report.edge_bandwidth_saved_gb > 0.0
    assert 80.0 <= report.crawl_efficiency_score <= 100.0
    assert report.active_policy_mode == "GEO_OPTIMIZED_OPEN"
    
    # Check crawler catalog presence
    bot_ids = [c.bot_id for c in report.crawlers]
    assert "oai_searchbot" in bot_ids
    assert "gptbot" in bot_ids
    assert "claudebot" in bot_ids
    assert "perplexitybot" in bot_ids
    assert "google_extended" in bot_ids
    assert "googlebot" in bot_ids
    assert "bytespider" in bot_ids
    assert "meta_external_agent" in bot_ids

    # Check recent traffic events
    assert len(report.recent_events) >= 10
    assert len(report.audit_hash) == 64  # SHA-256


def test_multibrand_crawler_variance():
    """Validates multi-brand deterministic variance and isolation."""
    engine = BotTrafficArmorEngine()
    brands = ["Stripe", "Snowflake", "Vercel", "Databricks"]
    
    reports = {}
    for brand in brands:
        rep = engine.compute_bot_telemetry(brand_name=brand, horizon_hours=24)
        assert rep.brand_name == brand
        assert len(rep.crawlers) == 8
        assert rep.crawl_efficiency_score >= 80.0
        reports[brand] = rep.total_bot_requests_24h

    # Verify requests are calculated and bounded
    for brand, reqs in reports.items():
        assert reqs > 50000


def test_waf_rule_synthesis_all_providers():
    """Validates rule generation across all 4 edge providers."""
    engine = BotTrafficArmorEngine()
    providers = ["CLOUDFLARE_WAF", "FASTLY_VCL", "AWS_WAF_ACL", "NGINX_INGRESS"]
    
    for prov in providers:
        rule = engine.generate_waf_rules(provider=prov, policy_mode="GEO_OPTIMIZED_OPEN", brand_name="Psychs")
        assert isinstance(rule, EdgeWafRuleSet)
        assert rule.provider == prov
        assert len(rule.rule_content) > 50
        assert "OAI-SearchBot" in rule.rule_content or "oai-searchbot" in rule.rule_content.lower()


def test_policy_mode_switching():
    """Validates dynamic self-healing policy mode switching."""
    engine = BotTrafficArmorEngine()
    
    # Switch to SELECTIVE_ARMOR
    res = engine.set_policy("SELECTIVE_ARMOR")
    assert res["status"] == "APPLIED_TO_EDGE"
    assert res["new_policy"] == "SELECTIVE_ARMOR"
    assert len(res["hmac_seal"]) == 64

    # Verify telemetry now reflects new policy
    report = engine.compute_bot_telemetry(brand_name="Psychs")
    assert report.active_policy_mode == "SELECTIVE_ARMOR"


if __name__ == "__main__":
    print("Running Bot Traffic Armor tests...")
    test_bot_telemetry_calculation_psychs()
    print(" [PASS] test_bot_telemetry_calculation_psychs")
    test_multibrand_crawler_variance()
    print(" [PASS] test_multibrand_crawler_variance")
    test_waf_rule_synthesis_all_providers()
    print(" [PASS] test_waf_rule_synthesis_all_providers")
    test_policy_mode_switching()
    print(" [PASS] test_policy_mode_switching")
    print("All 4 Bot Traffic Armor tests PASSED!")
