"""
Custom middleware for the Student Management System.
"""
from django.middleware.csrf import CsrfViewMiddleware


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
