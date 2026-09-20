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
from .domain_verification import DnsVerificationUnavailable, dns_txt_matches, source_belongs_to_domain
from .models import (
    AuditEvent,
    AuthoritativeSource,
    DomainVerificationChallenge,
    EvidenceObservation,
    EvidenceRetentionEvent,
    IdempotencyRecord,
    Job,
    Project,
    RevokedAccessToken,
    SourceSnapshot,
)
from .metrics import record_api_protection_event
from .policy import INGEST_EVIDENCE, MANAGE_SECURITY, VIEW_PROJECTS, WRITE_PROJECTS
from .rate_limit import RateLimitUnavailable, get_rate_limiter
from .settings import get_v2_settings
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
    domain_verification_status: Literal["unverified", "verified"]
    domain_verified_at: Optional[datetime]
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

    challenge_id: UUID = Field(validation_alias="id")
    status: Literal["pending", "verified", "expired", "superseded", "failed"]
    attempt_count: int
    last_checked_at: Optional[datetime]
    verified_at: Optional[datetime]
    expires_at: datetime


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    job_type: Literal["domain_verification", "evidence_collection", "source_snapshot"]
    status: Literal["queued", "running", "retry_wait", "succeeded", "dead_letter", "cancelled"]
    priority: int
    result: Optional[dict]
    attempt_count: int
    max_attempts: int
    available_at: datetime
    cancellation_requested_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class SourceSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    source_id: UUID
    collection_job_id: UUID
    requested_url: str
    final_url: str
    http_status: int
    content_type: str
    charset: str
    byte_length: int
    content_sha256: str
    fetched_at: datetime
    retention_expires_at: datetime
    created_at: datetime


class SourceSnapshotDetailResponse(SourceSnapshotResponse):
    body_text: str


class TokenRevocationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    token_id: str = Field(min_length=8, max_length=255)
    expires_at: datetime
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("expires_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("expires_at must include a timezone")
        return value


class TokenRevocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    expires_at: datetime
    reason: str
    created_at: datetime


class EvidenceObservationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    provider: str = Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9][A-Za-z0-9._:/ -]*$")
    model_identifier: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9][A-Za-z0-9._:/ -]*$")
    provider_request_id: Optional[str] = Field(default=None, min_length=1, max_length=255)
    prompt_text: str = Field(min_length=1, max_length=8_000)
    response_text: str = Field(min_length=1, max_length=64_000)
    citations: list[str] = Field(default_factory=list, max_length=50)
    observed_at: datetime

    @field_validator("provider")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        return value.lower()

    @field_validator("observed_at")
    @classmethod
    def require_observed_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("observed_at must include a timezone")
        return value

    @field_validator("citations")
    @classmethod
    def validate_citations(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for value in values:
            citation = value.strip()
            if len(citation) > 2048:
                raise ValueError("Citation URLs must contain at most 2048 characters")
            parsed = urlparse(citation)
            if parsed.scheme not in {"http", "https"} or not parsed.hostname:
                raise ValueError("Citations must be absolute HTTP(S) URLs")
            if parsed.username or parsed.password:
                raise ValueError("Citation URLs must not contain credentials")
            if citation not in seen:
                normalized.append(citation)
                seen.add(citation)
        return normalized

    @field_validator("provider_request_id", "prompt_text", "response_text")
    @classmethod
    def reject_null_characters(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and "\x00" in value:
            raise ValueError("Text fields must not contain null characters")
        return value


class EvidenceCollectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    prompt: str = Field(min_length=1, max_length=8_000)

    @field_validator("prompt")
    @classmethod
    def reject_null_characters(cls, value: str) -> str:
        if "\x00" in value:
            raise ValueError("Prompt must not contain null characters")
        return value


class EvidenceObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    evidence_class: Literal["observed"]
    provider: str
    model_identifier: str
    provider_request_id: Optional[str]
    collection_job_id: Optional[UUID]
    prompt_text: str
    response_text: str
    citations: list[str]
    observed_at: datetime
    content_hash: str
    retention_expires_at: datetime
    created_at: datetime


class EvidenceRetentionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    deleted_count: int
    retention_cutoff: datetime
    oldest_observed_at: datetime
    newest_observed_at: datetime
    executed_at: datetime


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
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:{project_id}:domain-verification"},
    )
    project = await _tenant_project(session, context, project_id)
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
        verification_status=(
            "verified"
            if project.domain_verification_status == "verified"
            and source_belongs_to_domain(command.canonical_url, project.canonical_domain)
            else "unverified"
        ),
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
        payload={
            "project_id": str(project_id),
            "canonical_url": source.canonical_url,
            "verification_status": source.verification_status,
        },
    ))
    return source


async def _tenant_source(
    session: AsyncSession,
    context: RequestContext,
    project_id: UUID,
    source_id: UUID,
) -> AuthoritativeSource:
    await _tenant_project(session, context, project_id)
    source = (
        await session.execute(
            select(AuthoritativeSource).where(
                AuthoritativeSource.tenant_id == context.tenant_id,
                AuthoritativeSource.project_id == project_id,
                AuthoritativeSource.id == source_id,
            )
        )
    ).scalar_one_or_none()
    if source is None:
        raise HTTPException(status_code=404, detail="Authoritative source not found")
    return source


@router.post(
    "/projects/{project_id}/sources/{source_id}/snapshot-jobs",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def enqueue_source_snapshot_job(
    project_id: UUID,
    source_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS, human_only=True)),
    session: AsyncSession = Depends(get_session),
):
    settings = get_v2_settings()
    if not settings.source_snapshots_enabled:
        raise HTTPException(status_code=503, detail="Source snapshots are not enabled")
    source = await _tenant_source(session, context, project_id, source_id)
    if source.verification_status != "verified":
        raise HTTPException(status_code=409, detail="Only verified sources can be captured")
    if source.snapshot_policy == "disabled":
        raise HTTPException(status_code=409, detail="Snapshots are disabled for this source")
    try:
        rate_decision = await get_rate_limiter().check(
            context,
            "source-snapshot",
            limit=settings.source_snapshot_rate_limit,
            window_seconds=settings.source_snapshot_rate_window_seconds,
        )
    except RateLimitUnavailable as exc:
        record_api_protection_event("rate_limit", "unavailable")
        raise HTTPException(status_code=503, detail="Source capture is temporarily unavailable") from exc
    if not rate_decision.allowed:
        record_api_protection_event("rate_limit", "rejected")
        raise HTTPException(
            status_code=429,
            detail="Source snapshot rate limit exceeded",
            headers={"Retry-After": str(rate_decision.retry_after_seconds), "X-RateLimit-Remaining": "0"},
        )

    request_hash = hashlib.sha256(f"{project_id}:{source_id}".encode("utf-8")).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:source_snapshot:{idempotency_key}"},
    )
    existing = (
        await session.execute(
            select(Job).where(
                Job.tenant_id == context.tenant_id,
                Job.job_type == "source_snapshot",
                Job.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()
    if existing:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Idempotency key reused with different input")
        return existing

    job = Job(
        tenant_id=context.tenant_id,
        project_id=project_id,
        job_type="source_snapshot",
        priority=35,
        payload={"source_id": str(source_id)},
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        max_attempts=3,
        created_by=context.principal_id,
    )
    session.add(job)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="job.enqueued",
        resource_type="job",
        resource_id=job.id,
        payload={"job_type": job.job_type, "project_id": str(project_id), "source_id": str(source_id)},
    ))
    return job


@router.get(
    "/projects/{project_id}/sources/{source_id}/snapshots",
    response_model=list[SourceSnapshotResponse],
)
async def list_source_snapshots(
    project_id: UUID,
    source_id: UUID,
    limit: int = 25,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_source(session, context, project_id, source_id)
    result = await session.execute(
        select(SourceSnapshot).where(
            SourceSnapshot.tenant_id == context.tenant_id,
            SourceSnapshot.project_id == project_id,
            SourceSnapshot.source_id == source_id,
        ).order_by(SourceSnapshot.fetched_at.desc()).limit(min(max(limit, 1), 100))
    )
    return result.scalars().all()


@router.get(
    "/projects/{project_id}/sources/{source_id}/snapshots/{snapshot_id}",
    response_model=SourceSnapshotDetailResponse,
)
async def get_source_snapshot(
    project_id: UUID,
    source_id: UUID,
    snapshot_id: UUID,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_source(session, context, project_id, source_id)
    snapshot = (
        await session.execute(
            select(SourceSnapshot).where(
                SourceSnapshot.tenant_id == context.tenant_id,
                SourceSnapshot.project_id == project_id,
                SourceSnapshot.source_id == source_id,
                SourceSnapshot.id == snapshot_id,
            )
        )
    ).scalar_one_or_none()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Source snapshot not found")
    return snapshot


@router.get(
    "/projects/{project_id}/evidence-observations",
    response_model=list[EvidenceObservationResponse],
)
async def list_evidence_observations(
    project_id: UUID,
    limit: int = 25,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_project(session, context, project_id)
    result = await session.execute(
        select(EvidenceObservation)
        .where(
            EvidenceObservation.tenant_id == context.tenant_id,
            EvidenceObservation.project_id == project_id,
        )
        .order_by(EvidenceObservation.observed_at.desc(), EvidenceObservation.created_at.desc())
        .limit(min(max(limit, 1), 50))
    )
    return result.scalars().all()


@router.get(
    "/evidence-retention-events",
    response_model=list[EvidenceRetentionEventResponse],
)
async def list_evidence_retention_events(
    limit: int = 25,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(EvidenceRetentionEvent)
        .where(EvidenceRetentionEvent.tenant_id == context.tenant_id)
        .order_by(EvidenceRetentionEvent.executed_at.desc())
        .limit(min(max(limit, 1), 100))
    )
    return result.scalars().all()


@router.post(
    "/projects/{project_id}/evidence-observations",
    response_model=EvidenceObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_evidence_observation(
    project_id: UUID,
    command: EvidenceObservationCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(INGEST_EVIDENCE, service_only=True)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_project(session, context, project_id)
    now = datetime.now(timezone.utc)
    observed_at = command.observed_at.astimezone(timezone.utc)
    settings = get_v2_settings()
    try:
        rate_decision = await get_rate_limiter().check(
            context,
            "evidence-ingest",
            limit=settings.evidence_ingest_rate_limit,
            window_seconds=settings.evidence_ingest_rate_window_seconds,
        )
    except RateLimitUnavailable as exc:
        record_api_protection_event("rate_limit", "unavailable")
        raise HTTPException(status_code=503, detail="Evidence ingestion is temporarily unavailable") from exc
    if not rate_decision.allowed:
        record_api_protection_event("rate_limit", "rejected")
        raise HTTPException(
            status_code=429,
            detail="Evidence ingestion rate limit exceeded",
            headers={
                "Retry-After": str(rate_decision.retry_after_seconds),
                "X-RateLimit-Remaining": "0",
            },
        )
    if observed_at > now + timedelta(minutes=5):
        raise HTTPException(status_code=422, detail="observed_at cannot be in the future")
    if observed_at < now - timedelta(seconds=settings.evidence_max_observation_age_seconds):
        raise HTTPException(status_code=422, detail="Observation is older than the ingestion policy permits")

    canonical_payload = {
        **command.model_dump(exclude={"observed_at"}),
        "observed_at": observed_at.isoformat(),
        "evidence_class": "observed",
        "project_id": str(project_id),
    }
    canonical_json = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"))
    request_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:{project_id}:evidence:{idempotency_key}"},
    )
    existing = (
        await session.execute(
            select(EvidenceObservation).where(
                EvidenceObservation.tenant_id == context.tenant_id,
                EvidenceObservation.project_id == project_id,
                EvidenceObservation.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()
    if existing:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Idempotency key reused with different input")
        return existing

    if command.provider_request_id:
        await session.execute(
            text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
            {
                "lock_key": (
                    f"{context.tenant_id}:{project_id}:provider-request:"
                    f"{command.provider}:{command.provider_request_id}"
                )
            },
        )
        provider_duplicate = (
            await session.execute(
                select(EvidenceObservation).where(
                    EvidenceObservation.tenant_id == context.tenant_id,
                    EvidenceObservation.project_id == project_id,
                    EvidenceObservation.provider == command.provider,
                    EvidenceObservation.provider_request_id == command.provider_request_id,
                )
            )
        ).scalar_one_or_none()
        if provider_duplicate:
            if provider_duplicate.request_hash != request_hash:
                raise HTTPException(status_code=409, detail="Provider request ID reused with different evidence")
            return provider_duplicate

    observation = EvidenceObservation(
        tenant_id=context.tenant_id,
        project_id=project_id,
        evidence_class="observed",
        provider=command.provider,
        model_identifier=command.model_identifier,
        provider_request_id=command.provider_request_id,
        prompt_text=command.prompt_text,
        response_text=command.response_text,
        citations=command.citations,
        observed_at=observed_at,
        content_hash=request_hash,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        collected_by=context.principal_id,
        retention_expires_at=now + timedelta(days=settings.evidence_retention_days),
    )
    session.add(observation)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="evidence_observation.created",
        resource_type="evidence_observation",
        resource_id=observation.id,
        payload={
            "project_id": str(project_id),
            "provider": observation.provider,
            "model_identifier": observation.model_identifier,
            "content_hash": observation.content_hash,
        },
    ))
    return observation


@router.post(
    "/projects/{project_id}/evidence-collection-jobs",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def enqueue_evidence_collection_job(
    project_id: UUID,
    command: EvidenceCollectionCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS, human_only=True)),
    session: AsyncSession = Depends(get_session),
):
    settings = get_v2_settings()
    if not settings.evidence_collection_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Evidence collection is not enabled",
        )
    await _tenant_project(session, context, project_id)
    try:
        rate_decision = await get_rate_limiter().check(
            context,
            "evidence-collection",
            limit=settings.evidence_collection_rate_limit,
            window_seconds=settings.evidence_collection_rate_window_seconds,
        )
    except RateLimitUnavailable as exc:
        record_api_protection_event("rate_limit", "unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Evidence collection is temporarily unavailable",
        ) from exc
    if not rate_decision.allowed:
        record_api_protection_event("rate_limit", "rejected")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Evidence collection rate limit exceeded",
            headers={
                "Retry-After": str(rate_decision.retry_after_seconds),
                "X-RateLimit-Remaining": "0",
            },
        )

    payload = command.model_dump()
    request_hash = hashlib.sha256(
        json.dumps(
            {"project_id": str(project_id), **payload},
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:evidence_collection:{idempotency_key}"},
    )
    existing = (
        await session.execute(
            select(Job).where(
                Job.tenant_id == context.tenant_id,
                Job.job_type == "evidence_collection",
                Job.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()
    if existing:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Idempotency key reused with different input")
        return existing

    job = Job(
        tenant_id=context.tenant_id,
        project_id=project_id,
        job_type="evidence_collection",
        priority=40,
        payload=payload,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        max_attempts=3,
        created_by=context.principal_id,
    )
    session.add(job)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="job.enqueued",
        resource_type="job",
        resource_id=job.id,
        payload={"job_type": job.job_type, "project_id": str(project_id)},
    ))
    return job


@router.post(
    "/projects/{project_id}/domain-verification-challenges",
    response_model=DomainVerificationChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_domain_verification_challenge(
    project_id: UUID,
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS, step_up=True, human_only=True)),
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
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS, step_up=True, human_only=True)),
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
    promoted_source_count = 0
    if locked_challenge.expires_at <= checked_at:
        locked_challenge.status = "expired"
        action = "domain_verification.expired"
    elif matched:
        locked_challenge.status = "verified"
        locked_challenge.verified_at = checked_at
        project.domain_verification_status = "verified"
        project.domain_verified_at = checked_at
        source_result = await session.execute(
            select(AuthoritativeSource).where(
                AuthoritativeSource.tenant_id == context.tenant_id,
                AuthoritativeSource.project_id == project_id,
                AuthoritativeSource.verification_status != "verified",
            )
        )
        for source in source_result.scalars().all():
            if source_belongs_to_domain(source.canonical_url, project.canonical_domain):
                source.verification_status = "verified"
                promoted_source_count += 1
        action = "domain_verification.verified"

    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action=action,
        resource_type="domain_verification_challenge",
        resource_id=locked_challenge.id,
        payload={
            "project_id": str(project_id),
            "status": locked_challenge.status,
            "promoted_source_count": promoted_source_count,
        },
    ))
    return locked_challenge


@router.post(
    "/projects/{project_id}/domain-verification-challenges/{challenge_id}/jobs",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def enqueue_domain_verification_job(
    project_id: UUID,
    challenge_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=16, max_length=255),
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS, step_up=True, human_only=True)),
    session: AsyncSession = Depends(get_session),
):
    await _tenant_project(session, context, project_id)
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
        raise HTTPException(status_code=404, detail="Verification challenge not found")
    if challenge.status != "pending":
        raise HTTPException(status_code=409, detail=f"Verification challenge is {challenge.status}")

    payload = {"challenge_id": str(challenge_id)}
    request_hash = hashlib.sha256(
        json.dumps({"project_id": str(project_id), **payload}, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:domain_verification:{idempotency_key}"},
    )
    existing = (
        await session.execute(
            select(Job).where(
                Job.tenant_id == context.tenant_id,
                Job.job_type == "domain_verification",
                Job.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()
    if existing:
        if existing.request_hash != request_hash:
            raise HTTPException(status_code=409, detail="Idempotency key reused with different input")
        return existing

    job = Job(
        tenant_id=context.tenant_id,
        project_id=project_id,
        job_type="domain_verification",
        payload=payload,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        created_by=context.principal_id,
    )
    session.add(job)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="job.enqueued",
        resource_type="job",
        resource_id=job.id,
        payload={"job_type": job.job_type, "project_id": str(project_id)},
    ))
    return job


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    limit: int = 100,
    project_id: Optional[UUID] = None,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    query = select(Job).where(Job.tenant_id == context.tenant_id)
    if project_id is not None:
        query = query.where(Job.project_id == project_id)
    result = await session.execute(query.order_by(Job.created_at.desc()).limit(min(max(limit, 1), 100)))
    return result.scalars().all()


async def _tenant_job(session: AsyncSession, context: RequestContext, job_id: UUID) -> Job:
    job = (
        await session.execute(select(Job).where(Job.tenant_id == context.tenant_id, Job.id == job_id))
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    context: RequestContext = Depends(require_permission(VIEW_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    return await _tenant_job(session, context, job_id)


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(
    job_id: UUID,
    context: RequestContext = Depends(require_permission(WRITE_PROJECTS)),
    session: AsyncSession = Depends(get_session),
):
    job = await _tenant_job(session, context, job_id)
    await session.refresh(job, with_for_update=True)
    if job.status in {"succeeded", "dead_letter", "cancelled"}:
        return job
    now = datetime.now(timezone.utc)
    previous_status = job.status
    job.cancellation_requested_at = now
    if job.status in {"queued", "retry_wait"}:
        job.status = "cancelled"
        job.completed_at = now
        if job.job_type in {"evidence_collection", "source_snapshot"}:
            job.payload = {}
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="job.cancellation_requested",
        resource_type="job",
        resource_id=job.id,
        payload={"job_type": job.job_type, "previous_status": previous_status},
    ))
    return job


@router.post(
    "/security/revoked-tokens",
    response_model=TokenRevocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def revoke_access_token(
    command: TokenRevocationCreate,
    context: RequestContext = Depends(require_permission(MANAGE_SECURITY, step_up=True, human_only=True)),
    session: AsyncSession = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    expires_at = command.expires_at.astimezone(timezone.utc)
    max_expiry = now + timedelta(seconds=get_v2_settings().oidc_max_token_lifetime_seconds + 30)
    if expires_at <= now or expires_at > max_expiry:
        raise HTTPException(status_code=422, detail="Revocation expiry must match a currently valid access token")
    token_hash = hashlib.sha256(command.token_id.encode("utf-8")).hexdigest()
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{context.tenant_id}:revoked-token:{token_hash}"},
    )
    existing = (
        await session.execute(
            select(RevokedAccessToken).where(
                RevokedAccessToken.tenant_id == context.tenant_id,
                RevokedAccessToken.token_hash == token_hash,
            )
        )
    ).scalar_one_or_none()
    if existing:
        if existing.expires_at < expires_at:
            raise HTTPException(status_code=409, detail="Token identifier reuse detected")
        return existing
    revocation = RevokedAccessToken(
        tenant_id=context.tenant_id,
        token_hash=token_hash,
        expires_at=expires_at,
        reason=command.reason,
        revoked_by=context.principal_id,
    )
    session.add(revocation)
    await session.flush()
    session.add(AuditEvent(
        tenant_id=context.tenant_id,
        actor_user_id=context.principal_id,
        request_id=context.request_id,
        action="access_token.revoked",
        resource_type="revoked_access_token",
        resource_id=revocation.id,
        payload={"expires_at": expires_at.isoformat(), "reason": command.reason},
    ))
    return revocation
