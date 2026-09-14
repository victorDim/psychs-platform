"""
Unit tests for Multi-Region Geo-Distributed Proxy & Egress Gateway Monitor.
"""
from app.network.geo_proxy_cluster import GeoProxyClusterManager

def test_geo_proxy_cluster_telemetry_and_regions():
    manager = GeoProxyClusterManager.get_instance()
    status = manager.get_cluster_status()

    assert status.cluster_version == "v2.0.0-PROD-GEO"
    assert status.total_active_nodes == 4250
    assert status.total_residential_pool == 7600
    assert len(status.regions) == 4
    
    region_ids = [r.region_id for r in status.regions]
    assert "US_EAST_IAD" in region_ids
    assert "US_WEST_PDX" in region_ids
    assert "EU_CENTRAL_FRA" in region_ids
    assert "AP_SOUTHEAST_SIN" in region_ids

    assert status.global_avg_latency_ms < 50.0
    assert status.global_p95_latency_ms < 60.0
    assert status.anti_detection_evasion_rate >= 99.0
    assert status.circuit_breakers_tripped == 0
    assert status.active_tls_profile is not None
    assert status.active_tls_profile.active is True

def test_engine_latency_matrix_and_probes():
    manager = GeoProxyClusterManager.get_instance()
    matrix = manager.get_latency_matrix()

    assert len(matrix) == 5
    engine_ids = [m.engine_id for m in matrix]
    assert "chatgpt_search" in engine_ids
    assert "perplexity_sonar" in engine_ids
    assert "claude_3_7" in engine_ids
    assert "gemini_flash" in engine_ids
    assert "google_ai_overviews" in engine_ids

    for m in matrix:
        assert "US_EAST_IAD" in m.latencies_by_region
        assert "EU_CENTRAL_FRA" in m.latencies_by_region
        assert m.packet_loss_pct == 0.0
        assert m.status == "OPTIMAL"

def test_synthetic_probe_dispatch_and_history():
    manager = GeoProxyClusterManager.get_instance()
    probe = manager.dispatch_synthetic_probe("EU_CENTRAL_FRA", "perplexity_sonar")

    assert probe.probe_id.startswith("PRB-")
    assert probe.region_id == "EU_CENTRAL_FRA"
    assert probe.target_engine == "Perplexity Sonar-Pro"
    assert probe.status_code == 200
    assert probe.anti_bot_evasion == "BYPASS_SUCCESSFUL"
    assert probe.round_trip_ms > 0
    assert len(probe.hops) == 4
    assert probe.hops[0].hop == 1
    assert probe.hops[-1].hop == 4

    history = manager.get_probe_history()
    assert len(history) >= 1
    assert history[0].probe_id == probe.probe_id

def test_ja3_fingerprint_rotation():
    manager = GeoProxyClusterManager.get_instance()
    initial_status = manager.get_cluster_status()
    initial_profile_id = initial_status.active_tls_profile.profile_id

    rotation_res = manager.rotate_tls_profiles()
    assert rotation_res["status"] == "ROTATED"
    assert rotation_res["previous_profile_id"] == initial_profile_id
    assert rotation_res["active_profile"]["profile_id"] != initial_profile_id
    assert rotation_res["active_profile"]["active"] is True

    new_status = manager.get_cluster_status()
    assert new_status.active_tls_profile.profile_id != initial_profile_id
