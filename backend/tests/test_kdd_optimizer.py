"""
Unit Tests for Princeton KDD-2024 Optimizer & Caching / Economics Engine
"""
from app.optimization.kdd_optimizer import KddGeoOptimizer
from app.routing_cache.router import DynamicModelRouter
from app.routing_cache.cache import TwoTierCacheManager
from app.mcp_server.server import PsychsMCPServer, MCPToolExecutionRequest

def test_kdd_optimizer_levers_and_lift():
    res = KddGeoOptimizer.generate_optimization(
        brand_name="Psychs",
        apply_stats=True,
        apply_sources=True,
        apply_quotes=True,
        apply_answer_first=True
    )
    assert len(res.active_levers) == 4
    assert len(res.diffs) >= 4
    assert res.aggregate_predicted_lift >= 20.0
    assert res.schema_compliance_score > 90.0

def test_dynamic_router_classification():
    decision_reasoning = DynamicModelRouter.classify_and_route("G-Eval Perception Rubric Reasoning")
    assert decision_reasoning.assigned_tier == "TIER_1_FRONTIER"
    assert "Claude" in decision_reasoning.model_name or "GPT" in decision_reasoning.model_name

    decision_extraction = DynamicModelRouter.classify_and_route("AST HTML Extraction and Pydantic Normalization")
    assert decision_extraction.assigned_tier == "TIER_2_OPEN_SLM"

    decision_vector = DynamicModelRouter.classify_and_route("Batch Embeddings Generation")
    assert decision_vector.assigned_tier == "TIER_3_LOCAL_EMBEDDING"

def test_unit_economics_gross_margin():
    economics = DynamicModelRouter.get_unit_economics()
    assert economics["cost_reduction_percent"] >= 80.0
    assert economics["software_gross_margin_percent"] >= 80.0

def test_two_tier_cache_hit():
    TwoTierCacheManager.store("Psychs", "What is the best GEO platform in 2026?", {"score": 92.5})
    
    # Exact lookup
    hit = TwoTierCacheManager.query("Psychs", "What is the best GEO platform in 2026?")
    assert hit.is_hit is True
    assert hit.cache_tier == "EXACT_SHA256"
    assert hit.retrieval_latency_ms < 15.0

async def test_mcp_permission_enforcement():
    # Level 1 agent trying to execute Level 4 tool (Publishing)
    denied_req = MCPToolExecutionRequest(
        tool_name="publish_cms_webhook",
        arguments={"diff_id": "D-1", "platform": "WordPress"},
        current_agent_level=1
    )
    res = await PsychsMCPServer.execute_tool(denied_req)
    assert res.status == "PERMISSION_DENIED"

    # Level 4 agent trying to publish without cryptographic human signature
    approval_req = MCPToolExecutionRequest(
        tool_name="publish_cms_webhook",
        arguments={"diff_id": "D-1", "platform": "WordPress"},
        current_agent_level=4,
        human_approval_signature=None
    )
    res_app = await PsychsMCPServer.execute_tool(approval_req)
    assert res_app.status == "APPROVAL_REQUIRED"
