import urllib.request
import json

base = "http://127.0.0.1:8000/api/v1/intelligence/ab-autopilot"

# 1. GET experiments
req = urllib.request.Request(f"{base}/experiments?brand_name=Psychs")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("GET /experiments:", resp.status, "Active Experiments:", data["active_experiments_count"], "Conv:", data["statistical_convergence_rate_pct"])

# 2. POST simulate-evaluation
req = urllib.request.Request(f"{base}/simulate-evaluation", data=json.dumps({"brand_name": "Psychs", "experiment_id": "EXP-PSYCHS-001", "probe_count": 25}).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("POST /simulate-evaluation:", resp.status, "Probes:", data["total_synthetic_probes"], "P(B>A):", data["bayesian_metrics"]["prob_variant_superior"])

# 3. POST promote-winner
req = urllib.request.Request(f"{base}/promote-winner", data=json.dumps({"brand_name": "Psychs", "experiment_id": "EXP-PSYCHS-001", "promotion_channel": "GITOPS_PR"}).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("POST /promote-winner:", resp.status, "PR:", data["pr_number"], "Status:", data["status"])

print("All API routes verified successfully!")
