from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
    get_student_guardians,
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


# ---------------------------------------------------------------------------
# Student Profile Views
# ---------------------------------------------------------------------------


class StudentProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/students/       – List all student profiles
    POST /api/enrollment/students/       – Create a student profile
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_active_student_profiles()

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
    PUT    /api/enrollment/students/<uuid>/   – Full update
    PATCH  /api/enrollment/students/<uuid>/   – Partial update
    DELETE /api/enrollment/students/<uuid>/   – Delete
    """

    queryset = StudentProfile.objects.select_related("user", "section").all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return StudentProfileCreateSerializer
        return StudentProfileSerializer


class StudentProfilesBySectionView(generics.ListAPIView):
    """
    GET /api/enrollment/students/by-section/<uuid>/ – List students in a section
    """

    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_students_by_section(self.kwargs["section_id"])


# ---------------------------------------------------------------------------
# Teacher Profile Views
# ---------------------------------------------------------------------------


class TeacherProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/teachers/       – List all teacher profiles
    POST /api/enrollment/teachers/       – Create a teacher profile
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_active_teacher_profiles()

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
    PUT    /api/enrollment/teachers/<uuid>/   – Full update
    PATCH  /api/enrollment/teachers/<uuid>/   – Partial update
    DELETE /api/enrollment/teachers/<uuid>/   – Delete
    """

    queryset = TeacherProfile.objects.select_related("user").all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TeacherProfileCreateSerializer
        return TeacherProfileSerializer


# ---------------------------------------------------------------------------
# Parent Profile Views
# ---------------------------------------------------------------------------


class ParentProfileListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/parents/       – List all parent profiles
    POST /api/enrollment/parents/       – Create a parent profile
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_active_parent_profiles()

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
    PUT    /api/enrollment/parents/<uuid>/   – Full update
    PATCH  /api/enrollment/parents/<uuid>/   – Partial update
    DELETE /api/enrollment/parents/<uuid>/   – Delete
    """

    queryset = ParentProfile.objects.select_related("user").all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ParentProfileCreateSerializer
        return ParentProfileSerializer


# ---------------------------------------------------------------------------
# StudentGuardian Views
# ---------------------------------------------------------------------------


class StudentGuardianListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enrollment/guardians/             – List all guardian links
    POST /api/enrollment/guardians/             – Create a guardian link
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudentGuardian.objects.select_related(
            "parent", "parent__user", "student", "student__user"
        ).all()

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
    DELETE /api/enrollment/guardians/<uuid>/   – Delete (unlink)
    """

    queryset = StudentGuardian.objects.select_related(
        "parent", "parent__user", "student", "student__user"
    ).all()
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_student_guardians(self.kwargs["student_id"])


class ParentChildrenView(generics.ListAPIView):
    """
    GET /api/enrollment/guardians/parent/<uuid>/ – Get children of a parent
    """

    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_parent_children(self.kwargs["parent_id"])


class SetPrimaryGuardianView(generics.GenericAPIView):
    """
    POST /api/enrollment/guardians/set-primary/ – Set a parent as primary guardian
    """

    permission_classes = [IsAuthenticated]
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
