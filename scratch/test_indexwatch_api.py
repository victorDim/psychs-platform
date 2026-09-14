import urllib.request
import json

base_url = "http://127.0.0.1:8000"

# Test 1: GET /api/v1/indexwatch/radar
req = urllib.request.Request(f"{base_url}/api/v1/indexwatch/radar?brand_name=Psychs&days_history=30")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("1. /indexwatch/radar -> status:", resp.status, "composite_vol:", data.get("composite_volatility_score"), "status:", data.get("system_status"), "engines:", len(data.get("engine_metrics", [])))

# Test 2: GET /api/v1/indexwatch/updates
req = urllib.request.Request(f"{base_url}/api/v1/indexwatch/updates")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("2. /indexwatch/updates -> status:", resp.status, "count:", len(data), "first update:", data[0].get("title") if data else None)

# Test 3: GET /api/v1/indexwatch/playbooks
req = urllib.request.Request(f"{base_url}/api/v1/indexwatch/playbooks")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("3. /indexwatch/playbooks -> status:", resp.status, "count:", len(data), "first playbook:", data[0].get("title") if data else None)

# Test 4: POST /api/v1/indexwatch/playbooks/trigger
payload = json.dumps({"playbook_id": "HEDGE-GEO-01", "brand_name": "Psychs"}).encode()
req = urllib.request.Request(f"{base_url}/api/v1/indexwatch/playbooks/trigger", data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("4. /indexwatch/playbooks/trigger -> status:", resp.status, "execution_id:", data.get("execution_id"), "lift:", data.get("simulated_gsov_recovery_lift"))

print("\nALL 4 LIVE INDEXWATCH API ENDPOINTS VERIFIED!")
