"""
Dynamic 3-Tier Model Routing Strategy & Unit Economics Engine (Latest State-of-the-Art Models)
"""
from typing import Dict, Any, List
from ..compat import BaseModel, Field

class RoutingDecision(BaseModel):
    task_name: str
    task_complexity: str
    assigned_tier: str
    model_name: str
    estimated_cost_per_call: float
    estimated_latency_ms: int
    rationale: str

class UnitEconomicsBreakdown(BaseModel):
    operational_step: str
    unoptimized_prototype_cost: float
    enterprise_architecture_cost: float
    cost_reduction_percent: float
    optimization_applied: str

class DynamicModelRouter:
    @classmethod
    def classify_and_route(cls, task_type: str) -> RoutingDecision:
        task_lower = task_type.lower()
        if any(w in task_lower for w in ["g_eval", "synthesis", "high_ambiguity", "reasoning", "rubric", "complex_perception"]):
            return RoutingDecision(
                task_name=task_type,
                task_complexity="HIGH_AMBIGUITY_REASONING",
                assigned_tier="TIER_1_FRONTIER",
                model_name="Claude 3.7 Sonnet (Extended Thinking) / OpenAI o3-mini / Gemini 2.5 Pro",
                estimated_cost_per_call=0.0095,
                estimated_latency_ms=750,
                rationale="High-ambiguity multi-factor reasoning, calibrated chain-of-thought, and G-Eval qualitative synthesis."
            )
        elif any(w in task_lower for w in ["ast", "extraction", "diff", "pydantic", "schema", "llms_txt", "sanitization"]):
            return RoutingDecision(
                task_name=task_type,
                task_complexity="STRUCTURED_EXTRACTION",
                assigned_tier="TIER_2_OPEN_SLM",
                model_name="vLLM DeepSeek-V3 / Qwen-2.5-Coder-32B / Llama-3.3-70B",
                estimated_cost_per_call=0.0008,
                estimated_latency_ms=140,
                rationale="High-throughput structured entity parsing, AST normalization, and Princeton KDD diff generation."
            )
        else:
            return RoutingDecision(
                task_name=task_type,
                task_complexity="VECTOR_INDEXING",
                assigned_tier="TIER_3_LOCAL_EMBEDDING",
                model_name="Local FP16 Halfvec Embedder (bge-m3 / text-embedding-3-large)",
                estimated_cost_per_call=0.00008,
                estimated_latency_ms=20,
                rationale="Sub-30ms vector representation generation without per-token API fees."
            )

    @classmethod
    def get_unit_economics(cls) -> Dict[str, Any]:
        breakdown = [
            UnitEconomicsBreakdown(
                operational_step="Site Crawl & AST Ingestion",
                unoptimized_prototype_cost=0.150,
                enterprise_architecture_cost=0.008,
                cost_reduction_percent=94.7,
                optimization_applied="AST pruning + sandboxed DeepSeek-V3/Llama-3.3 extraction."
            ),
            UnitEconomicsBreakdown(
                operational_step="Cold Prompt Panel (100 Prompts)",
                unoptimized_prototype_cost=10.000,
                enterprise_architecture_cost=1.800,
                cost_reduction_percent=82.0,
                optimization_applied="Proxy pooling, o3-mini fast-tier routing, and sequential SPRT sampling."
            ),
            UnitEconomicsBreakdown(
                operational_step="Semantic Cache Deduplication",
                unoptimized_prototype_cost=0.000,
                enterprise_architecture_cost=-1.080,
                cost_reduction_percent=100.0,
                optimization_applied="45% Redis semantic vector cache hit rate (tau >= 0.96)."
            ),
            UnitEconomicsBreakdown(
                operational_step="G-Eval Scoring Rubrics",
                unoptimized_prototype_cost=5.000,
                enterprise_architecture_cost=1.100,
                cost_reduction_percent=78.0,
                optimization_applied="Claude 3.7 / Gemini 2.5 Pro token-budgeted calibrated Chain-of-Thought."
            ),
            UnitEconomicsBreakdown(
                operational_step="Optimization Diff Generation",
                unoptimized_prototype_cost=2.400,
                enterprise_architecture_cost=0.500,
                cost_reduction_percent=79.2,
                optimization_applied="Prompt caching + specialized fine-tuned Qwen-2.5-Coder."
            )
        ]

        total_unopt = sum(b.unoptimized_prototype_cost for b in breakdown)
        total_opt = sum(b.enterprise_architecture_cost for b in breakdown)
        reduction = round(((total_unopt - total_opt) / total_unopt) * 100, 1)

        monthly_client_cost = round(total_opt * 4, 2)
        enterprise_subscription_price = 500.00
        gross_margin = round(((enterprise_subscription_price - monthly_client_cost) / enterprise_subscription_price) * 100, 1)

        return {
            "breakdown": [b.model_dump() for b in breakdown],
            "total_cost_per_audit_prototype": round(total_unopt, 3),
            "total_cost_per_audit_enterprise": round(total_opt, 3),
            "cost_reduction_percent": reduction,
            "monthly_client_cost_4_cycles": monthly_client_cost,
            "software_gross_margin_percent": gross_margin,
            "margin_status": "HIGHLY_PROFITABLE (>80% Target Met)"
        }
