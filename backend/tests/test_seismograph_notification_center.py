"""
Unit tests for Real-Time Frontier AI Query Seismograph & Push Notification Center Engine.
"""
import unittest
from app.intelligence.seismograph_notification_center import (
    SeismographNotificationCenterEngine,
    SeismographLiveTelemetry,
    PushNotificationEvent,
    NotificationChannelConfig,
    seismograph_notification_engine
)


class TestSeismographNotificationCenter(unittest.TestCase):
    def setUp(self):
        self.engine = SeismographNotificationCenterEngine()

    def test_seismograph_live_telemetry(self):
        """Test retrieving live seismograph telemetry for Psychs."""
        telemetry = self.engine.get_live_telemetry("Psychs")
        self.assertIsInstance(telemetry, SeismographLiveTelemetry)
        self.assertEqual(telemetry.brand_name, "Psychs")
        self.assertGreater(telemetry.current_composite_volatility, 0.0)
        self.assertIn(telemetry.global_alert_level, ["CALM", "MODERATE", "ELEVATED", "STORM"])
        self.assertGreaterEqual(len(telemetry.active_shockwaves), 3)
        self.assertGreaterEqual(len(telemetry.notification_channels), 5)
        self.assertGreaterEqual(len(telemetry.recent_notifications), 3)
        self.assertTrue(len(telemetry.audit_hash) > 20)
        self.assertIn("T", telemetry.generated_at)

    def test_seismograph_dispatch_alert(self):
        """Test synthesizing, HMAC-signing, and dispatching a live push notification."""
        alert = self.engine.dispatch_live_alert(
            brand_name="Psychs",
            event_type="VOLATILITY_SPIKE",
            severity="CRITICAL",
            title="SearchGPT High Turbulence Warning",
            message="Extreme citation turnover detected on benchmark pricing queries.",
            metric_payload={"v_algo": 82.4, "engine": "OpenAI SearchGPT"}
        )
        self.assertIsInstance(alert, PushNotificationEvent)
        self.assertTrue(alert.event_id.startswith("ALERT-PSYCHS-"))
        self.assertEqual(alert.severity, "CRITICAL")
        self.assertEqual(alert.dispatch_status, "DISPATCHED_DELIVERED")
        self.assertTrue(len(alert.cryptographic_hmac_seal) >= 32)
        self.assertIn("SLACK", alert.target_channels)

        # Verify it appears at the head of recent notifications
        telemetry = self.engine.get_live_telemetry("Psychs")
        self.assertEqual(telemetry.recent_notifications[0].event_id, alert.event_id)

    def test_seismograph_test_channel_ping(self):
        """Test running a diagnostics ping on a specific notification channel."""
        ping_res = self.engine.test_channel_ping("Psychs", "CHAN-SLACK-01")
        self.assertEqual(ping_res["status"], "SUCCESS")
        self.assertEqual(ping_res["channel_id"], "CHAN-SLACK-01")
        self.assertIn("ping_result", ping_res)
        self.assertTrue(ping_res["ping_result"]["hmac_signature"].startswith("sha256="))
        self.assertEqual(ping_res["ping_result"]["http_status"], 200)

    def test_seismograph_update_channel(self):
        """Test updating active toggle and subscribed events for a channel."""
        updated = self.engine.update_channel_subscription(
            brand_name="Psychs",
            channel_id="CHAN-DISCORD-02",
            is_active=False,
            subscribed_events=["GITOPS_PROMOTION_READY"]
        )
        self.assertIsInstance(updated, NotificationChannelConfig)
        self.assertEqual(updated.channel_id, "CHAN-DISCORD-02")
        self.assertFalse(updated.is_active)
        self.assertEqual(updated.subscribed_events, ["GITOPS_PROMOTION_READY"])

    def test_seismograph_multi_brand_isolation(self):
        """Test data isolation across Psychs, Supabase, and Linear."""
        psychs_tel = self.engine.get_live_telemetry("Psychs")
        supabase_tel = self.engine.get_live_telemetry("Supabase")
        linear_tel = self.engine.get_live_telemetry("Linear")

        self.assertEqual(psychs_tel.brand_name, "Psychs")
        self.assertEqual(supabase_tel.brand_name, "Supabase")
        self.assertEqual(linear_tel.brand_name, "Linear")

        # Confirm shockwaves are distinct
        self.assertNotEqual(psychs_tel.active_shockwaves[0].shock_id, supabase_tel.active_shockwaves[0].shock_id)
        self.assertNotEqual(supabase_tel.active_shockwaves[0].shock_id, linear_tel.active_shockwaves[0].shock_id)


if __name__ == "__main__":
    unittest.main()
