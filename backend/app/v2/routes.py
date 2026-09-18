"""Authenticated, tenant-isolated API v2 routes."""

import hashlib
import json
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from urllib.parse import urlparse, urlunsplit
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.ssrf_guard import validate_public_url_syntax

from .context import RequestContext
from .database import get_session
from .dependencies import require_permission
from .domain_verification import DnsVerificationUnavailable, dns_txt_matches
from .models import (
    AuditEvent,
    AuthoritativeSource,
    DomainVerificationChallenge,
    IdempotencyRecord,
    Project,
)
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


class AuthoritativeSourceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    canonical_url: str = Field(min_length=8, max_length=2048)
    source_type: Literal["website", "documentation", "press", "regulatory", "support", "other"]
    owner_label: str = Field(min_length=1, max_length=255)
    snapshot_policy: Literal["on_collection", "daily", "manual", "disabled"] = "on_collection"

    @field_validator("canonical_url")
    @classmethod
    def validate_canonical_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Canonical source must be an absolute HTTP(S) URL")
        if parsed.username or parsed.password:
            raise ValueError("Credentials embedded in source URLs are not permitted")
        if "\\" in parsed.netloc or any(character.isspace() for character in value):
            raise ValueError("Canonical source URL contains invalid hostname characters")
        if parsed.fragment:
            raise ValueError("Canonical source URL must not contain a fragment")
        hostname = parsed.hostname.encode("idna").decode("ascii").lower().rstrip(".")
        port = parsed.port
        default_port = 443 if parsed.scheme == "https" else 80
        display_host = f"[{hostname}]" if ":" in hostname else hostname
        netloc = display_host if port in {None, default_port} else f"{display_host}:{port}"
        canonical_url = urlunsplit((parsed.scheme.lower(), netloc, parsed.path or "/", parsed.query, ""))
        safe, reason = validate_public_url_syntax(canonical_url)
        if not safe:
            raise ValueError(reason)
        return canonical_url


class AuthoritativeSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    canonical_url: str
    source_type: str
    owner_label: str
    snapshot_policy: str
    verification_status: str
    created_at: datetime
    updated_at: datetime


class DomainVerificationChallengeResponse(BaseModel):
    challenge_id: UUID = Field(validation_alias="id")
    domain: str
    verification_method: Literal["dns_txt"] = "dns_txt"
    dns_record_name: str
    dns_record_value: str
    expires_at: datetime


class DomainVerificationResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    challenge_id: UUID
    status: Literal["pending", "verified", "expired", "superseded", "failed"]
    attempt_count: int
    last_checked_at: Optional[datetime]
    verified_at: Optional[datetime]
    expires_at: datetime


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


async def _tenant_project(session: AsyncSession, context: RequestContext, project_id: UUID) -> Project:
    project = await ProjectRepository(session, context.tenant_id).get(project_id)
    if project is None:
        # Do not reveal whether the identifier exists in another tenant.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("/projects/{project_id}/sources", response_model=list[AuthoritativeSourceResponse])
async def list_authoritative_sources(
    project_id: UUID,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_project(session, context, project_id)
    result = await session.execute(
        select(AuthoritativeSource)
        .where(
            AuthoritativeSource.tenant_id == context.tenant_id,
            AuthoritativeSource.project_id == project_id,
        )
        .order_by(AuthoritativeSource.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/projects/{project_id}/sources",
    response_model=AuthoritativeSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_authoritative_source(
    project_id: UUID,
    command: AuthoritativeSourceCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_project(session, context, project_id)
    endpoint = f"POST:/api/v2/projects/{project_id}/sources"
    canonical_payload = json.dumps(command.model_dump(), sort_keys=True, separators=(",", ":"))
    request_hash = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:{endpoint}:{idempotency_key}"},
    )
    existing_record = (
        await session.execute(
            select(IdempotencyRecord).where(
                IdempotencyRecord.tenant_id == context.tenant_id,
                IdempotencyRecord.endpoint == endpoint,
                IdempotencyRecord.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()
    if existing_record:
        if existing_record.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Idempotency key reused with different input")
        source = (
            await session.execute(
                select(AuthoritativeSource).where(
                    AuthoritativeSource.tenant_id == context.tenant_id,
                    AuthoritativeSource.id == existing_record.resource_id,
                )
            )
        ).scalar_one_or_none()
        if source is None:
            raise HTTPException(status_code=409, detail="Idempotency record is inconsistent")
        return source

    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:{project_id}:source:{command.canonical_url}"},
    )
    duplicate = (
        await session.execute(
            select(AuthoritativeSource.id).where(
                AuthoritativeSource.tenant_id == context.tenant_id,
                AuthoritativeSource.project_id == project_id,
                AuthoritativeSource.canonical_url == command.canonical_url,
            )
        )
    ).scalar_one_or_none()
    if duplicate:
        raise HTTPException(status_code=409, detail="Authoritative source already exists")

    source = AuthoritativeSource(
        tenant_id=context.tenant_id,
        project_id=project_id,
        created_by=context.principal_id,
        verification_status="unverified",
        **command.model_dump(),
    )
    session.add(source)
    await session.flush()
    session.add(IdempotencyRecord(
        tenant_id=context.tenant_id,
        endpoint=endpoint,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        resource_id=source.id,
    ))
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="authoritative_source.created",
        resource_type="authoritative_source",
        resource_id=source.id,
        payload={"project_id": str(project_id), "canonical_url": source.canonical_url},
    ))
    return source


@router.post(
    "/projects/{project_id}/domain-verification-challenges",
    response_model=DomainVerificationChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_domain_verification_challenge(
    project_id: UUID,
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    project = await _tenant_project(session, context, project_id)
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:{project_id}:domain-verification"},
    )
    await session.execute(
        update(DomainVerificationChallenge)
        .where(
            DomainVerificationChallenge.tenant_id == context.tenant_id,
            DomainVerificationChallenge.project_id == project_id,
            DomainVerificationChallenge.status == "pending",
        )
        .values(status="superseded")
    )
    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    challenge = DomainVerificationChallenge(
        tenant_id=context.tenant_id,
        project_id=project_id,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        verification_method="dns_txt",
        status="pending",
        expires_at=expires_at,
        created_by=context.principal_id,
    )
    session.add(challenge)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="domain_verification.challenge_created",
        resource_type="project",
        resource_id=project_id,
        payload={"method": "dns_txt", "expires_at": expires_at.isoformat()},
    ))
    return DomainVerificationChallengeResponse(
        challenge_id=challenge.id,
        domain=project.canonical_domain,
        dns_record_name=f"_psychs-verification.{project.canonical_domain}",
        dns_record_value=f"psychs-verification={raw_token}",
        expires_at=expires_at,
    )


@router.post(
    "/projects/{project_id}/domain-verification-challenges/{challenge_id}/verify",
    response_model=DomainVerificationResultResponse,
)
async def verify_domain_verification_challenge(
    project_id: UUID,
    challenge_id: UUID,
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    project = await _tenant_project(session, context, project_id)
    lock_acquired = (
        await session.execute(
            text("SELECT pg_try_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
            {"lock_key": f"{context.tenant_id}:{project_id}:domain-verification"},
        )
    ).scalar_one()
    if not lock_acquired:
        raise HTTPException(status_code=409, detail="Domain verification is already in progress")
    challenge = (
        await session.execute(
            select(DomainVerificationChallenge).where(
                DomainVerificationChallenge.id == challenge_id,
                DomainVerificationChallenge.tenant_id == context.tenant_id,
                DomainVerificationChallenge.project_id == project_id,
            )
        )
    ).scalar_one_or_none()
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification challenge not found")
    if challenge.status != "pending":
        return challenge

    checked_at = datetime.now(timezone.utc)
    if challenge.last_checked_at and challenge.last_checked_at > checked_at - timedelta(seconds=10):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Domain verification may be attempted once every 10 seconds",
            headers={"Retry-After": "10"},
        )
    matched = False
    if challenge.expires_at > checked_at:
        try:
            matched = await dns_txt_matches(
                f"_psychs-verification.{project.canonical_domain}",
                challenge.token_hash,
            )
        except DnsVerificationUnavailable as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    # Lock the row before persisting the result. The advisory lock also
    # serializes this check with challenge rotation for the project.
    locked_challenge = (
        await session.execute(
            select(DomainVerificationChallenge)
            .where(
                DomainVerificationChallenge.id == challenge_id,
                DomainVerificationChallenge.tenant_id == context.tenant_id,
                DomainVerificationChallenge.project_id == project_id,
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    if locked_challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification challenge not found")
    if locked_challenge.status != "pending":
        return locked_challenge

    locked_challenge.last_checked_at = checked_at
    locked_challenge.attempt_count += 1
    action = "domain_verification.checked"
    if locked_challenge.expires_at <= checked_at:
        locked_challenge.status = "expired"
        action = "domain_verification.expired"
    elif matched:
        locked_challenge.status = "verified"
        locked_challenge.verified_at = checked_at
        action = "domain_verification.verified"

    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action=action,
        resource_type="domain_verification_challenge",
        resource_id=locked_challenge.id,
        payload={"project_id": str(project_id), "status": locked_challenge.status},
    ))
    return locked_challenge
