"""
Unit tests for Programmatic Citation Grounding & Authority Seed Network Engine.
Validates domain authority ranking, opportunity docket retrieval, playbook synthesis,
campaign lifecycle updates, and multi-brand isolation.
"""

import unittest
from app.intelligence.citation_seed_network import (
    CitationSeedNetworkEngine,
    CitationSeedNetworkReport,
    AuthoritySeedDomain,
    GroundingThreadOpportunity,
    SeedingPlaybook,
    citation_seed_network_engine
)

class TestCitationSeedNetwork(unittest.TestCase):

    def setUp(self):
        self.engine = CitationSeedNetworkEngine()

    def test_seed_report_retrieval_psychs(self):
        report = self.engine.get_seed_network_report("Psychs")
        self.assertIsInstance(report, CitationSeedNetworkReport)
        self.assertEqual(report.brand_name, "Psychs")
        self.assertGreaterEqual(report.total_seed_domains_tracked, 5)
        self.assertGreater(report.potential_citation_lift_pct, 20.0)
        self.assertGreater(report.verified_ai_citations_won, 0)
        self.assertGreaterEqual(len(report.opportunities), 4)

        # Check top domain authority
        reddit = next((d for d in report.seed_domains if d.domain == "reddit.com"), None)
        self.assertIsNotNone(reddit)
        self.assertGreater(reddit.citation_authority_score, 90.0)
        self.assertIn("PerplexityBot", reddit.primary_crawler_affinities)

    def test_opportunity_docket_filtering(self):
        report = self.engine.get_seed_network_report("Psychs")
        opps = report.opportunities
        
        # Verify specific opportunities exist
        opp_001 = next((o for o in opps if o.opportunity_id == "OPP-PSYCHS-001"), None)
        self.assertIsNotNone(opp_001)
        self.assertEqual(opp_001.platform, "REDDIT")
        self.assertEqual(opp_001.brand_citation_status, "UNCITED_GAP")
        self.assertGreater(opp_001.estimated_gsov_impact_pct, 5.0)
        self.assertIn("Profound", opp_001.competitors_cited)

    def test_playbook_synthesis_and_campaign_update(self):
        playbook = self.engine.generate_seeding_playbook("Psychs", "OPP-PSYCHS-002")
        self.assertIsInstance(playbook, SeedingPlaybook)
        self.assertEqual(playbook.opportunity_id, "OPP-PSYCHS-002")
        self.assertEqual(playbook.brand_name, "Psychs")
        self.assertIn("Psychs", playbook.draft_technical_response)
        self.assertIn("KDD", playbook.kdd_factual_anchor)
        self.assertGreaterEqual(len(playbook.compliance_checklist), 2)

        # Update campaign status
        updated_opp = self.engine.update_campaign_status("Psychs", "OPP-PSYCHS-002", "VERIFIED_CITED_BY_AI")
        self.assertEqual(updated_opp.campaign_status, "VERIFIED_CITED_BY_AI")
        self.assertEqual(updated_opp.brand_citation_status, "CITED")

    def test_multibrand_seed_network_isolation(self):
        supa_rep = self.engine.get_seed_network_report("Supabase")
        lin_rep = self.engine.get_seed_network_report("Linear")

        self.assertEqual(supa_rep.brand_name, "Supabase")
        self.assertEqual(lin_rep.brand_name, "Linear")

        supa_titles = [o.discussion_title for o in supa_rep.opportunities]
        self.assertTrue(any("pgvector" in t for t in supa_titles))

        lin_titles = [o.discussion_title for o in lin_rep.opportunities]
        self.assertTrue(any("issue tracker" in t.lower() or "linear" in t.lower() for t in lin_titles))

if __name__ == "__main__":
    unittest.main()
