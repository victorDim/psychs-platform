"""
Unit tests for Automated Knowledge Graph & Wikidata Entity Sync Studio.
"""
from app.optimization.knowledge_graph_sync import KnowledgeGraphSyncEngine

def test_entity_knowledge_graph_resolution_psychs():
    engine = KnowledgeGraphSyncEngine.get_instance()
    report = engine.get_entity_knowledge_graph("Psychs")

    assert report.brand_name == "Psychs"
    assert report.wikidata_qid == "Q129849201"
    assert report.authority_score >= 95.0
    assert report.grade in ["A+", "A"]
    assert report.disambiguation_strength == "TIER_1_GLOBAL_AUTHORITY"
    assert report.triples_verified_count == 8
    assert report.discrepancies_count == 0
    assert len(report.claims) == 8

    p_ids = [c.property_id for c in report.claims]
    assert "P31" in p_ids
    assert "P452" in p_ids
    assert "P856" in p_ids
    assert "P159" in p_ids
    assert "P571" in p_ids
    assert "P1056" in p_ids

    assert "wikidata.org" in report.mappings.wikidata_qid or "Q129849201" in report.mappings.wikidata_qid
    assert "wikipedia.org" in report.mappings.wikipedia_url
    assert "crunchbase.com" in report.mappings.crunchbase_url
    assert len(report.audit_seal) == 64

def test_entity_knowledge_graph_multibrands():
    engine = KnowledgeGraphSyncEngine.get_instance()
    
    stripe_rep = engine.get_entity_knowledge_graph("Stripe")
    assert stripe_rep.wikidata_qid == "Q16839396"
    assert stripe_rep.authority_score >= 95.0

    snowflake_rep = engine.get_entity_knowledge_graph("Snowflake")
    assert snowflake_rep.wikidata_qid == "Q60747299"
    assert snowflake_rep.authority_score >= 90.0

    vercel_rep = engine.get_entity_knowledge_graph("Vercel")
    assert vercel_rep.wikidata_qid == "Q108749870"
    assert vercel_rep.authority_score >= 90.0

def test_sparql_query_execution():
    engine = KnowledgeGraphSyncEngine.get_instance()
    sparql = "SELECT ?p ?pLabel ?valLabel WHERE { wd:Q129849201 ?p ?val } LIMIT 10"
    res = engine.run_wikidata_sparql_query(sparql)

    assert res["status"] == "200_OK"
    assert len(res["results"]["bindings"]) >= 5
    assert res["query_execution_time_ms"] > 0
    assert "wikidata.org" in res["endpoint"]

def test_quickstatements_and_schema_sync():
    engine = KnowledgeGraphSyncEngine.get_instance()
    patch = engine.generate_quickstatements_patch("Psychs")

    assert patch.patch_id.startswith("QS-PATCH-PSYC-")
    assert patch.wikidata_qid == "Q129849201"
    assert "Q129849201\tP31\tQ1058914" in patch.quickstatements_v2_code
    assert "@prefix schema: <http://schema.org/>" in patch.turtle_rdf
    assert patch.updated_authority_score >= 96.0

    sync_res = engine.sync_claims_to_schema_org("Psychs")
    assert sync_res["status"] == "SYNCED_TO_SCHEMA_ORG_AND_LLMS_TXT"
    assert sync_res["same_as_links_injected"] >= 3
    assert "https://psychs.ai/llms.txt" in sync_res["canonical_endpoints"]
