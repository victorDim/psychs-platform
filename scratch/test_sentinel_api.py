import urllib.request
import json

base = "http://127.0.0.1:8000/api/v1/intelligence/poisoning-sentinel"

# 1. GET report
req = urllib.request.Request(f"{base}/report?brand_name=Psychs")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("GET /report:", resp.status, "Threats:", data["total_threats_monitored"], "Integrity:", data["graph_integrity_score_pct"])

# 2. POST scan
req = urllib.request.Request(f"{base}/scan", data=json.dumps({"brand_name": "Psychs"}).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("POST /scan:", resp.status, "Sources:", len(data["sources_probed"]), "Status:", data["scan_status"])

# 3. POST synthesize-patch
req = urllib.request.Request(f"{base}/synthesize-patch", data=json.dumps({"brand_name": "Psychs", "threat_id": "THREAT-PSYCHS-001"}).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("POST /synthesize-patch:", resp.status, "Patch ID:", data["patch_id"], "Platform:", data["target_platform"])

# 4. POST dispatch-neutralization
req = urllib.request.Request(f"{base}/dispatch-neutralization", data=json.dumps({"brand_name": "Psychs", "patch_id": "PATCH-THREAT-PSYCHS-001"}).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("POST /dispatch-neutralization:", resp.status, "Status:", data["status"], "Channels:", len(data["channels_notified"]))

print("All Sentinel API routes verified successfully!")
