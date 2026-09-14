"""
================================================================================
Psychs GEO Platform v2.0.0-PROD: Test Suite
Module: Frontier AI Algorithm Volatility & Search Engine IndexWatch (GEO IndexWatch)
================================================================================
Validates empirical V_algo calculations, multi-brand variance, 30-day seismograph
generation, core updates detection, and emergency hedge playbook execution.
================================================================================
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.intelligence.algorithm_volatility_radar import (
    AlgorithmVolatilityRadarEngine,
    EngineVolatilityMetric,
    DetectedAlgorithmUpdate,
    EmergencyHedgePlaybook,
    IndexWatchRadarReport
)


def test_radar_report_generation_psychs():
    """Validates full IndexWatch radar report computation for primary Psychs brand."""
    engine = AlgorithmVolatilityRadarEngine()
    report = engine.compute_radar_report(brand_name="Psychs", days_history=30)
    
    assert isinstance(report, IndexWatchRadarReport)
    assert report.brand_name == "Psychs"
    assert 10.0 <= report.composite_volatility_score <= 100.0
    assert report.system_status in ("CALM", "MODERATE", "HIGH", "STORM")
    assert len(report.engine_metrics) == 5
    
    # Verify engine metrics properties
    engine_ids = [m.engine_id for m in report.engine_metrics]
    assert "openai_searchgpt" in engine_ids
    assert "google_aio" in engine_ids
    assert "perplexity_pro" in engine_ids
    assert "claude_search" in engine_ids
    assert "grok_realtime" in engine_ids

    for metric in report.engine_metrics:
        assert 0.0 <= metric.volatility_score <= 100.0
        assert metric.status_level in ("CALM", "MODERATE", "HIGH", "STORM")
        assert 0.0 <= metric.citation_turnover_rate <= 100.0
        assert len(metric.historical_7d) == 7

    # Verify 30-day seismograph
    assert len(report.seismograph_30d) == 30
    assert report.seismograph_30d[-1].composite_volatility > 0.0
    assert len(report.audit_hash) == 64  # SHA-256


def test_multibrand_volatility_variance():
    """Validates multi-brand deterministic calculation and isolation."""
    engine = AlgorithmVolatilityRadarEngine()
    brands = ["Stripe", "Snowflake", "Vercel", "Databricks"]
    
    reports = {}
    for brand in brands:
        rep = engine.compute_radar_report(brand_name=brand, days_history=14)
        assert rep.brand_name == brand
        assert len(rep.seismograph_30d) == 14
        assert len(rep.engine_metrics) == 5
        reports[brand] = rep.composite_volatility_score

    # Verify scores are generated and bounded
    for brand, score in reports.items():
        assert 20.0 <= score <= 95.0


def test_core_updates_detection_and_filtering():
    """Validates detected core algorithm updates catalog and severity signals."""
    engine = AlgorithmVolatilityRadarEngine()
    updates = engine.get_detected_updates(limit=10)
    
    assert len(updates) >= 4
    update_ids = [u.update_id for u in updates]
    assert "ALGO-UPDT-2026.09-01" in update_ids
    assert "ALGO-UPDT-2026.09-02" in update_ids

    critical_updates = [u for u in updates if u.severity == "CRITICAL"]
    assert len(critical_updates) >= 1
    assert "Google AI Overviews" in critical_updates[0].affected_engine
    assert len(critical_updates[0].confirmed_markers) >= 2


def test_emergency_hedge_playbook_trigger():
    """Validates execution of an automated emergency hedge playbook."""
    engine = AlgorithmVolatilityRadarEngine()
    playbooks = engine.get_playbooks()
    
    assert len(playbooks) == 3
    playbook_ids = [p.playbook_id for p in playbooks]
    assert "HEDGE-GEO-01" in playbook_ids
    assert "HEDGE-GEO-02" in playbook_ids
    assert "HEDGE-GEO-03" in playbook_ids

    # Execute HEDGE-GEO-01
    result = engine.trigger_playbook("HEDGE-GEO-01", brand_name="Psychs")
    assert result["status"] == "DEPLOYED_SUCCESSFULLY"
    assert result["playbook_id"] == "HEDGE-GEO-01"
    assert len(result["actions_executed"]) >= 3
    assert "+" in result["simulated_gsov_recovery_lift"]
    assert len(result["hmac_signature"]) == 64

    # Verify radar report now reflects active defense hedge
    updated_report = engine.compute_radar_report(brand_name="Psychs")
    assert updated_report.active_defense_hedges >= 1


if __name__ == "__main__":
    print("Running Algorithm Volatility Radar tests...")
    test_radar_report_generation_psychs()
    print(" [PASS] test_radar_report_generation_psychs")
    test_multibrand_volatility_variance()
    print(" [PASS] test_multibrand_volatility_variance")
    test_core_updates_detection_and_filtering()
    print(" [PASS] test_core_updates_detection_and_filtering")
    test_emergency_hedge_playbook_trigger()
    print(" [PASS] test_emergency_hedge_playbook_trigger")
    print("All 4 Algorithm Volatility Radar tests PASSED!")
