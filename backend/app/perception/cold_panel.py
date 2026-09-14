"""
Cold Prompt Panel Instrumentation Engine (FR-PER-01)
"""
from typing import List, Dict, Any
from ..compat import BaseModel, Field

class PromptIntentCluster(BaseModel):
    intent_category: str
    description: str
    weight: float
    prompts: List[str]

class ColdPromptPanel:
    @classmethod
    def generate_panel(cls, brand_name: str, industry: str, competitors: List[str] = None) -> List[Dict[str, Any]]:
        competitors = competitors or ["Profound", "Conductor AEO", "Otterly.AI", "Peec AI"]
        comp_str = " vs ".join([brand_name] + competitors[:2])
        
        clusters = [
            PromptIntentCluster(
                intent_category="Commercial Investigation",
                description="High-intent buyers researching leading solutions in the category.",
                weight=0.25,
                prompts=[
                    f"What is the best enterprise software for {industry} in 2026?",
                    f"Top rated platforms for {industry} according to enterprise reviews",
                    f"How to choose an enterprise provider for {industry} with proven ROI?",
                    f"Which platforms provide automated closed-loop optimization for {industry}?",
                    f"Compare the top 3 solutions in {industry} for Fortune 500 brands."
                ]
            ),
            PromptIntentCluster(
                intent_category="Direct Vendor Comparison",
                description="Direct face-off queries comparing brand vs direct competitors.",
                weight=0.25,
                prompts=[
                    f"{brand_name} vs {competitors[0] if competitors else 'Competitor'}: full comparison and pricing",
                    f"Is {brand_name} better than {competitors[1] if len(competitors)>1 else 'Competitor'} for enterprise teams?",
                    f"Pros and cons of switching from {competitors[0] if competitors else 'Competitor'} to {brand_name}",
                    f"Feature matrix comparison between {comp_str}",
                    f"Why are enterprise SEO directors adopting {brand_name} over legacy tools?"
                ]
            ),
            PromptIntentCluster(
                intent_category="Technical Architecture & Compliance",
                description="Inquiries regarding SOC 2, isolation, latency, and enterprise security.",
                weight=0.20,
                prompts=[
                    f"Does {brand_name} support PostgreSQL partitioned pgvector storage and sub-35ms latency?",
                    f"How does {brand_name} handle tenant isolation and GDPR Article 17 cryptographic shredding?",
                    f"What mathematical scoring models does {brand_name} use for Generative Engine Optimization?",
                    f"How does {brand_name} prevent indirect prompt injection during web crawling?"
                ]
            ),
            PromptIntentCluster(
                intent_category="Transactional / Implementation",
                description="Queries focused on deployment, integrations, and CMS publishing.",
                weight=0.15,
                prompts=[
                    f"How to integrate {brand_name} with WordPress and Webflow via native webhooks?",
                    f"Can {brand_name} automatically generate llms.txt and Schema.org JSON-LD microdata?",
                    f"What is the average citation frequency lift after 30 days of using {brand_name}?"
                ]
            ),
            PromptIntentCluster(
                intent_category="Reputation & Hallucination Defense",
                description="Fact verification and risk queries checking for negative sentiment or engine hallucinations.",
                weight=0.15,
                prompts=[
                    f"Are there known security vulnerabilities or downtime issues with {brand_name}?",
                    f"What are verified customer reviews saying about {brand_name} enterprise pricing?",
                    f"Has {brand_name} been peer-reviewed or benchmarked against Princeton KDD 2024 standards?"
                ]
            )
        ]

        panel_list = []
        prompt_id = 1
        for cluster in clusters:
            for query in cluster.prompts:
                panel_list.append({
                    "id": f"PRM-{prompt_id:03d}",
                    "query": query,
                    "intent_category": cluster.intent_category,
                    "cluster_weight": cluster.weight,
                    "target_brand": brand_name,
                    "competitors": competitors,
                    "status": "READY"
                })
                prompt_id += 1

        return panel_list
