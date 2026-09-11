from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.api.serializers import (
    AcademicYearCreateSerializer,
    AcademicYearSerializer,
    ClassSectionCreateSerializer,
    ClassSectionSerializer,
    GradeLevelCreateSerializer,
    GradeLevelSerializer,
    SubjectAssignmentCreateSerializer,
    SubjectAssignmentSerializer,
    SubjectCreateSerializer,
    SubjectSerializer,
)
from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)
from academics.selectors import (
    get_active_academic_year,
    get_section_assignments,
    get_teacher_assignments,
    list_academic_years,
    list_grade_levels,
    list_sections_by_grade,
    list_subjects,
)
from academics.services import (
    assign_teacher_to_subject,
    create_academic_year,
    create_class_section,
    create_grade_level,
    create_subject,
    deactivate_subject_assignment,
    update_class_section,
)
from authentication.permissions import IsDirector


# ============================================================
# Academic Year Views
# ============================================================


class AcademicYearListView(generics.ListCreateAPIView):
    """
    GET /api/academics/years/
    POST /api/academics/years/
    List all academic years or create a new one (Director only).
    """

    permission_classes = [IsDirector]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AcademicYearCreateSerializer
        return AcademicYearSerializer

    def get_queryset(self):
        return list_academic_years()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            academic_year = create_academic_year(
                name=serializer.validated_data["name"],
                start_date=serializer.validated_data["start_date"],
                end_date=serializer.validated_data["end_date"],
                is_active=serializer.validated_data.get("is_active", False),
            )
            return Response(
                {
                    "success": True,
                    "message": "Academic year created successfully.",
                    "data": AcademicYearSerializer(academic_year).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class AcademicYearDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/academics/years/<uuid>/
    Retrieve, update, or delete an academic year (Director only).
    """

    serializer_class = AcademicYearSerializer
    permission_classes = [IsDirector]
    queryset = AcademicYear.objects.all()


class ActiveAcademicYearView(APIView):
    """
    GET /api/academics/years/active/
    Get the currently active academic year.
    """

    permission_classes = [IsDirector]

    def get(self, request):
        academic_year = get_active_academic_year()
        if not academic_year:
            return Response(
                {
                    "success": False,
                    "error": {"message": "No active academic year found."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "success": True,
                "data": AcademicYearSerializer(academic_year).data,
            }
        )


# ============================================================
# Grade Level Views
# ============================================================


class GradeLevelListView(generics.ListCreateAPIView):
    """
    GET /api/academics/grades/
    POST /api/academics/grades/
    List all grade levels or create a new one (Director only).
    """

    permission_classes = [IsDirector]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return GradeLevelCreateSerializer
        return GradeLevelSerializer

    def get_queryset(self):
        academic_year_id = self.request.query_params.get("academic_year_id")
        return list_grade_levels(academic_year_id)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            grade_level = create_grade_level(
                name=serializer.validated_data["name"],
                level=serializer.validated_data["level"],
                academic_year_id=str(serializer.validated_data["academic_year"].id),
                description=serializer.validated_data.get("description", ""),
            )
            return Response(
                {
                    "success": True,
                    "message": "Grade level created successfully.",
                    "data": GradeLevelSerializer(grade_level).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class GradeLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/academics/grades/<uuid>/
    Retrieve, update, or delete a grade level (Director only).
    """

    serializer_class = GradeLevelSerializer
    permission_classes = [IsDirector]
    queryset = GradeLevel.objects.all()


# ============================================================
# Class Section Views
# ============================================================


class ClassSectionListView(generics.ListCreateAPIView):
    """
    GET /api/academics/sections/
    POST /api/academics/sections/
    List all class sections or create a new one (Director only).
    """

    permission_classes = [IsDirector]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ClassSectionCreateSerializer
        return ClassSectionSerializer

    def get_queryset(self):
        grade_id = self.request.query_params.get("grade_id")
        if grade_id:
            return list_sections_by_grade(grade_id)
        return ClassSection.objects.select_related(
            "grade_level", "grade_level__academic_year"
        ).all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            section = create_class_section(
                grade_level_id=str(serializer.validated_data["grade_level"].id),
                name=serializer.validated_data["name"],
                capacity=serializer.validated_data.get("capacity", 40),
                room_number=serializer.validated_data.get("room_number", ""),
            )
            return Response(
                {
                    "success": True,
                    "message": "Class section created successfully.",
                    "data": ClassSectionSerializer(section).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class ClassSectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/academics/sections/<uuid>/
    Retrieve, update, or delete a class section (Director only).
    """

    serializer_class = ClassSectionSerializer
    permission_classes = [IsDirector]
    queryset = ClassSection.objects.all()


class ClassSectionByGradeView(generics.ListAPIView):
    """
    GET /api/academics/sections/by-grade/<uuid>/
    List all sections for a specific grade level (Director only).
    """

    serializer_class = ClassSectionSerializer
    permission_classes = [IsDirector]

    def get_queryset(self):
        return list_sections_by_grade(self.kwargs["grade_id"])


# ============================================================
# Subject Views
# ============================================================


class SubjectListView(generics.ListCreateAPIView):
    """
    GET /api/academics/subjects/
    POST /api/academics/subjects/
    List all subjects or create a new one (Director only).
    """

    permission_classes = [IsDirector]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SubjectCreateSerializer
        return SubjectSerializer

    def get_queryset(self):
        return list_subjects()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            subject = create_subject(
                name=serializer.validated_data["name"],
                code=serializer.validated_data["code"],
                description=serializer.validated_data.get("description", ""),
                grade_level_ids=[
                    str(gl.id)
                    for gl in serializer.validated_data.get("grade_levels", [])
                ],
            )
            return Response(
                {
                    "success": True,
                    "message": "Subject created successfully.",
                    "data": SubjectSerializer(subject).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/academics/subjects/<uuid>/
    Retrieve, update, or delete a subject (Director only).
    """

    serializer_class = SubjectSerializer
    permission_classes = [IsDirector]
    queryset = Subject.objects.all()


# ============================================================
# Subject Assignment Views
# ============================================================


class SubjectAssignmentListView(generics.ListCreateAPIView):
    """
    GET /api/academics/assignments/
    POST /api/academics/assignments/
    List all subject assignments or create a new one (Director only).
    """

    permission_classes = [IsDirector]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SubjectAssignmentCreateSerializer
        return SubjectAssignmentSerializer

    def get_queryset(self):
        queryset = SubjectAssignment.objects.select_related(
            "teacher",
            "subject",
            "section",
            "section__grade_level",
            "academic_year",
        ).all()

        # Filter by teacher
        teacher_id = self.request.query_params.get("teacher_id")
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        # Filter by section
        section_id = self.request.query_params.get("section_id")
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        # Filter by academic year
        academic_year_id = self.request.query_params.get("academic_year_id")
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            assignment = assign_teacher_to_subject(
                teacher_id=str(serializer.validated_data["teacher"].id),
                subject_id=str(serializer.validated_data["subject"].id),
                section_id=str(serializer.validated_data["section"].id),
                academic_year_id=str(
                    serializer.validated_data.get("academic_year", "")
                )
                if serializer.validated_data.get("academic_year")
                else None,
            )
            return Response(
                {
                    "success": True,
                    "message": "Teacher assigned to subject successfully.",
                    "data": SubjectAssignmentSerializer(assignment).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubjectAssignmentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET/DELETE /api/academics/assignments/<uuid>/
    Retrieve or deactivate a subject assignment (Director only).
    """

    serializer_class = SubjectAssignmentSerializer
    permission_classes = [IsDirector]
    queryset = SubjectAssignment.objects.all()

    def destroy(self, request, *args, **kwargs):
        """Soft delete - deactivate instead of hard delete."""
        instance = self.get_object()
        try:
            assignment = deactivate_subject_assignment(str(instance.id))
            return Response(
                {
                    "success": True,
                    "message": "Subject assignment deactivated successfully.",
                    "data": SubjectAssignmentSerializer(assignment).data,
                },
                status=status.HTTP_200_OK,
            )
        except ValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class TeacherAssignmentsView(APIView):
    """
    GET /api/academics/assignments/teacher/<uuid>/
    Get all assignments for a specific teacher (Director only).
    """

    permission_classes = [IsDirector]

    def get(self, request, teacher_id):
        academic_year_id = request.query_params.get("academic_year_id")
        assignments = get_teacher_assignments(teacher_id, academic_year_id)

        return Response(
            {
                "success": True,
                "data": SubjectAssignmentSerializer(assignments, many=True).data,
            }
        )


class SectionAssignmentsView(APIView):
    """
    GET /api/academics/assignments/section/<uuid>/
    Get all assignments for a specific section (Director only).
    """

    permission_classes = [IsDirector]

    def get(self, request, section_id):
        assignments = get_section_assignments(section_id)

        return Response(
            {
                "success": True,
                "data": SubjectAssignmentSerializer(assignments, many=True).data,
            }
        )
