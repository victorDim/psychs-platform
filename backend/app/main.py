"""
Psychs Enterprise Platform - FastAPI Application Cluster
Entrypoint for Generative Engine Optimization (GEO) & AI Brand Perception System v2.0.0-PROD
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI Perception Intelligence, Optimization, and Autonomous Operation Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "sla_uptime_target": "99.95%",
        "database_partitions": settings.POSTGRES_PARTITIONS,
        "two_tier_cache": "ACTIVE",
        "semantic_entropy_guardrail": f"H_sem <= {settings.SEMANTIC_ENTROPY_THRESHOLD}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
