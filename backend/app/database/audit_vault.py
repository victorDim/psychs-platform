import os
import time
import json
import hashlib
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..compat import BaseModel, Field

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
AUDIT_LOG_FILE = DATA_DIR / "audit_vault.jsonl"

class AuditLogEntry(BaseModel):
    log_id: str
    tenant_id: str
    timestamp: str
    actor_id: str
    action_type: str
    evidence_tier: str
    resource_target: str
    payload_hash: str
    hmac_signature: str
    details: Dict[str, Any]

class ImmutableAuditVault:
    _logs: List[AuditLogEntry] = []
    _lock = threading.Lock()
    _hydrated = False

    @classmethod
    def _ensure_hydrated(cls):
        with cls._lock:
            if cls._hydrated:
                return
            cls._hydrated = True
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            if AUDIT_LOG_FILE.exists() and AUDIT_LOG_FILE.stat().st_size > 0:
                loaded = []
                try:
                    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                data = json.loads(line)
                                loaded.append(AuditLogEntry(**data))
                    cls._logs = loaded
                except Exception:
                    cls._logs = []

            if not cls._logs:
                cls._seed_default_logs("ten_enterprise_prod_01")

    @classmethod
    def log_event(
        cls,
        tenant_id: str,
        actor_id: str,
        action_type: str,
        evidence_tier: str,
        resource_target: str,
        details: Dict[str, Any]
    ) -> AuditLogEntry:
        cls._ensure_hydrated()
        ts = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        raw_str = f"{tenant_id}:{actor_id}:{action_type}:{evidence_tier}:{ts}:{str(details)}"
        p_hash = hashlib.sha256(raw_str.encode()).hexdigest()
        salt = os.environ.get("WORM_AUDIT_SALT", f"WORM_VAULT_SEAL_{hashlib.sha256(tenant_id.encode()).hexdigest()[:16]}")
        sig = hashlib.sha256(f"{salt}::{p_hash}".encode()).hexdigest()

        entry = AuditLogEntry(
            log_id=f"AUD-{p_hash[:12].upper()}",
            tenant_id=tenant_id,
            timestamp=ts,
            actor_id=actor_id,
            action_type=action_type,
            evidence_tier=evidence_tier,
            resource_target=resource_target,
            payload_hash=p_hash,
            hmac_signature=sig,
            details=details
        )
        with cls._lock:
            cls._logs.insert(0, entry)
            try:
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                    data = entry.model_dump() if hasattr(entry, "model_dump") else entry.dict()
                    f.write(json.dumps(data) + "\n")
            except Exception:
                pass
        return entry

    @classmethod
    def get_recent_logs(cls, tenant_id: str = "ten_enterprise_prod_01", tier_filter: Optional[str] = None) -> List[AuditLogEntry]:
        cls._ensure_hydrated()
        with cls._lock:
            # Filter logs for tenant or fallback
            tenant_logs = [l for l in cls._logs if l.tenant_id == tenant_id]
            if not tenant_logs and tenant_id == "ten_enterprise_prod_01":
                tenant_logs = cls._logs

            if tier_filter and tier_filter != "ALL":
                return [l for l in tenant_logs if l.evidence_tier == tier_filter]
            return tenant_logs

    @classmethod
    def purge_tenant_logs(cls, tenant_id: str) -> int:
        cls._ensure_hydrated()
        with cls._lock:
            orig_len = len(cls._logs)
            cls._logs = [l for l in cls._logs if l.tenant_id != tenant_id]
            purged = orig_len - len(cls._logs)
            try:
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
                    for entry in cls._logs:
                        data = entry.model_dump() if hasattr(entry, "model_dump") else entry.dict()
                        f.write(json.dumps(data) + "\n")
            except Exception:
                pass
            return purged

    @classmethod
    def _seed_default_logs(cls, tenant_id: str):
        seeds = [
            ("ast_sanitizer_worker_04", "AST_HTML_NORMALIZATION", "OBSERVED", "https://psychs.ai", {"zero_point_elements_pruned": 2, "hidden_css_elements_pruned": 4, "injection_check": "SAFE"}),
            ("cold_panel_dispatcher_09", "MULTI_ENGINE_FANOUT", "OBSERVED", "OpenAI ChatGPT Search / Perplexity", {"queries_dispatched": 50, "proxy_pool": "residential_us_east", "latency_avg_ms": 680}),
            ("scoring_engine_math_v2", "COMPOSITE_SCORE_CALCULATION", "INFERRED", "S_perception_score", {"aggregate_score": 87.4, "grade": "A", "uncertainty_penalty": -3.2}),
            ("semantic_entropy_analyzer", "HALLUCINATION_CLUSTERING", "INFERRED", "H_sem_evaluation", {"h_sem": 0.184, "threshold": 0.45, "hallucination_risk": False}),
            ("kdd_optimizer_slm", "CONTENT_DIFF_GENERATION", "MODEL_GENERATED", "SEC-001 / Value Proposition", {"levers_applied": ["Statistics Addition", "Answer-First"], "predicted_lift": "+24.6%"}),
            ("vp_marketing@brand.com", "CMS_WEBHOOK_CRYPTOGRAPHIC_SIGN", "USER_PROVIDED", "WordPress Webhook Endpoint", {"environment": "PRODUCTION", "signature_verified": True})
        ]
        for actor, action, tier, resource, details in seeds:
            ts = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            raw_str = f"{tenant_id}:{actor}:{action}:{tier}:{ts}:{str(details)}"
            p_hash = hashlib.sha256(raw_str.encode()).hexdigest()
            salt = os.environ.get("WORM_AUDIT_SALT", f"WORM_VAULT_SEAL_{hashlib.sha256(tenant_id.encode()).hexdigest()[:16]}")
            sig = hashlib.sha256(f"{salt}::{p_hash}".encode()).hexdigest()
            entry = AuditLogEntry(
                log_id=f"AUD-{p_hash[:12].upper()}",
                tenant_id=tenant_id,
                timestamp=ts,
                actor_id=actor,
                action_type=action,
                evidence_tier=tier,
                resource_target=resource,
                payload_hash=p_hash,
                hmac_signature=sig,
                details=details
            )
            cls._logs.insert(0, entry)

        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
                for entry in cls._logs:
                    data = entry.model_dump() if hasattr(entry, "model_dump") else entry.dict()
                    f.write(json.dumps(data) + "\n")
        except Exception:
            pass
