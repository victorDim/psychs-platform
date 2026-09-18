"""Dependency-aware v2 startup and readiness checks."""

from typing import Any, Dict

import redis.asyncio as redis

from .database import database_ready
from .settings import get_v2_settings


async def dependency_status() -> Dict[str, Any]:
    settings = get_v2_settings()
    database_ok = await database_ready()
    redis_ok = False
    if settings.redis_url:
        client = redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
        try:
            redis_ok = bool(await client.ping())
        except Exception:
            redis_ok = False
        finally:
            await client.aclose()
    return {
        "ready": settings.v2_enabled and database_ok and redis_ok,
        "v2_enabled": settings.v2_enabled,
        "database": "ready" if database_ok else "unavailable",
        "redis": "ready" if redis_ok else "unavailable",
    }
