"""Secure FastAPI foundation for the production API migration.

Business routes remain disabled by default until they are protected by the same
authentication, tenant-isolation, and authorization policy as the legacy API.
"""

import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .v2.health import dependency_status
from .v2.observability import request_observability_middleware
from .v2.settings import get_v2_settings


settings = get_v2_settings()
ENVIRONMENT = settings.environment
VERSION = os.environ.get("PSYCHS_VERSION", "2.0.0")

app = FastAPI(
    title="Psychs GEO Platform",
    version=VERSION,
    description="AI perception intelligence and optimization platform",
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url=None,
)

origins = settings.cors_allowed_origins
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    )


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.middleware("http")(request_observability_middleware)


@app.get("/livez", include_in_schema=False)
@app.get("/api/v1/livez", include_in_schema=False)
@app.get("/api/v2/livez", include_in_schema=False)
async def liveness():
    return {"status": "alive", "service": "psychs-api", "version": VERSION}


@app.get("/health", include_in_schema=False)
@app.get("/api/v1/health", include_in_schema=False)
@app.get("/api/v2/health", include_in_schema=False)
async def health():
    return {
        "status": "running",
        "service": "psychs-api",
        "version": VERSION,
        "environment": ENVIRONMENT,
        "runtime": "v2_control_plane" if settings.v2_enabled else "migration_skeleton",
        "readiness_endpoint": "/readyz",
    }


@app.get("/readyz", include_in_schema=False)
@app.get("/api/v1/readyz", include_in_schema=False)
@app.get("/api/v2/readyz", include_in_schema=False)
async def readiness():
    status_result = await dependency_status()
    if not status_result["ready"]:
        raise HTTPException(status_code=503, detail=status_result)
    return status_result


@app.get("/startupz", include_in_schema=False)
@app.get("/api/v2/startupz", include_in_schema=False)
async def startup():
    status_result = await dependency_status()
    if not status_result["ready"]:
        raise HTTPException(status_code=503, detail=status_result)
    return status_result


if settings.v2_enabled:
    from .v2.routes import router as v2_router

    app.include_router(v2_router)

from .v2.telemetry import configure_telemetry

configure_telemetry(app, settings, VERSION)


if (
    ENVIRONMENT == "development"
    and os.environ.get("PSYCHS_ENABLE_UNAUTHENTICATED_FASTAPI_ROUTES", "false").lower() == "true"
):
    from .api.routes import router as api_router

    app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
