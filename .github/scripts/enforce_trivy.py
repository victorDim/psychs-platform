"""Turn Trivy JSON into actionable annotations and enforce release policy."""

import json
import os
import sys
from pathlib import Path


findings = []
for report_name in sys.argv[1:]:
    report = json.loads(Path(report_name).read_text(encoding="utf-8"))
    image_name = Path(report_name).stem.removeprefix("trivy-")
    for result in report.get("Results") or []:
        target = result.get("Target", image_name)
        for vulnerability in result.get("Vulnerabilities") or []:
            findings.append({
                "image": image_name,
                "target": target,
                "package": vulnerability.get("PkgName", "unknown"),
                "id": vulnerability.get("VulnerabilityID", "unknown"),
                "severity": vulnerability.get("Severity", "UNKNOWN"),
                "installed": vulnerability.get("InstalledVersion", "unknown"),
                "fixed": vulnerability.get("FixedVersion", "unknown"),
            })

summary_lines = ["## Container vulnerability policy", ""]
if findings:
    summary_lines.extend([
        "| Image | Target | Package | Vulnerability | Severity | Installed | Fixed |",
        "|---|---|---|---|---|---|---|",
    ])
    for item in findings:
        message = (
            f"{item['image']}:{item['target']} {item['package']} {item['id']} "
            f"({item['severity']}) {item['installed']} -> {item['fixed']}"
        )
        print(f"::error title=Fixable container vulnerability::{message}")
        summary_lines.append(
            f"| {item['image']} | {item['target']} | {item['package']} | {item['id']} | "
            f"{item['severity']} | {item['installed']} | {item['fixed']} |"
        )
else:
    summary_lines.append("No fixable HIGH or CRITICAL vulnerabilities detected.")

summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
if summary_path:
    with open(summary_path, "a", encoding="utf-8") as summary:
        summary.write("\n".join(summary_lines) + "\n")

if findings:
    raise SystemExit(f"Release blocked by {len(findings)} fixable HIGH/CRITICAL vulnerability finding(s)")
print("Container vulnerability policy passed")
