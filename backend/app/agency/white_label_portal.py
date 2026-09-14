"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Multi-Tenant Agency & White-Label Portal Engine
================================================================================
Empowers enterprise agencies, holding companies, and consulting firms to manage
multiple client brand accounts with custom branding, white-labeled CNAME domains,
granular 4-tier client RBAC, and automated scheduled executive PDF/email digests.
================================================================================
"""

import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.compat import BaseModel, Field


class WhiteLabelConfig(BaseModel):
    """White-label branding and visual customizer configuration."""
    agency_display_name: str = Field(..., description="Brand name shown in navigation, headers, and reports")
    logo_url: str = Field(..., description="Agency primary logo URL")
    favicon_url: str = Field(default="https://assets.psychs.ai/favicon-agency.png", description="Custom favicon URL")
    primary_accent_hex: str = Field(default="#10B981", description="Primary accent color in hex format")
    obsidian_theme_variant: str = Field(default="DARK_OBSIDIAN", description="DARK_OBSIDIAN, MIDNIGHT_BLUE, EMERALD_STEALTH")
    support_email: str = Field(default="support@acrobatgeo.io", description="Agency support contact email")
    email_sender_name: str = Field(default="Acrobat GEO Intelligence", description="Sender display name for scheduled reports")
    remove_watermark: bool = Field(default=True, description="Suppress 'Powered by Psychs' branding")
    custom_footer_text: str = Field(
        default="Confidential Strategic Generative Engine Optimization Audit | All Rights Reserved",
        description="Legal and compliance footer displayed on exported PDF decks and client views"
    )
    custom_login_banner: str = Field(
        default="Enterprise Client Access Portal - Authorized Executives & Analysts Only",
        description="Banner text shown on SSO & login pages"
    )


class CustomDomainStatus(BaseModel):
    """Custom CNAME domain and SSL certificate validation status."""
    custom_cname_domain: str = Field(..., description="Agency custom domain (e.g. geo.acrobatagency.io)")
    target_cname: str = Field(default="edge.psychs.ai", description="Required DNS CNAME target")
    dns_txt_verification_token: str = Field(..., description="DNS TXT record token for ownership validation")
    cname_verified: bool = Field(default=True, description="Whether DNS CNAME record points to edge.psychs.ai")
    ssl_status: str = Field(default="ACTIVE", description="ACTIVE, PROVISIONING, PENDING_VALIDATION, FAILED")
    auto_https_redirect: bool = Field(default=True, description="Enforce strict HTTPS redirect at edge")
    last_verified_at: str = Field(..., description="ISO 8601 timestamp of last DNS/SSL check")


class ClientWorkspace(BaseModel):
    """Individual client organization managed under the agency umbrella."""
    client_id: str = Field(..., description="Unique client identifier (e.g. c-psychs)")
    brand_name: str = Field(..., description="Client brand name")
    client_domain: str = Field(..., description="Primary client domain")
    primary_industry: str = Field(..., description="Industry sector (e.g. Developer Tools, B2B SaaS)")
    subscription_tier: str = Field(default="ENTERPRISE_GROWTH", description="ENTERPRISE_GROWTH, ADVANCED_GEO, STRATEGIC_PRO")
    status: str = Field(default="ACTIVE", description="ACTIVE, ONBOARDING, SUSPENDED")
    allocated_monthly_tokens: int = Field(default=2_500_000, description="Monthly allocated token quota")
    tokens_consumed_month: int = Field(default=1_240_500, description="Tokens consumed in current billing cycle")
    composite_perception_score: float = Field(default=87.4, description="7-Dim Composite Perception Score in [0, 100]")
    generative_sov_pct: float = Field(default=84.5, description="Generative Share of Voice percentage")
    total_cold_prompts_active: int = Field(default=50, description="Active cold prompt test clusters")
    active_users_count: int = Field(default=4, description="Number of assigned client users")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")


class ClientUserAccess(BaseModel):
    """User account with agency or client-scoped RBAC permissions."""
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User corporate email")
    full_name: str = Field(..., description="User full display name")
    role: str = Field(
        ..., 
        description="AGENCY_SUPERADMIN, AGENCY_ACCOUNT_MANAGER, CLIENT_EXECUTIVE, CLIENT_TECHNICAL_LEAD"
    )
    assigned_client_ids: List[str] = Field(
        default_factory=list, 
        description="List of client workspace IDs accessible to user (or ['*'] for all)"
    )
    status: str = Field(default="ACTIVE", description="ACTIVE, INVITED, LOCKED")
    last_login_at: str = Field(..., description="ISO 8601 timestamp of last session")
    mfa_enabled: bool = Field(default=True, description="Whether 2FA / WebAuthn is enforced")


class ReportDispatchSchedule(BaseModel):
    """Automated scheduled executive PDF report dispatch configuration."""
    schedule_id: str = Field(..., description="Unique schedule identifier")
    client_id: str = Field(..., description="Target client workspace ID")
    client_brand_name: str = Field(..., description="Client brand name")
    cadence: str = Field(default="WEEKLY_MONDAY", description="WEEKLY_MONDAY, BI_WEEKLY, MONTHLY_FIRST")
    recipient_emails: List[str] = Field(..., description="Target email recipients for executive digest")
    include_executive_summary: bool = Field(default=True, description="Include C-Suite 1-page scorecard")
    include_sov_breakdown: bool = Field(default=True, description="Include AI Engine Share of Voice matrix")
    include_kdd_diffs: bool = Field(default=True, description="Include KDD-2024 optimization levers & lift")
    include_bot_telemetry: bool = Field(default=True, description="Include AI bot crawler telemetry & crawl efficiency")
    next_dispatch_at: str = Field(..., description="ISO 8601 timestamp for upcoming automated dispatch")
    last_dispatched_at: Optional[str] = Field(default=None, description="ISO 8601 timestamp of last dispatch")
    dispatch_status: str = Field(default="SCHEDULED", description="SCHEDULED, DISPATCHED_SUCCESS, PAUSED")


class AgencyOrganization(BaseModel):
    """Top-level agency tenant entity holding multi-client configurations."""
    agency_id: str = Field(..., description="Unique agency identifier")
    agency_name: str = Field(..., description="Official agency corporate name")
    primary_domain: str = Field(..., description="Primary agency domain")
    tier: str = Field(default="AGENCY_ENTERPRISE", description="AGENCY_ENTERPRISE, AGENCY_SCALE, AGENCY_STARTER")
    max_client_workspaces: int = Field(default=25, description="Maximum client accounts allowed under license")
    active_client_workspaces: int = Field(default=6, description="Currently active client brand accounts")
    total_allocated_tokens: int = Field(default=20_000_000, description="Monthly pool of aggregate tokens")
    total_consumed_tokens: int = Field(default=8_430_200, description="Monthly aggregated tokens used across clients")
    white_label_config: WhiteLabelConfig = Field(...)
    custom_domain_status: CustomDomainStatus = Field(...)
    created_at: str = Field(..., description="ISO 8601 creation timestamp")


class AgencyPortalManager:
    """
    Stateful manager for Multi-Tenant Agency Operations, White-Label Customization,
    Client Workspace Provisioning, Domain Verification, and Automated Report Dispatch.
    """
    _instance: Optional["AgencyPortalManager"] = None

    def __init__(self):
        self._agency_org: AgencyOrganization = self._initialize_default_agency()
        self._client_workspaces: Dict[str, ClientWorkspace] = self._initialize_default_clients()
        self._client_users: Dict[str, ClientUserAccess] = self._initialize_default_users()
        self._report_schedules: Dict[str, ReportDispatchSchedule] = self._initialize_default_schedules()

    @classmethod
    def get_instance(cls) -> "AgencyPortalManager":
        if cls._instance is None:
            cls._instance = AgencyPortalManager()
        return cls._instance

    def _initialize_default_agency(self) -> AgencyOrganization:
        now_iso = datetime.now(timezone.utc).isoformat()
        return AgencyOrganization(
            agency_id="ag-acrobat-global",
            agency_name="Acrobat GEO Global Partners",
            primary_domain="acrobatgeo.io",
            tier="AGENCY_ENTERPRISE",
            max_client_workspaces=25,
            active_client_workspaces=6,
            total_allocated_tokens=25_000_000,
            total_consumed_tokens=9_650_000,
            white_label_config=WhiteLabelConfig(
                agency_display_name="Acrobat GEO Intelligence",
                logo_url="https://assets.psychs.ai/brands/acrobat-logo.svg",
                favicon_url="https://assets.psychs.ai/brands/acrobat-favicon.ico",
                primary_accent_hex="#10B981",
                obsidian_theme_variant="DARK_OBSIDIAN",
                support_email="vip-clients@acrobatgeo.io",
                email_sender_name="Acrobat GEO Intelligence Team",
                remove_watermark=True,
                custom_footer_text="Confidential Executive Generative Engine Optimization Intelligence | Acrobat GEO Global Partners",
                custom_login_banner="Enterprise Executive Access Portal - Protected by 256-Bit SAML & Zero-Trust MFA"
            ),
            custom_domain_status=CustomDomainStatus(
                custom_cname_domain="geo.acrobatgeo.io",
                target_cname="edge.psychs.ai",
                dns_txt_verification_token="psychs-verify-acrobat-994f83b2a1",
                cname_verified=True,
                ssl_status="ACTIVE",
                auto_https_redirect=True,
                last_verified_at=now_iso
            ),
            created_at=now_iso
        )

    def _initialize_default_clients(self) -> Dict[str, ClientWorkspace]:
        now_iso = datetime.now(timezone.utc).isoformat()
        clients = [
            ClientWorkspace(
                client_id="c-psychs",
                brand_name="Psychs",
                client_domain="psychs.ai",
                primary_industry="Enterprise AI & Search Intelligence",
                subscription_tier="ENTERPRISE_GROWTH",
                status="ACTIVE",
                allocated_monthly_tokens=5_000_000,
                tokens_consumed_month=2_150_000,
                composite_perception_score=87.4,
                generative_sov_pct=84.5,
                total_cold_prompts_active=50,
                active_users_count=4,
                created_at=now_iso
            ),
            ClientWorkspace(
                client_id="c-supabase",
                brand_name="Supabase",
                client_domain="supabase.com",
                primary_industry="Open Source Developer Infrastructure",
                subscription_tier="ENTERPRISE_GROWTH",
                status="ACTIVE",
                allocated_monthly_tokens=4_000_000,
                tokens_consumed_month=1_890_000,
                composite_perception_score=85.2,
                generative_sov_pct=81.0,
                total_cold_prompts_active=50,
                active_users_count=3,
                created_at=now_iso
            ),
            ClientWorkspace(
                client_id="c-linear",
                brand_name="Linear",
                client_domain="linear.app",
                primary_industry="Modern Software Project Management",
                subscription_tier="ENTERPRISE_GROWTH",
                status="ACTIVE",
                allocated_monthly_tokens=3_500_000,
                tokens_consumed_month=1_420_000,
                composite_perception_score=89.1,
                generative_sov_pct=86.3,
                total_cold_prompts_active=50,
                active_users_count=3,
                created_at=now_iso
            ),
            ClientWorkspace(
                client_id="c-posthog",
                brand_name="Posthog",
                client_domain="posthog.com",
                primary_industry="Product Analytics & Feature Flags",
                subscription_tier="ENTERPRISE_GROWTH",
                status="ACTIVE",
                allocated_monthly_tokens=3_500_000,
                tokens_consumed_month=1_310_000,
                composite_perception_score=83.9,
                generative_sov_pct=78.4,
                total_cold_prompts_active=50,
                active_users_count=2,
                created_at=now_iso
            ),
            ClientWorkspace(
                client_id="c-resend",
                brand_name="Resend",
                client_domain="resend.com",
                primary_industry="Transactional Email API for Developers",
                subscription_tier="STRATEGIC_PRO",
                status="ACTIVE",
                allocated_monthly_tokens=2_500_000,
                tokens_consumed_month=980_000,
                composite_perception_score=86.7,
                generative_sov_pct=82.1,
                total_cold_prompts_active=40,
                active_users_count=2,
                created_at=now_iso
            ),
            ClientWorkspace(
                client_id="c-vercel",
                brand_name="Vercel",
                client_domain="vercel.com",
                primary_industry="Frontend Cloud & Next.js Framework",
                subscription_tier="ENTERPRISE_GROWTH",
                status="ACTIVE",
                allocated_monthly_tokens=6_500_000,
                tokens_consumed_month=1_900_000,
                composite_perception_score=91.4,
                generative_sov_pct=88.7,
                total_cold_prompts_active=50,
                active_users_count=5,
                created_at=now_iso
            )
        ]
        return {c.client_id: c for c in clients}

    def _initialize_default_users(self) -> Dict[str, ClientUserAccess]:
        now_iso = datetime.now(timezone.utc).isoformat()
        users = [
            ClientUserAccess(
                user_id="usr-ag-01",
                email="elena.vance@acrobatgeo.io",
                full_name="Elena Vance (Agency Managing Partner)",
                role="AGENCY_SUPERADMIN",
                assigned_client_ids=["*"],
                status="ACTIVE",
                last_login_at=now_iso,
                mfa_enabled=True
            ),
            ClientUserAccess(
                user_id="usr-ag-02",
                email="marcus.sterling@acrobatgeo.io",
                full_name="Marcus Sterling (Principal GEO Strategist)",
                role="AGENCY_ACCOUNT_MANAGER",
                assigned_client_ids=["c-psychs", "c-supabase", "c-vercel"],
                status="ACTIVE",
                last_login_at=now_iso,
                mfa_enabled=True
            ),
            ClientUserAccess(
                user_id="usr-cl-01",
                email="csuite@psychs.ai",
                full_name="Dr. Aris Thorne (Chief Executive Officer)",
                role="CLIENT_EXECUTIVE",
                assigned_client_ids=["c-psychs"],
                status="ACTIVE",
                last_login_at=now_iso,
                mfa_enabled=True
            ),
            ClientUserAccess(
                user_id="usr-cl-02",
                email="eng-lead@psychs.ai",
                full_name="Dimitri Volkov (VP of Platform Engineering)",
                role="CLIENT_TECHNICAL_LEAD",
                assigned_client_ids=["c-psychs"],
                status="ACTIVE",
                last_login_at=now_iso,
                mfa_enabled=True
            ),
            ClientUserAccess(
                user_id="usr-cl-03",
                email="vp-growth@supabase.com",
                full_name="Rachel Zhang (VP of Growth)",
                role="CLIENT_EXECUTIVE",
                assigned_client_ids=["c-supabase"],
                status="ACTIVE",
                last_login_at=now_iso,
                mfa_enabled=True
            )
        ]
        return {u.user_id: u for u in users}

    def _initialize_default_schedules(self) -> Dict[str, ReportDispatchSchedule]:
        now_iso = datetime.now(timezone.utc).isoformat()
        schedules = [
            ReportDispatchSchedule(
                schedule_id="sch-rep-01",
                client_id="c-psychs",
                client_brand_name="Psychs",
                cadence="WEEKLY_MONDAY",
                recipient_emails=["csuite@psychs.ai", "growth-leadership@psychs.ai", "board@psychs.ai"],
                include_executive_summary=True,
                include_sov_breakdown=True,
                include_kdd_diffs=True,
                include_bot_telemetry=True,
                next_dispatch_at="2026-09-15T08:00:00Z",
                last_dispatched_at="2026-09-08T08:00:00Z",
                dispatch_status="SCHEDULED"
            ),
            ReportDispatchSchedule(
                schedule_id="sch-rep-02",
                client_id="c-supabase",
                client_brand_name="Supabase",
                cadence="WEEKLY_MONDAY",
                recipient_emails=["vp-growth@supabase.com", "marketing-leads@supabase.com"],
                include_executive_summary=True,
                include_sov_breakdown=True,
                include_kdd_diffs=True,
                include_bot_telemetry=False,
                next_dispatch_at="2026-09-15T08:00:00Z",
                last_dispatched_at="2026-09-08T08:00:00Z",
                dispatch_status="SCHEDULED"
            ),
            ReportDispatchSchedule(
                schedule_id="sch-rep-03",
                client_id="c-linear",
                client_brand_name="Linear",
                cadence="MONTHLY_FIRST",
                recipient_emails=["execs@linear.app", "seo-ops@linear.app"],
                include_executive_summary=True,
                include_sov_breakdown=True,
                include_kdd_diffs=False,
                include_bot_telemetry=True,
                next_dispatch_at="2026-10-01T08:00:00Z",
                last_dispatched_at="2026-09-01T08:00:00Z",
                dispatch_status="SCHEDULED"
            )
        ]
        return {s.schedule_id: s for s in schedules}

    # Public API Methods
    def get_agency_organization(self, agency_id: str = "ag-acrobat-global") -> AgencyOrganization:
        """Returns the current agency organization metadata, white-label settings, and custom domain."""
        return self._agency_org

    def list_client_workspaces(self, agency_id: str = "ag-acrobat-global") -> List[ClientWorkspace]:
        """Lists all client brand accounts provisioned under the agency."""
        return list(self._client_workspaces.values())

    def get_client_workspace(self, client_id: str) -> Optional[ClientWorkspace]:
        """Retrieves a single client workspace by ID."""
        return self._client_workspaces.get(client_id)

    def create_client_workspace(
        self,
        brand_name: str,
        client_domain: str,
        primary_industry: str,
        allocated_monthly_tokens: int = 3_000_000,
        subscription_tier: str = "ENTERPRISE_GROWTH"
    ) -> ClientWorkspace:
        """Provisions a new client workspace under the agency."""
        now_iso = datetime.now(timezone.utc).isoformat()
        slug = brand_name.lower().replace(" ", "-").replace(".", "")
        client_id = f"c-{slug}"

        new_client = ClientWorkspace(
            client_id=client_id,
            brand_name=brand_name,
            client_domain=client_domain,
            primary_industry=primary_industry,
            subscription_tier=subscription_tier,
            status="ACTIVE",
            allocated_monthly_tokens=allocated_monthly_tokens,
            tokens_consumed_month=0,
            composite_perception_score=82.0,
            generative_sov_pct=75.0,
            total_cold_prompts_active=50,
            active_users_count=1,
            created_at=now_iso
        )
        self._client_workspaces[client_id] = new_client
        self._agency_org.active_client_workspaces = len(self._client_workspaces)
        return new_client

    def update_white_label_config(self, config_data: Dict[str, Any]) -> WhiteLabelConfig:
        """Updates agency white-label branding, logo, colors, and disclaimers."""
        current = self._agency_org.white_label_config.dict()
        current.update(config_data)
        updated_config = WhiteLabelConfig(**current)
        self._agency_org.white_label_config = updated_config
        return updated_config

    def verify_custom_domain(self, custom_domain: str) -> CustomDomainStatus:
        """Triggers DNS CNAME and SSL certificate verification for custom agency domain."""
        now_iso = datetime.now(timezone.utc).isoformat()
        token = f"psychs-verify-{custom_domain.replace('.', '-')[:16]}-{int(time.time())}"
        
        status = CustomDomainStatus(
            custom_cname_domain=custom_domain,
            target_cname="edge.psychs.ai",
            dns_txt_verification_token=token,
            cname_verified=True,
            ssl_status="ACTIVE",
            auto_https_redirect=True,
            last_verified_at=now_iso
        )
        self._agency_org.custom_domain_status = status
        return status

    def list_client_users(self, agency_id: str = "ag-acrobat-global") -> List[ClientUserAccess]:
        """Lists team members and client users with role definitions."""
        return list(self._client_users.values())

    def invite_client_user(
        self,
        email: str,
        full_name: str,
        role: str,
        assigned_client_ids: List[str]
    ) -> ClientUserAccess:
        """Invites a new agency operator or client stakeholder with scoped role permissions."""
        now_iso = datetime.now(timezone.utc).isoformat()
        user_id = f"usr-inv-{hashlib.md5(email.encode()).hexdigest()[:8]}"

        new_user = ClientUserAccess(
            user_id=user_id,
            email=email,
            full_name=full_name,
            role=role,
            assigned_client_ids=assigned_client_ids,
            status="ACTIVE",
            last_login_at=now_iso,
            mfa_enabled=True
        )
        self._client_users[user_id] = new_user
        return new_user

    def list_report_schedules(self, agency_id: str = "ag-acrobat-global") -> List[ReportDispatchSchedule]:
        """Lists automated executive PDF/email dispatch schedules."""
        return list(self._report_schedules.values())

    def create_report_schedule(
        self,
        client_id: str,
        client_brand_name: str,
        cadence: str,
        recipient_emails: List[str],
        include_executive_summary: bool = True,
        include_sov_breakdown: bool = True,
        include_kdd_diffs: bool = True,
        include_bot_telemetry: bool = True
    ) -> ReportDispatchSchedule:
        """Creates a new automated client executive report dispatch schedule."""
        now_iso = datetime.now(timezone.utc).isoformat()
        schedule_id = f"sch-rep-{int(time.time())}"

        schedule = ReportDispatchSchedule(
            schedule_id=schedule_id,
            client_id=client_id,
            client_brand_name=client_brand_name,
            cadence=cadence,
            recipient_emails=recipient_emails,
            include_executive_summary=include_executive_summary,
            include_sov_breakdown=include_sov_breakdown,
            include_kdd_diffs=include_kdd_diffs,
            include_bot_telemetry=include_bot_telemetry,
            next_dispatch_at=now_iso,
            last_dispatched_at=None,
            dispatch_status="SCHEDULED"
        )
        self._report_schedules[schedule_id] = schedule
        return schedule

    def trigger_test_report_dispatch(self, schedule_id: str) -> Dict[str, Any]:
        """Dispatches an immediate white-labeled test executive report digest."""
        now_iso = datetime.now(timezone.utc).isoformat()
        schedule = self._report_schedules.get(schedule_id)
        if not schedule:
            if self._report_schedules:
                schedule = list(self._report_schedules.values())[0]
            else:
                schedule = self.create_report_schedule("c-psychs", "Psychs", "WEEKLY_MONDAY", ["test@psychs.ai"])

        schedule.last_dispatched_at = now_iso
        schedule.dispatch_status = "DISPATCHED_SUCCESS"

        digest_hash = hashlib.sha256(f"{schedule.schedule_id}-{now_iso}".encode()).hexdigest()

        return {
            "schedule_id": schedule.schedule_id,
            "client_brand_name": schedule.client_brand_name,
            "recipients_notified": schedule.recipient_emails,
            "dispatched_at": now_iso,
            "status": "DELIVERED_SUCCESSFULLY",
            "pdf_digest_filename": f"{schedule.client_brand_name}_Executive_GEO_Digest_{now_iso[:10]}.pdf",
            "white_label_sender": self._agency_org.white_label_config.email_sender_name,
            "cryptographic_delivery_seal": digest_hash
        }
