"""Immutable identity and tenancy context for a single request."""

from dataclasses import dataclass
from typing import FrozenSet
from uuid import UUID


@dataclass(frozen=True, slots=True)
class RequestContext:
    request_id: str
    principal_id: UUID
    external_subject: str
    tenant_id: UUID
    membership_id: UUID
    role: str
    scopes: FrozenSet[str]

    def has_scope(self, scope: str) -> bool:
        return scope in self.scopes
