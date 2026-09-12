"""
Custom DRF renderers for the Student Management System.
"""
from rest_framework.renderers import JSONRenderer

from common.envelope import envelop


class EnvelopeJSONRenderer(JSONRenderer):
    """
    Render every JSON response in the single consistent envelope.

    Before this renderer the API spoke four different shapes depending on
    which DRF base class a view happened to use, so a client had no way to
    unwrap a response without knowing which view produced it. Everything is
    now wrapped as ``{"success": true, "data": <payload>}``, where
    ``<payload>`` is the object for detail routes and the paginated
    ``{"count", "next", "previous", "results"}`` block for list routes, so a
    client can always read ``body.data.results ?? body.data``.

    The shape itself lives in ``common.envelope.envelop`` and is also applied
    to ``response.data`` by ``common.middleware.EnvelopeMiddleware``; this
    renderer is the guarantee that the serialized body carries it even if a
    response bypasses that middleware.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}

        # 204 No Content and friends carry no body to wrap.
        if data is None:
            return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get("response")
        status_code = getattr(response, "status_code", 200)

        return super().render(
            envelop(data, status_code),
            accepted_media_type,
            renderer_context,
        )
