from app.intelligence.geo_variant_autopilot import (
    GeoVariantAutopilotEngine,
    AutopilotReport,
    GeoExperiment,
    ContentVariant,
    BayesianMetrics,
    EdgeRoutingConfig
)

def test_autopilot_report_retrieval_psychs(autopilot_engine):
    report = autopilot_engine.get_autopilot_report("Psychs")
    assert isinstance(report, AutopilotReport)
    assert report.brand_name == "Psychs"
    assert report.active_experiments_count >= 2
    assert report.statistical_convergence_rate_pct >= 50.0
    assert report.average_citation_lift_pct > 0.0
    assert len(report.audit_hash) == 64

    # Validate first experiment
    exp = report.experiments[0]
    assert exp.experiment_id == "EXP-PSYCHS-001"
    assert exp.control_variant.extractability_score < exp.challenger_variant.extractability_score
    assert exp.bayesian_metrics.prob_variant_superior > 0.90
    assert exp.edge_routing.edge_provider == "CLOUDFLARE_WORKERS"
    assert "Cloudflare-Workers" in exp.edge_routing.generated_worker_script

def test_bayesian_posterior_and_significance_calculation(autopilot_engine):
    metrics = autopilot_engine._calculate_bayesian_metrics(
        control_wins=20,
        control_misses=80,
        challenger_wins=85,
        challenger_misses=15
    )
    assert isinstance(metrics, BayesianMetrics)
    assert metrics.expected_win_rate > 70.0
    assert metrics.prob_variant_superior >= 0.95
    assert metrics.bayes_factor > 5.0
    assert metrics.credible_interval_low < metrics.expected_win_rate < metrics.credible_interval_high
    assert metrics.sample_size == 200

def test_synthetic_evaluation_simulation(autopilot_engine):
    # Initial state
    report = autopilot_engine.get_autopilot_report("Psychs")
    exp = report.experiments[1]  # EXP-PSYCHS-002 is ACTIVE_RUNNING
    initial_probes = exp.total_synthetic_probes

    # Run simulation
    updated_exp = autopilot_engine.simulate_evaluation("Psychs", exp.experiment_id, probe_count=30)
    assert updated_exp.total_synthetic_probes == initial_probes + 60
    assert updated_exp.bayesian_metrics.prob_variant_superior > 0.90

def test_experiment_creation_and_edge_routing(autopilot_engine):
    new_exp = autopilot_engine.create_experiment(
        brand_name="Psychs",
        target_route="/pricing/enterprise",
        page_title="Transparent Enterprise GEO Pricing",
        challenger_label="Variant B (Calculated ROI Levers)",
        kdd_levers=["Statistics Addition", "Quotation Corroboration"],
        content_snippet="Psychs delivers 97% gross margin efficiency with transparent metered API billing at $0.002 per cold probe.",
        edge_provider="CLOUDFLARE_WORKERS",
        split_ratio="80/20",
        bot_routing_mode="SPLIT_ALL"
    )
    assert new_exp.target_route == "/pricing/enterprise"
    assert new_exp.experiment_status == "ACTIVE_RUNNING"
    assert "80/20" in new_exp.edge_routing.traffic_split_ratio
    assert "/pricing/enterprise" in new_exp.edge_routing.generated_worker_script

    # Verify present in report
    report = autopilot_engine.get_autopilot_report("Psychs")
    assert any(e.experiment_id == new_exp.experiment_id for e in report.experiments)

def test_promote_winner_and_gitops_payload(autopilot_engine):
    pr_payload = autopilot_engine.promote_winner("Psychs", "EXP-PSYCHS-001", "GITOPS_PR")
    assert pr_payload["status"] == "MERGED_AUTOMATICALLY"
    assert "pr_number" in pr_payload
    assert "geo-autopilot/promote-exp-psychs-001" in pr_payload["branch_name"]
    assert pr_payload["predicted_citation_lift"] > 0

    # Verify experiment status updated to PROMOTED_TO_PROD
    report = autopilot_engine.get_autopilot_report("Psychs")
    exp1 = next(e for e in report.experiments if e.experiment_id == "EXP-PSYCHS-001")
    assert exp1.experiment_status == "PROMOTED_TO_PROD"

def test_multibrand_autopilot_isolation(autopilot_engine):
    psychs_rep = autopilot_engine.get_autopilot_report("Psychs")
    supabase_rep = autopilot_engine.get_autopilot_report("Supabase")
    linear_rep = autopilot_engine.get_autopilot_report("Linear")

    assert psychs_rep.brand_name == "Psychs"
    assert supabase_rep.brand_name == "Supabase"
    assert linear_rep.brand_name == "Linear"

    assert psychs_rep.experiments[0].brand_name == "Psychs"
    assert supabase_rep.experiments[0].brand_name == "Supabase"
    assert linear_rep.experiments[0].brand_name == "Linear"
