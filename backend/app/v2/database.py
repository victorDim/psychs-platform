"""Async PostgreSQL session management and tenant transaction context."""

from typing import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .settings import get_v2_settings


settings = get_v2_settings()
EXPECTED_DATABASE_REVISION = "0005_identity_assurance"
engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_pool_overflow,
) if settings.v2_enabled and settings.async_database_url else None

SessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession) if engine else None


async def get_session() -> AsyncIterator[AsyncSession]:
    if SessionFactory is None:
        raise RuntimeError("API v2 database is not configured")
    async with SessionFactory() as session:
        async with session.begin():
            yield session


async def set_tenant_context(session: AsyncSession, tenant_id: str) -> None:
    # The transaction-local value automatically clears on commit/rollback and
    # prevents tenant identity leaking through a pooled connection.
    await session.execute(
        text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
        {"tenant_id": tenant_id},
    )


async def database_ready() -> bool:
    if engine is None:
        return False
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
            revision = await connection.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
            return revision.scalar_one_or_none() == EXPECTED_DATABASE_REVISION
    except Exception:
        return False
