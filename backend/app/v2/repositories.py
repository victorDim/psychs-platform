"""Tenant-scoped repositories. PostgreSQL RLS remains the final enforcement layer."""

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Project


class ProjectRepository:
    def __init__(self, session: AsyncSession, tenant_id: UUID):
        self._session = session
        self._tenant_id = tenant_id

    async def list(self, limit: int = 100) -> Sequence[Project]:
        result = await self._session.execute(
            select(Project)
            .where(Project.tenant_id == self._tenant_id)
            .order_by(Project.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get(self, project_id: UUID) -> Project | None:
        result = await self._session.execute(
            select(Project).where(Project.tenant_id == self._tenant_id, Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def add(self, project: Project) -> Project:
        if project.tenant_id != self._tenant_id:
            raise ValueError("Repository cannot write outside its tenant")
        self._session.add(project)
        await self._session.flush()
        return project
