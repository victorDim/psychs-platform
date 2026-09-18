"""Authenticated, tenant-isolated API v2 routes."""

import hashlib
import json
import re
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .context import RequestContext
from .database import get_session
from .dependencies import require_permission
from .models import AuditEvent, IdempotencyRecord, Project
from .policy import VIEW_PROJECTS, WRITE_PROJECTS
from .repositories import ProjectRepository


router = APIRouter(prefix="/api/v2", tags=["v2"])


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    canonical_domain: str = Field(min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("canonical_domain")
    @classmethod
    def validate_domain(cls, value: str) -> str:
        parsed = urlparse(value if "://" in value else f"https://{value}")
        hostname = (parsed.hostname or "").lower().rstrip(".")
        if parsed.username or parsed.password or parsed.port:
            raise ValueError("Domain must not contain credentials or a port")
        if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
            raise ValueError("Domain must not contain a path, query, or fragment")
        if not re.fullmatch(r"(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}", hostname):
            raise ValueError("A valid public DNS domain is required")
        return hostname


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    canonical_domain: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    limit: int = 100,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    safe_limit = min(max(limit, 1), 100)
    return await ProjectRepository(session, context.tenant_id).list(safe_limit)


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    command: ProjectCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    canonical_payload = json.dumps(command.model_dump(), sort_keys=True, separators=(",", ":"))
    request_hash = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:POST:/api/v2/projects:{idempotency_key}"},
    )
    existing_result = await session.execute(
        select(IdempotencyRecord).where(
            IdempotencyRecord.tenant_id == context.tenant_id,
            IdempotencyRecord.endpoint == "POST:/api/v2/projects",
            IdempotencyRecord.idempotency_key == idempotency_key,
        )
    )
    existing = existing_result.scalar_one_or_none()
    repository = ProjectRepository(session, context.tenant_id)
    if existing:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Idempotency key reused with different input")
        project = await repository.get(existing.resource_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Idempotency record is inconsistent")
        return project

    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:project-slug:{command.slug}"},
    )
    slug_result = await session.execute(
        select(Project.id).where(Project.tenant_id == context.tenant_id, Project.slug == command.slug)
    )
    if slug_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug already exists")

    project = Project(
        id=uuid4(),
        tenant_id=context.tenant_id,
        created_by=context.principal_id,
        **command.model_dump(),
    )
    await repository.add(project)
    session.add(IdempotencyRecord(
        tenant_id=context.tenant_id,
        endpoint="POST:/api/v2/projects",
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        resource_id=project.id,
    ))
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="project.created",
        resource_type="project",
        resource_id=project.id,
        payload={"slug": project.slug, "canonical_domain": project.canonical_domain},
    ))
    return project
