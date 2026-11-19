"""
Tests for the shared response envelope.

Every endpoint must answer with `{"success", "data"}` so the browser client
can unwrap a response without knowing which DRF base class produced it.
"""

from unittest.mock import patch

from django.db import OperationalError
from django.urls import reverse

from common.testing import SchoolTestCase


class EnvelopeRendererTests(SchoolTestCase):
    def test_paginated_list_is_enveloped(self):
        """List routes nest the paginated block under `data`."""
        self.login(self.director)

        response = self.client.get(reverse("academics:year-list"))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertIn("results", response.data["data"])
        self.assertIn("count", response.data["data"])
        self.assertEqual(response.data["data"]["count"], 1)

    def test_response_data_carries_the_envelope(self):
        """
        `response.data` must match the wire shape. The renderer only wraps the
        rendered body, so EnvelopeMiddleware does the same for the in-flight
        response; without it every test reading `.data` saw a different shape.
        """
        self.login(self.director)

        response = self.client.get(reverse("academics:year-list"))

        self.assertIn("success", response.data)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["count"], 1)

    def test_detail_is_enveloped(self):
        """Detail routes put the object itself under `data`."""
        self.login(self.director)

        response = self.client.get(
            reverse("academics:year-detail", args=[self.year.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "2025-2026")

    def test_view_built_envelope_passes_through(self):
        """A view that builds its own envelope keeps its `message`."""
        self.login(self.director)

        response = self.client.post(
            reverse("academics:year-list"),
            {
                "name": "2026-2027",
                "start_date": "2026-09-01",
                "end_date": "2027-06-30",
                "is_active": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        self.assertIn("message", response.data)
        self.assertEqual(response.data["data"]["name"], "2026-2027")

    def test_errors_report_success_false(self):
        response = self.client.get(reverse("academics:year-list"))

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data["success"])
        self.assertIn("message", response.data["error"])


class HealthCheckEndpointTests(SchoolTestCase):
    """Test suite for /api/health/ container orchestration endpoint."""

    def test_health_check_returns_healthy(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")
        self.assertEqual(response.json()["database"], "connected")

    @patch("django.db.connection.ensure_connection")
    def test_health_check_returns_503_when_database_fails(self, mock_conn):
        mock_conn.side_effect = OperationalError("Database connection lost")
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "unhealthy")


class RequestIDMiddlewareTests(SchoolTestCase):
    """Test suite for RequestID correlation tracking."""

    def test_request_id_injected_in_response_header(self):
        response = self.client.get("/api/health/")
        self.assertTrue(response.has_header("X-Request-ID"))
        self.assertTrue(len(response["X-Request-ID"]) > 10)

    def test_incoming_request_id_preserved(self):
        custom_id = "test-correlation-uuid-9999"
        response = self.client.get("/api/health/", HTTP_X_REQUEST_ID=custom_id)
        self.assertEqual(response["X-Request-ID"], custom_id)
