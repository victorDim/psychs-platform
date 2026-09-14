export interface DimensionScore {
  key: string;
  name: string;
  weight: number;
  raw_score: number;
  uncertainty: number;
  penalized_score: number;
  weighted_score: number;
  evidence_summary: string;
  status: 'OPTIMAL' | 'MODERATE' | 'DEFICIT';
}

export interface CompositePerceptionResult {
  aggregate_score: number;
  dimensions: DimensionScore[];
  total_weight: number;
  overall_confidence: number;
  grade: string;
  key_drivers: string[];
  urgent_deficits: string[];
}

export interface SemanticCluster {
  cluster_id: number;
  representative_text: string;
  sample_count: number;
  probability: number;
  is_majority_cluster: boolean;
}

export interface SemanticEntropyResult {
  query: string;
  total_samples: number;
  temperature: number;
  semantic_entropy: number;
  entropy_threshold: number;
  is_hallucination_risk: boolean;
  confidence_score: number;
  clusters: SemanticCluster[];
  diagnosis: string;
  recommended_action: string;
}

export interface CompetitorMetric {
  brand_name: string;
  generative_sov_percent: number;
  primary_recommendation_rate: number;
  average_sentiment: number;
  average_citations_per_query: number;
  total_mentions_count: number;
  is_client_brand: boolean;
}

export interface SovAnalysisResult {
  client_brand: string;
  total_panel_queries: number;
  leaderboard: CompetitorMetric[];
  market_share_gap: number;
  executive_summary: string;
}

export interface CitationDomainGap {
  domain: string;
  domain_authority_score: number;
  engine_citation_frequency: number;
  competitors_featured: string[];
  client_featured: boolean;
  opportunity_tier: 'CRITICAL_GAP' | 'HIGH_PRIORITY' | 'SECURED';
  recommended_outreach: string;
}

export interface CitationGapAnalysisResult {
  total_domains_analyzed: number;
  critical_gaps_count: number;
  secured_domains_count: number;
  ranked_opportunities: CitationDomainGap[];
  strategic_takeaway: string;
}

export interface PromptDiagnosis {
  query_id: string;
  query_text: string;
  state: 'WON' | 'LOST' | 'ABSENT';
  winning_entity: string;
  engine_name: string;
  root_cause_diagnosis: string;
  gap_category: string;
  recommended_geo_action: string;
  predicted_win_probability_after_fix: number;
}

export interface WinLossSummary {
  total_evaluated_queries: number;
  won_count: number;
  lost_count: number;
  absent_count: number;
  win_rate_percent: number;
  diagnoses: PromptDiagnosis[];
}

export interface OptimizationLever {
  lever_name: string;
  is_active: boolean;
  empirical_lift_weight: number;
  applied_changes_count: number;
  description: string;
}

export interface ContentDiffItem {
  section_id: string;
  section_title: string;
  original_text: string;
  optimized_text: string;
  diff_type: string;
  applied_levers: string[];
  expected_citation_lift_delta: number;
  extractability_score: number;
}

export interface OptimizationPlanResult {
  document_title: string;
  active_levers: OptimizationLever[];
  diffs: ContentDiffItem[];
  aggregate_predicted_lift: number;
  schema_compliance_score: number;
  extractability_lift: number;
}

export interface EntitySchemaResult {
  brand_name: string;
  organization_jsonld: Record<string, any>;
  service_jsonld: Record<string, any>;
  faqpage_jsonld: Record<string, any>;
  validation_status: string;
  same_as_links_count: number;
}

export interface LlmsTxtResult {
  brand_name: string;
  llms_txt_content: string;
  llms_full_txt_content: string;
  total_sections: number;
  char_count: number;
  is_valid: boolean;
}

export interface WebhookEndpoint {
  platform_name: string;
  endpoint_url: string;
  environment: string;
  status: string;
  last_sync_timestamp: string;
  secret_key_preview: string;
}

export interface RemeasurementCheckpoint {
  checkpoint_day: number;
  status: string;
  execution_date: string;
  perception_score: number;
  delta_perception_score: number;
  citation_frequency_rate: number;
  citation_lift_percent: number;
  hallucination_rate_percent: number;
  verified_roi_multiplier: number;
}

export interface RemeasurementCampaign {
  campaign_id: string;
  target_page_url: string;
  baseline_date: string;
  checkpoints: RemeasurementCheckpoint[];
  cumulative_citation_lift: number;
  cumulative_perception_lift: number;
  summary_report: string;
}

export interface UnitEconomicsBreakdown {
  operational_step: string;
  unoptimized_prototype_cost: number;
  enterprise_architecture_cost: number;
  cost_reduction_percent: number;
  optimization_applied: string;
}

export interface UnitEconomicsResult {
  breakdown: UnitEconomicsBreakdown[];
  total_cost_per_audit_prototype: number;
  total_cost_per_audit_enterprise: number;
  cost_reduction_percent: number;
  monthly_client_cost_4_cycles: number;
  software_gross_margin_percent: number;
  margin_status: string;
}

export interface AuditLogEntry {
  log_id: string;
  tenant_id: string;
  timestamp: string;
  actor_id: string;
  action_type: string;
  evidence_tier: 'OBSERVED' | 'INFERRED' | 'MODEL_GENERATED' | 'USER_PROVIDED';
  resource_target: string;
  payload_hash: string;
  hmac_signature: string;
  details: Record<string, any>;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  required_permission_level: number;
  input_schema: Record<string, any>;
}

export interface TenantKeyStatus {
  tenant_id: string;
  tenant_name: string;
  kms_tdk_arn: string;
  key_state: string;
  created_at: string;
  last_rotated_at: string;
  shred_completion_time_seconds?: number;
  is_data_recoverable: boolean;
}

// ---------------- Hardening Solution Types ----------------

export interface EngineCanaryStatus {
  engine_name: string;
  sample_queries_evaluated: number;
  jensen_shannon_divergence: number;
  drift_status: 'NORMAL' | 'ELEVATED' | 'DRIFT_DETECTED';
  last_calibration_timestamp: string;
  optimal_passage_word_count: number;
  recommended_lever_reweight: Record<string, number>;
}

export interface CanarySystemReport {
  total_canary_probes: number;
  global_drift_index: number;
  system_health_status: string;
  engines: EngineCanaryStatus[];
  automated_adjustments_applied: string[];
}

export interface AdaptiveSampleDecision {
  query: string;
  stage_executed: number;
  samples_drawn: number;
  early_exit_triggered: boolean;
  initial_nli_similarity: number;
  semantic_entropy: number;
  tokens_consumed: number;
  tokens_saved: number;
  cost_reduction_percent: number;
}

export interface AdaptiveSamplerMetrics {
  total_queries_processed: number;
  stage_1_early_exit_count: number;
  stage_2_escalated_count: number;
  early_exit_rate_percent: number;
  cumulative_tokens_saved: number;
  cumulative_cost_saved_usd: number;
  avg_inference_latency_ms: number;
}

export interface PullRequestResult {
  pr_number: number;
  pr_title: string;
  branch_name: string;
  repo_url: string;
  pr_url: string;
  status: string;
  ci_checks_status: string;
  predicted_citation_lift: number;
  created_at: string;
}

export interface MultiSigApprovalStage {
  stage_name: string;
  required_role: string;
  approver_email?: string;
  is_approved: boolean;
  signature_hash?: string;
  signed_timestamp?: string;
}

export interface HeadlessConnector {
  platform_name: string;
  connector_type: string;
  space_or_project_id: string;
  status: string;
  last_export_timestamp: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  observed_branded_queries: number;
  counterfactual_baseline: number;
  incremental_lift_percent: number;
  generative_citation_rate: number;
}

export interface AICrawlerLog {
  timestamp: string;
  bot_name: string;
  target_path: string;
  http_status: number;
  response_time_ms: number;
  ip_subnet: string;
}

export interface CausalAttributionReport {
  campaign_name: string;
  time_series: TimeSeriesDataPoint[];
  cumulative_incremental_queries: number;
  direct_traffic_lift_percent: number;
  branded_search_lift_percent: number;
  incremental_pipeline_attributed_usd: number;
  statistical_significance_p_value: number;
  causal_impact_summary: string;
  recent_ai_crawler_logs: AICrawlerLog[];
}

export interface ApiKeyConfig {
  openai_api_key: string;
  openai_model?: string;
  perplexity_api_key: string;
  perplexity_model?: string;
  gemini_api_key: string;
  gemini_model?: string;
  anthropic_api_key: string;
  anthropic_model?: string;
  deepseek_api_key: string;
  deepseek_model?: string;
  glm_api_key?: string;
  glm_model?: string;
  grok_api_key?: string;
  grok_model?: string;
  proxy_url: string;
  proxy_url_masked?: string;
  execution_mode: 'LIVE' | 'HYBRID_SANDBOX';
  proxy_enabled: boolean;
  active_proxy_provider: string;
  total_proxies_online: number;
}

export interface ProxyStatus {
  status: string;
  provider: string;
  active_ips: number;
  rotation_interval_seconds: number;
  geo_coverage: string[];
  egress_ip_pool: string;
  average_latency_ms: number;
}

export interface ConnectionTestResult {
  provider_name: string;
  status: string;
  latency_ms: number;
  message: string;
  timestamp: string;
}

export interface ApiSettingsResponse {
  settings: ApiKeyConfig;
  proxy_health: ProxyStatus;
}

// -----------------------------------------------------------------------------
// Asynchronous Background Worker & 24/7 Scraping Queue Interfaces (Option 2)
// -----------------------------------------------------------------------------
export interface TaskQueueJob {
  task_id: string;
  name: string;
  task_type: string;
  priority: 'HIGH' | 'CANARY_CRON' | 'MEDIUM' | 'LOW';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  retries: number;
  max_retries: number;
  error_message?: string;
  payload: Record<string, any>;
  result?: Record<string, any>;
  duration_ms: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface QueueStats {
  total_jobs: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  worker_status: 'ACTIVE' | 'STOPPED';
}

export interface AuditSchedule {
  schedule_id: string;
  name: string;
  brand_name: string;
  cadence: '1_HOUR' | '6_HOUR' | '12_HOUR' | '24_HOUR';
  interval_seconds: number;
  engines: string[];
  proxy_regions: string[];
  auto_alert_djs_threshold: number;
  enabled: boolean;
  last_run_at: string;
  next_run_at: string;
  total_runs_completed: number;
  last_run_score: number;
  created_at: string;
}

export interface WebhookAlertEndpoint {
  endpoint_id: string;
  name: string;
  channel_type: 'SLACK' | 'TEAMS' | 'PAGERDUTY' | 'GENERIC_HTTP';
  url: string;
  secret_token_masked?: string;
  events: string[];
  is_active: boolean;
  total_deliveries: number;
  last_delivery_status: string;
  last_delivery_at: string;
  created_at: string;
}

export interface WebhookDeliveryLog {
  delivery_id: string;
  endpoint_id: string;
  endpoint_name: string;
  channel_type: string;
  event_type: string;
  http_status: number;
  signature_header: string;
  latency_ms: number;
  timestamp: string;
  status: string;
}

// -----------------------------------------------------------------------------
// Enterprise SSO Federation & 5-Tier RBAC Interfaces (Option 3)
// -----------------------------------------------------------------------------
export interface SSOConfiguration {
  sso_enabled: boolean;
  provider_type: 'SAML_2_0' | 'OIDC_GOOGLE' | 'OIDC_OKTA' | 'AZURE_AD';
  idp_entity_id: string;
  idp_sso_url: string;
  sp_entity_id: string;
  sp_acs_url: string;
  x509_cert_fingerprint: string;
  enforce_sso_only: boolean;
  default_provisioning_role: string;
  auto_provision_jit: boolean;
  domain_whitelists: string[];
  last_metadata_sync: string;
}

export interface EnterpriseUser {
  user_id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SECOPS_ADMIN' | 'BRAND_MANAGER' | 'CAB_APPROVER' | 'ANALYST_VIEWER';
  auth_method: string;
  status: 'ACTIVE' | 'SUSPENDED';
  last_active: string;
  sessions_count: number;
}

export interface ActiveSession {
  session_id: string;
  user_id: string;
  user_email: string;
  tenant_id: string;
  role: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  status: string;
}

export interface RBACRoleSummary {
  role: string;
  permission_count: number;
  permissions: string[];
}

// -----------------------------------------------------------------------------
// Enterprise Metered Token Usage & Stripe Billing Interfaces (Option 3)
// -----------------------------------------------------------------------------
export interface ModelUsageMetric {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface TokenUsageSummary {
  monthly_quota_tokens: number;
  tokens_consumed_month: number;
  tokens_remaining: number;
  quota_used_percentage: number;
  is_soft_quota_warning: boolean;
  is_hard_quota_exceeded: boolean;
  cache_hits_month: number;
  tokens_saved_by_cache: number;
  estimated_cache_savings_usd: number;
  proxy_requests_month: number;
  proxy_bandwidth_mb: number;
  total_model_cost_usd: number;
  per_model_breakdown: Record<string, ModelUsageMetric>;
}

export interface EnterpriseSubscription {
  tier_id: string;
  tier_name: string;
  status: string;
  billing_interval: string;
  amount_usd: number;
  current_period_start: string;
  current_period_end: string;
  seats_included: number;
  seats_allocated: number;
  included_monthly_tokens: number;
  overage_rate_per_million: number;
  sla_tier: string;
  dedicated_kms: boolean;
  stripe_customer_id: string;
  payment_method: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface BillingInvoice {
  invoice_id: string;
  period: string;
  date: string;
  amount_usd: number;
  status: 'PAID' | 'OPEN' | 'VOID';
  items: InvoiceItem[];
}

export interface BoardReportMetadata {
  report_id: string;
  brand_name: string;
  report_type: string;
  generated_at: string;
  auditor_identity: string;
  is_confidential: boolean;
  cryptographic_sha256_seal: string;
  soc2_compliance_verified: boolean;
}

export interface ExecutiveSummarySection {
  aggregate_score: number;
  grade: string;
  market_standing: string;
  thirty_day_score_delta: number;
  executive_overview: string;
  top_strategic_strengths: string[];
  urgent_vulnerabilities: string[];
}

export interface DimensionScoreItem {
  key: string;
  name: string;
  weight: number;
  raw_score: number;
  uncertainty: number;
  penalized_score: number;
  status: string;
  executive_takeaway: string;
}

export interface BoardReportPackage {
  metadata: BoardReportMetadata;
  executive_summary: ExecutiveSummarySection;
  dimensions_breakdown: DimensionScoreItem[];
  gsov_leaderboard: any[];
  citation_gaps_summary: any;
  hallucination_entropy_audit: any;
  kdd_optimization_lift: any;
  econometric_roi_forecast: any;
  custom_board_notes?: string;
  printable_html?: string;
}

export interface ReportHistoryItem {
  report_id: string;
  report_type: string;
  generated_at: string;
  brand_name: string;
  aggregate_score: number;
  grade: string;
  sha256_seal: string;
  status: string;
}

export interface IngestionResult {
  ingest_id: string;
  target_url: string;
  domain: string;
  brand_name: string;
  crawled_at: string;
  crawl_depth: string;
  html_bytes_received: number;
  sanitization: {
    extracted_text: string;
    pruned_elements_count: number;
    security_flags: string[];
    is_safe: boolean;
  };
  brand_schema: {
    brand_name: string;
    canonical_domain: string;
    primary_industry: string;
    value_proposition: string;
    core_products_services: string[];
    key_differentiators: string[];
    verifiable_statistics: string[];
    authoritative_sources_cited: string[];
    identified_competitors: string[];
    wikidata_entity_id: string | null;
    confidence_score: number;
  };
  generated_schemas: EntitySchemaResult;
  generated_llms_txt: LlmsTxtResult;
  baseline_perception_score: CompositePerceptionResult;
  baseline_sov: SovAnalysisResult;
  total_cold_prompts_generated: number;
  sha256_ingest_seal: string;
  security_clearance: string;
  status: string;
}

export interface IngestedDomainRecord {
  ingest_id: string;
  domain: string;
  brand_name: string;
  crawled_at: string;
  aggregate_score: number;
  grade: string;
  security_clearance: string;
  sha256_seal: string;
}

export interface CrawlRequestPayload {
  url_or_domain: string;
  crawl_depth?: string;
  strip_injections?: boolean;
  raw_html?: string;
}

export interface RegionalNodeCluster {
  region_id: string;
  region_name: string;
  location: string;
  active_residential_ips: number;
  total_residential_pool: number;
  health_score: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  egress_bandwidth_gb: number;
  primary_asns: string[];
  circuit_breaker_status: 'NORMAL' | 'DEGRADED' | 'FAILOVER';
  active_sessions_count: number;
  last_probe_timestamp: string;
}

export interface EngineLatencyMetric {
  engine_id: string;
  engine_name: string;
  target_endpoint: string;
  latencies_by_region: Record<string, number>;
  packet_loss_pct: number;
  http_status_code: number;
  tls_handshake_ms: number;
  status: 'OPTIMAL' | 'GOOD' | 'DEGRADED';
}

export interface TlsFingerprintProfile {
  profile_id: string;
  emulation_target: string;
  ja3_hash: string;
  ja3_raw: string;
  ja4_hash: string;
  h2_settings: Record<string, any>;
  cipher_suites_count: number;
  active: boolean;
  last_rotated_timestamp: string;
  evasion_success_rate: number;
}

export interface SyntheticProbeHop {
  hop: number;
  ip_segment: string;
  asn: string;
  rtt_ms: number;
  location: string;
}

export interface SyntheticProbeResult {
  probe_id: string;
  timestamp: string;
  region_id: string;
  region_name: string;
  target_engine: string;
  target_endpoint: string;
  round_trip_ms: number;
  dns_lookup_ms: number;
  tcp_connect_ms: number;
  tls_handshake_ms: number;
  ttfb_ms: number;
  status_code: number;
  ja3_used: string;
  anti_bot_evasion: string;
  hops: SyntheticProbeHop[];
}

export interface ProxyClusterStatus {
  cluster_version: string;
  total_active_nodes: number;
  total_residential_pool: number;
  global_avg_latency_ms: number;
  global_p95_latency_ms: number;
  active_sessions: number;
  total_bandwidth_served_tb: number;
  anti_detection_evasion_rate: number;
  circuit_breakers_tripped: number;
  regions: RegionalNodeCluster[];
  active_tls_profile: TlsFingerprintProfile;
  tls_profiles: TlsFingerprintProfile[];
  last_updated: string;
}

export interface AdversarialAttackVector {
  vector_id: string;
  name: string;
  category: 'INDIRECT_PROMPT_INJECTION' | 'SENTIMENT_POISONING' | 'CITATION_SQUATTING' | 'HALLUCINATION_EXPLOIT' | 'CONTEXT_SMUGGLING';
  threat_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  sample_payload: string;
  simulation_status: 'NEUTRALIZED' | 'BLOCKED' | 'DETECTED' | 'FLAGGED' | 'VULNERABLE';
  mitigation_guardrail: string;
  resilience_score: number;
  execution_latency_ms: number;
}

export interface AttackCategoryScore {
  category: string;
  category_name: string;
  score: number;
  attacks_tested: number;
  attacks_blocked: number;
  status: 'ROBUST' | 'SECURED' | 'ADEQUATE' | 'ATTENTION';
}

export interface PenTestReport {
  test_id: string;
  brand_name: string;
  timestamp: string;
  overall_robustness_score: number;
  grade: string;
  risk_level: string;
  total_vectors_tested: number;
  vectors_neutralized: number;
  neutralization_rate_pct: number;
  categories: AttackCategoryScore[];
  vectors: AdversarialAttackVector[];
  remediation_steps: string[];
  audit_seal: string;
}

export interface HardeningPatchResult {
  patch_id: string;
  brand_name: string;
  applied_at: string;
  previous_score: number;
  new_robustness_score: number;
  patched_vectors_count: number;
  synthesized_schema_anchor: string;
  synthesized_llms_txt_rules: string[];
  honeypot_canary_registered: string;
  status: string;
}

export interface KnowledgeGraphClaimTriple {
  property_id: string;
  property_name: string;
  value: string;
  datatype: string;
  verification_status: 'VERIFIED' | 'UNCONFIRMED' | 'DISCREPANCY_DETECTED' | 'MISSING_IN_WIKIDATA';
  source_references: string[];
  confidence_score: number;
}

export interface CrossGraphEntityMapping {
  wikidata_qid: string;
  wikipedia_url: string;
  google_kg_mid: string;
  crunchbase_url: string;
  linkedin_url: string;
  schema_org_same_as_links: string[];
}

export interface KnowledgeGraphAuditReport {
  brand_name: string;
  wikidata_qid: string;
  authority_score: number;
  grade: string;
  disambiguation_strength: 'TIER_1_GLOBAL_AUTHORITY' | 'WELL_DISAMBIGUATED' | 'MODERATE_DISAMBIGUATION';
  triples_verified_count: number;
  discrepancies_count: number;
  claims: KnowledgeGraphClaimTriple[];
  mappings: CrossGraphEntityMapping;
  quickstatements_script: string;
  rdf_turtle_payload: string;
  audit_seal: string;
  last_synced_at: string;
}

export interface QuickStatementsPatch {
  patch_id: string;
  brand_name: string;
  wikidata_qid: string;
  quickstatements_v2_code: string;
  turtle_rdf: string;
  updated_authority_score: number;
  generated_at: string;
}

export interface KnowledgeGraphSyncResponse {
  status: string;
  brand_name: string;
  wikidata_qid: string;
  same_as_links_injected: number;
  canonical_endpoints: string[];
  sha256_sync_seal: string;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Frontier AI Algorithm Volatility & Search Engine IndexWatch Interfaces
// -----------------------------------------------------------------------------
export interface EngineVolatilityMetric {
  engine_id: string;
  engine_name: string;
  volatility_score: number;
  status_level: 'CALM' | 'MODERATE' | 'HIGH' | 'STORM';
  citation_turnover_rate: number;
  rank_variance: number;
  diversity_entropy: number;
  status_color: string;
  historical_7d: number[];
}

export interface DetectedAlgorithmUpdate {
  update_id: string;
  affected_engine: string;
  engine_id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'ELEVATED' | 'ROUTINE';
  detected_at: string;
  impacted_sectors: string[];
  confirmed_markers: string[];
  recommended_action: string;
}

export interface EmergencyHedgePlaybook {
  playbook_id: string;
  title: string;
  description: string;
  trigger_threshold: number;
  category: 'TRIPLE_GROUNDING' | 'CITATION_INJECTION' | 'HIGH_ENTROPY_SNIPPET';
  action_steps: string[];
  estimated_lift_recovery: string;
  execution_time_seconds: number;
  is_automated: boolean;
}

export interface SeismographDataPoint {
  date: string;
  composite_volatility: number;
  openai_searchgpt: number;
  google_aio: number;
  perplexity_pro: number;
  claude_search: number;
  grok_realtime: number;
  active_update_event?: string | null;
}

export interface IndexWatchRadarReport {
  brand_name: string;
  composite_volatility_score: number;
  system_status: 'CALM' | 'MODERATE' | 'HIGH' | 'STORM';
  active_turbulent_engines: number;
  engine_metrics: EngineVolatilityMetric[];
  seismograph_30d: SeismographDataPoint[];
  detected_updates: DetectedAlgorithmUpdate[];
  available_playbooks: EmergencyHedgePlaybook[];
  active_defense_hedges: number;
  audit_hash: string;
  generated_at: string;
}

export interface HedgeExecutionResult {
  execution_id: string;
  playbook_id: string;
  title: string;
  brand_name: string;
  status: string;
  actions_executed: string[];
  simulated_gsov_recovery_lift: string;
  volatility_relief_delta: string;
  execution_duration_sec: number;
  executed_at: string;
  hmac_signature: string;
}

// -----------------------------------------------------------------------------
// Self-Healing GEO Bot Traffic Analyzer & Edge WAF Armor Interfaces
// -----------------------------------------------------------------------------
export interface AiBotCrawlerMetric {
  bot_id: string;
  bot_name: string;
  user_agent_pattern: string;
  operator: string;
  purpose: string;
  is_verified_asn: boolean;
  requests_24h: number;
  bandwidth_mb_24h: number;
  avg_latency_ms: number;
  crawl_depth_avg: number;
  status_level: 'HEALTHY_INGESTION' | 'THROTTLED' | 'BLOCKED' | 'AGGRESSIVE';
  primary_targets: string[];
}

export interface CrawlTrafficEvent {
  event_id: string;
  timestamp: string;
  bot_id: string;
  bot_name: string;
  client_ip: string;
  client_asn: string;
  requested_path: string;
  http_status: number;
  response_time_ms: number;
  action_taken: 'SERVED_FROM_CACHE' | 'ALLOWED' | 'RATE_LIMITED' | 'BLOCKED';
}

export interface EdgeWafRuleSet {
  provider: 'CLOUDFLARE_WAF' | 'FASTLY_VCL' | 'AWS_WAF_ACL' | 'NGINX_INGRESS';
  policy_mode: 'GEO_OPTIMIZED_OPEN' | 'SELECTIVE_ARMOR' | 'AGGRESSIVE_RATE_LIMIT';
  rule_name: string;
  description: string;
  config_format: 'EXPRESSION' | 'VCL' | 'JSON' | 'NGINX_CONF';
  rule_content: string;
  generated_at: string;
}

export interface BotArmorTelemetryReport {
  brand_name: string;
  total_bot_requests_24h: number;
  edge_bandwidth_saved_gb: number;
  crawl_efficiency_score: number;
  active_policy_mode: 'GEO_OPTIMIZED_OPEN' | 'SELECTIVE_ARMOR' | 'AGGRESSIVE_RATE_LIMIT';
  crawlers: AiBotCrawlerMetric[];
  recent_events: CrawlTrafficEvent[];
  active_rulesets: EdgeWafRuleSet[];
  audit_hash: string;
  generated_at: string;
}

export interface PolicySwitchResult {
  switch_id: string;
  old_policy: string;
  new_policy: string;
  status: string;
  active_crawlers_affected: number;
  switched_at: string;
  hmac_seal: string;
}

// Agency & Multi-Tenant White-Label Types
export interface WhiteLabelConfig {
  agency_display_name: string;
  logo_url: string;
  favicon_url: string;
  primary_accent_hex: string;
  obsidian_theme_variant: string;
  support_email: string;
  email_sender_name: string;
  remove_watermark: boolean;
  custom_footer_text: string;
  custom_login_banner: string;
}

export interface CustomDomainStatus {
  custom_cname_domain: string;
  target_cname: string;
  dns_txt_verification_token: string;
  cname_verified: boolean;
  ssl_status: 'ACTIVE' | 'PROVISIONING' | 'PENDING_VALIDATION' | 'FAILED';
  auto_https_redirect: boolean;
  last_verified_at: string;
}

export interface ClientWorkspace {
  client_id: string;
  brand_name: string;
  client_domain: string;
  primary_industry: string;
  subscription_tier: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'SUSPENDED';
  allocated_monthly_tokens: number;
  tokens_consumed_month: number;
  composite_perception_score: number;
  generative_sov_pct: number;
  total_cold_prompts_active: number;
  active_users_count: number;
  created_at: string;
}

export interface ClientUserAccess {
  user_id: string;
  email: string;
  full_name: string;
  role: 'AGENCY_SUPERADMIN' | 'AGENCY_ACCOUNT_MANAGER' | 'CLIENT_EXECUTIVE' | 'CLIENT_TECHNICAL_LEAD';
  assigned_client_ids: string[];
  status: 'ACTIVE' | 'INVITED' | 'LOCKED';
  last_login_at: string;
  mfa_enabled: boolean;
}

export interface ReportDispatchSchedule {
  schedule_id: string;
  client_id: string;
  client_brand_name: string;
  cadence: 'WEEKLY_MONDAY' | 'BI_WEEKLY' | 'MONTHLY_FIRST';
  recipient_emails: string[];
  include_executive_summary: boolean;
  include_sov_breakdown: boolean;
  include_kdd_diffs: boolean;
  include_bot_telemetry: boolean;
  next_dispatch_at: string;
  last_dispatched_at?: string;
  dispatch_status: 'SCHEDULED' | 'DISPATCHED_SUCCESS' | 'PAUSED';
}

export interface AgencyOrganization {
  agency_id: string;
  agency_name: string;
  primary_domain: string;
  tier: string;
  max_client_workspaces: number;
  active_client_workspaces: number;
  total_allocated_tokens: number;
  total_consumed_tokens: number;
  white_label_config: WhiteLabelConfig;
  custom_domain_status: CustomDomainStatus;
  created_at: string;
}

// Competitor Counter-Positioning & Search Siphoning Types
export interface CompetitorEntity {
  competitor_id: string;
  name: string;
  domain: string;
  current_gsov_pct: number;
  citation_authority_score: number;
  vulnerability_tags: string[];
  vulnerable_prompt_clusters: string[];
  head_to_head_win_rate: number;
}

export interface CounterPositioningLever {
  dimension_key: string;
  dimension_name: string;
  competitor_drawback: string;
  brand_superiority: string;
  lift_impact_pct: number;
  factual_evidence_url: string;
}

export interface ComparisonMatrixItem {
  dimension_name: string;
  brand_capability: string;
  competitor_capability: string;
  winner: 'BRAND_SUPERIOR' | 'FEATURE_PARITY' | 'COMPETITOR_EDGE';
}

export interface SiphoningStrategyPayload {
  strategy_id: string;
  target_competitor: string;
  comparative_angle: 'PERFORMANCE_ARCHITECTURE' | 'ENTERPRISE_SECURITY' | 'PRICING_TRANSPARENCY' | 'DEVELOPER_EXTENSIBILITY';
  suggested_page_title: string;
  meta_description: string;
  matrix_items: ComparisonMatrixItem[];
  html_comparison_table: string;
  schema_jsonld_table: Record<string, any>;
  predicted_gsov_siphoning_lift: number;
  recommended_route: string;
  generated_at: string;
}

export interface SiphoningLiftSimulationResult {
  simulation_id: string;
  brand_name: string;
  target_competitor: string;
  baseline_brand_gsov: number;
  baseline_competitor_gsov: number;
  projected_brand_gsov: number;
  projected_competitor_gsov: number;
  net_siphoned_market_share: number;
  engine_breakdown: Record<string, { baseline_brand: number; post_brand: number; baseline_comp: number; post_comp: number }>;
  prompt_clusters_flipped: number;
  simulated_at: string;
}

export interface CompetitorSiphoningReport {
  brand_name: string;
  total_competitors_tracked: number;
  total_vulnerabilities_cataloged: number;
  potential_siphoned_sov_pct: number;
  competitors: CompetitorEntity[];
  active_campaign_routes: string[];
  audit_hash: string;
  generated_at: string;
}

// Multi-Model Consensus & Hallucination Dispute Tribunal Types
export interface ModelClaimVote {
  model_id: string;
  model_name: string;
  engine_provider: string;
  stance: 'AFFIRMATIVE' | 'NEGATIVE' | 'CONTRADICTORY' | 'UNRESOLVED';
  confidence_score: number;
  verbatim_quote: string;
  reasoning_chain: string;
  temporal_anchor_year: number;
}

export interface FactualEvidenceAnchor {
  anchor_id: string;
  source_url: string;
  source_title: string;
  authority_tier: 'PRIMARY_DOCUMENT' | 'OFFICIAL_CERTIFICATION' | 'CODE_MANIFEST' | 'REGULATORY_FILING';
  verified_fact_statement: string;
  evidence_sha256: string;
  last_verified_timestamp: string;
}

export interface TruthReconciliationManifest {
  reconciliation_id: string;
  dispute_id: string;
  brand_name: string;
  contested_dimension: string;
  adjudicated_verdict: string;
  confidence_level: number;
  culprit_models: string[];
  hallucination_classification: 'ENTITY_CONFUSION' | 'TEMPORAL_DRIFT' | 'QUANTITATIVE_MISQUOTATION' | 'FABRICATED_CONSTRAINT';
  schema_claim_review_jsonld: Record<string, any>;
  provider_errata_payload: Record<string, any>;
  cryptographic_seal_hmac: string;
  created_at: string;
}

export interface DisputeCase {
  dispute_id: string;
  brand_name: string;
  contested_query: string;
  contested_dimension: string;
  severity: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'RESOLVED';
  status: 'ADJUDICATED' | 'UNDER_DEBATE' | 'DISPATCHED';
  semantic_dispute_index: number;
  fleiss_kappa_agreement: number;
  model_votes: ModelClaimVote[];
  evidence_anchors: FactualEvidenceAnchor[];
  adjudicated_manifest?: TruthReconciliationManifest;
  last_detected_at: string;
}

export interface DisputeTribunalReport {
  brand_name: string;
  total_disputes_tracked: number;
  active_critical_cases: number;
  overall_resolution_rate_pct: number;
  average_semantic_dispute_index: number;
  truth_seals_minted: number;
  dispute_cases: DisputeCase[];
  edge_corrections_route: string;
}

// Programmatic Citation Grounding & Authority Seed Network Types
export interface AuthoritySeedDomain {
  domain: string;
  display_name: string;
  category: 'TECHNICAL_COMMUNITY' | 'PEER_REVIEW' | 'MEDIA_PRESS' | 'ENTERPRISE_SOFTWARE_PORTAL' | 'ACADEMIC_PREPRINT';
  citation_authority_score: number;
  rag_indexing_frequency: number;
  primary_crawler_affinities: string[];
  top_ingested_query_clusters: string[];
  monthly_crawled_urls: number;
}

export interface GroundingThreadOpportunity {
  opportunity_id: string;
  brand_name: string;
  platform: 'REDDIT' | 'GITHUB' | 'ARXIV' | 'TECH_MEDIA' | 'G2_REVIEW' | 'STACKOVERFLOW' | 'HACKER_NEWS' | 'TECHNICAL_COMMUNITY';
  target_url: string;
  discussion_title: string;
  thread_authority_weight: number;
  competitor_mentions_count: number;
  competitors_cited: string[];
  brand_citation_status: 'CITED' | 'UNCITED_GAP' | 'INACCURATE_MENTION';
  target_anchor_phrase: string;
  estimated_gsov_impact_pct: number;
  campaign_status: 'IDENTIFIED' | 'SEEDED_SUBMITTED' | 'VERIFIED_CITED_BY_AI';
  discovered_at: string;
}

export interface SeedingPlaybook {
  playbook_id: string;
  opportunity_id: string;
  brand_name: string;
  target_platform: string;
  target_url: string;
  recommended_contributor_persona: 'SENIOR_ARCHITECT' | 'DEVREL_LEAD' | 'BENCHMARK_RESEARCHER';
  draft_technical_response: string;
  statistical_quotation_hook: string;
  kdd_factual_anchor: string;
  target_citations: string[];
  compliance_checklist: string[];
  generated_at: string;
}

export interface CitationSeedNetworkReport {
  brand_name: string;
  total_seed_domains_tracked: number;
  active_unclaimed_gaps: number;
  potential_citation_lift_pct: number;
  verified_ai_citations_won: number;
  average_domain_authority: number;
  seed_domains: AuthoritySeedDomain[];
  opportunities: GroundingThreadOpportunity[];
  active_playbooks: SeedingPlaybook[];
  audit_hash: string;
  generated_at: string;
}

// Autonomous GEO A/B Variant Autopilot & Edge Sandbox Types
export interface ContentVariant {
  variant_id: string;
  variant_label: string;
  applied_kdd_levers: string[];
  content_snippet: string;
  schema_jsonld: Record<string, any>;
  extractability_score: number;
  token_size: number;
}

export interface BayesianMetrics {
  prior_alpha: number;
  prior_beta: number;
  posterior_alpha: number;
  posterior_beta: number;
  expected_win_rate: number;
  credible_interval_low: number;
  credible_interval_high: number;
  prob_variant_superior: number;
  bayes_factor: number;
  sample_size: number;
}

export interface EdgeRoutingConfig {
  edge_provider: 'CLOUDFLARE_WORKERS' | 'VERCEL_EDGE' | 'FASTLY_COMPUTE';
  traffic_split_ratio: string;
  bot_routing_mode: 'SPLIT_ALL' | 'BOTS_ONLY' | 'HUMANS_ONLY';
  generated_worker_script: string;
}

export interface GeoExperiment {
  experiment_id: string;
  brand_name: string;
  target_route: string;
  page_title: string;
  experiment_status: 'ACTIVE_RUNNING' | 'CONVERGED_SIGNIFICANT' | 'PROMOTED_TO_PROD' | 'PAUSED';
  control_variant: ContentVariant;
  challenger_variant: ContentVariant;
  total_synthetic_probes: number;
  engine_win_rates: Record<string, { control_win_rate: number; challenger_win_rate: number }>;
  bayesian_metrics: BayesianMetrics;
  edge_routing: EdgeRoutingConfig;
  gitops_pr_data?: {
    pr_number: number;
    branch_name: string;
    pr_title: string;
    repo_url?: string;
    pr_url?: string;
    status: string;
    ci_checks_status?: string;
    predicted_citation_lift?: number;
    promotion_channel?: string;
    promoted_at?: string;
    cryptographic_seal?: string;
  } | null;
  last_evaluated_at: string;
}

export interface AutopilotReport {
  brand_name: string;
  active_experiments_count: number;
  statistical_convergence_rate_pct: number;
  average_citation_lift_pct: number;
  auto_promoted_winners_count: number;
  experiments: GeoExperiment[];
  audit_hash: string;
  generated_at: string;
}

// Negative SEO & Knowledge Graph Poisoning Defense Sentinel Types
export interface PoisoningAttackVector {
  threat_id: string;
  target_source: 'WIKIDATA_REVISION' | 'DBPEDIA_TRIPLE' | 'COMMONS_CRAWL_CONTAMINATION' | 'REDDIT_SYBIL_CAMPAIGN' | 'SPOOFED_BENCHMARK';
  severity: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
  contested_property: string;
  malicious_assertion: string;
  authoritative_fact: string;
  culprit_attribution: string;
  detected_at: string;
  neutralization_status: 'DETECTED_UNRESOLVED' | 'COUNTER_PATCH_SYNTHESIZED' | 'DISCLAIMER_DISPATCHED' | 'NEUTRALIZED';
}

export interface AuthoritativeSparqlAssertion {
  assertion_id: string;
  subject_qid: string;
  predicate_uri: string;
  object_value: string;
  proof_source: string;
  evidence_sha256: string;
  verified_at: string;
}

export interface DefensiveCounterPatch {
  patch_id: string;
  threat_id: string;
  target_platform: 'WIKIDATA_QUICKSTATEMENTS' | 'SCHEMA_CLAIM_REVIEW' | 'EDGE_DISCLAIMER_ROUTE' | 'RAG_ERRATA_PAYLOAD';
  quickstatements_v2_code: string;
  schema_claim_review_jsonld: Record<string, any>;
  provider_errata_payload: Record<string, any>;
  cryptographic_hmac_seal: string;
  generated_at: string;
}

export interface KnowledgePoisoningReport {
  brand_name: string;
  total_threats_monitored: number;
  active_critical_poisonings: number;
  graph_integrity_score_pct: number;
  automated_neutralization_rate_pct: number;
  threat_vectors: PoisoningAttackVector[];
  authoritative_assertions: AuthoritativeSparqlAssertion[];
  active_patches: DefensiveCounterPatch[];
  audit_hash: string;
  generated_at: string;
}

// Conversational AI Purchase Intent & Multi-Turn Buyer Journey Simulator Types
export interface BuyerPersona {
  persona_id: string;
  title: string;
  department: string;
  evaluation_focus: string;
  weight_pct: number;
  funnel_conversion_rate_pct: number;
  primary_objection: string;
  decision_triggers: string[];
}

export interface JourneyTurn {
  turn_number: number;
  stage: 'DISCOVERY' | 'TECHNICAL_COMPARISON' | 'SECURITY_COMPLIANCE' | 'COMMERCIAL_PROCUREMENT';
  stage_label: string;
  user_prompt: string;
  model_engine: string;
  model_response_excerpt: string;
  recommendation_status: 'PRIMARY_RECOMMENDED' | 'MENTIONED_ALTERNATIVE' | 'OMITTED' | 'DISQUALIFIED';
  sentiment_score: number;
  detected_objections: string[];
  citations_grounded: string[];
}

export interface JourneySimulation {
  simulation_id: string;
  brand_name: string;
  persona_id: string;
  persona_title: string;
  target_engine: string;
  total_turns: number;
  overall_outcome: 'WON_RECOMMENDATION' | 'LOST_TO_COMPETITOR' | 'TIED_CONSIDERATION';
  conversion_probability_pct: number;
  turns: JourneyTurn[];
  key_takeaways: string[];
  simulated_at: string;
}

export interface ObjectionPreemptionPatch {
  patch_id: string;
  objection_tag: string;
  affected_personas: string[];
  preemption_title: string;
  recommended_copy: string;
  target_destination: 'LLMS_TXT_FAQ' | 'SCHEMA_FAQ_PAGE' | 'MARKETING_SPEC_TABLE' | 'SECURITY_PORTAL';
  schema_faq_jsonld: Record<string, any>;
  llms_txt_block: string;
  predicted_csor_lift_pct: number;
  implementation_status: 'READY_TO_DEPLOY' | 'DEPLOYED_EDGE_ACTIVE';
  generated_at: string;
}

export interface BuyerJourneyReport {
  brand_name: string;
  overall_csor_pct: number;
  total_simulations_executed: number;
  persona_win_rates: Record<string, number>;
  funnel_stage_conversion: Record<string, number>;
  personas: BuyerPersona[];
  recent_simulations: JourneySimulation[];
  objection_patches: ObjectionPreemptionPatch[];
  top_objection_clusters: Array<{ objection_tag: string; frequency: number; status: string }>;
  audit_hash: string;
  generated_at: string;
}

// Sandboxed Headless Crawler & Recursive Brand Ingestion Types
export interface CrawlPageNode {
  page_id: string;
  url: string;
  route_path: string;
  page_title: string;
  http_status: number;
  byte_size: number;
  word_count: number;
  security_clearance: 'PASSED_ZERO_TRUST' | 'FLAGGED_INJECTION';
  pruned_elements_count: number;
  extracted_claims: string[];
  detected_injections: string[];
  kdd_recommended_levers: string[];
  predicted_citation_lift_pct: number;
  crawled_at: string;
}

export interface SitemapRoute {
  route_path: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastmod: string;
  crawl_status: 'CRAWLED_SUCCESS' | 'PENDING_DISCOVERY' | 'SKIPPED_NOINDEX';
}

export interface ContextWindowMetrics {
  total_tokens: number;
  gpt6_astra_utilization_pct: number;
  claude_fable_utilization_pct: number;
  gemini_37_flash_utilization_pct: number;
  estimated_context_fit_grade: 'OPTIMAL_FIT' | 'ELEVATED_USAGE' | 'OVERFLOW_RISK';
}

export interface AutonomousIngestionReport {
  ingest_id: string;
  brand_name: string;
  root_domain: string;
  root_url: string;
  crawl_depth_executed: string;
  total_pages_discovered: number;
  total_pages_crawled: number;
  sitemap_routes: SitemapRoute[];
  crawled_pages: CrawlPageNode[];
  context_window_metrics: ContextWindowMetrics;
  unified_llms_full_txt: string;
  multi_page_schema_jsonld: Record<string, any>;
  aggregate_security_clearance: string;
  sha256_ingest_seal: string;
  crawled_at: string;
}

// -----------------------------------------------------------------------------
// Real-Time Frontier AI Query Seismograph & Push Notification Center Types
// -----------------------------------------------------------------------------
export interface SeismographShockwave {
  shock_id: string;
  engine_id: string;
  engine_name: string;
  magnitude_richter: number;
  volatility_v_algo: number;
  dominant_anomaly_type: 'CITATION_PURGE' | 'GROUNDING_TURNOVER' | 'WEIGHTING_REBALANCE' | 'HALLUCINATION_OUTLIER' | string;
  impacted_queries_count: number;
  detected_at: string;
  status: 'ACTIVE_SURGE' | 'CONTAINED_BY_HEDGE' | 'RESOLVED' | string;
}

export interface PushNotificationEvent {
  event_id: string;
  brand_name: string;
  event_type: 'VOLATILITY_SPIKE' | 'POISONING_ATTACK_DETECTED' | 'BUYER_OBJECTION_SURFACED' | 'CITATION_EROSION_EVENT' | 'GITOPS_PROMOTION_READY' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | string;
  title: string;
  message: string;
  metric_payload: Record<string, any>;
  target_channels: string[];
  dispatch_status: 'DISPATCHED_DELIVERED' | 'QUEUED' | 'RETRYING' | string;
  dispatched_at: string;
  cryptographic_hmac_seal: string;
}

export interface NotificationChannelConfig {
  channel_id: string;
  channel_name: string;
  channel_type: 'SLACK' | 'DISCORD' | 'TEAMS' | 'PAGERDUTY' | 'EMAIL' | 'WEBHOOK' | string;
  destination_target: string;
  is_active: boolean;
  subscribed_events: string[];
  last_ping_status: '200_OK' | 'DEGRADED' | 'PENDING' | string;
  total_alerts_sent: number;
  created_at: string;
}

export interface SeismographLiveTelemetry {
  brand_name: string;
  current_composite_volatility: number;
  global_alert_level: 'CALM' | 'MODERATE' | 'ELEVATED' | 'STORM' | string;
  active_shockwaves: SeismographShockwave[];
  recent_notifications: PushNotificationEvent[];
  notification_channels: NotificationChannelConfig[];
  total_alerts_dispatched_24h: number;
  audit_hash: string;
  generated_at: string;
}

// -----------------------------------------------------------------------------
// Automated SOC2 Type II Continuous Compliance & Merkle Proof Types
// -----------------------------------------------------------------------------
export interface SOC2ControlItem {
  control_id: string;
  category: 'SECURITY' | 'AVAILABILITY' | 'PROCESSING_INTEGRITY' | 'CONFIDENTIALITY' | 'PRIVACY' | string;
  title: string;
  description: string;
  evidence_tier: 'OBSERVED' | 'INFERRED' | 'MODEL_GENERATED' | 'USER_PROVIDED' | string;
  test_method: 'AUTOMATED_CONTINUOUS_TELEMETRY' | 'CRYPTOGRAPHIC_WORM_VALIDATION' | 'STATIC_POLICY_VERIFICATION' | string;
  compliance_status: 'PASSED_COMPLIANT' | 'ACTION_REQUIRED' | 'EXEMPT' | string;
  last_evaluated_at: string;
  automated_telemetry: Record<string, any>;
  auditor_guidance: string;
}

export interface TrustServiceCategoryScore {
  category: string;
  name: string;
  total_controls: number;
  passed_controls: number;
  compliance_pct: number;
  status: 'COMPLIANT_CERTIFIED' | 'DEGRADED' | 'NON_COMPLIANT' | string;
}

export interface MerkleAuditBlock {
  block_index: number;
  timestamp: string;
  log_id: string;
  action_type: string;
  actor_id: string;
  previous_block_hash: string;
  data_hash: string;
  block_hash: string;
}

export interface MerkleAuditProof {
  log_id: string;
  block_index: number;
  block_hash: string;
  merkle_root: string;
  proof_path: Array<{ side: string; hash: string }>;
  is_valid: boolean;
  verified_at: string;
}

export interface SOC2CompliancePackage {
  report_id: string;
  brand_name: string;
  auditor_org: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  overall_compliance_pct: number;
  trust_services_scores: TrustServiceCategoryScore[];
  controls: SOC2ControlItem[];
  merkle_root: string;
  total_merkle_blocks: number;
  cryptographic_seal: string;
  printable_html?: string;
}

export interface SOC2ComplianceReport {
  brand_name: string;
  overall_compliance_pct: number;
  overall_status: string;
  evaluated_at: string;
  total_controls_count: number;
  passed_controls_count: number;
  trust_services_scores: TrustServiceCategoryScore[];
  controls: SOC2ControlItem[];
  merkle_root: string;
  total_merkle_blocks: number;
}



