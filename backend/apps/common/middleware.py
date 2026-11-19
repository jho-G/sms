"""
Custom middleware for the Student Management System.
"""

import uuid

from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.response import Response as DRFResponse

from common.envelope import envelop


class CsrfExemptApiMiddleware(CsrfViewMiddleware):
    """
    Exempt API endpoints from CSRF protection.

    API endpoints use JWT tokens in the Authorization header,
    so CSRF protection is not needed for them.
    """

    def _reject(self, request, reason):
        # If the request is for an API endpoint, skip CSRF validation
        if request.path.startswith("/api/"):
            return None
        return super()._reject(request, reason)

    def process_view(self, request, callback, callback_args, callback_kwargs):
        # If the request is for an API endpoint, skip CSRF validation
        if request.path.startswith("/api/"):
            return None
        return super().process_view(request, callback, callback_args, callback_kwargs)


class EnvelopeMiddleware:
    """
    Normalise ``response.data`` on DRF responses to the shared envelope.

    ``EnvelopeJSONRenderer`` wraps the body only when the response is
    rendered, which leaves ``response.data`` holding the pre-envelope
    payload. Anything that inspects a response before that point -- the test
    suite, logging, or downstream middleware -- saw a different shape than
    the wire. Wrapping here, before rendering, makes the two agree without
    every view having to build the envelope itself.

    Non-DRF responses (the Django admin, static files) are left alone.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if isinstance(response, DRFResponse) and response.data is not None:
            response.data = envelop(response.data, response.status_code)
        return response


class RequestIDMiddleware:
    """
    Assigns a unique correlation ID to every incoming request.
    Enables distributed request tracing in logs and injects X-Request-ID header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.id = request_id
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
