"""
OpenAPI 3.0 Specification & Swagger UI / ReDoc Generator for Psychs Enterprise GEO Platform
"""
import json

OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Psychs Enterprise Generative Engine Optimization (GEO) API",
        "description": "Enterprise-grade AI Perception Intelligence, Mathematical Scoring, and Autonomous Generative Engine Optimization (GEO) REST API.\n\nFrontier AI Engines: GPT-6 Astra, Gemini 3.7 Flash, Claude Fable 5.1, Sonar Reasoning Pro, Grok-3, DeepSeek-R1, GLM-4-Plus.",
        "version": "2.0.0-PROD",
        "contact": {
            "name": "Psychs Engineering Team",
            "url": "https://psychs.ai"
        },
        "license": {
            "name": "Enterprise Commercial License",
            "url": "https://psychs.ai/terms"
        }
    },
    "servers": [
        {
            "url": "http://localhost:8000",
            "description": "Local Development / Production Hardened Gateway"
        }
    ],
    "tags": [
        {"name": "System & Health", "description": "Platform diagnostics, uptime, and cluster status"},
        {"name": "Perception & Scoring", "description": "Mathematical 7-Dim composite perception score and multi-engine cold panels"},
        {"name": "Frontier Intelligence", "description": "SOV analysis, citation gaps, dispute tribunal, buyer journey, and seismograph"},
        {"name": "Autonomous Ingestion & Crawler", "description": "Headless browser crawler, recursive DOM sanitization, and AST validation"},
        {"name": "Optimization & Schema", "description": "Princeton KDD optimizer, JSON-LD knowledge graph, and llms.txt generation"},
        {"name": "Enterprise Security & SOC2", "description": "SOC2 continuous compliance, Merkle audit vault, and KMS crypto-shredding"},
        {"name": "Network & Bot Armor", "description": "AI crawler bot detection, residential proxy mesh, and rate telemetry"},
        {"name": "Agency White-Label", "description": "Multi-tenant white-label workspaces, custom domains, and automated board reports"}
    ],
    "paths": {
        "/api/v1/health": {
            "get": {
                "tags": ["System & Health"],
                "summary": "Health Check & Engine Status",
                "description": "Returns uptime SLA, database partition health, cache state, and live gateway availability.",
                "responses": {
                    "200": {
                        "description": "System operational status",
                        "content": {
                            "application/json": {
                                "example": {
                                    "status": "HEALTHY",
                                    "service": "Psychs Enterprise GEO Platform",
                                    "version": "2.0.0-PROD",
                                    "sla_uptime_target": "99.95%"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/perception/score": {
            "get": {
                "tags": ["Perception & Scoring"],
                "summary": "Compute Mathematical GEO Perception Score",
                "parameters": [
                    {"name": "entity_raw", "in": "query", "schema": {"type": "number", "default": 88.0}},
                    {"name": "sov_raw", "in": "query", "schema": {"type": "number", "default": 84.5}},
                    {"name": "citation_raw", "in": "query", "schema": {"type": "number", "default": 79.0}}
                ],
                "responses": {
                    "200": {
                        "description": "Perception score results"
                    }
                }
            }
        },
        "/api/v1/perception/panel": {
            "get": {
                "tags": ["Perception & Scoring"],
                "summary": "Multi-Engine Cold Prompt Fan-Out",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}},
                    {"name": "industry", "in": "query", "schema": {"type": "string", "default": "Generative Engine Optimization (GEO)"}}
                ],
                "responses": {
                    "200": {
                        "description": "Cold prompt panel responses across 7 frontier AI engines"
                    }
                }
            }
        },
        "/api/v1/intelligence/sov": {
            "get": {
                "tags": ["Frontier Intelligence"],
                "summary": "Share of Voice (SOV) Analysis",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "SOV metrics by engine"}}
            }
        },
        "/api/v1/intelligence/seismograph/telemetry": {
            "get": {
                "tags": ["Frontier Intelligence"],
                "summary": "Real-Time Query Seismograph Telemetry",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "Live query tremor events and sentiment volatility"}}
            }
        },
        "/api/v1/compliance/soc2/report": {
            "get": {
                "tags": ["Enterprise Security & SOC2"],
                "summary": "SOC2 Type II Continuous Compliance Report",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "Cryptographically sealed SOC2 continuous compliance matrix"}}
            }
        },
        "/api/v1/compliance/soc2/merkle-chain": {
            "get": {
                "tags": ["Enterprise Security & SOC2"],
                "summary": "Cryptographic Merkle Audit Chain",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "Tamper-proof SHA256 Merkle audit trail"}}
            }
        },
        "/api/v1/ingestion/headless/report": {
            "get": {
                "tags": ["Autonomous Ingestion & Crawler"],
                "summary": "Headless Browser Autonomous Crawl Report",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "SSR/SPA rendered sitemap routes and AST clean states"}}
            }
        },
        "/api/v1/intelligence/buyer-journey/report": {
            "get": {
                "tags": ["Frontier Intelligence"],
                "summary": "Multi-Persona Buyer Journey Simulation",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}}
                ],
                "responses": {"200": {"description": "CSoR funnel retention across 5 buyer personas"}}
            }
        },
        "/api/v1/network/bot-armor/telemetry": {
            "get": {
                "tags": ["Network & Bot Armor"],
                "summary": "AI Crawler Bot Armor Telemetry",
                "parameters": [
                    {"name": "brand_name", "in": "query", "schema": {"type": "string", "default": "Psychs"}},
                    {"name": "horizon_hours", "in": "query", "schema": {"type": "integer", "default": 24}}
                ],
                "responses": {"200": {"description": "Bot crawler hits, token scrapers, and IP shielding"}}
            }
        },
        "/api/v1/agency/organizations": {
            "get": {
                "tags": ["Agency White-Label"],
                "summary": "Agency Organization Metadata",
                "parameters": [
                    {"name": "agency_id", "in": "query", "schema": {"type": "string", "default": "ag-acrobat-global"}}
                ],
                "responses": {"200": {"description": "White-label branding and agency settings"}}
            }
        }
    }
}

SWAGGER_UI_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Psychs GEO API | Swagger Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 2 7 12 12 22 7 12 2'/><polyline points='2 17 12 22 22 17'/><polyline points='2 12 12 17 22 12'/></svg>" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0b0f17;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .topbar { display: none !important; }
    .swagger-ui {
      filter: invert(88%) hue-rotate(180deg);
    }
    .swagger-ui .wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    .custom-header {
      background: linear-gradient(135deg, #0d121e 0%, #151d30 100%);
      border-bottom: 1px solid rgba(16, 185, 129, 0.3);
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 22px;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .nav-links a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
      margin-left: 16px;
      font-size: 14px;
    }
    .nav-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
      Psychs Enterprise GEO Platform API
      <span class="badge">v2.0.0-PROD</span>
    </h1>
    <div class="nav-links">
      <a href="http://localhost:5173" target="_blank">Open Web UI ↗</a>
      <a href="/redoc">ReDoc</a>
      <a href="/openapi.json">OpenAPI Spec JSON</a>
      <a href="/health">Health Status</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
"""

REDOC_HTML = """<!DOCTYPE html>
<html>
  <head>
    <title>Psychs GEO API | ReDoc Reference</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; background: #0b0f17; }
    </style>
  </head>
  <body>
    <redoc spec-url='/openapi.json' theme='{"colors":{"primary":{"main":"#10b981"}}}'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
"""
