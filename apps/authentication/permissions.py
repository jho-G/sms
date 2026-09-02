from rest_framework.permissions import BasePermission


class IsDirector(BasePermission):
    """
    Allow access only to users with DIRECTOR role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "DIRECTOR"
        )


class IsTeacher(BasePermission):
    """
    Allow access only to users with TEACHER role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TEACHER"
        )


class IsStudent(BasePermission):
    """
    Allow access only to users with STUDENT role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class IsParent(BasePermission):
    """
    Allow access only to users with PARENT role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "PARENT"
        )


class IsDirectorOrTeacher(BasePermission):
    """
    Allow access to users with DIRECTOR or TEACHER role.
    Useful for academic management endpoints.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["DIRECTOR", "TEACHER"]
        )


class IsOwner(BasePermission):
    """
    Object-level permission: only allow owners of an object to access it.
    Assumes the object has a 'user' field.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
