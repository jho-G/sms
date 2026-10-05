from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import (
    IsDirector,
    IsDirectorOrGuardianParticipant,
    IsDirectorOrProfileOwner,
    IsDirectorOrTeacherReadOnly,
)
from enrollment.api.serializers import (
    ParentProfileCreateSerializer,
    ParentProfileSerializer,
    StudentGuardianCreateSerializer,
    StudentGuardianSerializer,
    StudentProfileCreateSerializer,
    StudentProfileSerializer,
    TeacherProfileCreateSerializer,
    TeacherProfileSerializer,
)
from enrollment.models import (
    ParentProfile,
    StudentGuardian,
    StudentProfile,
    TeacherProfile,
)
from enrollment.selectors import (
    get_parent_children,
    get_parent_profile_by_user,
    get_student_guardians,
    get_student_profile_by_user,
    get_teacher_profile_by_user,
    list_active_parent_profiles,
    list_active_student_profiles,
    list_active_teacher_profiles,
    list_students_by_section,
)
from enrollment.services import (
    link_parent_to_student,
    register_parent,
    register_student,
    register_teacher,
    set_primary_guardian,
    unlink_parent_from_student,
)


def _visible_student_profiles(user):
    """
    Narrow the student roster to what ``user`` is allowed to see.

    Directors and teachers see every active student. A student sees only
    their own record, and a parent only the children linked to them.
    """
    queryset = list_active_student_profiles()

    if user.role in ("DIRECTOR", "TEACHER"):
        return queryset
    if user.role == "STUDENT":
        return queryset.filter(user_id=user.id)
    if user.role == "PARENT":
        return queryset.filter(
            guardian_links__parent__user_id=user.id
        ).distinct()
    return queryset.none()


# ---------------------------------------------------------------------------
# Current User's Profile
# ---------------------------------------------------------------------------


class MyProfileView(APIView):
    """
    GET /api/enrollment/me/ – Resolve the caller's own domain profile.

    Attendance, grades and guardian links are keyed by StudentProfile /
    ParentProfile UUIDs, not by the User UUID that the client holds after
    login. Without this endpoint the browser client had no way to find its
    own profile id and silently queried with the wrong key, so every
    student and parent page came back empty.
    """

    permission_classes = [IsAuthenticated]

    #: role -> (selector, serializer)
    PROFILE_RESOLVERS = {
        "STUDENT": (get_student_profile_by_user, StudentProfileSerializer),
        "TEACHER": (get_teacher_profile_by_user, TeacherProfileSerializer),
        "PARENT": (get_parent_profile_by_user, ParentProfileSerializer),
    }

    def get(self, request):
        role = request.user.role
        resolver = self.PROFILE_RESOLVERS.get(role)

        if resolver is None:
            # Directors have no domain profile; that is not an error.
            return Response({"role": role, "profile": None})

        selector, serializer_class = resolver
        profile = selector(str(request.user.id))

        if profile is None:
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": (
                            f"No {role.lower()} profile exists for this account. "
                            "Ask a director to complete your enrollment."
                        )
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"role": role, "profile": serializer_class(profile).data}
        )


# ---------------------------------------------------------------------------
# Student Profile Views
# ---------------------------------------------------------------------------


class StudentProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/students/       – List student profiles in scope
    POST /api/enrollment/students/       – Create a student profile (Director)
    """

    permission_classes = [IsDirectorOrProfileOwner]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsDirector()]
        return super().get_permissions()

    def get_queryset(self):
        return _visible_student_profiles(self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StudentProfileCreateSerializer
        return StudentProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = data.pop("user")

        profile = register_student(
            user_id=str(user.id),
            student_id=data["student_id"],
            section_id=str(data["section"].id) if data.get("section") else None,
            date_of_birth=data["date_of_birth"],
            guardian_contact=data.get("guardian_contact", ""),
            medical_notes=data.get("medical_notes", ""),
        )

        return Response(
            StudentProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )


class StudentProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enrollment/students/<uuid>/   – Retrieve
    PUT    /api/enrollment/students/<uuid>/   – Full update (Director)
    PATCH  /api/enrollment/students/<uuid>/   – Partial update (Director)
    DELETE /api/enrollment/students/<uuid>/   – Delete (Director)
    """

    queryset = StudentProfile.objects.select_related("user", "section").all()
    permission_classes = [IsDirectorOrProfileOwner]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return StudentProfileCreateSerializer
        return StudentProfileSerializer


class StudentProfilesBySectionView(generics.ListAPIView):
    """
    GET /api/enrollment/students/by-section/<uuid>/ – Section roster

    Teachers need this to take attendance and enter marks, so it is readable
    by directors and teachers but never writable.
    """

    serializer_class = StudentProfileSerializer
    permission_classes = [IsDirectorOrTeacherReadOnly]

    def get_queryset(self):
        return list_students_by_section(self.kwargs["section_id"])


# ---------------------------------------------------------------------------
# Teacher Profile Views
# ---------------------------------------------------------------------------


class TeacherProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/teachers/       – List teacher profiles in scope
    POST /api/enrollment/teachers/       – Create a teacher profile (Director)
    """

    permission_classes = [IsDirectorOrProfileOwner]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsDirector()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = list_active_teacher_profiles()
        if self.request.user.role == "DIRECTOR":
            return queryset
        return queryset.filter(user_id=self.request.user.id)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TeacherProfileCreateSerializer
        return TeacherProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = data.pop("user")

        profile = register_teacher(
            user_id=str(user.id),
            employee_id=data["employee_id"],
            department=data.get("department", ""),
            specialization=data.get("specialization", ""),
            qualification=data.get("qualification", ""),
        )

        return Response(
            TeacherProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )


class TeacherProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enrollment/teachers/<uuid>/   – Retrieve
    PUT    /api/enrollment/teachers/<uuid>/   – Full update (Director)
    PATCH  /api/enrollment/teachers/<uuid>/   – Partial update (Director)
    DELETE /api/enrollment/teachers/<uuid>/   – Delete (Director)
    """

    queryset = TeacherProfile.objects.select_related("user").all()
    permission_classes = [IsDirectorOrProfileOwner]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TeacherProfileCreateSerializer
        return TeacherProfileSerializer


# ---------------------------------------------------------------------------
# Parent Profile Views
# ---------------------------------------------------------------------------


class ParentProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/parents/       – List parent profiles in scope
    POST /api/enrollment/parents/       – Create a parent profile (Director)
    """

    permission_classes = [IsDirectorOrProfileOwner]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsDirector()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = list_active_parent_profiles()
        if self.request.user.role == "DIRECTOR":
            return queryset
        return queryset.filter(user_id=self.request.user.id)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ParentProfileCreateSerializer
        return ParentProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = data.pop("user")

        profile = register_parent(
            user_id=str(user.id),
            occupation=data.get("occupation", ""),
            address=data.get("address", ""),
            secondary_phone=data.get("secondary_phone", ""),
        )

        return Response(
            ParentProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )


class ParentProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enrollment/parents/<uuid>/   – Retrieve
    PUT    /api/enrollment/parents/<uuid>/   – Full update (Director)
    PATCH  /api/enrollment/parents/<uuid>/   – Partial update (Director)
    DELETE /api/enrollment/parents/<uuid>/   – Delete (Director)
    """

    queryset = ParentProfile.objects.select_related("user").all()
    permission_classes = [IsDirectorOrProfileOwner]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ParentProfileCreateSerializer
        return ParentProfileSerializer


# ---------------------------------------------------------------------------
# StudentGuardian Views
# ---------------------------------------------------------------------------


class StudentGuardianListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/guardians/             – List guardian links in scope
    POST /api/enrollment/guardians/             – Create a link (Director)
    """

    permission_classes = [IsDirectorOrGuardianParticipant]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsDirector()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = StudentGuardian.objects.select_related(
            "parent", "parent__user", "student", "student__user"
        ).all()

        user = self.request.user
        if user.role in ("DIRECTOR", "TEACHER"):
            return queryset
        if user.role == "PARENT":
            return queryset.filter(parent__user_id=user.id)
        if user.role == "STUDENT":
            return queryset.filter(student__user_id=user.id)
        return queryset.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StudentGuardianCreateSerializer
        return StudentGuardianSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        link = link_parent_to_student(
            parent_id=str(data["parent"].id),
            student_id=str(data["student"].id),
            relationship=data.get(
                "relationship", StudentGuardian.Relationship.OTHER
            ),
            is_primary=data.get("is_primary", False),
        )

        return Response(
            StudentGuardianSerializer(link).data,
            status=status.HTTP_201_CREATED,
        )


class StudentGuardianDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/enrollment/guardians/<uuid>/   – Retrieve
    DELETE /api/enrollment/guardians/<uuid>/   – Unlink (Director)
    """

    queryset = StudentGuardian.objects.select_related(
        "parent", "parent__user", "student", "student__user"
    ).all()
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsDirectorOrGuardianParticipant]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        unlink_parent_from_student(
            parent_id=str(instance.parent_id),
            student_id=str(instance.student_id),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentGuardiansView(generics.ListAPIView):
    """
    GET /api/enrollment/guardians/student/<uuid>/ – Get guardians of a student
    """

    serializer_class = StudentGuardianSerializer
    permission_classes = [IsDirectorOrGuardianParticipant]

    def get_queryset(self):
        queryset = get_student_guardians(self.kwargs["student_id"])

        user = self.request.user
        if user.role in ("DIRECTOR", "TEACHER"):
            return queryset
        if user.role == "PARENT":
            return queryset.filter(parent__user_id=user.id)
        if user.role == "STUDENT":
            return queryset.filter(student__user_id=user.id)
        return queryset.none()


class ParentChildrenView(generics.ListAPIView):
    """
    GET /api/enrollment/guardians/parent/<uuid>/ – Get children of a parent

    ``parent_id`` is a ParentProfile UUID, not a User UUID. Parents may only
    read their own list.
    """

    serializer_class = StudentGuardianSerializer
    permission_classes = [IsDirectorOrGuardianParticipant]

    def get_queryset(self):
        queryset = get_parent_children(self.kwargs["parent_id"])

        user = self.request.user
        if user.role in ("DIRECTOR", "TEACHER"):
            return queryset
        if user.role == "PARENT":
            return queryset.filter(parent__user_id=user.id)
        return queryset.none()


class SetPrimaryGuardianView(generics.GenericAPIView):
    """
    POST /api/enrollment/guardians/set-primary/ – Set a parent as primary (Director)
    """

    permission_classes = [IsDirector]
    serializer_class = StudentGuardianCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        link = set_primary_guardian(
            student_id=str(data["student"].id),
            parent_id=str(data["parent"].id),
        )

        return Response(
            StudentGuardianSerializer(link).data,
            status=status.HTTP_200_OK,
        )
