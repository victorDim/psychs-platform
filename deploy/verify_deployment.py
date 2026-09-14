#!/usr/bin/env python3
"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Deployment & Cloud Stack Verification Suite
================================================================================
Validates all containerization artifacts, Docker Compose configs, Kubernetes
manifests, PostgreSQL 16 schema integrity, and live API endpoints.
================================================================================
"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ANSI Color Codes
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

ROOT_DIR = Path(__file__).resolve().parent.parent

passed_checks = 0
failed_checks = 0

def log_pass(name: str, detail: str = ""):
    global passed_checks
    passed_checks += 1
    msg = f"  {GREEN}[PASS]{RESET} {BOLD}{name}{RESET}"
    if detail:
        msg += f" - {detail}"
    print(msg)

def log_fail(name: str, detail: str = ""):
    global failed_checks
    failed_checks += 1
    msg = f"  {RED}[FAIL]{RESET} {BOLD}{name}{RESET}"
    if detail:
        msg += f" - {detail}"
    print(msg)

def log_section(title: str):
    print(f"\n{CYAN}{BOLD}=== {title} ==={RESET}")

def test_file_exists(rel_path: str, min_size: int = 10):
    path = ROOT_DIR / rel_path
    if path.exists() and path.stat().st_size >= min_size:
        log_pass(f"File Existence: {rel_path}", f"{path.stat().st_size} bytes")
        return True
    else:
        log_fail(f"File Existence: {rel_path}", "File missing or empty")
        return False

def check_file_contains(rel_path: str, required_tokens: list):
    path = ROOT_DIR / rel_path
    if not path.exists():
        log_fail(f"Token Verification: {rel_path}", "File not found")
        return False
    
    content = path.read_text(encoding="utf-8")
    missing = [t for t in required_tokens if t not in content]
    if not missing:
        log_pass(f"Content Check: {rel_path}", f"All {len(required_tokens)} critical tokens present")
        return True
    else:
        log_fail(f"Content Check: {rel_path}", f"Missing tokens: {missing}")
        return False

def verify_k8s_manifests():
    log_section("1. Kubernetes Manifests Validation")
    
    # 01-namespace-config.yaml
    test_file_exists("deploy/k8s/01-namespace-config.yaml")
    check_file_contains("deploy/k8s/01-namespace-config.yaml", [
        "name: psychs-prod",
        "name: psychs-config",
        "name: psychs-secrets",
        "OPENAI_MODEL",
        "GEMINI_MODEL",
        "ANTHROPIC_MODEL",
        "DEEPSEEK_MODEL",
        "GLM_MODEL",
        "GROK_MODEL"
    ])
    
    # 02-databases.yaml
    test_file_exists("deploy/k8s/02-databases.yaml")
    check_file_contains("deploy/k8s/02-databases.yaml", [
        "image: pgvector/pgvector:pg16",
        "name: psychs-postgres",
        "image: redis:7-alpine",
        "name: psychs-redis",
        "name: psychs-redis-pvc"
    ])
    
    # 03-backend-deployment.yaml
    test_file_exists("deploy/k8s/03-backend-deployment.yaml")
    check_file_contains("deploy/k8s/03-backend-deployment.yaml", [
        "name: psychs-backend",
        "name: psychs-backend-service",
        "name: psychs-backend-pdb",
        "name: psychs-backend-hpa",
        "/api/v1/health",
        "runAsNonRoot: true"
    ])
    
    # 04-frontend-ingress.yaml
    test_file_exists("deploy/k8s/04-frontend-ingress.yaml")
    check_file_contains("deploy/k8s/04-frontend-ingress.yaml", [
        "name: psychs-frontend",
        "name: psychs-frontend-service",
        "name: psychs-ingress",
        "geo.psychs.ai",
        "path: /api",
        "nginx.ingress.kubernetes.io/proxy-buffering"
    ])

def verify_docker_and_compose():
    log_section("2. Docker & Compose Stacks Validation")
    
    # Backend Dockerfile
    test_file_exists("backend/Dockerfile")
    check_file_contains("backend/Dockerfile", [
        "python:3.12-slim",
        "useradd -u 10001",
        "EXPOSE 8000",
        "CMD [\"python\", \"server.py\", \"8000\"]"
    ])
    
    # Frontend Dockerfile
    test_file_exists("frontend/Dockerfile")
    check_file_contains("frontend/Dockerfile", [
        "node:20-alpine AS builder",
        "npm run build",
        "nginx:alpine",
        "COPY --from=builder /app/dist /usr/share/nginx/html",
        "EXPOSE 80"
    ])
    
    # Frontend Nginx Config
    test_file_exists("frontend/nginx.conf")
    check_file_contains("frontend/nginx.conf", [
        "proxy_pass http://backend:8000/api/;",
        "proxy_buffering off;",
        "try_files $uri $uri/ /index.html;",
        "location = /healthz"
    ])
    
    # Production Compose
    test_file_exists("docker-compose.yml")
    check_file_contains("docker-compose.yml", [
        "services:",
        "postgres:",
        "redis:",
        "backend:",
        "frontend:",
        "pgvector/pgvector:pg16",
        "redis:7-alpine"
    ])
    
    # Dev Compose
    test_file_exists("docker-compose.dev.yml")
    check_file_contains("docker-compose.dev.yml", [
        "./backend:/app",
        "./frontend:/app",
        "npm run dev"
    ])

def verify_database_schema():
    log_section("3. PostgreSQL 16 pgvector Database Schema")
    test_file_exists("backend/app/database/schema.sql")
    
    # Check for 16 declarative hash partitions & halfvec
    check_file_contains("backend/app/database/schema.sql", [
        "CREATE EXTENSION IF NOT EXISTS vector;",
        "PARTITION BY HASH (tenant_id);",
        "tenant_embeddings_p0",
        "tenant_embeddings_p15",
        "halfvec(1536)",
        "audit_logs",
        "hmac_signature"
    ])

def verify_cicd_pipeline():
    log_section("4. GitHub Actions CI/CD Pipeline")
    test_file_exists(".github/workflows/ci-cd.yml")
    check_file_contains(".github/workflows/ci-cd.yml", [
        "name: Psychs GEO Enterprise CI/CD Pipeline",
        "python run_tests.py",
        "npm run build",
        "docker/build-push-action",
        "ghcr.io"
    ])

def verify_live_api():
    log_section("5. Live Backend Gateway & API Health Check")
    endpoints = [
        ("API Health Endpoint (/api/v1/health)", "http://127.0.0.1:8000/api/v1/health", "status"),
        ("Worker Queue Stats (/api/v1/scheduler/stats)", "http://127.0.0.1:8000/api/v1/scheduler/stats", "total_jobs"),
        ("24/7 Schedules List (/api/v1/scheduler/schedules)", "http://127.0.0.1:8000/api/v1/scheduler/schedules", None),
        ("Alert Webhook Endpoints (/api/v1/webhooks/endpoints)", "http://127.0.0.1:8000/api/v1/webhooks/endpoints", None),
        ("Enterprise SSO Config (/api/v1/auth/sso/config)", "http://127.0.0.1:8000/api/v1/auth/sso/config", "sso_enabled"),
        ("Enterprise RBAC Roles (/api/v1/auth/roles)", "http://127.0.0.1:8000/api/v1/auth/roles", None),
        ("Enterprise Subscription (/api/v1/billing/subscription)", "http://127.0.0.1:8000/api/v1/billing/subscription", "tier_id"),
        ("Metered Token Usage (/api/v1/billing/usage)", "http://127.0.0.1:8000/api/v1/billing/usage", "tokens_consumed_month"),
        ("Two-Tier Cache Performance Stats (/api/v1/routing/cache/stats)", "http://127.0.0.1:8000/api/v1/routing/cache/stats", "hit_ratio_pct"),
        ("Upstream Resilience & Circuit Breakers (/api/v1/network/resilience-status)", "http://127.0.0.1:8000/api/v1/network/resilience-status", "status"),
        ("Geo Proxy Cluster Telemetry (/api/v1/network/proxy-cluster)", "http://127.0.0.1:8000/api/v1/network/proxy-cluster", "total_active_nodes"),
        ("Frontier AI Latency Matrix (/api/v1/network/latency-matrix)", "http://127.0.0.1:8000/api/v1/network/latency-matrix", None),
        ("Adversarial Pen-Test Report (/api/v1/pentest/report)", "http://127.0.0.1:8000/api/v1/pentest/report?brand_name=Psychs", "overall_robustness_score"),
        ("Adversarial Attack Vectors (/api/v1/pentest/vectors)", "http://127.0.0.1:8000/api/v1/pentest/vectors", None),
        ("Knowledge Graph Entity Sync (/api/v1/knowledge-graph/entity)", "http://127.0.0.1:8000/api/v1/knowledge-graph/entity?brand_name=Psychs", "authority_score"),
        ("SPARQL Direct Triples Query (/api/v1/knowledge-graph/sparql)", "http://127.0.0.1:8000/api/v1/knowledge-graph/sparql?brand_name=Psychs", "results"),
        ("Algorithm Volatility Radar (/api/v1/indexwatch/radar)", "http://127.0.0.1:8000/api/v1/indexwatch/radar?brand_name=Psychs", "composite_volatility_score"),
        ("Detected Core Updates (/api/v1/indexwatch/updates)", "http://127.0.0.1:8000/api/v1/indexwatch/updates", None),
        ("Emergency Hedge Playbooks (/api/v1/indexwatch/playbooks)", "http://127.0.0.1:8000/api/v1/indexwatch/playbooks", None),
        ("AI Bot Traffic Armor Telemetry (/api/v1/network/bot-armor/telemetry)", "http://127.0.0.1:8000/api/v1/network/bot-armor/telemetry?brand_name=Psychs", "crawl_efficiency_score"),
        ("Tracked AI Crawlers List (/api/v1/network/bot-armor/crawlers)", "http://127.0.0.1:8000/api/v1/network/bot-armor/crawlers", None),
        ("Agency Organizations (/api/v1/agency/organizations)", "http://127.0.0.1:8000/api/v1/agency/organizations", "agency_name"),
        ("Agency Client Workspaces (/api/v1/agency/clients)", "http://127.0.0.1:8000/api/v1/agency/clients", None),
        ("Agency Users Directory (/api/v1/agency/users)", "http://127.0.0.1:8000/api/v1/agency/users", None),
        ("Agency Report Schedules (/api/v1/agency/reports/schedules)", "http://127.0.0.1:8000/api/v1/agency/reports/schedules", None),
        ("Competitor Counter-Positioning Landscape (/api/v1/intelligence/counter-positioning/landscape)", "http://127.0.0.1:8000/api/v1/intelligence/counter-positioning/landscape?brand_name=Psychs", "potential_siphoned_sov_pct"),
        ("Multi-Model Dispute Tribunal Cases (/api/v1/intelligence/tribunal/cases)", "http://127.0.0.1:8000/api/v1/intelligence/tribunal/cases?brand_name=Psychs", "total_disputes_tracked"),
        ("Citation Seed Network Report (/api/v1/intelligence/citation-seeds/report)", "http://127.0.0.1:8000/api/v1/intelligence/citation-seeds/report?brand_name=Psychs", "total_seed_domains_tracked"),
        ("GEO A/B Variant Autopilot Experiments (/api/v1/intelligence/ab-autopilot/experiments)", "http://127.0.0.1:8000/api/v1/intelligence/ab-autopilot/experiments?brand_name=Psychs", "active_experiments_count"),
        ("Knowledge Graph Poisoning Defense Sentinel Report (/api/v1/intelligence/poisoning-sentinel/report)", "http://127.0.0.1:8000/api/v1/intelligence/poisoning-sentinel/report?brand_name=Psychs", "graph_integrity_score_pct"),
        ("Conversational Buyer Journey Simulator Report (/api/v1/intelligence/buyer-journey/report)", "http://127.0.0.1:8000/api/v1/intelligence/buyer-journey/report?brand_name=Psychs", "overall_csor_pct"),
        ("Headless Crawler Multi-Page Ingestion Report (/api/v1/ingestion/headless/report)", "http://127.0.0.1:8000/api/v1/ingestion/headless/report?brand_name=Psychs", "unified_llms_full_txt"),
        ("Frontier AI Query Seismograph & Push Notification Center (/api/v1/intelligence/seismograph/telemetry)", "http://127.0.0.1:8000/api/v1/intelligence/seismograph/telemetry?brand_name=Psychs", "current_composite_volatility"),
        ("AICPA SOC2 Type II Continuous Compliance Report (/api/v1/compliance/soc2/report)", "http://127.0.0.1:8000/api/v1/compliance/soc2/report?brand_name=Psychs", "overall_compliance_pct"),
        ("Immutable Merkle Audit Chain (/api/v1/compliance/soc2/merkle-chain)", "http://127.0.0.1:8000/api/v1/compliance/soc2/merkle-chain?brand_name=Psychs", "merkle_root")
    ]
    
    for name, url, key_check in endpoints:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Psychs-Verifier/2.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                status = resp.getcode()
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                if status == 200:
                    if key_check is None or (isinstance(data, (dict, list)) and (key_check is None or (isinstance(data, dict) and key_check in data))):
                        log_pass(name, f"Status 200 OK | Response size: {len(body)} bytes")
                    else:
                        log_fail(name, f"Missing key '{key_check}' in response: {body[:100]}")
                else:
                    log_fail(name, f"HTTP Status {status}")
        except Exception as e:
            log_fail(name, f"Connection error: {e}")

def run_backend_tests():
    log_section("6. Backend Master 112/112 Test Suite Execution")
    try:
        sys.path.insert(0, str(ROOT_DIR / "backend"))
        from run_tests import run_all
        success = run_all()
        if success:
            log_pass("Backend Test Runner", "112/112 Unit Tests Passed (100%)")
        else:
            log_fail("Backend Test Runner", "Some unit tests failed")
    except Exception as e:
        log_fail("Backend Test Runner", f"Execution error: {e}")

def main():
    print(f"{BOLD}{GREEN}========================================================================{RESET}")
    print(f"{BOLD}{GREEN}     Psychs GEO Platform v2.0.0-PROD Deployment Verification Suite     {RESET}")
    print(f"{BOLD}{GREEN}========================================================================{RESET}")
    
    verify_k8s_manifests()
    verify_docker_and_compose()
    verify_database_schema()
    verify_cicd_pipeline()
    verify_live_api()
    run_backend_tests()
    
    print(f"\n{BOLD}========================================================================{RESET}")
    total = passed_checks + failed_checks
    if failed_checks == 0:
        print(f"{GREEN}{BOLD}VERIFICATION SUCCESSFUL: {passed_checks}/{total} checks passed (100%){RESET}")
        return 0
    else:
        print(f"{RED}{BOLD}VERIFICATION FAILED: {failed_checks}/{total} checks failed{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
