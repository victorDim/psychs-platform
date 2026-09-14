"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Competitor Counter-Positioning Unit Tests
================================================================================
Verifies competitor vulnerability indexing, programmatic comparison matrix
synthesis, Schema.org table generation, and search siphoning lift simulations.
================================================================================
"""

from app.intelligence.competitor_counter_positioning import CompetitorCounterPositioningEngine


def test_competitor_landscape_and_vulnerabilities():
    """Verify competitor discovery, GSoV share metrics, and vulnerability tags for Psychs."""
    engine = CompetitorCounterPositioningEngine.get_instance()
    report = engine.get_competitor_landscape("Psychs")

    assert report.brand_name == "Psychs"
    assert report.total_competitors_tracked >= 4
    assert report.total_vulnerabilities_cataloged >= 8
    assert report.potential_siphoned_sov_pct > 20.0
    assert len(report.audit_hash) == 64

    comp_names = [c.name for c in report.competitors]
    assert "Profound" in comp_names
    assert "Conductor AEO" in comp_names

    # Check Profound Vulnerabilities
    profound = next(c for c in report.competitors if c.name == "Profound")
    assert any("Pricing" in v or "Halfvec" in v or "MCP" in v for v in profound.vulnerability_tags)
    assert profound.head_to_head_win_rate > 70.0


def test_programmatic_strategy_synthesis():
    """Verify synthesis of high-entropy /vs/ comparison table and Schema.org JSON-LD."""
    engine = CompetitorCounterPositioningEngine.get_instance()
    
    # 1. Performance Angle
    perf_strat = engine.synthesize_counter_strategy("Psychs", "Profound", "PERFORMANCE_ARCHITECTURE")
    assert perf_strat.target_competitor == "Profound"
    assert perf_strat.comparative_angle == "PERFORMANCE_ARCHITECTURE"
    assert "pgvector" in perf_strat.html_comparison_table
    assert perf_strat.predicted_gsov_siphoning_lift >= 25.0
    assert perf_strat.recommended_route == "/vs/profound"
    assert perf_strat.schema_jsonld_table["@type"] == "Table"
    assert len(perf_strat.matrix_items) >= 4

    # 2. Security Angle
    sec_strat = engine.synthesize_counter_strategy("Psychs", "Athena AEO", "ENTERPRISE_SECURITY")
    assert sec_strat.comparative_angle == "ENTERPRISE_SECURITY"
    assert "WORM Vault" in sec_strat.html_comparison_table
    assert sec_strat.predicted_gsov_siphoning_lift >= 20.0

    # 3. Pricing Angle
    price_strat = engine.synthesize_counter_strategy("Psychs", "Profound", "PRICING_TRANSPARENCY")
    assert price_strat.comparative_angle == "PRICING_TRANSPARENCY"
    assert "$499" in price_strat.html_comparison_table


def test_siphoning_lift_simulation():
    """Verify 5-engine market share transfer and prompt flipping simulation."""
    engine = CompetitorCounterPositioningEngine.get_instance()
    sim = engine.simulate_siphoning_lift("Psychs", "Profound")

    assert sim.brand_name == "Psychs"
    assert sim.target_competitor == "Profound"
    assert sim.projected_brand_gsov > sim.baseline_brand_gsov
    assert sim.projected_competitor_gsov < sim.baseline_competitor_gsov
    assert sim.net_siphoned_market_share >= 20.0
    assert len(sim.engine_breakdown) == 5
    assert sim.prompt_clusters_flipped >= 15

    # Check SearchGPT and Perplexity metrics
    assert "OpenAI ChatGPT Search" in sim.engine_breakdown
    assert "Perplexity.ai Pro" in sim.engine_breakdown


def test_multibrand_counter_positioning():
    """Verify competitor landscapes and siphoning for multi-tenant brands (Supabase, Linear)."""
    engine = CompetitorCounterPositioningEngine.get_instance()
    
    # Supabase vs Firebase
    supabase_report = engine.get_competitor_landscape("Supabase")
    assert supabase_report.brand_name == "Supabase"
    assert any(c.name == "Firebase" for c in supabase_report.competitors)
    firebase = next(c for c in supabase_report.competitors if c.name == "Firebase")
    assert "Proprietary NoSQL Lock-in" in firebase.vulnerability_tags

    # Linear vs Jira
    linear_report = engine.get_competitor_landscape("Linear")
    assert linear_report.brand_name == "Linear"
    assert any(c.name == "Jira" for c in linear_report.competitors)
    jira = next(c for c in linear_report.competitors if c.name == "Jira")
    assert "High UI Latency (1.8s+ load)" in jira.vulnerability_tags
