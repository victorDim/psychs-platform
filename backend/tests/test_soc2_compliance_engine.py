"""
Unit tests for Automated SOC2 Type II Continuous Compliance & Merkle Audit Exporter Engine.
"""
import unittest
import hashlib
from app.compliance.soc2_compliance_engine import (
    SOC2ComplianceEngine,
    SOC2CompliancePackage,
    MerkleAuditProof,
    soc2_compliance_engine
)


class TestSOC2ComplianceEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SOC2ComplianceEngine()

    def test_soc2_continuous_evaluation(self):
        """Test continuous evaluation of Trust Services Criteria controls."""
        report = self.engine.get_compliance_report("Psychs")
        self.assertEqual(report["brand_name"], "Psychs")
        self.assertEqual(report["overall_compliance_pct"], 100.0)
        self.assertEqual(report["overall_status"], "SOC2_TYPE_II_CERTIFIED")
        self.assertGreaterEqual(len(report["trust_services_scores"]), 5)
        self.assertGreaterEqual(len(report["controls"]), 15)
        self.assertTrue(len(report["merkle_root"]) >= 32)

        # Check all 5 Trust Service categories
        cat_names = [s["category"] for s in report["trust_services_scores"]]
        self.assertIn("SECURITY", cat_names)
        self.assertIn("AVAILABILITY", cat_names)
        self.assertIn("PROCESSING_INTEGRITY", cat_names)
        self.assertIn("CONFIDENTIALITY", cat_names)
        self.assertIn("PRIVACY", cat_names)

    def test_merkle_tree_integrity_and_proof(self):
        """Test Merkle audit block chain generation and cryptographic proof verification."""
        chain = self.engine.get_merkle_audit_chain("Psychs")
        self.assertGreaterEqual(chain["total_blocks"], 6)
        self.assertTrue(chain["is_chain_intact"])
        self.assertEqual(len(chain["merkle_root"]), 64)

        # Verify inclusion proof for the first log
        target_log = chain["blocks"][0]["log_id"]
        proof = self.engine.verify_merkle_proof("Psychs", target_log)
        self.assertIsInstance(proof, MerkleAuditProof)
        self.assertEqual(proof.log_id, target_log)
        self.assertTrue(proof.is_valid)
        self.assertEqual(proof.merkle_root, chain["merkle_root"])
        self.assertGreater(len(proof.proof_path), 0)

    def test_merkle_tamper_detection(self):
        """Test that altering a block immediately breaks cryptographic root hash validation."""
        blocks = self.engine._build_merkle_blocks("Psychs")
        original_root = self.engine._calculate_merkle_root(blocks)

        # Create tampered copy of blocks
        from app.compliance.soc2_compliance_engine import MerkleAuditBlock
        tampered_blocks = [MerkleAuditBlock(**b.model_dump()) for b in blocks]
        tampered_blocks[0].block_hash = hashlib.sha256(b"tampered_data_injection").hexdigest()
        tampered_root = self.engine._calculate_merkle_root(tampered_blocks)

        # Merkle roots must mismatch
        self.assertNotEqual(original_root, tampered_root)

    def test_soc2_package_and_html_generation(self):
        """Test synthesizing sealed SOC2 compliance package with HTML export."""
        pkg = self.engine.export_compliance_package(
            brand_name="Psychs",
            auditor_org="Schellman & Company, LLC",
            period_days=90,
            format_type="html"
        )
        self.assertIsInstance(pkg, SOC2CompliancePackage)
        self.assertTrue(pkg.report_id.startswith("SOC2-REPORT-PSYCHS-"))
        self.assertEqual(pkg.overall_compliance_pct, 100.0)
        self.assertTrue(len(pkg.cryptographic_seal) >= 32)
        self.assertIsNotNone(pkg.printable_html)
        self.assertIn("AICPA SOC2 Type II Continuous Attestation Dossier", pkg.printable_html)
        self.assertIn("Psychs", pkg.printable_html)
        self.assertIn("Schellman & Company, LLC", pkg.printable_html)

    def test_multibrand_compliance_isolation(self):
        """Test compliance evaluation across multiple brands."""
        psychs_rep = self.engine.get_compliance_report("Psychs")
        supabase_rep = self.engine.get_compliance_report("Supabase")
        linear_rep = self.engine.get_compliance_report("Linear")

        self.assertEqual(psychs_rep["brand_name"], "Psychs")
        self.assertEqual(supabase_rep["brand_name"], "Supabase")
        self.assertEqual(linear_rep["brand_name"], "Linear")


if __name__ == "__main__":
    unittest.main()
