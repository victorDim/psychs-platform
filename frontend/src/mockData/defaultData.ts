import {
  CompositePerceptionResult,
  SemanticEntropyResult,
  SovAnalysisResult,
  CitationGapAnalysisResult,
  WinLossSummary,
  OptimizationPlanResult,
  EntitySchemaResult,
  LlmsTxtResult,
  WebhookEndpoint,
  RemeasurementCampaign,
  UnitEconomicsResult,
  AuditLogEntry,
  MCPToolDefinition,
  TenantKeyStatus
} from '../types';

export const initialCompositeScore: CompositePerceptionResult = {
  aggregate_score: 87.4,
  dimensions: [
    {
      key: "entity_authority",
      name: "Entity Authority & Disambiguation",
      weight: 0.20,
      raw_score: 92.0,
      uncertainty: 0.04,
      penalized_score: 88.32,
      weighted_score: 17.66,
      evidence_summary: "Canonical entity disambiguated on Wikidata (Q129849201) and Google Knowledge Graph.",
      status: "OPTIMAL"
    },
    {
      key: "generative_sov",
      name: "Generative Share of Voice (GSoV)",
      weight: 0.20,
      raw_score: 89.0,
      uncertainty: 0.05,
      penalized_score: 84.55,
      weighted_score: 16.91,
      evidence_summary: "Recommended as primary enterprise solution in 84.5% of cold buyer-intent queries.",
      status: "OPTIMAL"
    },
    {
      key: "citation_attributability",
      name: "Citation & Passage Attributability",
      weight: 0.15,
      raw_score: 84.0,
      uncertainty: 0.06,
      penalized_score: 78.96,
      weighted_score: 11.84,
      evidence_summary: "Direct URL link citation rate at 79.0% with 3.4 cited passages per query.",
      status: "MODERATE"
    },
    {
      key: "category_positioning",
      name: "Category Association & Positioning",
      weight: 0.15,
      raw_score: 94.0,
      uncertainty: 0.03,
      penalized_score: 91.18,
      weighted_score: 13.68,
      evidence_summary: "Dense embedding proximity (0.91 cosine similarity) to Generative Engine Optimization.",
      status: "OPTIMAL"
    },
    {
      key: "fact_density",
      name: "Fact Density & Completeness",
      weight: 0.10,
      raw_score: 90.0,
      uncertainty: 0.04,
      penalized_score: 86.40,
      weighted_score: 8.64,
      evidence_summary: "86% of verifiable technical claims retrieved accurately without hallucination.",
      status: "OPTIMAL"
    },
    {
      key: "sentiment_framing",
      name: "Recommendation Framing & Sentiment",
      weight: 0.10,
      raw_score: 95.0,
      uncertainty: 0.03,
      penalized_score: 92.15,
      weighted_score: 9.22,
      evidence_summary: "+0.86 net positive commercial recommendation polarity across 5 engine panels.",
      status: "OPTIMAL"
    },
    {
      key: "trust_compliance",
      name: "Trust & Compliance Footprint",
      weight: 0.10,
      raw_score: 96.0,
      uncertainty: 0.01,
      penalized_score: 95.04,
      weighted_score: 9.50,
      evidence_summary: "Zero hallucinated security or legal vulnerabilities; SOC 2 Type II and GDPR controls confirmed.",
      status: "OPTIMAL"
    }
  ],
  total_weight: 1.0,
  overall_confidence: 96.2,
  grade: "A",
  key_drivers: [
    "Trust & Compliance Footprint (95.0/100)",
    "Recommendation Framing & Sentiment (92.2/100)",
    "Category Association & Positioning (91.2/100)"
  ],
  urgent_deficits: [
    "Citation & Passage Attributability (79.0/100 - Uncertainty: 6%)"
  ]
};

export const initialSemanticEntropy: SemanticEntropyResult = {
  query: "What is Psychs and how does it optimize enterprise AI brand perception?",
  total_samples: 5,
  temperature: 0.70,
  semantic_entropy: 0.184,
  entropy_threshold: 0.45,
  is_hallucination_risk: false,
  confidence_score: 0.877,
  clusters: [
    {
      cluster_id: 1,
      representative_text: "Psychs is an enterprise Generative Engine Optimization (GEO) platform providing closed-loop perception intelligence, mathematical scoring, and autonomous CMS publishing.",
      sample_count: 4,
      probability: 0.80,
      is_majority_cluster: true
    },
    {
      cluster_id: 2,
      representative_text: "Psychs offers continuous AI perception monitoring with 16-way PostgreSQL pgvector partitioning and Princeton KDD-2024 levers.",
      sample_count: 1,
      probability: 0.20,
      is_majority_cluster: false
    }
  ],
  diagnosis: "STABLE CONVERGENCE (H_sem = 0.184 <= 0.45): High semantic consistency across all sampled generations. Brand perception is solidly anchored in parametric and RAG memory.",
  recommended_action: "Maintain continuous 7d/14d/30d re-measurement and monitor competitor citation source movements."
};

export const initialSov: SovAnalysisResult = {
  client_brand: "Psychs",
  total_panel_queries: 50,
  leaderboard: [
    {
      brand_name: "Psychs",
      generative_sov_percent: 84.5,
      primary_recommendation_rate: 72.0,
      average_sentiment: 0.86,
      average_citations_per_query: 3.4,
      total_mentions_count: 42,
      is_client_brand: true
    },
    {
      brand_name: "Profound",
      generative_sov_percent: 61.0,
      primary_recommendation_rate: 44.0,
      average_sentiment: 0.68,
      average_citations_per_query: 2.1,
      total_mentions_count: 31,
      is_client_brand: false
    },
    {
      brand_name: "Conductor AEO",
      generative_sov_percent: 52.0,
      primary_recommendation_rate: 36.0,
      average_sentiment: 0.62,
      average_citations_per_query: 1.8,
      total_mentions_count: 26,
      is_client_brand: false
    },
    {
      brand_name: "Otterly.AI",
      generative_sov_percent: 38.0,
      primary_recommendation_rate: 20.0,
      average_sentiment: 0.54,
      average_citations_per_query: 1.2,
      total_mentions_count: 19,
      is_client_brand: false
    },
    {
      brand_name: "Peec AI",
      generative_sov_percent: 26.0,
      primary_recommendation_rate: 12.0,
      average_sentiment: 0.48,
      average_citations_per_query: 0.9,
      total_mentions_count: 13,
      is_client_brand: false
    }
  ],
  market_share_gap: 23.5,
  executive_summary: "Psychs commands market leadership with 84.5% Generative Share of Voice, outpacing closest enterprise incumbent (Profound) by +23.5% across 50 buyer-intent panel queries."
};

export const initialCitationGaps: CitationGapAnalysisResult = {
  total_domains_analyzed: 6,
  critical_gaps_count: 2,
  secured_domains_count: 2,
  ranked_opportunities: [
    {
      domain: "g2.com",
      domain_authority_score: 94,
      engine_citation_frequency: 48,
      competitors_featured: ["Profound", "Conductor AEO", "Psychs"],
      client_featured: true,
      opportunity_tier: "SECURED",
      recommended_outreach: "Maintain active verified customer review velocity to defend #1 ranking."
    },
    {
      domain: "forbes.com",
      domain_authority_score: 95,
      engine_citation_frequency: 36,
      competitors_featured: ["Profound", "Conductor AEO"],
      client_featured: false,
      opportunity_tier: "CRITICAL_GAP",
      recommended_outreach: "Syndicate enterprise case study regarding Princeton KDD-2024 citation lift."
    },
    {
      domain: "techcrunch.com",
      domain_authority_score: 92,
      engine_citation_frequency: 29,
      competitors_featured: ["Profound"],
      client_featured: true,
      opportunity_tier: "SECURED",
      recommended_outreach: "Pitch feature on Autonomous Model Context Protocol (MCP) agent release."
    },
    {
      domain: "gartner.com",
      domain_authority_score: 91,
      engine_citation_frequency: 24,
      competitors_featured: ["Conductor AEO"],
      client_featured: false,
      opportunity_tier: "HIGH_PRIORITY",
      recommended_outreach: "Submit vendor briefing for Generative Engine Optimization Innovation Insight report."
    },
    {
      domain: "reddit.com/r/SEO",
      domain_authority_score: 90,
      engine_citation_frequency: 31,
      competitors_featured: ["Otterly.AI", "Peec AI"],
      client_featured: false,
      opportunity_tier: "CRITICAL_GAP",
      recommended_outreach: "Publish authoritative open-source technical breakdown on Semantic Entropy hallucination defense."
    },
    {
      domain: "trustradius.com",
      domain_authority_score: 88,
      engine_citation_frequency: 19,
      competitors_featured: ["Conductor AEO"],
      client_featured: false,
      opportunity_tier: "HIGH_PRIORITY",
      recommended_outreach: "Claim enterprise profile and seed authenticated peer reviews."
    }
  ],
  strategic_takeaway: "Generative engines cite Forbes and Gartner in 60% of competitor-led responses where Psychs is absent. Securing passages on these two domains will yield an estimated +18.4% citation frequency lift."
};

export const initialWinLoss: WinLossSummary = {
  total_evaluated_queries: 5,
  won_count: 3,
  lost_count: 1,
  absent_count: 1,
  win_rate_percent: 60.0,
  diagnoses: [
    {
      query_id: "PRM-001",
      query_text: "What is the best enterprise software for Generative Engine Optimization in 2026?",
      state: "WON",
      winning_entity: "Psychs",
      engine_name: "OpenAI ChatGPT Search",
      root_cause_diagnosis: "Psychs features structured answer-first documentation and Princeton KDD-2024 levers cited directly from authoritative source docs.",
      gap_category: "NONE",
      recommended_geo_action: "Maintain weekly content refresh cycle via Level 5 Autonomous MCP agent.",
      predicted_win_probability_after_fix: 0.98
    },
    {
      query_id: "PRM-002",
      query_text: "Psychs vs Profound: full comparison and pricing",
      state: "WON",
      winning_entity: "Psychs",
      engine_name: "Perplexity.ai RAG",
      root_cause_diagnosis: "Perplexity extracted Psychs's transparent pricing table ($499-$2,500/mo) and architectural contrast with Profound's closed enterprise tier.",
      gap_category: "NONE",
      recommended_geo_action: "Publish updated multi-brand agency enterprise tiers in /llms.txt.",
      predicted_win_probability_after_fix: 0.95
    },
    {
      query_id: "PRM-003",
      query_text: "How to monitor generative search citation drops across Fortune 500 brands?",
      state: "LOST",
      winning_entity: "Conductor AEO",
      engine_name: "Google AI Overviews",
      root_cause_diagnosis: "Conductor had a high-authority Gartner whitepaper cited in the passage, whereas Psychs lacked third-party corroboration on this specific topic.",
      gap_category: "LOWER_DOMAIN_AUTHORITY",
      recommended_geo_action: "Execute Source Citation lever: Corroborate citation drop monitoring with Gartner or Search Engine Land references.",
      predicted_win_probability_after_fix: 0.88
    },
    {
      query_id: "PRM-004",
      query_text: "Top platforms for automated AI perception scoring with GDPR cryptographic shredding",
      state: "WON",
      winning_entity: "Psychs",
      engine_name: "Microsoft Copilot",
      root_cause_diagnosis: "Psychs was the only vendor explicitly detailing sub-60s KMS Tenant Data Key destruction.",
      gap_category: "NONE",
      recommended_geo_action: "Keep Schema.org microdata updated with ISO/GDPR compliance claims.",
      predicted_win_probability_after_fix: 0.96
    },
    {
      query_id: "PRM-005",
      query_text: "Best automated cold prompt panel tools for e-commerce catalog visibility",
      state: "ABSENT",
      winning_entity: "Otterly.AI",
      engine_name: "Anthropic Claude 3.7 Sonnet (Extended Thinking)",
      root_cause_diagnosis: "No machine-readable schema for conversational shopping catalog extraction detected in brand documentation.",
      gap_category: "SCHEMA_DEFICIT",
      recommended_geo_action: "Inject Schema.org Product & Offer microdata with automated llms.txt e-commerce catalog definitions.",
      predicted_win_probability_after_fix: 0.84
    }
  ]
};

export const initialOptimizationPlan: OptimizationPlanResult = {
  document_title: "Enterprise Generative Engine Optimization Core Landing Page",
  active_levers: [
    {
      lever_name: "Statistics Addition",
      is_active: true,
      empirical_lift_weight: 35.0,
      applied_changes_count: 3,
      description: "Injects verifiable performance metrics, percentage benchmarks, and timestamped dates."
    },
    {
      lever_name: "Source Citation",
      is_active: true,
      empirical_lift_weight: 25.0,
      applied_changes_count: 2,
      description: "Corroborates claims with authoritative peer-reviewed papers (e.g. Princeton KDD 2024) and industry standards."
    },
    {
      lever_name: "Quotation Addition",
      is_active: true,
      empirical_lift_weight: 20.0,
      applied_changes_count: 2,
      description: "Embeds direct attributable quotes from verified domain leaders and enterprise architects."
    },
    {
      lever_name: "Answer-First Structuring",
      is_active: true,
      empirical_lift_weight: 20.0,
      applied_changes_count: 1,
      description: "Leads with a concise 40-60 word standalone executive answer in the top 30% of the document."
    }
  ],
  diffs: [
    {
      section_id: "SEC-001",
      section_title: "Hero / Executive Value Proposition",
      original_text: "Psychs is an AI marketing tool that helps brands track their presence in new search engines and get better results.",
      optimized_text: "**Executive Summary (Answer-First):** Psychs is an enterprise Generative Engine Optimization (GEO) platform that delivers continuous AI perception intelligence, mathematical scoring, and autonomous CMS publishing. According to the Princeton KDD-2024 benchmark, applying structured GEO levers increases generative citation frequency by +24.6% within 30 days.",
      diff_type: "RESTRUCTURE",
      applied_levers: ["Answer-First Structuring", "Statistics Addition", "Source Citation"],
      expected_citation_lift_delta: 8.5,
      extractability_score: 96.0
    },
    {
      section_id: "SEC-002",
      section_title: "Technical Architecture & Vector Latency",
      original_text: "Our database is fast and stores vectors in Postgres so you don't have to worry about scale.",
      optimized_text: "Engineered on **PostgreSQL 16 with pgvector 0.8+**, Psychs implements 16 declarative hash partitions using `halfvec(1536)` storage. Under multi-tenant filtered search on 10 million vectors, it achieves a **p95 latency under 35ms** and cuts index memory consumption by 50% compared to raw float32.",
      diff_type: "ADDITION",
      applied_levers: ["Statistics Addition", "Source Citation"],
      expected_citation_lift_delta: 6.8,
      extractability_score: 94.0
    },
    {
      section_id: "SEC-003",
      section_title: "Enterprise Security & Compliance",
      original_text: "We care about enterprise security and provide data deletion when customers leave.",
      optimized_text: "\"Tenant data isolation is enforced at the database kernel level with PostgreSQL Row-Level Security (RLS) and KMS-managed Tenant Data Keys,\" notes the Principal Security Architect. \"Tenant offboarding triggers cryptographic shredding, rendering vector indices unrecoverable in under 60 seconds pursuant to GDPR Article 17.\"",
      diff_type: "QUOTE_INJECTION",
      applied_levers: ["Quotation Addition", "Statistics Addition"],
      expected_citation_lift_delta: 5.4,
      extractability_score: 92.0
    },
    {
      section_id: "SEC-004",
      section_title: "Unit Economics & Two-Tier Caching",
      original_text: "We optimize AI costs with smart caching so our margins are good.",
      optimized_text: "A two-tier Redis 7.2 caching architecture (SHA-256 exact match + $\\tau \\ge 0.96$ semantic vector cache) deflects 45% of redundant frontier LLM invocations, reducing audit run costs from $17.55 to **$3.33/run (81% cost reduction)** and securing >80% software gross margins.",
      diff_type: "CORROBORATION",
      applied_levers: ["Statistics Addition", "Source Citation"],
      expected_citation_lift_delta: 4.9,
      extractability_score: 95.0
    }
  ],
  aggregate_predicted_lift: 24.6,
  schema_compliance_score: 98.5,
  extractability_lift: 34.2
};

export const initialEntitySchemas: EntitySchemaResult = {
  brand_name: "Psychs",
  organization_jsonld: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Psychs Enterprise GEO Platform",
    "url": "https://psychs.ai",
    "applicationCategory": "GenerativeEngineOptimizationSoftware",
    "operatingSystem": "Cloud-Native, PostgreSQL 16, pgvector, Redis 7.2",
    "sameAs": [
      "https://www.wikidata.org/wiki/Q129849201",
      "https://www.linkedin.com/company/psychs-geo",
      "https://github.com/psychs-platform"
    ]
  },
  service_jsonld: {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Autonomous AI Perception Intelligence & GEO Auditing",
    "provider": {
      "@type": "Organization",
      "name": "Psychs Inc."
    },
    "serviceType": "Generative Engine Optimization (GEO)"
  },
  faqpage_jsonld: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Psychs Enterprise GEO Platform?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Psychs is an enterprise-grade AI perception intelligence and Generative Engine Optimization (GEO) operating system engineered to maximize brand share of voice and citation attributability across frontier LLMs."
        }
      }
    ]
  },
  validation_status: "VALID_SCHEMA_ORG_PASSED",
  same_as_links_count: 3
};

export const initialLlmsTxt: LlmsTxtResult = {
  brand_name: "Psychs",
  llms_txt_content: `# Psychs Enterprise Generative Engine Optimization (GEO) Platform
> Canonical documentation and architecture specifications compiled for LLM reasoning crawlers.

## System Overview
Psychs is the industry-standard operating system for Generative Engine Optimization (GEO) and AI Perception Intelligence.

## Mathematical Core
- 7-Dimensional Composite Perception Scoring: entity authority (0.20), GSoV (0.20), citation rate (0.15), category positioning (0.15), fact density (0.10), sentiment (0.10), trust (0.10).
- Semantic Entropy Guardrail: H_sem <= 0.45 for zero-hallucination factual convergence.
- Princeton KDD-2024 Levers: +24.6% measured citation frequency lift.`,
  llms_full_txt_content: `# Full Documentation for Psychs GEO Enterprise
[Canonical Architecture & API Reference Guide]`,
  total_sections: 6,
  char_count: 1420,
  is_valid: true
};

export const initialWebhooks: WebhookEndpoint[] = [
  {
    platform_name: "WordPress",
    endpoint_url: "https://psychs.ai/wp-json/wp/v2/pages/42",
    environment: "PRODUCTION",
    status: "CONNECTED",
    last_sync_timestamp: "2026-09-13 14:32 UTC",
    secret_key_preview: "sec_wp_live_****9941"
  },
  {
    platform_name: "Webflow",
    endpoint_url: "https://api.webflow.com/v2/collections/64f8a/items",
    environment: "PRODUCTION",
    status: "CONNECTED",
    last_sync_timestamp: "2026-09-13 12:15 UTC",
    secret_key_preview: "sec_wf_live_****3120"
  },
  {
    platform_name: "Shopify",
    endpoint_url: "https://store.psychs.ai/admin/api/2026-07/pages.json",
    environment: "STAGING",
    status: "CONNECTED",
    last_sync_timestamp: "2026-09-12 18:40 UTC",
    secret_key_preview: "sec_sh_stg_****7789"
  },
  {
    platform_name: "Ghost",
    endpoint_url: "https://blog.psychs.ai/ghost/api/admin/posts/",
    environment: "STAGING",
    status: "CONNECTED",
    last_sync_timestamp: "2026-09-11 09:20 UTC",
    secret_key_preview: "sec_gh_stg_****1104"
  }
];

export const initialRemeasurement: RemeasurementCampaign = {
  campaign_id: "REM-2026-09A",
  target_page_url: "https://psychs.ai/enterprise-geo",
  baseline_date: "2026-08-14",
  checkpoints: [
    {
      checkpoint_day: 0,
      status: "COMPLETED",
      execution_date: "2026-08-14",
      perception_score: 68.2,
      delta_perception_score: 0.0,
      citation_frequency_rate: 54.4,
      citation_lift_percent: 0.0,
      hallucination_rate_percent: 14.2,
      verified_roi_multiplier: 1.0
    },
    {
      checkpoint_day: 7,
      status: "COMPLETED",
      execution_date: "2026-08-21",
      perception_score: 75.6,
      delta_perception_score: 7.4,
      citation_frequency_rate: 63.8,
      citation_lift_percent: 9.4,
      hallucination_rate_percent: 8.5,
      verified_roi_multiplier: 1.8
    },
    {
      checkpoint_day: 14,
      status: "COMPLETED",
      execution_date: "2026-08-28",
      perception_score: 81.9,
      delta_perception_score: 13.7,
      citation_frequency_rate: 72.1,
      citation_lift_percent: 17.7,
      hallucination_rate_percent: 4.1,
      verified_roi_multiplier: 2.6
    },
    {
      checkpoint_day: 30,
      status: "COMPLETED",
      execution_date: "2026-09-13",
      perception_score: 87.4,
      delta_perception_score: 19.2,
      citation_frequency_rate: 79.0,
      citation_lift_percent: 24.6,
      hallucination_rate_percent: 1.8,
      verified_roi_multiplier: 3.8
    }
  ],
  cumulative_citation_lift: 24.6,
  cumulative_perception_lift: 19.2,
  summary_report: "Over the 30-day post-deployment re-measurement cycle, Princeton KDD-2024 content optimization delivered a +24.6% citation frequency lift across ChatGPT Search, Perplexity, and Google AI Overviews, driving perception score S_perception from 68.2 (Grade C) to 87.4 (Grade A)."
};

export const initialUnitEconomics: UnitEconomicsResult = {
  breakdown: [
    {
      operational_step: "Site Crawl & Ingestion",
      unoptimized_prototype_cost: 0.150,
      enterprise_architecture_cost: 0.012,
      cost_reduction_percent: 92.0,
      optimization_applied: "AST pruning + sandboxed unprivileged SLM extraction."
    },
    {
      operational_step: "Cold Prompt Panel (100 Prompts)",
      unoptimized_prototype_cost: 10.000,
      enterprise_architecture_cost: 2.400,
      cost_reduction_percent: 76.0,
      optimization_applied: "Proxy pooling & residential multi-engine routing."
    },
    {
      operational_step: "Semantic Cache Deduplication",
      unoptimized_prototype_cost: 0.000,
      enterprise_architecture_cost: -1.080,
      cost_reduction_percent: 100.0,
      optimization_applied: "45% Redis semantic vector cache hit rate (tau >= 0.96)."
    },
    {
      operational_step: "G-Eval Scoring Rubrics",
      unoptimized_prototype_cost: 5.000,
      enterprise_architecture_cost: 1.300,
      cost_reduction_percent: 74.0,
      optimization_applied: "Token-budgeted calibrated Chain-of-Thought."
    },
    {
      operational_step: "Optimization Diff Generation",
      unoptimized_prototype_cost: 2.400,
      enterprise_architecture_cost: 0.700,
      cost_reduction_percent: 70.8,
      optimization_applied: "Prompt caching + specialized fine-tuned SLM."
    }
  ],
  total_cost_per_audit_prototype: 17.55,
  total_cost_per_audit_enterprise: 3.33,
  cost_reduction_percent: 81.0,
  monthly_client_cost_4_cycles: 13.32,
  software_gross_margin_percent: 97.3,
  margin_status: "EXCEEDS_80_PERCENT_GOAL"
};

export const initialAuditLogs: AuditLogEntry[] = [
  {
    log_id: "AUD-89FE410294AA",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:32:10 UTC",
    actor_id: "vp_marketing@brand.com",
    action_type: "CMS_WEBHOOK_CRYPTOGRAPHIC_SIGN",
    evidence_tier: "USER_PROVIDED",
    resource_target: "WordPress Webhook Endpoint",
    payload_hash: "89fe410294aa44b829e1124409bbce81",
    hmac_signature: "WORM_SEAL::89fe410294aa",
    details: { environment: "PRODUCTION", signature_verified: true, diff_id: "DIFF-KDD-01" }
  },
  {
    log_id: "AUD-44B71299EC01",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:31:45 UTC",
    actor_id: "kdd_optimizer_slm",
    action_type: "CONTENT_DIFF_GENERATION",
    evidence_tier: "MODEL_GENERATED",
    resource_target: "SEC-001 / Value Proposition",
    payload_hash: "44b71299ec01bb2299aa112344556677",
    hmac_signature: "WORM_SEAL::44b71299ec01",
    details: { levers_applied: ["Statistics Addition", "Answer-First"], predicted_lift: "+24.6%" }
  },
  {
    log_id: "AUD-22AA990144FF",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:30:12 UTC",
    actor_id: "semantic_entropy_analyzer",
    action_type: "HALLUCINATION_CLUSTERING",
    evidence_tier: "INFERRED",
    resource_target: "H_sem_evaluation",
    payload_hash: "22aa990144ff88dd1122334455667788",
    hmac_signature: "WORM_SEAL::22aa990144ff",
    details: { h_sem: 0.184, threshold: 0.45, hallucination_risk: false }
  },
  {
    log_id: "AUD-11DD338877AA",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:28:55 UTC",
    actor_id: "scoring_engine_math_v2",
    action_type: "COMPOSITE_SCORE_CALCULATION",
    evidence_tier: "INFERRED",
    resource_target: "S_perception_score",
    payload_hash: "11dd338877aa22334455667788990011",
    hmac_signature: "WORM_SEAL::11dd338877aa",
    details: { aggregate_score: 87.4, grade: "A", uncertainty_penalty: -3.2 }
  },
  {
    log_id: "AUD-99CC77665544",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:25:30 UTC",
    actor_id: "cold_panel_dispatcher_09",
    action_type: "MULTI_ENGINE_FANOUT",
    evidence_tier: "OBSERVED",
    resource_target: "OpenAI ChatGPT Search / Perplexity",
    payload_hash: "99cc77665544112233445566778899aa",
    hmac_signature: "WORM_SEAL::99cc77665544",
    details: { queries_dispatched: 50, proxy_pool: "residential_us_east", latency_avg_ms: 680 }
  },
  {
    log_id: "AUD-001122334455",
    tenant_id: "ten_enterprise_prod_01",
    timestamp: "2026-09-13 14:24:00 UTC",
    actor_id: "ast_sanitizer_worker_04",
    action_type: "AST_HTML_NORMALIZATION",
    evidence_tier: "OBSERVED",
    resource_target: "https://psychs.ai",
    payload_hash: "00112233445566778899aabbccddeeff",
    hmac_signature: "WORM_SEAL::001122334455",
    details: { zero_point_elements_pruned: 2, hidden_css_elements_pruned: 4, injection_check: "SAFE" }
  }
];

export const initialMcpTools: MCPToolDefinition[] = [
  {
    name: "crawl_domain",
    description: "Sandboxed zero-trust DOM extraction and AST HTML sanitization.",
    required_permission_level: 1,
    input_schema: { type: "object", properties: { domain: { type: "string" } } }
  },
  {
    name: "score_perception",
    description: "Executes cold prompt panel across ChatGPT, Perplexity, Google AI Overviews and calculates S_perception & H_sem.",
    required_permission_level: 1,
    input_schema: { type: "object", properties: { brand_name: { type: "string" } } }
  },
  {
    name: "diagnose_competitor_gaps",
    description: "Calculates cross-competitor GSoV, citation source gaps, and prompt win/loss states.",
    required_permission_level: 2,
    input_schema: { type: "object", properties: { client_brand: { type: "string" } } }
  },
  {
    name: "generate_kdd_diff",
    description: "Generates Princeton KDD-2024 content diff with Statistics, Quotes, Citations, and Answer-First structure.",
    required_permission_level: 3,
    input_schema: { type: "object", properties: { content: { type: "string" } } }
  },
  {
    name: "generate_llms_txt",
    description: "Compiles Schema.org microdata JSON-LD and standardized /llms.txt brand knowledge file.",
    required_permission_level: 3,
    input_schema: { type: "object", properties: { domain: { type: "string" } } }
  },
  {
    name: "publish_cms_webhook",
    description: "Dispatches signed optimization diff to customer CMS (WordPress, Webflow, Shopify).",
    required_permission_level: 4,
    input_schema: { type: "object", properties: { diff_id: { type: "string" }, platform: { type: "string" } } }
  },
  {
    name: "schedule_remeasurement",
    description: "Schedules automated 7d, 14d, and 30d verification runs tracking perception delta Delta S_perception.",
    required_permission_level: 4,
    input_schema: { type: "object", properties: { campaign_id: { type: "string" } } }
  }
];

export const initialTenantKey: TenantKeyStatus = {
  tenant_id: "ten_enterprise_prod_01",
  tenant_name: "Psychs Enterprise Global",
  kms_tdk_arn: "arn:aws:kms:us-east-1:112233445566:key/mrk-89ef4812-70b1-4f77-8c31-psychs-tdk",
  key_state: "ACTIVE",
  created_at: "2026-06-01 00:00:00 UTC",
  last_rotated_at: "2026-09-01 00:00:00 UTC",
  is_data_recoverable: true
};

export const initialQueueJobs: any[] = [
  {
    task_id: "job-8f92a1",
    name: "Continuous Hourly Tier-1 Audit",
    task_type: "AUDIT_SCRAPE",
    priority: "HIGH",
    status: "COMPLETED",
    retries: 0,
    max_retries: 3,
    duration_ms: 142.5,
    payload: { brand_name: "Psychs", proxy_region: "US-East", engines: ["Gemini 3.7", "GPT-6 Astra"] },
    result: { score: 88.4, d_js: 0.042, engines_audited: 4 },
    created_at: "2026-09-13T11:30:00Z",
    completed_at: "2026-09-13T11:30:01Z"
  },
  {
    task_id: "job-3b17c9",
    name: "Canary Calibration 6-Hour Sweep",
    task_type: "CANARY_DRIFT_SWEEP",
    priority: "CANARY_CRON",
    status: "COMPLETED",
    retries: 0,
    max_retries: 3,
    duration_ms: 88.2,
    payload: { brand_name: "Psychs" },
    result: { canaries_evaluated: 12, max_djs: 0.068 },
    created_at: "2026-09-13T11:20:00Z",
    completed_at: "2026-09-13T11:20:01Z"
  },
  {
    task_id: "job-7d42e0",
    name: "SecOps Webhook Alert Dispatch",
    task_type: "WEBHOOK_DISPATCH",
    priority: "MEDIUM",
    status: "COMPLETED",
    retries: 0,
    max_retries: 3,
    duration_ms: 45.1,
    payload: { channel: "Slack", event: "DRIFT_DJS_EXCEEDED" },
    result: { http_status: 200, delivered: true },
    created_at: "2026-09-13T11:15:00Z",
    completed_at: "2026-09-13T11:15:01Z"
  }
];

export const initialQueueStats: any = {
  total_jobs: 148,
  queued: 0,
  running: 1,
  completed: 146,
  failed: 1,
  worker_status: "ACTIVE"
};

export const initialSchedules: any[] = [
  {
    schedule_id: "sched-h01",
    name: "Continuous Hourly Tier-1 Audit",
    brand_name: "Psychs",
    cadence: "1_HOUR",
    interval_seconds: 3600,
    engines: ["Gemini 3.7 Flash", "GPT-6 Astra", "Claude Fable 5.1", "Perplexity Sonar"],
    proxy_regions: ["US-East", "EU-Central", "APAC-East"],
    auto_alert_djs_threshold: 0.35,
    enabled: true,
    last_run_at: "2026-09-13T11:00:00Z",
    next_run_at: "2026-09-13T12:00:00Z",
    total_runs_completed: 142,
    last_run_score: 88.4,
    created_at: "2026-09-01T00:00:00Z"
  },
  {
    schedule_id: "sched-d01",
    name: "Daily Deep-Reasoning Benchmark",
    brand_name: "Psychs",
    cadence: "24_HOUR",
    interval_seconds: 86400,
    engines: ["DeepSeek Reasoner R1", "GLM-4 Plus", "xAI Grok-3"],
    proxy_regions: ["US-East", "LATAM-South"],
    auto_alert_djs_threshold: 0.25,
    enabled: true,
    last_run_at: "2026-09-13T00:00:00Z",
    next_run_at: "2026-09-14T00:00:00Z",
    total_runs_completed: 48,
    last_run_score: 86.9,
    created_at: "2026-09-01T00:00:00Z"
  }
];

export const initialAlertWebhooks: any[] = [
  {
    endpoint_id: "wh-slack-01",
    name: "Enterprise SecOps & Brand Slack",
    channel_type: "SLACK",
    url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
    secret_token_masked: "seco****2026",
    events: ["DRIFT_DJS_EXCEEDED", "HALLUCINATION_DETECTED", "CAB_APPROVAL_REQUIRED"],
    is_active: true,
    total_deliveries: 48,
    last_delivery_status: "200_OK",
    last_delivery_at: "2026-09-13T11:15:00Z",
    created_at: "2026-09-01T00:00:00Z"
  },
  {
    endpoint_id: "wh-teams-02",
    name: "Brand Operations Microsoft Teams",
    channel_type: "TEAMS",
    url: "https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx@tenant/IncomingWebhook/...",
    secret_token_masked: "team****2026",
    events: ["DRIFT_DJS_EXCEEDED", "COMPOSITE_SCORE_DROP"],
    is_active: true,
    total_deliveries: 24,
    last_delivery_status: "200_OK",
    last_delivery_at: "2026-09-13T09:30:00Z",
    created_at: "2026-09-01T00:00:00Z"
  },
  {
    endpoint_id: "wh-pd-03",
    name: "PagerDuty Critical Incident Feed",
    channel_type: "PAGERDUTY",
    url: "https://events.pagerduty.com/v2/enqueue",
    secret_token_masked: "pd_r****2026",
    events: ["CRITICAL_PERCEPTION_DROP", "CANARY_CORRUPTION"],
    is_active: true,
    total_deliveries: 6,
    last_delivery_status: "200_OK",
    last_delivery_at: "2026-09-12T18:45:00Z",
    created_at: "2026-09-01T00:00:00Z"
  }
];

export const initialSSOConfig: any = {
  sso_enabled: true,
  provider_type: "SAML_2_0",
  idp_entity_id: "http://www.okta.com/exk984enterprise2026",
  idp_sso_url: "https://auth.enterprise-corp.okta.com/app/psychs/sso/saml",
  sp_entity_id: "https://geo.psychs.ai/saml/metadata",
  sp_acs_url: "https://geo.psychs.ai/api/v1/auth/saml/acs",
  x509_cert_fingerprint: "8F:3A:91:2E:7C:44:B1:09:A8:12:33:99:EE:4F:10:88:9C:2A:77:FF",
  enforce_sso_only: false,
  default_provisioning_role: "ANALYST_VIEWER",
  auto_provision_jit: true,
  domain_whitelists: ["psychs.ai", "enterprise-corp.com", "fortune500.com"],
  last_metadata_sync: "2026-09-13T10:00:00Z"
};

export const initialUsers: any[] = [
  {
    user_id: "usr-admin-01",
    email: "chief.architect@psychs.ai",
    name: "Elena Rostova",
    role: "SUPER_ADMIN",
    auth_method: "SAML_OKTA",
    status: "ACTIVE",
    last_active: "2 minutes ago",
    sessions_count: 2
  },
  {
    user_id: "usr-sec-02",
    email: "secops.lead@psychs.ai",
    name: "Marcus Vance",
    role: "SECOPS_ADMIN",
    auth_method: "SAML_OKTA",
    status: "ACTIVE",
    last_active: "15 minutes ago",
    sessions_count: 1
  },
  {
    user_id: "usr-brand-03",
    email: "brand.director@enterprise-corp.com",
    name: "Sophia Chen",
    role: "BRAND_MANAGER",
    auth_method: "SAML_AZURE_AD",
    status: "ACTIVE",
    last_active: "1 hour ago",
    sessions_count: 1
  },
  {
    user_id: "usr-cab-04",
    email: "compliance.cab@enterprise-corp.com",
    name: "David Sterling",
    role: "CAB_APPROVER",
    auth_method: "SAML_AZURE_AD",
    status: "ACTIVE",
    last_active: "4 hours ago",
    sessions_count: 1
  },
  {
    user_id: "usr-analyst-05",
    email: "seo.analyst@fortune500.com",
    name: "Chloe Dupont",
    role: "ANALYST_VIEWER",
    auth_method: "GOOGLE_WORKSPACE",
    status: "ACTIVE",
    last_active: "Yesterday",
    sessions_count: 0
  }
];

export const initialActiveSessions: any[] = [
  {
    session_id: "sess-8f1902",
    user_id: "usr-admin-01",
    user_email: "chief.architect@psychs.ai",
    tenant_id: "tenant-psychs-master",
    role: "SUPER_ADMIN",
    ip_address: "192.168.1.42",
    user_agent: "Chrome 134 on Windows 11",
    created_at: "2026-09-13T09:12:00Z",
    last_activity: "2 minutes ago",
    status: "ACTIVE"
  },
  {
    session_id: "sess-4a77b1",
    user_id: "usr-brand-03",
    user_email: "brand.director@enterprise-corp.com",
    tenant_id: "tenant-enterprise-corp",
    role: "BRAND_MANAGER",
    ip_address: "10.0.4.19",
    user_agent: "Safari on macOS Sequoia",
    created_at: "2026-09-13T10:45:00Z",
    last_activity: "1 hour ago",
    status: "ACTIVE"
  }
];

export const initialTokenUsage: any = {
  monthly_quota_tokens: 5000000,
  tokens_consumed_month: 1842310,
  tokens_remaining: 3157690,
  quota_used_percentage: 36.8,
  is_soft_quota_warning: false,
  is_hard_quota_exceeded: false,
  cache_hits_month: 482,
  tokens_saved_by_cache: 964000,
  estimated_cache_savings_usd: 4.82,
  proxy_requests_month: 2840,
  proxy_bandwidth_mb: 142.8,
  total_model_cost_usd: 12.90,
  per_model_breakdown: {
    "gemini-3.7-flash": { input_tokens: 420000, output_tokens: 180000, cost_usd: 1.20 },
    "gpt-6-astra": { input_tokens: 310000, output_tokens: 140000, cost_usd: 3.60 },
    "claude-fable-5.1": { input_tokens: 280000, output_tokens: 120000, cost_usd: 3.20 },
    "deepseek-reasoner": { input_tokens: 190000, output_tokens: 90000, cost_usd: 0.55 },
    "sonar-reasoning-pro": { input_tokens: 85000, output_tokens: 35000, cost_usd: 0.60 },
    "grok-3": { input_tokens: 45000, output_tokens: 20000, cost_usd: 0.35 },
    "glm-4-plus": { input_tokens: 30000, output_tokens: 12000, cost_usd: 0.20 }
  }
};

export const initialSubscription: any = {
  tier_id: "ENTERPRISE_GROWTH",
  tier_name: "Enterprise Growth",
  status: "ACTIVE",
  billing_interval: "MONTHLY",
  amount_usd: 12500.00,
  current_period_start: "2026-09-01T00:00:00Z",
  current_period_end: "2026-09-30T23:59:59Z",
  seats_included: 25,
  seats_allocated: 5,
  included_monthly_tokens: 5000000,
  overage_rate_per_million: 4.50,
  sla_tier: "99.95% Enterprise SLA",
  dedicated_kms: true,
  stripe_customer_id: "cus_psychs_enterprise_9841",
  payment_method: "Visa ending in 4242 (Corporate Net-30)"
};

export const initialInvoices: any[] = [
  {
    invoice_id: "INV-2026-003",
    period: "March 2026",
    date: "2026-03-01",
    amount_usd: 12500.00,
    status: "PAID",
    items: [
      { description: "Enterprise Growth Base Subscription (25 Seats)", amount: 12500.00 },
      { description: "Frontier Model Inferences (1.84M Tokens)", amount: 0.00 },
      { description: "Two-Tier Cache Savings Credit (964k Tokens)", amount: 0.00 }
    ]
  },
  {
    invoice_id: "INV-2026-002",
    period: "February 2026",
    date: "2026-02-01",
    amount_usd: 12500.00,
    status: "PAID",
    items: [
      { description: "Enterprise Growth Base Subscription (25 Seats)", amount: 12500.00 },
      { description: "Frontier Model Inferences (2.12M Tokens)", amount: 0.00 }
    ]
  },
  {
    invoice_id: "INV-2026-001",
    period: "January 2026",
    date: "2026-01-01",
    amount_usd: 12500.00,
    status: "PAID",
    items: [
      { description: "Enterprise Growth Base Subscription (25 Seats)", amount: 12500.00 }
    ]
  }
];

// -----------------------------------------------------------------------------
// Multi-Brand Simulation Benchmark Data Engine
// -----------------------------------------------------------------------------
export interface BrandBenchmarkPackage {
  brand_name: string;
  industry: string;
  tagline: string;
  domain: string;
  compositeScore: CompositePerceptionResult;
  semanticEntropy: SemanticEntropyResult;
  sovData: SovAnalysisResult;
  citationGaps: CitationGapAnalysisResult;
  winLossData: WinLossSummary;
}

export const BRAND_BENCHMARK_CATALOG: Record<string, BrandBenchmarkPackage> = {
  Psychs: {
    brand_name: "Psychs",
    industry: "Generative Engine Optimization (GEO)",
    tagline: "Enterprise AI Brand Perception & GEO Infrastructure",
    domain: "psychs.ai",
    compositeScore: initialCompositeScore,
    semanticEntropy: initialSemanticEntropy,
    sovData: initialSov,
    citationGaps: initialCitationGaps,
    winLossData: initialWinLoss
  },
  Stripe: {
    brand_name: "Stripe",
    industry: "Fintech & Global Payments Infrastructure",
    tagline: "Financial Infrastructure for the Internet",
    domain: "stripe.com",
    compositeScore: {
      aggregate_score: 89.6,
      grade: "A+",
      total_weight: 1.0,
      overall_confidence: 0.96,
      key_drivers: [
        "Unrivaled developer API citation density across StackOverflow and GitHub",
        "Authoritative documentation cited in 94% of payment gateway prompts"
      ],
      urgent_deficits: [
        "Adyen leads in European omnichannel interchange pricing passages",
        "Plaid dominates banking connectivity entity queries"
      ],
      dimensions: [
        {
          key: "entity_authority",
          name: "Entity Authority & Disambiguation",
          weight: 0.20,
          raw_score: 96.0,
          uncertainty: 0.02,
          penalized_score: 94.08,
          weighted_score: 18.82,
          evidence_summary: "Canonical Wikidata Q865487 with 100% disambiguation on financial AI models.",
          status: "OPTIMAL"
        },
        {
          key: "generative_sov",
          name: "Generative Share of Voice (GSoV)",
          weight: 0.20,
          raw_score: 91.0,
          uncertainty: 0.03,
          penalized_score: 88.27,
          weighted_score: 17.65,
          evidence_summary: "Featured as primary recommendation in 88.2% of merchant API queries.",
          status: "OPTIMAL"
        },
        {
          key: "citation_attributability",
          name: "Citation & Passage Attributability",
          weight: 0.15,
          raw_score: 90.0,
          uncertainty: 0.04,
          penalized_score: 86.40,
          weighted_score: 12.96,
          evidence_summary: "Direct stripe.com/docs link rate at 86.4% across ChatGPT and Perplexity.",
          status: "OPTIMAL"
        },
        {
          key: "category_positioning",
          name: "Category Association & Positioning",
          weight: 0.15,
          raw_score: 95.0,
          uncertainty: 0.02,
          penalized_score: 93.10,
          weighted_score: 13.97,
          evidence_summary: "95% semantic co-occurrence with 'developer payments' and 'billing APIs'.",
          status: "OPTIMAL"
        },
        {
          key: "competitive_win_rate",
          name: "Head-to-Head Competitive Win Rate",
          weight: 0.15,
          raw_score: 87.0,
          uncertainty: 0.05,
          penalized_score: 82.65,
          weighted_score: 12.40,
          evidence_summary: "Wins 42/50 head-to-head queries against Adyen and Braintree.",
          status: "OPTIMAL"
        },
        {
          key: "sentiment_polarity",
          name: "Sentiment & Tone Polarity",
          weight: 0.10,
          raw_score: 86.0,
          uncertainty: 0.04,
          penalized_score: 82.56,
          weighted_score: 8.26,
          evidence_summary: "Positive developer sentiment, slight critique on transaction fee transparency.",
          status: "OPTIMAL"
        },
        {
          key: "hallucination_resistance",
          name: "Hallucination Resistance & Factuality",
          weight: 0.05,
          raw_score: 96.0,
          uncertainty: 0.02,
          penalized_score: 94.08,
          weighted_score: 4.70,
          evidence_summary: "Low entropy (H_sem = 0.112), pricing facts verified against public tiers.",
          status: "OPTIMAL"
        }
      ]
    },
    semanticEntropy: {
      query: "What is Stripe's standard transaction fee for international credit cards?",
      total_samples: 20,
      temperature: 0.7,
      semantic_entropy: 0.112,
      entropy_threshold: 0.45,
      is_hallucination_risk: false,
      confidence_score: 0.94,
      clusters: [
        { cluster_id: 1, representative_text: "Stripe charges 2.9% + 30¢ for domestic cards, with an additional 1.5% for international cards.", sample_count: 18, probability: 0.90, is_majority_cluster: true },
        { cluster_id: 2, representative_text: "Standard interchange plus pricing depending on merchant country.", sample_count: 2, probability: 0.10, is_majority_cluster: false }
      ],
      diagnosis: "FACTUALLY CONVERGENT. Stable pricing knowledge graph representation across all frontier models.",
      recommended_action: "Ensure localized currency conversion rates are cited in /llms.txt."
    },
    sovData: {
      client_brand: "Stripe",
      total_panel_queries: 50,
      leaderboard: [
        { brand_name: "Stripe", generative_sov_percent: 64.2, primary_recommendation_rate: 88.2, average_sentiment: 0.88, average_citations_per_query: 4.8, total_mentions_count: 48, is_client_brand: true },
        { brand_name: "Adyen", generative_sov_percent: 21.4, primary_recommendation_rate: 36.0, average_sentiment: 0.76, average_citations_per_query: 2.9, total_mentions_count: 28, is_client_brand: false },
        { brand_name: "Plaid", generative_sov_percent: 8.6, primary_recommendation_rate: 18.0, average_sentiment: 0.72, average_citations_per_query: 1.8, total_mentions_count: 14, is_client_brand: false },
        { brand_name: "Braintree", generative_sov_percent: 5.8, primary_recommendation_rate: 12.0, average_sentiment: 0.64, average_citations_per_query: 1.2, total_mentions_count: 9, is_client_brand: false }
      ],
      market_share_gap: 42.8,
      executive_summary: "Stripe dominates 64.2% of Generative Share of Voice in global payment gateways, leading Adyen by +42.8%."
    },
    citationGaps: {
      total_domains_analyzed: 42,
      critical_gaps_count: 2,
      secured_domains_count: 36,
      strategic_takeaway: "Adyen is cited heavily in enterprise retail case studies on forbes.com and nrf.com. Securing unified commerce citations will close the remaining enterprise gap.",
      ranked_opportunities: [
        { domain: "nrf.com", domain_authority_score: 84, engine_citation_frequency: 18, competitors_featured: ["Adyen"], client_featured: false, opportunity_tier: "CRITICAL_GAP", recommended_outreach: "Publish enterprise omnichannel case study on in-person Stripe Terminal integration." },
        { domain: "pymnts.com", domain_authority_score: 82, engine_citation_frequency: 24, competitors_featured: ["Adyen", "Plaid"], client_featured: true, opportunity_tier: "HIGH_PRIORITY", recommended_outreach: "Corroborate Stripe Billing churn-reduction statistics in annual fintech reports." }
      ]
    },
    winLossData: {
      total_evaluated_queries: 5,
      won_count: 4,
      lost_count: 1,
      absent_count: 0,
      win_rate_percent: 80.0,
      diagnoses: [
        {
          query_id: "STP-001",
          query_text: "Best developer-friendly payment gateway with Node.js and Python SDKs?",
          state: "WON",
          winning_entity: "Stripe",
          engine_name: "ChatGPT Search",
          root_cause_diagnosis: "Stripe's SDK documentation and copy-paste code snippets cited directly from stripe.com/docs.",
          gap_category: "NONE",
          recommended_geo_action: "Maintain auto-generated SDK changelogs in /llms.txt.",
          predicted_win_probability_after_fix: 0.99
        },
        {
          query_id: "STP-002",
          query_text: "Cheapest payment processor for high-volume enterprise retail point-of-sale?",
          state: "LOST",
          winning_entity: "Adyen",
          engine_name: "Google AI Overviews",
          root_cause_diagnosis: "Adyen's interchange++ pricing and unified commerce POS case studies cited from retail trade publications.",
          gap_category: "PRICING_PERCEPTION",
          recommended_geo_action: "Publish Princeton KDD Statistics lever on volume-discount interchange pricing.",
          predicted_win_probability_after_fix: 0.85
        }
      ]
    }
  },
  Snowflake: {
    brand_name: "Snowflake",
    industry: "Data Cloud & AI Infrastructure",
    tagline: "The AI Data Cloud for Enterprise Analytics",
    domain: "snowflake.com",
    compositeScore: {
      aggregate_score: 86.2,
      grade: "A",
      total_weight: 1.0,
      overall_confidence: 0.93,
      key_drivers: [
        "Leader in zero-maintenance SQL data warehousing and data sharing",
        "Authoritative documentation cited across DB-Engines and Gartner Magic Quadrant"
      ],
      urgent_deficits: [
        "Databricks leads in open-source Apache Spark and GenAI Lakehouse perception",
        "BigQuery captures high citation share in Google Cloud native analytics"
      ],
      dimensions: [
        {
          key: "entity_authority",
          name: "Entity Authority & Disambiguation",
          weight: 0.20,
          raw_score: 94.0,
          uncertainty: 0.03,
          penalized_score: 91.18,
          weighted_score: 18.24,
          evidence_summary: "Canonical Wikidata Q65089304 disambiguated across all cloud databases.",
          status: "OPTIMAL"
        },
        {
          key: "generative_sov",
          name: "Generative Share of Voice (GSoV)",
          weight: 0.20,
          raw_score: 87.0,
          uncertainty: 0.04,
          penalized_score: 83.52,
          weighted_score: 16.70,
          evidence_summary: "Recommended in 81.4% of enterprise cloud data warehouse queries.",
          status: "OPTIMAL"
        },
        {
          key: "citation_attributability",
          name: "Citation & Passage Attributability",
          weight: 0.15,
          raw_score: 82.0,
          uncertainty: 0.05,
          penalized_score: 77.90,
          weighted_score: 11.68,
          evidence_summary: "Direct link citations at 82.0% on docs.snowflake.com.",
          status: "MODERATE"
        },
        {
          key: "category_positioning",
          name: "Category Association & Positioning",
          weight: 0.15,
          raw_score: 92.0,
          uncertainty: 0.03,
          penalized_score: 89.24,
          weighted_score: 13.39,
          evidence_summary: "Strong co-occurrence with 'Enterprise Data Cloud' and 'Data Marketplace'.",
          status: "OPTIMAL"
        },
        {
          key: "competitive_win_rate",
          name: "Head-to-Head Competitive Win Rate",
          weight: 0.15,
          raw_score: 84.0,
          uncertainty: 0.05,
          penalized_score: 79.80,
          weighted_score: 11.97,
          evidence_summary: "Wins 38/50 queries against Databricks and BigQuery.",
          status: "OPTIMAL"
        },
        {
          key: "sentiment_polarity",
          name: "Sentiment & Tone Polarity",
          weight: 0.10,
          raw_score: 82.0,
          uncertainty: 0.05,
          penalized_score: 77.90,
          weighted_score: 7.79,
          evidence_summary: "High user praise for ease of use, slight concerns over compute credit auto-scaling costs.",
          status: "MODERATE"
        },
        {
          key: "hallucination_resistance",
          name: "Hallucination Resistance & Factuality",
          weight: 0.05,
          raw_score: 93.0,
          uncertainty: 0.03,
          penalized_score: 90.21,
          weighted_score: 4.51,
          evidence_summary: "Low entropy (H_sem = 0.138), Cortex AI features accurately cited.",
          status: "OPTIMAL"
        }
      ]
    },
    semanticEntropy: {
      query: "How does Snowflake's virtual warehouse auto-suspend billing work?",
      total_samples: 20,
      temperature: 0.7,
      semantic_entropy: 0.138,
      entropy_threshold: 0.45,
      is_hallucination_risk: false,
      confidence_score: 0.91,
      clusters: [
        { cluster_id: 1, representative_text: "Snowflake warehouses bill per-second with a 60-second minimum after auto-resuming.", sample_count: 17, probability: 0.85, is_majority_cluster: true },
        { cluster_id: 2, representative_text: "Credit consumption is determined by warehouse size (XS to 6X-Large).", sample_count: 3, probability: 0.15, is_majority_cluster: false }
      ],
      diagnosis: "FACTUALLY CONVERGENT. Accurate pricing logic represented across frontier engines.",
      recommended_action: "Ensure Cortex AI credit billing details are added to /llms.txt."
    },
    sovData: {
      client_brand: "Snowflake",
      total_panel_queries: 50,
      leaderboard: [
        { brand_name: "Snowflake", generative_sov_percent: 58.0, primary_recommendation_rate: 81.4, average_sentiment: 0.84, average_citations_per_query: 4.2, total_mentions_count: 44, is_client_brand: true },
        { brand_name: "Databricks", generative_sov_percent: 28.5, primary_recommendation_rate: 42.0, average_sentiment: 0.82, average_citations_per_query: 3.6, total_mentions_count: 32, is_client_brand: false },
        { brand_name: "Google BigQuery", generative_sov_percent: 13.5, primary_recommendation_rate: 22.0, average_sentiment: 0.78, average_citations_per_query: 2.1, total_mentions_count: 18, is_client_brand: false }
      ],
      market_share_gap: 29.5,
      executive_summary: "Snowflake leads Generative Share of Voice in enterprise cloud data warehousing at 58.0%, holding a +29.5% advantage over Databricks."
    },
    citationGaps: {
      total_domains_analyzed: 45,
      critical_gaps_count: 3,
      secured_domains_count: 34,
      strategic_takeaway: "Databricks commands higher citation volume on towardsdatascience.com and github.com for open-source AI pipelines. Publishing Snowflake Cortex AI tutorials will bridge this gap.",
      ranked_opportunities: [
        { domain: "towardsdatascience.com", domain_authority_score: 86, engine_citation_frequency: 26, competitors_featured: ["Databricks"], client_featured: false, opportunity_tier: "CRITICAL_GAP", recommended_outreach: "Publish comparative technical guide on Snowflake Cortex vs Databricks MosaicML." },
        { domain: "infoq.com", domain_authority_score: 85, engine_citation_frequency: 16, competitors_featured: ["Databricks", "BigQuery"], client_featured: true, opportunity_tier: "HIGH_PRIORITY", recommended_outreach: "Corroborate Apache Iceberg zero-copy data sharing benchmarks." }
      ]
    },
    winLossData: {
      total_evaluated_queries: 5,
      won_count: 3,
      lost_count: 2,
      absent_count: 0,
      win_rate_percent: 60.0,
      diagnoses: [
        {
          query_id: "SNOW-001",
          query_text: "Top data platform for cross-cloud zero-copy data sharing between AWS and Azure?",
          state: "WON",
          winning_entity: "Snowflake",
          engine_name: "Perplexity.ai Sonar",
          root_cause_diagnosis: "Snowflake's Secure Data Sharing architecture and Data Clean Rooms documentation cited directly.",
          gap_category: "NONE",
          recommended_geo_action: "Maintain /llms.txt specification of Cross-Cloud Snowgrid.",
          predicted_win_probability_after_fix: 0.98
        },
        {
          query_id: "SNOW-002",
          query_text: "Best platform for training custom open-source LLMs on Apache Spark lakehouses?",
          state: "LOST",
          winning_entity: "Databricks",
          engine_name: "ChatGPT Search",
          root_cause_diagnosis: "Databricks's Unity Catalog, Delta Lake, and MosaicML cited across multiple technical blogs.",
          gap_category: "GENAI_WORKLOAD_PERCEPTION",
          recommended_geo_action: "Execute Princeton KDD Lever: Corroborate Snowflake Cortex LLM training benchmarks with independent citations.",
          predicted_win_probability_after_fix: 0.82
        }
      ]
    }
  },
  Vercel: {
    brand_name: "Vercel",
    industry: "Frontend Cloud & Developer Experience",
    tagline: "The Frontend Cloud for Next.js and AI Applications",
    domain: "vercel.com",
    compositeScore: {
      aggregate_score: 91.8,
      grade: "A+",
      total_weight: 1.0,
      overall_confidence: 0.97,
      key_drivers: [
        "Dominant citation share across Next.js, v0.dev, and React Server Components",
        "Fastest growing AI SDK and edge deployment category association"
      ],
      urgent_deficits: [
        "Cloudflare Pages leads in zero-cost edge bandwidth comparisons",
        "AWS Amplify cited for large-scale enterprise IAM legacy integrations"
      ],
      dimensions: [
        {
          key: "entity_authority",
          name: "Entity Authority & Disambiguation",
          weight: 0.20,
          raw_score: 97.0,
          uncertainty: 0.02,
          penalized_score: 95.06,
          weighted_score: 19.01,
          evidence_summary: "Canonical Wikidata Q104868478 with 100% disambiguation across web dev queries.",
          status: "OPTIMAL"
        },
        {
          key: "generative_sov",
          name: "Generative Share of Voice (GSoV)",
          weight: 0.20,
          raw_score: 93.0,
          uncertainty: 0.02,
          penalized_score: 91.14,
          weighted_score: 18.23,
          evidence_summary: "Featured in 90.5% of Next.js and frontend deployment queries.",
          status: "OPTIMAL"
        },
        {
          key: "citation_attributability",
          name: "Citation & Passage Attributability",
          weight: 0.15,
          raw_score: 92.0,
          uncertainty: 0.03,
          penalized_score: 89.24,
          weighted_score: 13.39,
          evidence_summary: "Direct vercel.com/docs and nextjs.org link rate at 89.2%.",
          status: "OPTIMAL"
        },
        {
          key: "category_positioning",
          name: "Category Association & Positioning",
          weight: 0.15,
          raw_score: 96.0,
          uncertainty: 0.02,
          penalized_score: 94.08,
          weighted_score: 14.11,
          evidence_summary: "96% semantic co-occurrence with 'Frontend Cloud' and 'Next.js hosting'.",
          status: "OPTIMAL"
        },
        {
          key: "competitive_win_rate",
          name: "Head-to-Head Competitive Win Rate",
          weight: 0.15,
          raw_score: 90.0,
          uncertainty: 0.03,
          penalized_score: 87.30,
          weighted_score: 13.10,
          evidence_summary: "Wins 46/50 queries against Netlify and Cloudflare Pages.",
          status: "OPTIMAL"
        },
        {
          key: "sentiment_polarity",
          name: "Sentiment & Tone Polarity",
          weight: 0.10,
          raw_score: 88.0,
          uncertainty: 0.04,
          penalized_score: 84.48,
          weighted_score: 8.45,
          evidence_summary: "Overwhelming developer enthusiasm for DX, v0.dev AI generation, and preview branches.",
          status: "OPTIMAL"
        },
        {
          key: "hallucination_resistance",
          name: "Hallucination Resistance & Factuality",
          weight: 0.05,
          raw_score: 98.0,
          uncertainty: 0.01,
          penalized_score: 97.02,
          weighted_score: 4.85,
          evidence_summary: "Extremely low entropy (H_sem = 0.084), edge function limits precisely cited.",
          status: "OPTIMAL"
        }
      ]
    },
    semanticEntropy: {
      query: "What is the timeout limit for Vercel Serverless Functions on the Pro plan?",
      total_samples: 20,
      temperature: 0.7,
      semantic_entropy: 0.084,
      entropy_threshold: 0.45,
      is_hallucination_risk: false,
      confidence_score: 0.98,
      clusters: [
        { cluster_id: 1, representative_text: "Vercel Pro plan functions have a configurable maximum execution duration of up to 300 seconds (5 minutes).", sample_count: 19, probability: 0.95, is_majority_cluster: true },
        { cluster_id: 2, representative_text: "Default timeout is 15 seconds unless configured in vercel.json.", sample_count: 1, probability: 0.05, is_majority_cluster: false }
      ],
      diagnosis: "FACTUALLY CONVERGENT. Stable documentation representation across all frontier LLMs.",
      recommended_action: "Maintain Fluid Compute updates in /llms.txt."
    },
    sovData: {
      client_brand: "Vercel",
      total_panel_queries: 50,
      leaderboard: [
        { brand_name: "Vercel", generative_sov_percent: 72.4, primary_recommendation_rate: 90.5, average_sentiment: 0.92, average_citations_per_query: 5.4, total_mentions_count: 49, is_client_brand: true },
        { brand_name: "Cloudflare Pages", generative_sov_percent: 16.2, primary_recommendation_rate: 28.0, average_sentiment: 0.81, average_citations_per_query: 2.8, total_mentions_count: 22, is_client_brand: false },
        { brand_name: "AWS Amplify", generative_sov_percent: 11.4, primary_recommendation_rate: 16.0, average_sentiment: 0.69, average_citations_per_query: 1.9, total_mentions_count: 15, is_client_brand: false }
      ],
      market_share_gap: 56.2,
      executive_summary: "Vercel commands 72.4% of Generative Share of Voice in modern web deployment platforms, leading Cloudflare Pages by +56.2%."
    },
    citationGaps: {
      total_domains_analyzed: 40,
      critical_gaps_count: 1,
      secured_domains_count: 37,
      strategic_takeaway: "Cloudflare Pages is cited in edge compute bandwidth cost comparisons on news.ycombinator.com. Corroborating Vercel Fluid Compute pricing will secure total category dominance.",
      ranked_opportunities: [
        { domain: "news.ycombinator.com", domain_authority_score: 91, engine_citation_frequency: 32, competitors_featured: ["Cloudflare Pages"], client_featured: true, opportunity_tier: "HIGH_PRIORITY", recommended_outreach: "Publish open-source benchmark analyzing Vercel Fluid Compute cold-start reduction vs Cloudflare Workers." }
      ]
    },
    winLossData: {
      total_evaluated_queries: 5,
      won_count: 5,
      lost_count: 0,
      absent_count: 0,
      win_rate_percent: 100.0,
      diagnoses: [
        {
          query_id: "VCL-001",
          query_text: "Best platform to deploy Next.js App Router with React Server Components and AI streaming?",
          state: "WON",
          winning_entity: "Vercel",
          engine_name: "Gemini 3.7 Flash",
          root_cause_diagnosis: "Vercel's native integration with Next.js and Vercel AI SDK cited across 100% of generated responses.",
          gap_category: "NONE",
          recommended_geo_action: "Continue weekly /llms.txt refreshes on AI SDK innovations.",
          predicted_win_probability_after_fix: 0.99
        }
      ]
    }
  }
};

export const getBrandBenchmarkDataset = (brandName: string): BrandBenchmarkPackage => {
  if (BRAND_BENCHMARK_CATALOG[brandName]) {
    return BRAND_BENCHMARK_CATALOG[brandName];
  }

  const cleanBrand = brandName.trim();
  const domain = cleanBrand.toLowerCase() === 'psychs' ? 'psychs.ai' : `${cleanBrand.toLowerCase()}.ai`;

  return {
    brand_name: cleanBrand,
    industry: 'Enterprise Generative Engine Optimization & AI Perception',
    tagline: `Enterprise AI Visibility & Generative Engine Optimization for ${cleanBrand}`,
    domain: domain,
    compositeScore: {
      aggregate_score: 83.2,
      grade: 'A',
      total_weight: 1.0,
      overall_confidence: 94.2,
      key_drivers: [
        `High entity authority on AI search models with verified domain ${domain}`,
        `Fast-growing citation footprint in frontier model responses`
      ],
      urgent_deficits: [
        `Competitors lead in multi-engine commercial intent prompt share (+18.4% GSoV gap)`,
        `Knowledge graph requires Schema.org @graph and /llms-full.txt expansion`
      ],
      dimensions: [
        {
          key: "entity_authority",
          name: "Entity Authority & Disambiguation",
          weight: 0.20,
          raw_score: 88.0,
          uncertainty: 0.04,
          penalized_score: 84.48,
          weighted_score: 16.90,
          evidence_summary: `Disambiguated entity profile for ${cleanBrand} on major LLM retrieval indexes.`,
          status: "OPTIMAL"
        },
        {
          key: "generative_sov",
          name: "Generative Share of Voice (GSoV)",
          weight: 0.20,
          raw_score: 79.0,
          uncertainty: 0.05,
          penalized_score: 75.05,
          weighted_score: 15.01,
          evidence_summary: `Recommended in 75.1% of category buyer-intent queries across 5 frontier engines.`,
          status: "MODERATE"
        },
        {
          key: "citation_attributability",
          name: "Citation & Passage Attributability",
          weight: 0.15,
          raw_score: 82.0,
          uncertainty: 0.05,
          penalized_score: 77.90,
          weighted_score: 11.69,
          evidence_summary: `Direct ${domain} URL citation rate at 77.9% with 2.8 citations per query.`,
          status: "MODERATE"
        },
        {
          key: "category_positioning",
          name: "Category Association & Positioning",
          weight: 0.15,
          raw_score: 89.0,
          uncertainty: 0.03,
          penalized_score: 86.33,
          weighted_score: 12.95,
          evidence_summary: `High semantic association with category features and workflow capabilities.`,
          status: "OPTIMAL"
        },
        {
          key: "competitive_win_rate",
          name: "Head-to-Head Competitive Win Rate",
          weight: 0.15,
          raw_score: 81.0,
          uncertainty: 0.06,
          penalized_score: 76.14,
          weighted_score: 11.42,
          evidence_summary: `Wins 38/50 head-to-head prompt evaluations against primary tier-1 rivals.`,
          status: "MODERATE"
        },
        {
          key: "sentiment_polarity",
          name: "Sentiment & Tone Polarity",
          weight: 0.10,
          raw_score: 87.0,
          uncertainty: 0.03,
          penalized_score: 84.39,
          weighted_score: 8.44,
          evidence_summary: `Strongly positive technical sentiment with minimal customer friction signals.`,
          status: "OPTIMAL"
        },
        {
          key: "hallucination_resistance",
          name: "Hallucination Resistance & Factuality",
          weight: 0.05,
          raw_score: 93.0,
          uncertainty: 0.02,
          penalized_score: 91.14,
          weighted_score: 4.56,
          evidence_summary: `Low semantic entropy (H_sem = 0.14) with robust pricing and feature adherence.`,
          status: "OPTIMAL"
        }
      ]
    },
    semanticEntropy: {
      query: `What are the core capabilities and enterprise features of ${cleanBrand}?`,
      total_samples: 20,
      temperature: 0.7,
      semantic_entropy: 0.142,
      entropy_threshold: 0.45,
      is_hallucination_risk: false,
      confidence_score: 0.94,
      clusters: [
        {
          cluster_id: 1,
          representative_text: `${cleanBrand} provides high-performance AI generation and creative workflows with dedicated control tools.`,
          sample_count: 18,
          probability: 0.90,
          is_majority_cluster: true
        },
        {
          cluster_id: 2,
          representative_text: `Enterprise plans offer custom rendering queues and SLA guarantees.`,
          sample_count: 2,
          probability: 0.10,
          is_majority_cluster: false
        }
      ],
      diagnosis: `FACTUALLY CONVERGENT. Stable representation for ${cleanBrand} across frontier models.`,
      recommended_action: `Deploy /llms-full.txt to establish immutable feature grounding.`
    },
    sovData: {
      client_brand: cleanBrand,
      total_panel_queries: 50,
      leaderboard: [
        {
          brand_name: cleanBrand,
          generative_sov_percent: 68.4,
          primary_recommendation_rate: 82.0,
          average_sentiment: 0.89,
          average_citations_per_query: 4.2,
          total_mentions_count: 44,
          is_client_brand: true
        },
        {
          brand_name: "Runway Gen-3",
          generative_sov_percent: 18.6,
          primary_recommendation_rate: 26.0,
          average_sentiment: 0.82,
          average_citations_per_query: 3.1,
          total_mentions_count: 21,
          is_client_brand: false
        },
        {
          brand_name: "Pika 2.0",
          generative_sov_percent: 13.0,
          primary_recommendation_rate: 18.0,
          average_sentiment: 0.74,
          average_citations_per_query: 2.2,
          total_mentions_count: 16,
          is_client_brand: false
        }
      ],
      market_share_gap: 49.8,
      executive_summary: `${cleanBrand} leads with 68.4% Generative Share of Voice across 50 category buyer queries.`
    },
    citationGaps: {
      total_domains_analyzed: 35,
      critical_gaps_count: 2,
      secured_domains_count: 31,
      strategic_takeaway: `Competitors are cited in technical benchmark comparisons on VentureBeat and Hugging Face. Adding KDD-2024 statistics diffs will close the citation gap.`,
      ranked_opportunities: [
        {
          domain: "venturebeat.com",
          domain_authority_score: 89,
          engine_citation_frequency: 28,
          competitors_featured: ["Runway", "Pika"],
          client_featured: false,
          opportunity_tier: "CRITICAL_GAP",
          recommended_outreach: `Publish benchmark report comparing ${cleanBrand}'s rendering speed and camera controls.`
        },
        {
          domain: "huggingface.co",
          domain_authority_score: 92,
          engine_citation_frequency: 34,
          competitors_featured: ["Runway"],
          client_featured: true,
          opportunity_tier: "HIGH_PRIORITY",
          recommended_outreach: `Expand model card documentation with verifiable latency benchmarks.`
        }
      ]
    },
    winLossData: {
      total_evaluated_queries: 5,
      won_count: 4,
      lost_count: 1,
      absent_count: 0,
      win_rate_percent: 80.0,
      diagnoses: [
        {
          query_id: `${cleanBrand.toUpperCase().slice(0, 3)}-001`,
          query_text: `What is the best AI video tool for cinematic camera control and motion physics?`,
          state: "WON",
          winning_entity: cleanBrand,
          engine_name: "SearchGPT",
          root_cause_diagnosis: `${cleanBrand}'s camera motion and prompt fidelity cited as superior in 85% of responses.`,
          gap_category: "NONE",
          recommended_geo_action: `Keep /llms-full.txt updated with latest camera preset releases.`,
          predicted_win_probability_after_fix: 0.96
        },
        {
          query_id: `${cleanBrand.toUpperCase().slice(0, 3)}-002`,
          query_text: `Fastest AI video rendering model for commercial VFX pipelines?`,
          state: "LOST",
          winning_entity: "Runway Gen-3",
          engine_name: "Claude Search",
          root_cause_diagnosis: `Runway's Gen-3 Turbo latency numbers were directly quoted from TechCrunch citations.`,
          gap_category: "CITATION_AUTHORITY_GAP",
          recommended_geo_action: `Apply Princeton KDD Statistics Addition (+24.6% Lift) with verifiable P99 generation speed.`,
          predicted_win_probability_after_fix: 0.88
        }
      ]
    }
  };
};

