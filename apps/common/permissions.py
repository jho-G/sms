from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Object-level permission: only allow owners of an object to access it.
    Expects the view to set `owner_field` or defaults to 'user'.
    """

    def has_object_permission(self, request, view, obj):
        owner_field = getattr(view, "owner_field", "user")
        return getattr(obj, owner_field, None) == request.user


class IsAdminUser(BasePermission):
    """Allow access only to admin/staff users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Allow read-only access to unauthenticated users,
    but require authentication for write operations.
    """

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user and request.user.is_authenticated


class IsStudent(BasePermission):
    """Allow access only to users with is_student=True."""

    def has_permission(self, request, view):
        return request.user and getattr(request.user, "is_student", False)


class IsTeacher(BasePermission):
    """Allow access only to users with is_teacher=True."""

    def has_permission(self, request, view):
        return request.user and getattr(request.user, "is_teacher", False)
