from rest_framework.permissions import SAFE_METHODS, BasePermission


def _role(request):
    """Return the caller's role, or None when unauthenticated."""
    user = getattr(request, "user", None)
    if not (user and user.is_authenticated):
        return None
    return user.role


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


class IsDirectorOrTeacherReadOnly(BasePermission):
    """
    Directors get full access; teachers get read-only access.

    Used for the roster-style endpoints that teachers legitimately need in
    order to take attendance and enter marks, but must not be able to mutate.
    """

    def has_permission(self, request, view):
        role = _role(request)
        if role == "DIRECTOR":
            return True
        return role == "TEACHER" and request.method in SAFE_METHODS


class IsDirectorOrProfileOwner(BasePermission):
    """
    Directors get full access, teachers read-only, and the user a profile
    belongs to may read their own record.

    Before this, every enrollment endpoint was ``IsAuthenticated``, so any
    signed-in student could list, edit and delete every profile in the school.
    """

    def has_permission(self, request, view):
        # Any authenticated user may reach the view; object-level checks and
        # queryset narrowing decide what they actually see.
        return _role(request) is not None

    def has_object_permission(self, request, view, obj):
        role = _role(request)
        if role == "DIRECTOR":
            return True
        if request.method not in SAFE_METHODS:
            return False
        if role == "TEACHER":
            return True
        return getattr(obj, "user_id", None) == request.user.id


class IsDirectorOrGuardianParticipant(BasePermission):
    """
    Directors manage guardian links; the parent and the student named on a
    link may read it.
    """

    def has_permission(self, request, view):
        role = _role(request)
        if role in ("DIRECTOR", "TEACHER"):
            return True
        # Parents and students may only read, and only their own links.
        return role in ("PARENT", "STUDENT") and request.method in SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        role = _role(request)
        if role == "DIRECTOR":
            return True
        if request.method not in SAFE_METHODS:
            return False
        if role == "TEACHER":
            return True
        user_id = request.user.id
        return (
            obj.parent.user_id == user_id or obj.student.user_id == user_id
        )
