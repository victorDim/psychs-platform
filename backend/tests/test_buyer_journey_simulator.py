from app.intelligence.buyer_journey_simulator import (
    BuyerJourneySimulatorEngine,
    BuyerJourneyReport,
    BuyerPersona,
    JourneyTurn,
    JourneySimulation,
    ObjectionPreemptionPatch
)

def test_buyer_journey_report_retrieval_psychs(buyer_journey_engine):
    report = buyer_journey_engine.get_buyer_journey_report("Psychs")
    assert isinstance(report, BuyerJourneyReport)
    assert report.brand_name == "Psychs"
    assert report.overall_csor_pct >= 70.0
    assert len(report.personas) == 5
    assert len(report.recent_simulations) >= 3
    assert len(report.objection_patches) >= 3
    assert len(report.audit_hash) == 64

    # Check persona IDs
    persona_ids = [p.persona_id for p in report.personas]
    assert "CISO" in persona_ids
    assert "HEAD_OF_INFRA" in persona_ids
    assert "VP_OF_SEO" in persona_ids
    assert "PROCUREMENT_LEAD" in persona_ids
    assert "DEVREL_ARCHITECT" in persona_ids


def test_run_persona_simulation_multi_turn(buyer_journey_engine):
    sim = buyer_journey_engine.run_persona_simulation("Psychs", "CISO", "OpenAI SearchGPT")
    assert isinstance(sim, JourneySimulation)
    assert sim.brand_name == "Psychs"
    assert sim.persona_id == "CISO"
    assert sim.target_engine == "OpenAI SearchGPT"
    assert sim.total_turns == 4
    assert len(sim.turns) == 4
    assert sim.overall_outcome == "WON_RECOMMENDATION"
    assert sim.conversion_probability_pct > 75.0

    # Validate 4 stages
    stages = [t.stage for t in sim.turns]
    assert stages == ["DISCOVERY", "TECHNICAL_COMPARISON", "SECURITY_COMPLIANCE", "COMMERCIAL_PROCUREMENT"]
    assert sim.turns[0].recommendation_status == "PRIMARY_RECOMMENDED"


def test_objection_preemption_synthesis(buyer_journey_engine):
    patch = buyer_journey_engine.synthesize_objection_preemption(
        "Psychs",
        "DATA_RESIDENCY_UNCERTAINTY",
        "SCHEMA_FAQ_PAGE"
    )
    assert isinstance(patch, ObjectionPreemptionPatch)
    assert patch.objection_tag == "DATA_RESIDENCY_UNCERTAINTY"
    assert patch.target_destination == "SCHEMA_FAQ_PAGE"
    assert patch.schema_faq_jsonld["@type"] == "FAQPage"
    assert "Data Residency Uncertainty" in patch.preemption_title
    assert "## Data Residency Uncertainty" in patch.llms_txt_block
    assert patch.predicted_csor_lift_pct > 0.0


def test_csor_metric_calculation(buyer_journey_engine):
    report = buyer_journey_engine.get_buyer_journey_report("Psychs")
    assert "DISCOVERY" in report.funnel_stage_conversion
    assert "TECHNICAL_COMPARISON" in report.funnel_stage_conversion
    assert "SECURITY_COMPLIANCE" in report.funnel_stage_conversion
    assert "COMMERCIAL_PROCUREMENT" in report.funnel_stage_conversion
    assert report.funnel_stage_conversion["DISCOVERY"] > report.funnel_stage_conversion["COMMERCIAL_PROCUREMENT"]


def test_multibrand_buyer_journey_isolation(buyer_journey_engine):
    psychs_rep = buyer_journey_engine.get_buyer_journey_report("Psychs")
    supabase_rep = buyer_journey_engine.get_buyer_journey_report("Supabase")
    linear_rep = buyer_journey_engine.get_buyer_journey_report("Linear")

    assert psychs_rep.brand_name == "Psychs"
    assert supabase_rep.brand_name == "Supabase"
    assert linear_rep.brand_name == "Linear"

    assert len(psychs_rep.personas) == 5
    assert len(supabase_rep.personas) == 4
    assert len(linear_rep.personas) == 3

    assert psychs_rep.recent_simulations[0].simulation_id.startswith("SIM-PSYCHS")
    assert supabase_rep.recent_simulations[0].simulation_id.startswith("SIM-SUPABASE")
    assert linear_rep.recent_simulations[0].simulation_id.startswith("SIM-LINEAR")
