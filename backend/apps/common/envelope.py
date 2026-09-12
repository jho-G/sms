"""
The shared response envelope.

Every successful API response is shaped as::

    {"success": true, "data": <payload>}

and every error as::

    {"success": false, "error": {...}}

Two layers apply it from this single implementation:

* ``EnvelopeJSONRenderer`` wraps the serialized body at render time.
* ``EnvelopeMiddleware`` wraps the in-flight ``response.data`` before it is
  rendered, so code that inspects a response early -- the test suite, logging,
  or view/tests -- sees the same shape that goes over the wire.

Payloads that already carry ``success`` (views that build the envelope by
hand, and ``common.exceptions.custom_exception_handler``) are returned
untouched so their ``message``/``error`` keys survive.
"""
from typing import Any, Optional


def envelop(data: Any, status_code: int = 200) -> Optional[Any]:
    """Wrap ``data`` in the standard envelope unless it already has one."""
    if data is None:
        return None
    if isinstance(data, dict) and "success" in data:
        return data
    return {
        "success": 200 <= status_code < 400,
        "data": data,
    }
