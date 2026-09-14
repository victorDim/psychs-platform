"""
Standalone Test Runner for Psychs Backend Engines (Including Production Solutions & Live Gateway)
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tests.test_sanitizer import (
    test_ast_strips_hidden_elements,
    test_ast_strips_zero_width_unicode,
    test_indirect_prompt_injection_flag
)
from tests.test_composite_score import (
    test_composite_scoring_calculation,
    test_severe_uncertainty_degrades_score
)
from tests.test_semantic_entropy import (
    test_stable_semantic_entropy,
    test_divergent_hallucination_entropy
)
from tests.test_kdd_optimizer import (
    test_kdd_optimizer_levers_and_lift,
    test_dynamic_router_classification,
    test_unit_economics_gross_margin,
    test_two_tier_cache_hit,
    test_mcp_permission_enforcement
)
from tests.test_production_solutions import (
    test_canary_drift_engine_divergence,
    test_adaptive_sprt_sampler_early_exit,
    test_gitops_pr_automation_and_multisig,
    test_econometric_causal_attribution
)
from tests.test_live_gateway import (
    test_config_masking_and_updates,
    test_live_connectors_circuit_breaker,
    test_residential_proxy_health,
    test_connection_ping_diagnostics
)
from tests.test_scheduler_and_billing import (
    test_async_task_queue_priority_and_execution,
    test_audit_scheduler_recurrence_and_trigger,
    test_webhook_dispatcher_hmac_and_templates,
    test_rbac_matrix_permissions_enforcement,
    test_sso_saml_assertion_and_session_jwt,
    test_metered_token_quota_and_cache_savings
)
from tests.test_multibrand_simulation import (
    test_multibrand_scoring_and_isolation
)
from tests.test_reporting_engine import (
    test_board_report_generation_and_seal,
    test_historical_report_archive
)
from tests.test_crawler_ingestion import (
    test_autonomous_crawler_and_schema_synthesis,
    test_crawler_prompt_injection_stripping,
    test_ingested_domains_archive_query
)
from tests.test_geo_proxy_cluster import (
    test_geo_proxy_cluster_telemetry_and_regions,
    test_engine_latency_matrix_and_probes,
    test_synthetic_probe_dispatch_and_history,
    test_ja3_fingerprint_rotation
)
from tests.test_adversarial_pentest import (
    test_attack_vector_catalog,
    test_pentest_execution_and_robustness_scoring,
    test_pentest_suite_filtering_and_custom_brand,
    test_defensive_hardening_patch_application
)
from tests.test_knowledge_graph_sync import (
    test_entity_knowledge_graph_resolution_psychs,
    test_entity_knowledge_graph_multibrands,
    test_sparql_query_execution,
    test_quickstatements_and_schema_sync
)
from tests.test_algorithm_volatility_radar import (
    test_radar_report_generation_psychs,
    test_multibrand_volatility_variance,
    test_core_updates_detection_and_filtering,
    test_emergency_hedge_playbook_trigger
)
from tests.test_bot_traffic_analyzer import (
    test_bot_telemetry_calculation_psychs,
    test_multibrand_crawler_variance,
    test_waf_rule_synthesis_all_providers,
    test_policy_mode_switching
)
from tests.test_white_label_portal import (
    test_agency_organization_and_defaults,
    test_client_workspace_provisioning_and_isolation,
    test_custom_cname_verification_and_ssl,
    test_client_user_rbac_and_report_dispatch
)
from tests.test_competitor_counter_positioning import (
    test_competitor_landscape_and_vulnerabilities,
    test_programmatic_strategy_synthesis,
    test_siphoning_lift_simulation,
    test_multibrand_counter_positioning
)
from tests.test_dispute_tribunal import TestDisputeTribunal
from tests.test_citation_seed_network import TestCitationSeedNetwork
from tests.test_geo_variant_autopilot import (
    test_autopilot_report_retrieval_psychs,
    test_bayesian_posterior_and_significance_calculation,
    test_synthetic_evaluation_simulation,
    test_experiment_creation_and_edge_routing,
    test_promote_winner_and_gitops_payload,
    test_multibrand_autopilot_isolation
)
from tests.test_knowledge_poisoning_sentinel import (
    test_sentinel_report_retrieval_psychs,
    test_poisoning_scan_and_threat_detection,
    test_counter_patch_synthesis_and_sparql,
    test_neutralization_dispatch_and_hmac,
    test_multibrand_poisoning_sentinel_isolation
)
from tests.test_buyer_journey_simulator import (
    test_buyer_journey_report_retrieval_psychs,
    test_run_persona_simulation_multi_turn,
    test_objection_preemption_synthesis,
    test_csor_metric_calculation,
    test_multibrand_buyer_journey_isolation
)
from tests.test_headless_crawler import (
    test_headless_crawler_report_retrieval_psychs,
    test_recursive_crawl_execution,
    test_ast_sanitization_multi_page,
    test_llms_full_txt_synthesis,
    test_multibrand_headless_crawler_isolation
)
from tests.test_seismograph_notification_center import TestSeismographNotificationCenter
from tests.test_soc2_compliance_engine import TestSOC2ComplianceEngine
from tests.test_security_phase1 import TestSecurityPhase1
from tests.test_persistence_and_cache_phase2 import (
    test_audit_vault_persistence_and_hydration,
    test_crypto_shredding_persistence_and_cascading_purge,
    test_two_tier_cache_lru_and_inverted_index,
    test_two_tier_cache_ttl_expiration,
    test_async_task_queue_multiworker_and_archive
)
from tests.test_resilience_and_circuit_breaker_phase3 import (
    test_circuit_breaker_state_transitions,
    test_exponential_backoff_and_retry,
    test_multi_region_proxy_failover,
    test_resilience_status_telemetry,
    test_live_engine_dispatcher_circuit_breaking
)
from app.intelligence.geo_variant_autopilot import GeoVariantAutopilotEngine
from app.intelligence.knowledge_poisoning_sentinel import KnowledgePoisoningSentinelEngine
from app.intelligence.buyer_journey_simulator import BuyerJourneySimulatorEngine
from app.ingestion.headless_crawler import HeadlessCrawlerEngine

def run_all():
    tribunal_suite = TestDisputeTribunal()
    tribunal_suite.setUp()
    seed_suite = TestCitationSeedNetwork()
    seed_suite.setUp()
    seismo_suite = TestSeismographNotificationCenter()
    seismo_suite.setUp()
    soc2_suite = TestSOC2ComplianceEngine()
    soc2_suite.setUp()
    sec_phase1 = TestSecurityPhase1()
    autopilot_engine = GeoVariantAutopilotEngine()
    sentinel_engine = KnowledgePoisoningSentinelEngine()
    buyer_journey_engine = BuyerJourneySimulatorEngine()
    headless_crawler = HeadlessCrawlerEngine()
    
    tests = [
        ("test_ast_strips_hidden_elements", test_ast_strips_hidden_elements),
        ("test_ast_strips_zero_width_unicode", test_ast_strips_zero_width_unicode),
        ("test_indirect_prompt_injection_flag", test_indirect_prompt_injection_flag),
        ("test_composite_scoring_calculation", test_composite_scoring_calculation),
        ("test_severe_uncertainty_degrades_score", test_severe_uncertainty_degrades_score),
        ("test_stable_semantic_entropy", test_stable_semantic_entropy),
        ("test_divergent_hallucination_entropy", test_divergent_hallucination_entropy),
        ("test_kdd_optimizer_levers_and_lift", test_kdd_optimizer_levers_and_lift),
        ("test_dynamic_router_classification", test_dynamic_router_classification),
        ("test_unit_economics_gross_margin", test_unit_economics_gross_margin),
        ("test_two_tier_cache_hit", test_two_tier_cache_hit),
        ("test_canary_drift_engine_divergence", test_canary_drift_engine_divergence),
        ("test_adaptive_sprt_sampler_early_exit", test_adaptive_sprt_sampler_early_exit),
        ("test_gitops_pr_automation_and_multisig", test_gitops_pr_automation_and_multisig),
        ("test_econometric_causal_attribution", test_econometric_causal_attribution),
        ("test_config_masking_and_updates", test_config_masking_and_updates),
        ("test_live_connectors_circuit_breaker", test_live_connectors_circuit_breaker),
        ("test_residential_proxy_health", test_residential_proxy_health),
        ("test_connection_ping_diagnostics", test_connection_ping_diagnostics),
        ("test_async_task_queue_priority_and_execution", test_async_task_queue_priority_and_execution),
        ("test_audit_scheduler_recurrence_and_trigger", test_audit_scheduler_recurrence_and_trigger),
        ("test_webhook_dispatcher_hmac_and_templates", test_webhook_dispatcher_hmac_and_templates),
        ("test_rbac_matrix_permissions_enforcement", test_rbac_matrix_permissions_enforcement),
        ("test_sso_saml_assertion_and_session_jwt", test_sso_saml_assertion_and_session_jwt),
        ("test_metered_token_quota_and_cache_savings", test_metered_token_quota_and_cache_savings),
        ("test_multibrand_scoring_and_isolation", test_multibrand_scoring_and_isolation),
        ("test_board_report_generation_and_seal", test_board_report_generation_and_seal),
        ("test_historical_report_archive", test_historical_report_archive),
        ("test_autonomous_crawler_and_schema_synthesis", test_autonomous_crawler_and_schema_synthesis),
        ("test_crawler_prompt_injection_stripping", test_crawler_prompt_injection_stripping),
        ("test_ingested_domains_archive_query", test_ingested_domains_archive_query),
        ("test_geo_proxy_cluster_telemetry_and_regions", test_geo_proxy_cluster_telemetry_and_regions),
        ("test_engine_latency_matrix_and_probes", test_engine_latency_matrix_and_probes),
        ("test_synthetic_probe_dispatch_and_history", test_synthetic_probe_dispatch_and_history),
        ("test_ja3_fingerprint_rotation", test_ja3_fingerprint_rotation),
        ("test_attack_vector_catalog", test_attack_vector_catalog),
        ("test_pentest_execution_and_robustness_scoring", test_pentest_execution_and_robustness_scoring),
        ("test_pentest_suite_filtering_and_custom_brand", test_pentest_suite_filtering_and_custom_brand),
        ("test_defensive_hardening_patch_application", test_defensive_hardening_patch_application),
        ("test_entity_knowledge_graph_resolution_psychs", test_entity_knowledge_graph_resolution_psychs),
        ("test_entity_knowledge_graph_multibrands", test_entity_knowledge_graph_multibrands),
        ("test_sparql_query_execution", test_sparql_query_execution),
        ("test_quickstatements_and_schema_sync", test_quickstatements_and_schema_sync),
        ("test_radar_report_generation_psychs", test_radar_report_generation_psychs),
        ("test_multibrand_volatility_variance", test_multibrand_volatility_variance),
        ("test_core_updates_detection_and_filtering", test_core_updates_detection_and_filtering),
        ("test_emergency_hedge_playbook_trigger", test_emergency_hedge_playbook_trigger),
        ("test_bot_telemetry_calculation_psychs", test_bot_telemetry_calculation_psychs),
        ("test_multibrand_crawler_variance", test_multibrand_crawler_variance),
        ("test_waf_rule_synthesis_all_providers", test_waf_rule_synthesis_all_providers),
        ("test_policy_mode_switching", test_policy_mode_switching),
        ("test_agency_organization_and_defaults", test_agency_organization_and_defaults),
        ("test_client_workspace_provisioning_and_isolation", test_client_workspace_provisioning_and_isolation),
        ("test_custom_cname_verification_and_ssl", test_custom_cname_verification_and_ssl),
        ("test_client_user_rbac_and_report_dispatch", test_client_user_rbac_and_report_dispatch),
        ("test_competitor_landscape_and_vulnerabilities", test_competitor_landscape_and_vulnerabilities),
        ("test_programmatic_strategy_synthesis", test_programmatic_strategy_synthesis),
        ("test_siphoning_lift_simulation", test_siphoning_lift_simulation),
        ("test_multibrand_counter_positioning", test_multibrand_counter_positioning),
        ("test_tribunal_report_retrieval_psychs", tribunal_suite.test_tribunal_report_retrieval_psychs),
        ("test_fleiss_kappa_and_dispute_index_calculation", tribunal_suite.test_fleiss_kappa_and_dispute_index_calculation),
        ("test_case_reconciliation_and_claim_review_schema", tribunal_suite.test_case_reconciliation_and_claim_review_schema),
        ("test_multibrand_dispute_isolation", tribunal_suite.test_multibrand_dispute_isolation),
        ("test_seed_report_retrieval_psychs", seed_suite.test_seed_report_retrieval_psychs),
        ("test_opportunity_docket_filtering", seed_suite.test_opportunity_docket_filtering),
        ("test_playbook_synthesis_and_campaign_update", seed_suite.test_playbook_synthesis_and_campaign_update),
        ("test_multibrand_seed_network_isolation", seed_suite.test_multibrand_seed_network_isolation),
        ("test_autopilot_report_retrieval_psychs", lambda: test_autopilot_report_retrieval_psychs(autopilot_engine)),
        ("test_bayesian_posterior_and_significance_calculation", lambda: test_bayesian_posterior_and_significance_calculation(autopilot_engine)),
        ("test_synthetic_evaluation_simulation", lambda: test_synthetic_evaluation_simulation(autopilot_engine)),
        ("test_experiment_creation_and_edge_routing", lambda: test_experiment_creation_and_edge_routing(autopilot_engine)),
        ("test_promote_winner_and_gitops_payload", lambda: test_promote_winner_and_gitops_payload(autopilot_engine)),
        ("test_multibrand_autopilot_isolation", lambda: test_multibrand_autopilot_isolation(autopilot_engine)),
        ("test_sentinel_report_retrieval_psychs", lambda: test_sentinel_report_retrieval_psychs(sentinel_engine)),
        ("test_poisoning_scan_and_threat_detection", lambda: test_poisoning_scan_and_threat_detection(sentinel_engine)),
        ("test_counter_patch_synthesis_and_sparql", lambda: test_counter_patch_synthesis_and_sparql(sentinel_engine)),
        ("test_neutralization_dispatch_and_hmac", lambda: test_neutralization_dispatch_and_hmac(sentinel_engine)),
        ("test_multibrand_poisoning_sentinel_isolation", lambda: test_multibrand_poisoning_sentinel_isolation(sentinel_engine)),
        ("test_buyer_journey_report_retrieval_psychs", lambda: test_buyer_journey_report_retrieval_psychs(buyer_journey_engine)),
        ("test_run_persona_simulation_multi_turn", lambda: test_run_persona_simulation_multi_turn(buyer_journey_engine)),
        ("test_objection_preemption_synthesis", lambda: test_objection_preemption_synthesis(buyer_journey_engine)),
        ("test_csor_metric_calculation", lambda: test_csor_metric_calculation(buyer_journey_engine)),
        ("test_multibrand_buyer_journey_isolation", lambda: test_multibrand_buyer_journey_isolation(buyer_journey_engine)),
        ("test_headless_crawler_report_retrieval_psychs", lambda: test_headless_crawler_report_retrieval_psychs(headless_crawler)),
        ("test_recursive_crawl_execution", lambda: test_recursive_crawl_execution(headless_crawler)),
        ("test_ast_sanitization_multi_page", lambda: test_ast_sanitization_multi_page(headless_crawler)),
        ("test_llms_full_txt_synthesis", lambda: test_llms_full_txt_synthesis(headless_crawler)),
        ("test_multibrand_headless_crawler_isolation", lambda: test_multibrand_headless_crawler_isolation(headless_crawler)),
        ("test_seismograph_live_telemetry", seismo_suite.test_seismograph_live_telemetry),
        ("test_seismograph_dispatch_alert", seismo_suite.test_seismograph_dispatch_alert),
        ("test_seismograph_test_channel_ping", seismo_suite.test_seismograph_test_channel_ping),
        ("test_soc2_continuous_evaluation", soc2_suite.test_soc2_continuous_evaluation),
        ("test_merkle_tree_integrity_and_proof", soc2_suite.test_merkle_tree_integrity_and_proof),
        ("test_merkle_tamper_detection", soc2_suite.test_merkle_tamper_detection),
        ("test_soc2_package_and_html_generation", soc2_suite.test_soc2_package_and_html_generation),
        ("test_multibrand_compliance_isolation", soc2_suite.test_multibrand_compliance_isolation),
        ("test_ssrf_blocks_private_and_loopback_ips", lambda: sec_phase1.test_ssrf_blocks_private_and_loopback_ips()),
        ("test_ssrf_allows_public_domains", lambda: sec_phase1.test_ssrf_allows_public_domains()),
        ("test_crawler_ssrf_defense_integration", lambda: sec_phase1.test_crawler_ssrf_defense_integration()),
        ("test_jwt_mint_verify_and_rbac_permission", lambda: sec_phase1.test_jwt_mint_verify_and_rbac_permission()),
        ("test_dynamic_cryptographic_salts", lambda: sec_phase1.test_dynamic_cryptographic_salts()),
        ("test_audit_vault_persistence_and_hydration", test_audit_vault_persistence_and_hydration),
        ("test_crypto_shredding_persistence_and_cascading_purge", test_crypto_shredding_persistence_and_cascading_purge),
        ("test_two_tier_cache_lru_and_inverted_index", test_two_tier_cache_lru_and_inverted_index),
        ("test_two_tier_cache_ttl_expiration", test_two_tier_cache_ttl_expiration),
        ("test_async_task_queue_multiworker_and_archive", test_async_task_queue_multiworker_and_archive),
        ("test_circuit_breaker_state_transitions", test_circuit_breaker_state_transitions),
        ("test_exponential_backoff_and_retry", test_exponential_backoff_and_retry),
        ("test_multi_region_proxy_failover", test_multi_region_proxy_failover),
        ("test_resilience_status_telemetry", test_resilience_status_telemetry),
        ("test_live_engine_dispatcher_circuit_breaking", test_live_engine_dispatcher_circuit_breaking),
    ]

    passed = 0
    failed = 0

    print("======================================================================")
    print("  Psychs GEO Platform v2.0.0-PROD: Full Hardened Test Suite")
    print("======================================================================")

    for name, fn in tests:
        try:
            fn()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name} -> {e}")
            failed += 1

    try:
        asyncio.run(test_mcp_permission_enforcement())
        print(f" [PASS] test_mcp_permission_enforcement")
        passed += 1
    except Exception as e:
        print(f" [FAIL] test_mcp_permission_enforcement -> {e}")
        failed += 1

    print("======================================================================")
    print(f"Total: {passed + failed} | Passed: {passed} | Failed: {failed}")
    print("======================================================================")
    if failed > 0:
        return False
    return True

if __name__ == "__main__":
    if not run_all():
        sys.exit(1)
