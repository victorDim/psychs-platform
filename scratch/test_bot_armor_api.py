import urllib.request
import json

base_url = "http://127.0.0.1:8000"

# Test 1: GET /api/v1/network/bot-armor/telemetry
req = urllib.request.Request(f"{base_url}/api/v1/network/bot-armor/telemetry?brand_name=Psychs&horizon_hours=24")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("1. /bot-armor/telemetry -> status:", resp.status, "total_reqs:", data.get("total_bot_requests_24h"), "efficiency:", data.get("crawl_efficiency_score"), "crawlers:", len(data.get("crawlers", [])))

# Test 2: GET /api/v1/network/bot-armor/crawlers
req = urllib.request.Request(f"{base_url}/api/v1/network/bot-armor/crawlers")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("2. /bot-armor/crawlers -> status:", resp.status, "count:", len(data), "first bot:", data[0].get("bot_name") if data else None)

# Test 3: POST /api/v1/network/bot-armor/waf-rules
payload = json.dumps({"provider": "CLOUDFLARE_WAF", "policy_mode": "GEO_OPTIMIZED_OPEN", "brand_name": "Psychs"}).encode()
req = urllib.request.Request(f"{base_url}/api/v1/network/bot-armor/waf-rules", data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("3. /bot-armor/waf-rules -> status:", resp.status, "provider:", data.get("provider"), "rule_len:", len(data.get("rule_content", "")))

# Test 4: POST /api/v1/network/bot-armor/set-policy
payload = json.dumps({"policy_mode": "SELECTIVE_ARMOR"}).encode()
req = urllib.request.Request(f"{base_url}/api/v1/network/bot-armor/set-policy", data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("4. /bot-armor/set-policy -> status:", resp.status, "new_policy:", data.get("new_policy"), "switch_id:", data.get("switch_id"))

print("\nALL 4 LIVE BOT ARMOR API ENDPOINTS VERIFIED!")
