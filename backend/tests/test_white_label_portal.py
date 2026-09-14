"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Multi-Tenant Agency & White-Label Test Suite
================================================================================
Verifies agency organization defaults, white-label branding customizer, custom
CNAME domain verification, client workspace provisioning, and scheduled report dispatch.
================================================================================
"""

from app.agency.white_label_portal import AgencyPortalManager


def test_agency_organization_and_defaults():
    """Verify agency default configuration, tier limits, and white-label theme."""
    manager = AgencyPortalManager.get_instance()
    agency = manager.get_agency_organization()

    assert agency.agency_id == "ag-acrobat-global"
    assert "Acrobat GEO" in agency.agency_name
    assert agency.tier == "AGENCY_ENTERPRISE"
    assert agency.max_client_workspaces >= 20
    assert agency.active_client_workspaces >= 6

    # Verify White-Label Config
    cfg = agency.white_label_config
    assert cfg.agency_display_name == "Acrobat GEO Intelligence"
    assert cfg.primary_accent_hex == "#10B981"
    assert cfg.remove_watermark is True
    assert "Confidential" in cfg.custom_footer_text

    # Verify Custom Domain Status
    domain = agency.custom_domain_status
    assert "acrobatgeo.io" in domain.custom_cname_domain
    assert domain.target_cname == "edge.psychs.ai"
    assert domain.ssl_status == "ACTIVE"
    assert domain.cname_verified is True


def test_client_workspace_provisioning_and_isolation():
    """Verify listing existing clients and provisioning a new isolated client workspace."""
    manager = AgencyPortalManager.get_instance()
    clients = manager.list_client_workspaces()

    assert len(clients) >= 6
    brand_names = [c.brand_name for c in clients]
    assert "Psychs" in brand_names
    assert "Supabase" in brand_names
    assert "Linear" in brand_names
    assert "Vercel" in brand_names

    # Provision New Client Workspace
    new_client = manager.create_client_workspace(
        brand_name="Stripe",
        client_domain="stripe.com",
        primary_industry="Financial Infrastructure & Global Payments",
        allocated_monthly_tokens=4_500_000,
        subscription_tier="ENTERPRISE_GROWTH"
    )

    assert new_client.client_id == "c-stripe"
    assert new_client.brand_name == "Stripe"
    assert new_client.client_domain == "stripe.com"
    assert new_client.allocated_monthly_tokens == 4_500_000
    assert new_client.status == "ACTIVE"
    assert new_client.composite_perception_score >= 80.0

    # Ensure updated client list includes new workspace
    updated_clients = manager.list_client_workspaces()
    assert any(c.client_id == "c-stripe" for c in updated_clients)


def test_custom_cname_verification_and_ssl():
    """Verify custom domain update and DNS TXT verification token generation."""
    manager = AgencyPortalManager.get_instance()
    
    # Update theme config
    updated_cfg = manager.update_white_label_config({
        "agency_display_name": "Horizon GEO Partners",
        "primary_accent_hex": "#6366F1",
        "remove_watermark": True
    })
    assert updated_cfg.agency_display_name == "Horizon GEO Partners"
    assert updated_cfg.primary_accent_hex == "#6366F1"

    # Verify Custom CNAME Domain
    status = manager.verify_custom_domain("geo.horizonpartners.com")
    assert status.custom_cname_domain == "geo.horizonpartners.com"
    assert status.target_cname == "edge.psychs.ai"
    assert status.ssl_status == "ACTIVE"
    assert status.cname_verified is True
    assert status.dns_txt_verification_token.startswith("psychs-verify-")


def test_client_user_rbac_and_report_dispatch():
    """Verify client user invitations, role scoping, and automated report dispatch."""
    manager = AgencyPortalManager.get_instance()
    
    # List Users
    users = manager.list_client_users()
    assert len(users) >= 5
    roles = [u.role for u in users]
    assert "AGENCY_SUPERADMIN" in roles
    assert "CLIENT_EXECUTIVE" in roles

    # Invite New Client User
    new_user = manager.invite_client_user(
        email="csuite@linear.app",
        full_name="Karri Saarinen (Co-Founder & CEO)",
        role="CLIENT_EXECUTIVE",
        assigned_client_ids=["c-linear"]
    )
    assert new_user.user_id.startswith("usr-inv-")
    assert new_user.email == "csuite@linear.app"
    assert new_user.role == "CLIENT_EXECUTIVE"
    assert "c-linear" in new_user.assigned_client_ids

    # List Schedules & Dispatch Test Report
    schedules = manager.list_report_schedules()
    assert len(schedules) >= 3

    test_dispatch = manager.trigger_test_report_dispatch(schedules[0].schedule_id)
    assert test_dispatch["status"] == "DELIVERED_SUCCESSFULLY"
    assert "pdf_digest_filename" in test_dispatch
    assert len(test_dispatch["cryptographic_delivery_seal"]) == 64
