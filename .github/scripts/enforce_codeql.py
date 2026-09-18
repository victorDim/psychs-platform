"""Enforce a release threshold against CodeQL SARIF results."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable


DEFAULT_THRESHOLD = 7.0


def _score(rule: dict[str, Any]) -> float:
    value = (rule.get("properties") or {}).get("security-severity", 0)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def collect_findings(paths: Iterable[Path], threshold: float) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for path in paths:
        report = json.loads(path.read_text(encoding="utf-8"))
        for run in report.get("runs") or []:
            rules = (run.get("tool") or {}).get("driver", {}).get("rules") or []
            rules_by_id = {rule.get("id"): rule for rule in rules}
            for result in run.get("results") or []:
                rule = rules_by_id.get(result.get("ruleId"), {})
                if not rule and isinstance(result.get("ruleIndex"), int):
                    index = result["ruleIndex"]
                    if 0 <= index < len(rules):
                        rule = rules[index]
                score = _score(rule)
                level = result.get("level") or (rule.get("defaultConfiguration") or {}).get("level", "warning")
                if score < threshold and level != "error":
                    continue

                location = ((result.get("locations") or [{}])[0].get("physicalLocation") or {})
                artifact = location.get("artifactLocation") or {}
                region = location.get("region") or {}
                message = (result.get("message") or {}).get("text", "CodeQL finding")
                findings.append({
                    "rule_id": result.get("ruleId") or rule.get("id") or "unknown",
                    "severity": score,
                    "level": level,
                    "path": artifact.get("uri", "unknown"),
                    "line": int(region.get("startLine") or 1),
                    "message": " ".join(message.split())[:500],
                })
    return findings


def _command_escape(value: object) -> str:
    return str(value).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def _markdown_escape(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: enforce_codeql.py SARIF_DIRECTORY")
    directory = Path(sys.argv[1])
    reports = sorted(directory.rglob("*.sarif")) if directory.is_dir() else []
    if not reports:
        raise SystemExit(f"No CodeQL SARIF reports found under {directory}")

    threshold = float(os.environ.get("CODEQL_SECURITY_SEVERITY_THRESHOLD", DEFAULT_THRESHOLD))
    if not 0 <= threshold <= 10:
        raise SystemExit("CODEQL_SECURITY_SEVERITY_THRESHOLD must be between 0 and 10")
    findings = collect_findings(reports, threshold)

    summary_lines = [
        "## CodeQL release policy",
        "",
        f"Threshold: security severity >= {threshold:.1f}, or SARIF level `error`.",
        "",
    ]
    if findings:
        summary_lines.extend([
            "| Rule | Severity | Level | Location | Message |",
            "|---|---:|---|---|---|",
        ])
        for finding in findings:
            title = _command_escape(f"CodeQL {finding['rule_id']}")
            message = _command_escape(finding["message"])
            path = _command_escape(finding["path"])
            print(f"::error file={path},line={finding['line']},title={title}::{message}")
            summary_lines.append(
                f"| {_markdown_escape(finding['rule_id'])} | {finding['severity']:.1f} | "
                f"{_markdown_escape(finding['level'])} | "
                f"{_markdown_escape(finding['path'])}:{finding['line']} | "
                f"{_markdown_escape(finding['message'])} |"
            )
    else:
        summary_lines.append(f"No blocking findings across {len(reports)} SARIF report(s).")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write("\n".join(summary_lines) + "\n")

    if findings:
        print(f"Release blocked by {len(findings)} CodeQL finding(s)", file=sys.stderr)
        return 1
    print(f"CodeQL release policy passed across {len(reports)} SARIF report(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
