"""
Unit tests for Autonomous Multi-Model Consensus & Hallucination Dispute Tribunal Engine.
Validates multi-model debate docket retrieval, Fleiss' Kappa, S_dispute, reconciliation,
Schema.org ClaimReview JSON-LD synthesis, and multi-brand isolation.
"""

import unittest
from app.intelligence.dispute_tribunal import (
    DisputeTribunalEngine,
    DisputeTribunalReport,
    DisputeCase,
    TruthReconciliationManifest,
    ModelClaimVote,
    FactualEvidenceAnchor,
    dispute_tribunal_engine
)

class TestDisputeTribunal(unittest.TestCase):

    def setUp(self):
        self.engine = DisputeTribunalEngine()

    def test_tribunal_report_retrieval_psychs(self):
        report = self.engine.get_brand_tribunal_report("Psychs")
        self.assertIsInstance(report, DisputeTribunalReport)
        self.assertEqual(report.brand_name, "Psychs")
        self.assertGreaterEqual(report.total_disputes_tracked, 3)
        self.assertGreater(report.overall_resolution_rate_pct, 0.0)
        self.assertGreater(report.truth_seals_minted, 0)
        self.assertEqual(report.edge_corrections_route, "/corrections.jsonld")

        # Check case 001
        case_001 = next((c for c in report.dispute_cases if c.dispute_id == "DISP-PSYCHS-001"), None)
        self.assertIsNotNone(case_001)
        self.assertEqual(case_001.status, "ADJUDICATED")
        self.assertIsNotNone(case_001.adjudicated_manifest)
        self.assertIn("GPT-6", str(case_001.adjudicated_manifest.culprit_models))

    def test_fleiss_kappa_and_dispute_index_calculation(self):
        # Case with strong consensus
        affirmative_votes = [
            ModelClaimVote(
                model_id=f"m-{i}", model_name=f"Model {i}", engine_provider="Provider",
                stance="AFFIRMATIVE", confidence_score=0.95, verbatim_quote="Yes", reasoning_chain="Confirmed"
            ) for i in range(5)
        ]
        kappa_high = self.engine._compute_fleiss_kappa(affirmative_votes)
        s_dispute_low = self.engine._compute_semantic_dispute_index(affirmative_votes)
        self.assertGreaterEqual(kappa_high, 0.9)
        self.assertLessEqual(s_dispute_low, 0.1)

        # Case with split debate
        split_votes = [
            ModelClaimVote(
                model_id="m-1", model_name="M1", engine_provider="P1",
                stance="AFFIRMATIVE", confidence_score=0.95, verbatim_quote="Yes", reasoning_chain="Confirmed"
            ),
            ModelClaimVote(
                model_id="m-2", model_name="M2", engine_provider="P2",
                stance="NEGATIVE", confidence_score=0.90, verbatim_quote="No", reasoning_chain="Refuted"
            ),
            ModelClaimVote(
                model_id="m-3", model_name="M3", engine_provider="P3",
                stance="CONTRADICTORY", confidence_score=0.60, verbatim_quote="Maybe", reasoning_chain="Unclear"
            )
        ]
        kappa_split = self.engine._compute_fleiss_kappa(split_votes)
        s_dispute_split = self.engine._compute_semantic_dispute_index(split_votes)
        self.assertLess(kappa_split, 0.5)
        self.assertGreater(s_dispute_split, 0.4)

    def test_case_reconciliation_and_claim_review_schema(self):
        manifest = self.engine.reconcile_case("DISP-PSYCHS-002", "Psychs")
        self.assertIsInstance(manifest, TruthReconciliationManifest)
        self.assertEqual(manifest.dispute_id, "DISP-PSYCHS-002")
        self.assertEqual(manifest.brand_name, "Psychs")
        self.assertIn("ClaimReview", manifest.schema_claim_review_jsonld["@type"])
        self.assertEqual(manifest.schema_claim_review_jsonld["reviewRating"]["ratingValue"], "5")
        self.assertIn("Google Gemini", str(manifest.provider_errata_payload))
        self.assertTrue(len(manifest.cryptographic_seal_hmac) == 64)

        # Dispatch errata
        dispatch_result = self.engine.dispatch_errata("DISP-PSYCHS-002", "Psychs")
        self.assertEqual(dispatch_result["status"], "DISPATCHED")
        self.assertGreaterEqual(len(dispatch_result["channels_notified"]), 4)

    def test_multibrand_dispute_isolation(self):
        supabase_report = self.engine.get_brand_tribunal_report("Supabase")
        linear_report = self.engine.get_brand_tribunal_report("Linear")

        self.assertEqual(supabase_report.brand_name, "Supabase")
        self.assertEqual(linear_report.brand_name, "Linear")

        supa_cases = [c.contested_query for c in supabase_report.dispute_cases]
        self.assertTrue(any("pgvector" in q for q in supa_cases))

        lin_cases = [c.contested_query for c in linear_report.dispute_cases]
        self.assertTrue(any("IndexedDB" in q or "offline" in q for q in lin_cases))

if __name__ == "__main__":
    unittest.main()
