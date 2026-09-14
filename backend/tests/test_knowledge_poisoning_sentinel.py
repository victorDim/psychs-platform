from app.intelligence.knowledge_poisoning_sentinel import (
    KnowledgePoisoningSentinelEngine,
    KnowledgePoisoningReport,
    PoisoningAttackVector,
    AuthoritativeSparqlAssertion,
    DefensiveCounterPatch
)

def test_sentinel_report_retrieval_psychs(sentinel_engine):
    report = sentinel_engine.get_sentinel_report("Psychs")
    assert isinstance(report, KnowledgePoisoningReport)
    assert report.brand_name == "Psychs"
    assert report.total_threats_monitored >= 3
    assert report.graph_integrity_score_pct >= 80.0
    assert report.automated_neutralization_rate_pct > 0.0
    assert len(report.audit_hash) == 64

    # Validate first threat
    threat = report.threat_vectors[0]
    assert threat.threat_id == "THREAT-PSYCHS-001"
    assert threat.severity == "CRITICAL"
    assert "Delaware C-Corporation" in threat.authoritative_fact

    # Validate assertions
    assert len(report.authoritative_assertions) >= 4
    assert report.authoritative_assertions[0].subject_qid == "wd:Q129841249"

def test_poisoning_scan_and_threat_detection(sentinel_engine):
    scan_res = sentinel_engine.scan_third_party_graphs("Psychs")
    assert scan_res["brand_name"] == "Psychs"
    assert len(scan_res["sources_probed"]) >= 5
    assert scan_res["total_threats_found"] >= 3
    assert scan_res["scan_status"] == "SCAN_COMPLETE_NO_NEW_ANOMALIES"

def test_counter_patch_synthesis_and_sparql(sentinel_engine):
    patch = sentinel_engine.synthesize_counter_patch("Psychs", "THREAT-PSYCHS-002")
    assert isinstance(patch, DefensiveCounterPatch)
    assert patch.threat_id == "THREAT-PSYCHS-002"
    assert "QuickStatements" in patch.quickstatements_v2_code
    assert patch.schema_claim_review_jsonld["@type"] == "ClaimReview"
    assert len(patch.cryptographic_hmac_seal) == 64

    # Verify report reflects patch synthesis
    report = sentinel_engine.get_sentinel_report("Psychs")
    threat2 = next(t for t in report.threat_vectors if t.threat_id == "THREAT-PSYCHS-002")
    assert threat2.neutralization_status == "COUNTER_PATCH_SYNTHESIZED"

def test_neutralization_dispatch_and_hmac(sentinel_engine):
    # Synthesize patch first
    patch = sentinel_engine.synthesize_counter_patch("Psychs", "THREAT-PSYCHS-001")
    dispatch_res = sentinel_engine.dispatch_counter_neutralization("Psychs", patch.patch_id)
    assert dispatch_res["status"] == "DISPATCHED_NEUTRALIZED"
    assert len(dispatch_res["channels_notified"]) >= 5
    assert len(dispatch_res["cryptographic_delivery_seal"]) == 64

    # Verify threat status updated to NEUTRALIZED
    report = sentinel_engine.get_sentinel_report("Psychs")
    threat1 = next(t for t in report.threat_vectors if t.threat_id == "THREAT-PSYCHS-001")
    assert threat1.neutralization_status == "NEUTRALIZED"

def test_multibrand_poisoning_sentinel_isolation(sentinel_engine):
    psychs_rep = sentinel_engine.get_sentinel_report("Psychs")
    supabase_rep = sentinel_engine.get_sentinel_report("Supabase")
    linear_rep = sentinel_engine.get_sentinel_report("Linear")

    assert psychs_rep.brand_name == "Psychs"
    assert supabase_rep.brand_name == "Supabase"
    assert linear_rep.brand_name == "Linear"

    assert psychs_rep.threat_vectors[0].threat_id.startswith("THREAT-PSYCHS")
    assert supabase_rep.threat_vectors[0].threat_id.startswith("THREAT-SUPABASE")
    assert linear_rep.threat_vectors[0].threat_id.startswith("THREAT-LINEAR")
