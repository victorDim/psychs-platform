from app.ingestion.headless_crawler import (
    HeadlessCrawlerEngine,
    AutonomousIngestionReport,
    CrawlPageNode,
    SitemapRoute,
    ContextWindowMetrics
)

def test_headless_crawler_report_retrieval_psychs(headless_crawler_engine):
    report = headless_crawler_engine.get_headless_crawl_report("Psychs")
    assert isinstance(report, AutonomousIngestionReport)
    assert report.brand_name == "Psychs"
    assert report.root_domain == "psychs.ai"
    assert len(report.sitemap_routes) >= 5
    assert len(report.crawled_pages) >= 5
    assert len(report.sha256_ingest_seal) == 64
    assert report.aggregate_security_clearance == "PASSED_ZERO_TRUST"

    # Validate sitemap routes
    routes = [r.route_path for r in report.sitemap_routes]
    assert "/" in routes
    assert "/pricing" in routes
    assert "/security/soc2-vault-kms" in routes


def test_recursive_crawl_execution(headless_crawler_engine):
    new_report = headless_crawler_engine.run_headless_crawl(
        url_or_domain="https://stripe.com",
        crawl_depth="DEEP_5_PAGE",
        strip_injections=True
    )
    assert isinstance(new_report, AutonomousIngestionReport)
    assert new_report.brand_name == "Stripe"
    assert new_report.root_domain == "stripe.com"
    assert len(new_report.crawled_pages) == 5
    assert new_report.crawl_depth_executed == "DEEP_5_PAGE"


def test_ast_sanitization_multi_page(headless_crawler_engine):
    report = headless_crawler_engine.get_headless_crawl_report("Psychs")
    for page in report.crawled_pages:
        assert isinstance(page, CrawlPageNode)
        assert page.http_status == 200
        assert page.byte_size > 0
        assert page.security_clearance == "PASSED_ZERO_TRUST"
        assert len(page.extracted_claims) > 0
        assert len(page.kdd_recommended_levers) > 0


def test_llms_full_txt_synthesis(headless_crawler_engine):
    report = headless_crawler_engine.get_headless_crawl_report("Psychs")
    assert "# Psychs" in report.unified_llms_full_txt
    assert "Context Window" in report.unified_llms_full_txt or "llms-full.txt" in report.unified_llms_full_txt
    assert report.context_window_metrics.total_tokens > 1000
    assert report.context_window_metrics.gpt6_astra_utilization_pct < 10.0
    assert report.context_window_metrics.claude_fable_utilization_pct < 10.0
    assert report.context_window_metrics.gemini_37_flash_utilization_pct < 10.0
    assert report.context_window_metrics.estimated_context_fit_grade == "OPTIMAL_FIT"


def test_multibrand_headless_crawler_isolation(headless_crawler_engine):
    psychs_rep = headless_crawler_engine.get_headless_crawl_report("Psychs")
    supabase_rep = headless_crawler_engine.get_headless_crawl_report("Supabase")
    linear_rep = headless_crawler_engine.get_headless_crawl_report("Linear")

    assert psychs_rep.brand_name == "Psychs"
    assert supabase_rep.brand_name == "Supabase"
    assert linear_rep.brand_name == "Linear"

    assert psychs_rep.root_domain == "psychs.ai"
    assert supabase_rep.root_domain == "supabase.com"
    assert linear_rep.root_domain == "linear.app"

    assert psychs_rep.crawled_pages[0].page_id.startswith("PAGE-PSYCHS")
    assert supabase_rep.crawled_pages[0].page_id.startswith("PAGE-SUPABASE")
    assert linear_rep.crawled_pages[0].page_id.startswith("PAGE-LINEAR")
