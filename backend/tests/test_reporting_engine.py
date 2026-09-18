"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Executive Boardroom Reporting Test Suite
================================================================================
Verifies board report generation, multi-brand parameterization, printable HTML
rendering, and SHA-256 integrity seal verification.
================================================================================
"""

import hashlib
from app.reporting.board_report import BoardReportGenerator

def test_board_report_generation_and_seal():
    """Verify board report generation and cryptographic integrity seal."""
    brands = ["Psychs", "Stripe", "Snowflake", "Vercel"]

    for brand in brands:
        report = BoardReportGenerator.generate_report(
            brand_name=brand,
            report_type="QUARTERLY_BOARD_DECK",
            is_confidential=True,
            custom_notes="Q3 Enterprise AI Perception Audit for Board of Directors."
        )

        assert report.metadata.brand_name == brand
        assert report.metadata.report_type == "QUARTERLY_BOARD_DECK"
        assert report.metadata.is_confidential is True
        assert len(report.metadata.cryptographic_sha256_seal) == 64
        assert report.metadata.soc2_compliance_verified is False
        assert report.metadata.evidence_mode == "SYNTHETIC_DEMO"

        # Verify Executive Summary
        assert report.executive_summary.aggregate_score >= 80.0
        assert report.executive_summary.grade in ["A", "A+", "A-"]
        assert len(report.executive_summary.top_strategic_strengths) >= 1
        assert len(report.executive_summary.urgent_vulnerabilities) >= 1

        # Verify 7 Dimensions
        assert len(report.dimensions_breakdown) == 7
        total_weight = sum(d.weight for d in report.dimensions_breakdown)
        assert abs(total_weight - 1.0) < 0.001

        # Verify GSoV Leaderboard
        assert len(report.gsov_leaderboard) >= 2
        assert report.gsov_leaderboard[0]["brand_name"] == brand
        assert report.gsov_leaderboard[0]["is_client_brand"] is True

        # Verify Econometric ROI Forecast
        assert report.econometric_roi_forecast["incremental_annual_pipeline_usd"] > 0
        assert report.econometric_roi_forecast["net_roi_multiple"] >= 3.0

        # Verify Printable HTML
        assert report.printable_html is not None
        assert f"Boardroom Perception Report - {brand}" in report.printable_html
        assert report.metadata.cryptographic_sha256_seal in report.printable_html
        assert "CONFIDENTIAL" in report.printable_html
        assert "Executive Board Commentary" in report.printable_html

def test_historical_report_archive():
    """Verify report history querying and metadata."""
    history = BoardReportGenerator.get_report_history("Psychs")
    assert len(history) >= 2
    assert all("report_id" in h and "sha256_seal" in h for h in history)

def test_report_html_escapes_untrusted_content():
    report = BoardReportGenerator.generate_report(
        brand_name='<img src=x onerror=alert(1)>',
        custom_notes='<script>alert("xss")</script>'
    )
    assert '<script>alert("xss")</script>' not in report.printable_html
    assert '<img src=x onerror=alert(1)>' not in report.printable_html
    assert '&lt;script&gt;' in report.printable_html
