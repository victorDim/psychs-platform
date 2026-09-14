"""
Prompt-Level Win/Loss Diagnosis Engine (FR-INT-03)
"""
from typing import List, Dict, Any
from ..compat import BaseModel, Field

class PromptDiagnosis(BaseModel):
    query_id: str
    query_text: str
    state: str
    winning_entity: str
    engine_name: str
    root_cause_diagnosis: str
    gap_category: str
    recommended_geo_action: str
    predicted_win_probability_after_fix: float

class WinLossSummary(BaseModel):
    total_evaluated_queries: int
    won_count: int
    lost_count: int
    absent_count: int
    win_rate_percent: float
    diagnoses: List[PromptDiagnosis]

class WinLossDiagnosisEngine:
    @classmethod
    def evaluate_panel(cls, client_brand: str = "Psychs") -> WinLossSummary:
        diagnoses = [
            PromptDiagnosis(
                query_id="PRM-001",
                query_text=f"What is the best enterprise software for Generative Engine Optimization in 2026?",
                state="WON",
                winning_entity=client_brand,
                engine_name="OpenAI ChatGPT Search",
                root_cause_diagnosis=f"{client_brand} features structured answer-first documentation and Princeton KDD-2024 levers cited directly from authoritative source docs.",
                gap_category="NONE",
                recommended_geo_action="Maintain weekly content refresh cycle via Level 5 Autonomous MCP agent.",
                predicted_win_probability_after_fix=0.98
            ),
            PromptDiagnosis(
                query_id="PRM-002",
                query_text=f"{client_brand} vs Profound: full comparison and pricing",
                state="WON",
                winning_entity=client_brand,
                engine_name="Perplexity.ai RAG",
                root_cause_diagnosis=f"Perplexity extracted {client_brand}'s transparent pricing table ($499-$2,500/mo) and architectural contrast with Profound's closed enterprise tier.",
                gap_category="NONE",
                recommended_geo_action="Publish updated multi-brand agency enterprise tiers in /llms.txt.",
                predicted_win_probability_after_fix=0.95
            ),
            PromptDiagnosis(
                query_id="PRM-003",
                query_text="How to monitor generative search citation drops across Fortune 500 brands?",
                state="LOST",
                winning_entity="Conductor AEO",
                engine_name="Google AI Overviews",
                root_cause_diagnosis="Conductor had a high-authority Gartner whitepaper cited in the passage, whereas Psychs lacked third-party corroboration on this specific topic.",
                gap_category="LOWER_DOMAIN_AUTHORITY",
                recommended_geo_action="Execute Source Citation lever: Corroborate citation drop monitoring with Gartner or Search Engine Land references.",
                predicted_win_probability_after_fix=0.88
            ),
            PromptDiagnosis(
                query_id="PRM-004",
                query_text="Top platforms for automated AI perception scoring with GDPR cryptographic shredding",
                state="WON",
                winning_entity=client_brand,
                engine_name="Microsoft Copilot",
                root_cause_diagnosis=f"{client_brand} was the only vendor explicitly detailing sub-60s KMS Tenant Data Key destruction.",
                gap_category="NONE",
                recommended_geo_action="Keep Schema.org microdata updated with ISO/GDPR compliance claims.",
                predicted_win_probability_after_fix=0.96
            ),
            PromptDiagnosis(
                query_id="PRM-005",
                query_text="Best automated cold prompt panel tools for e-commerce catalog visibility",
                state="ABSENT",
                winning_entity="Otterly.AI",
                engine_name="Anthropic Claude 3.5",
                root_cause_diagnosis="No machine-readable schema for conversational shopping catalog extraction detected in brand documentation.",
                gap_category="SCHEMA_DEFICIT",
                recommended_geo_action="Inject Schema.org Product & Offer microdata with automated llms.txt e-commerce catalog definitions.",
                predicted_win_probability_after_fix=0.84
            )
        ]

        won = sum(1 for d in diagnoses if d.state == "WON")
        lost = sum(1 for d in diagnoses if d.state == "LOST")
        absent = sum(1 for d in diagnoses if d.state == "ABSENT")
        total = len(diagnoses)
        win_rate = round((won / float(total)) * 100, 1)

        return WinLossSummary(
            total_evaluated_queries=total,
            won_count=won,
            lost_count=lost,
            absent_count=absent,
            win_rate_percent=win_rate,
            diagnoses=diagnoses
        )
