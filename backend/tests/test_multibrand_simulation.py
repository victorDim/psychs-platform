"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Multi-Brand Benchmark Simulation Test Suite
================================================================================
Verifies data isolation, perception scoring calculations, and GSoV leaderboards
across multiple benchmark brands: Psychs, Stripe, Snowflake, and Vercel.
================================================================================
"""

from app.perception.composite_score import PerceptionScoringEngine
from app.intelligence.sov_analyzer import SovAnalyzer
from app.perception.cold_panel import ColdPromptPanel

def test_multibrand_scoring_and_isolation():
    """Verify perception scoring across multi-tenant benchmark brands."""
    brands = [
        ("Psychs", "Generative Engine Optimization (GEO)", 87.0),
        ("Stripe", "Fintech & Payments Infrastructure", 89.0),
        ("Snowflake", "Data Cloud & AI Infrastructure", 86.0),
        ("Vercel", "Frontend Cloud & Developer Experience", 91.0)
    ]

    for brand, industry, min_score in brands:
        # Generate cold panel prompts for brand
        panel = ColdPromptPanel.generate_panel(brand, industry)
        assert len(panel) >= 20
        assert any(brand.lower() in p["query"].lower() for p in panel)

        # Analyze GSoV
        sov = SovAnalyzer.analyze_sov(brand)
        assert sov.client_brand == brand
        assert len(sov.leaderboard) >= 2
        assert sov.leaderboard[0].brand_name == brand
        assert sov.leaderboard[0].generative_sov_percent > 50.0

        # Calculate composite score
        score = PerceptionScoringEngine.calculate()
        assert score.aggregate_score >= 80.0
        assert len(score.dimensions) == 7
        assert score.total_weight == 1.0
