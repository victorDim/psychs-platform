"""Tests for CI release-policy parsers."""

import importlib.util
import json
from pathlib import Path


SCRIPT = Path(__file__).parents[2] / ".github" / "scripts" / "enforce_codeql.py"
SPEC = importlib.util.spec_from_file_location("enforce_codeql", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def _sarif(severity: str, level: str = "warning"):
    return {
        "version": "2.1.0",
        "runs": [{
            "tool": {"driver": {"rules": [{
                "id": "py/security-test",
                "properties": {"security-severity": severity},
                "defaultConfiguration": {"level": level},
            }]}},
            "results": [{
                "ruleId": "py/security-test",
                "level": level,
                "message": {"text": "Unsafe test flow"},
                "locations": [{"physicalLocation": {
                    "artifactLocation": {"uri": "backend/example.py"},
                    "region": {"startLine": 17},
                }}],
            }],
        }],
    }


def test_codeql_policy_blocks_high_security_severity(tmp_path):
    report = tmp_path / "python.sarif"
    report.write_text(json.dumps(_sarif("8.2")), encoding="utf-8")
    findings = MODULE.collect_findings([report], threshold=7.0)
    assert findings == [{
        "rule_id": "py/security-test",
        "severity": 8.2,
        "level": "warning",
        "path": "backend/example.py",
        "line": 17,
        "message": "Unsafe test flow",
    }]


def test_codeql_policy_allows_non_error_below_threshold_and_blocks_errors(tmp_path):
    medium = tmp_path / "medium.sarif"
    medium.write_text(json.dumps(_sarif("6.9")), encoding="utf-8")
    assert MODULE.collect_findings([medium], threshold=7.0) == []

    error = tmp_path / "error.sarif"
    error.write_text(json.dumps(_sarif("0", level="error")), encoding="utf-8")
    assert len(MODULE.collect_findings([error], threshold=7.0)) == 1
