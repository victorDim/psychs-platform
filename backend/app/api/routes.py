"""
FastAPI Enterprise REST Routes for Psychs GEO Platform v2.0.0-PROD
"""
from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from ..ingestion.crawler import IngestionPipeline
from ..ingestion.sanitizer import ASTSanitizer
from ..perception.cold_panel import ColdPromptPanel
from ..perception.multi_engine import MultiEngineDispatcher
from ..perception.composite_score import PerceptionScoringEngine, CompositePerceptionResult
from ..perception.semantic_entropy import SemanticEntropyEngine, SemanticEntropyResult
from ..intelligence.sov_analyzer import SovAnalyzer, SovAnalysisResult
from ..intelligence.citation_gap import CitationGapAnalyzer, CitationGapAnalysisResult
from ..intelligence.win_loss import WinLossDiagnosisEngine, WinLossSummary
from ..optimization.kdd_optimizer import KddGeoOptimizer, OptimizationPlanResult
from ..optimization.entity_schema import EntitySchemaGenerator, EntitySchemaResult
from ..optimization.llms_txt_generator import LlmsTxtGenerator, LlmsTxtResult
from ..optimization.cms_webhooks import CmsWebhookManager, PublishDeploymentRequest, PublishDeploymentResponse, WebhookEndpoint
from ..optimization.remeasurement import RemeasurementEngine, RemeasurementCampaign
from ..routing_cache.router import DynamicModelRouter, RoutingDecision
from ..routing_cache.cache import TwoTierCacheManager, CacheLookupResult
from ..database.audit_vault import ImmutableAuditVault, AuditLogEntry
from ..database.crypto_shredding import CryptoShreddingService, TenantKeyStatus
from ..mcp_server.server import PsychsMCPServer, MCPToolExecutionRequest, MCPToolExecutionResponse, MCPToolDefinition
from .sse_stream import generate_audit_stream

router = APIRouter()

# ----------------- Ingestion -----------------
class IngestRequest(BaseModel):
    url_or_domain: str = "psychs.ai"
    raw_html: Optional[str] = None

@router.post("/ingest")
async def ingest_domain(req: IngestRequest):
    return await IngestionPipeline.crawl_and_extract(req.url_or_domain, req.raw_html)

# ----------------- Perception & Audits -----------------
class AuditRunRequest(BaseModel):
    brand_name: str = "Psychs"
    domain: str = "psychs.ai"
    industry: str = "Generative Engine Optimization (GEO)"
    competitors: List[str] = ["Profound", "Conductor AEO", "Otterly.AI", "Peec AI"]
    sample_count: int = 50

@router.post("/perception/audit")
async def run_perception_audit(req: AuditRunRequest):
    # Check cache first
    cache_res = TwoTierCacheManager.query(req.brand_name, f"audit_{req.sample_count}")
    if cache_res.is_hit and cache_res.cached_payload:
        return cache_res.cached_payload

    # Run Cold Panel & Calculations
    panel = ColdPromptPanel.generate_panel(req.brand_name, req.industry, req.competitors)
    score = PerceptionScoringEngine.calculate()
    entropy = SemanticEntropyEngine.evaluate_entropy(f"What is {req.brand_name}?")
    sov = SovAnalyzer.analyze_sov(req.brand_name, req.competitors, len(panel))
    
    res = {
        "brand_name": req.brand_name,
        "domain": req.domain,
        "total_panel_prompts": len(panel),
        "composite_score": score.model_dump(),
        "semantic_entropy": entropy.model_dump(),
        "sov": sov.model_dump(),
        "status": "SUCCESS"
    }
    TwoTierCacheManager.store(req.brand_name, f"audit_{req.sample_count}", res)
    return res

@router.get("/perception/score", response_model=CompositePerceptionResult)
async def get_perception_score(
    entity_raw: float = Query(88.0),
    sov_raw: float = Query(84.5),
    citation_raw: float = Query(79.0),
    category_raw: float = Query(91.0),
    fact_raw: float = Query(86.0),
    sentiment_raw: float = Query(92.0),
    trust_raw: float = Query(95.0)
):
    return PerceptionScoringEngine.calculate(
        entity_raw=entity_raw,
        sov_raw=sov_raw,
        citation_raw=citation_raw,
        category_raw=category_raw,
        fact_raw=fact_raw,
        sentiment_raw=sentiment_raw,
        trust_raw=trust_raw
    )

@router.get("/perception/stream")
async def stream_live_audit(domain: str = "psychs.ai", brand_name: str = "Psychs"):
    return EventSourceResponse(generate_audit_stream(domain, brand_name))

@router.get("/perception/panel")
async def get_cold_prompt_panel(brand_name: str = "Psychs", industry: str = "Generative Engine Optimization (GEO)"):
    return ColdPromptPanel.generate_panel(brand_name, industry)

# ----------------- Competitive Intelligence -----------------
@router.get("/intelligence/sov", response_model=SovAnalysisResult)
async def get_sov_analysis(brand_name: str = "Psychs"):
    return SovAnalyzer.analyze_sov(brand_name)

@router.get("/intelligence/citation-gaps", response_model=CitationGapAnalysisResult)
async def get_citation_gaps(brand_name: str = "Psychs"):
    return CitationGapAnalyzer.analyze_gaps(brand_name)

@router.get("/intelligence/win-loss", response_model=WinLossSummary)
async def get_win_loss_diagnosis(brand_name: str = "Psychs"):
    return WinLossDiagnosisEngine.evaluate_panel(brand_name)

# ----------------- GEO Optimization Engine -----------------
class KddDiffRequest(BaseModel):
    brand_name: str = "Psychs"
    apply_stats: bool = True
    apply_sources: bool = True
    apply_quotes: bool = True
    apply_answer_first: bool = True

@router.post("/optimization/kdd-diff", response_model=OptimizationPlanResult)
async def generate_kdd_diff(req: KddDiffRequest):
    return KddGeoOptimizer.generate_optimization(
        brand_name=req.brand_name,
        apply_stats=req.apply_stats,
        apply_sources=req.apply_sources,
        apply_quotes=req.apply_quotes,
        apply_answer_first=req.apply_answer_first
    )

@router.get("/optimization/entity-schemas", response_model=EntitySchemaResult)
async def get_entity_schemas(brand_name: str = "Psychs", domain: str = "psychs.ai"):
    return EntitySchemaGenerator.generate_schemas(brand_name, domain)

@router.get("/optimization/llms-txt", response_model=LlmsTxtResult)
async def get_llms_txt(brand_name: str = "Psychs", domain: str = "psychs.ai"):
    return LlmsTxtGenerator.generate(brand_name, domain)

@router.get("/optimization/webhooks", response_model=List[WebhookEndpoint])
async def get_cms_webhooks():
    return CmsWebhookManager.get_configured_webhooks()

@router.post("/optimization/publish", response_model=PublishDeploymentResponse)
async def publish_cms_diff(req: PublishDeploymentRequest):
    return CmsWebhookManager.publish_diff(req)

@router.get("/optimization/remeasurement", response_model=RemeasurementCampaign)
async def get_remeasurement_tracking():
    return RemeasurementEngine.get_campaign_status()

# ----------------- Routing, Cache & Economics -----------------
@router.get("/router/unit-economics")
async def get_unit_economics():
    return DynamicModelRouter.get_unit_economics()

@router.post("/router/classify", response_model=RoutingDecision)
async def classify_task(task_type: str = Query("G-Eval Perception Rubric Reasoning")):
    return DynamicModelRouter.classify_and_route(task_type)

class CacheQueryRequest(BaseModel):
    entity_name: str = "Psychs"
    query_text: str = "What is the best enterprise GEO platform?"

@router.post("/cache/lookup", response_model=CacheLookupResult)
async def test_cache_lookup(req: CacheQueryRequest):
    return TwoTierCacheManager.query(req.entity_name, req.query_text)

# ----------------- Evidence Vault & Security -----------------
@router.get("/audit/logs", response_model=List[AuditLogEntry])
async def get_audit_logs(tier_filter: Optional[str] = Query("ALL")):
    return ImmutableAuditVault.get_recent_logs(tier_filter=tier_filter)

@router.get("/security/kms-tdk", response_model=TenantKeyStatus)
async def get_kms_tdk_status(tenant_id: str = "ten_enterprise_prod_01"):
    return CryptoShreddingService.get_key_status(tenant_id)

@router.post("/security/crypto-shred")
async def execute_crypto_shred(tenant_id: str = "ten_enterprise_prod_01"):
    return CryptoShreddingService.execute_cryptographic_shred(tenant_id)

# ----------------- Model Context Protocol (MCP) -----------------
@router.get("/mcp/tools", response_model=List[MCPToolDefinition])
async def list_mcp_tools():
    return PsychsMCPServer.list_tools()

@router.post("/mcp/execute", response_model=MCPToolExecutionResponse)
async def execute_mcp_tool(req: MCPToolExecutionRequest):
    return await PsychsMCPServer.execute_tool(req)
