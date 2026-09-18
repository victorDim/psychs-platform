# ==============================================================================
# Psychs GEO Platform v2.0.0-PROD: Multi-Stage Production Backend Dockerfile
# Security Hardened: Non-Root Execution, Minimal Attack Surface
# ==============================================================================

FROM python:3.12-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254 AS builder

WORKDIR /build
COPY requirements.lock .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.lock

FROM python:3.12-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254 AS runtime

# Install system dependencies
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    APP_HOME=/app \
    PSYCHS_ENVIRONMENT=production

WORKDIR ${APP_HOME}

COPY --from=builder /wheels /wheels
COPY requirements.lock .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.lock && \
    rm -rf /wheels

# Create non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy application source code
COPY --chown=appuser:appgroup . ${APP_HOME}/

# Switch to non-root user
USER appuser

# Expose API and SSE streaming port
EXPOSE 8000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/readyz || exit 1

# Launch the authenticated v2 FastAPI control plane. One worker per container;
# scale with replicas so health, shutdown, and memory limits remain predictable.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
