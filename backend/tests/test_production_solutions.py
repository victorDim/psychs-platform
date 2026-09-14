"""
Unit Tests for Production-Grade Solutions & Hardening Engines
"""
from app.perception.canaries import CanaryDriftEngine
from app.routing_cache.adaptive_sampler import AdaptiveSamplingEngine
from app.optimization.gitops_cms import GitOpsCmsEngine
from app.intelligence.causal_attribution import EconometricAttributionEngine

def test_canary_drift_engine_divergence():
    p = [0.4, 0.3, 0.2, 0.1]
    q = [0.4, 0.3, 0.2, 0.1]
    # Identical distributions should have zero divergence
    assert CanaryDriftEngine.calculate_js_divergence(p, q) == 0.0

    # Divergent distributions
    q_div = [0.1, 0.2, 0.3, 0.4]
    div = CanaryDriftEngine.calculate_js_divergence(p, q_div)
    assert div > 0.10

    report = CanaryDriftEngine.evaluate_canaries()
    assert report.total_canary_probes == 500
    assert len(report.engines) == 5
    assert report.system_health_status == "AUTOTUNED_RESILIENT"

def test_adaptive_sprt_sampler_early_exit():
    # Stage 1 Early Exit for high similarity
    decision_exit = AdaptiveSamplingEngine.sample_adaptive("What is Psychs?", force_escalate=False)
    assert decision_exit.early_exit_triggered is True
    assert decision_exit.stage_executed == 1
    assert decision_exit.samples_drawn == 2
    assert decision_exit.cost_reduction_percent == 60.0

    # Stage 2 Escalation
    decision_escalate = AdaptiveSamplingEngine.sample_adaptive("Ambiguous query", force_escalate=True)
    assert decision_escalate.early_exit_triggered is False
    assert decision_escalate.stage_executed == 2
    assert decision_escalate.samples_drawn == 5

    metrics = AdaptiveSamplingEngine.get_aggregate_metrics()
    assert metrics.early_exit_rate_percent >= 50.0

def test_gitops_pr_automation_and_multisig():
    pr = GitOpsCmsEngine.create_gitops_pr(diff_id="DIFF-KDD-01")
    assert pr.pr_number > 0
    assert "feat(geo)" in pr.pr_title
    assert "PASSED" in pr.ci_checks_status

    multisig = GitOpsCmsEngine.get_multisig_workflow()
    assert len(multisig) == 3
    assert multisig[0].is_approved is True

    connectors = GitOpsCmsEngine.get_headless_connectors()
    assert len(connectors) >= 4

def test_econometric_causal_attribution():
    report = EconometricAttributionEngine.get_attribution_report("Psychs")
    assert len(report.time_series) > 0
    assert report.branded_search_lift_percent > 20.0
    assert report.statistical_significance_p_value < 0.05
    assert len(report.recent_ai_crawler_logs) >= 4
