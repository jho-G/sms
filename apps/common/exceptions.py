from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that returns consistent error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "error": {
                "status_code": response.status_code,
                "message": _get_error_message(response),
                "details": response.data,
            },
        }
    else:
        # Handle unexpected exceptions (e.g., unhandled server errors)
        response = Response(
            {
                "success": False,
                "error": {
                    "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "An unexpected error occurred.",
                    "details": str(exc),
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_message(response):
    """Extract a human-readable message from the response data."""
    if isinstance(response.data, dict):
        if "detail" in response.data:
            return str(response.data["detail"])
        if "non_field_errors" in response.data:
            return str(response.data["non_field_errors"][0])
    elif isinstance(response.data, list):
        return str(response.data[0])

    return {
        400: "Bad request.",
        401: "Authentication credentials were not provided.",
        403: "You do not have permission to perform this action.",
        404: "Not found.",
        405: "Method not allowed.",
        429: "Too many requests.",
        500: "Internal server error.",
    }.get(response.status_code, "An error occurred.")
