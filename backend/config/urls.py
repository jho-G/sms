"""
URL configuration for student project.
Modular Monolith - config/urls.py
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView


def health_check(request):
    """
    Health check endpoint for Docker container orchestration and load balancers.
    Checks database connection responsiveness.
    """
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception as exc:
        return JsonResponse(
            {"status": "unhealthy", "database": str(exc)},
            status=503,
        )
    return JsonResponse({"status": "healthy", "database": "connected"})


urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    # Authentication API
    path("api/auth/", include("authentication.api.urls")),
    # JWT Token endpoints
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    # Academics API
    path("api/academics/", include("academics.api.urls")),
    # Enrollment API
    path("api/enrollment/", include("enrollment.api.urls")),
    # Attendance API
    path("api/attendance/", include("attendance.api.urls")),
    # Grading API
    path("api/grading/", include("grading.api.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
