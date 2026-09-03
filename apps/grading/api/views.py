from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsDirector, IsDirectorOrTeacher, IsTeacher
from grading.api.serializers import (
    AssessmentCategoryCreateSerializer,
    AssessmentCategorySerializer,
    BulkGradeSubmitSerializer,
    GradeCreateSerializer,
    GradeSerializer,
    ReportCardSerializer,
)
from grading.models import AssessmentCategory, Grade
from grading.selectors import (
    calculate_subject_total,
    get_assessment_categories_by_subject,
    get_grades_by_assessment_category,
    get_student_grades,
    get_student_report_card,
)
from grading.services import (
    create_assessment_category,
    record_single_grade,
    record_student_grades,
)


# ---------------------------------------------------------------------------
# Assessment Category Views
# ---------------------------------------------------------------------------


class AssessmentCategoryListView(generics.ListCreateAPIView):
    """
    GET  /api/grading/categories/       – List assessment categories
    POST /api/grading/categories/       – Create assessment category (Teacher/Director)
    """

    permission_classes = [IsDirectorOrTeacher]

    def get_queryset(self):
        queryset = AssessmentCategory.objects.select_related(
            "subject_assignment",
            "subject_assignment__subject",
            "subject_assignment__section",
            "subject_assignment__teacher",
        ).all()

        # Filter by subject assignment
        subject_assignment_id = self.request.query_params.get(
            "subject_assignment_id"
        )
        if subject_assignment_id:
            queryset = queryset.filter(
                subject_assignment_id=subject_assignment_id
            )

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AssessmentCategoryCreateSerializer
        return AssessmentCategorySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            category = create_assessment_category(
                name=data["name"],
                subject_assignment_id=str(data["subject_assignment"].id),
                weight=data["weight"],
                description=data.get("description", ""),
            )
            return Response(
                {
                    "success": True,
                    "message": "Assessment category created successfully.",
                    "data": AssessmentCategorySerializer(category).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {"success": False, "error": {"message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AssessmentCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/grading/categories/<uuid>/
    """

    serializer_class = AssessmentCategorySerializer
    permission_classes = [IsDirectorOrTeacher]
    queryset = AssessmentCategory.objects.select_related(
        "subject_assignment",
        "subject_assignment__subject",
        "subject_assignment__section",
        "subject_assignment__teacher",
    ).all()


# ---------------------------------------------------------------------------
# Grade Views
# ---------------------------------------------------------------------------


class GradeListView(generics.ListAPIView):
    """
    GET /api/grading/grades/ – List grades with optional filters
    """

    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Grade.objects.select_related(
            "student",
            "student__user",
            "assessment_category",
            "assessment_category__subject_assignment",
            "assessment_category__subject_assignment__subject",
            "recorded_by",
        ).all()

        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        category_id = self.request.query_params.get("assessment_category_id")
        if category_id:
            queryset = queryset.filter(assessment_category_id=category_id)

        return queryset


class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/grading/grades/<uuid>/
    """

    serializer_class = GradeSerializer
    permission_classes = [IsDirectorOrTeacher]
    queryset = Grade.objects.select_related(
        "student",
        "student__user",
        "assessment_category",
        "assessment_category__subject_assignment",
        "assessment_category__subject_assignment__subject",
        "recorded_by",
    ).all()


# ---------------------------------------------------------------------------
# Single Grade Entry (Teacher)
# ---------------------------------------------------------------------------


class GradeRecordView(APIView):
    """
    POST /api/grading/grades/record/
    Create or update a single grade for one student.
    """

    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = GradeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            grade = record_single_grade(
                student_id=str(data["student"].id),
                assessment_category_id=str(data["assessment_category"].id),
                score=data["score"],
                max_score=data["max_score"],
                remarks=data.get("remarks", ""),
                recorded_by=request.user,
            )
            return Response(
                {
                    "success": True,
                    "message": "Grade recorded successfully.",
                    "data": GradeSerializer(grade).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {"success": False, "error": {"message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Bulk Grade Submission (Teacher marks entry)
# ---------------------------------------------------------------------------


class BulkGradeSubmitView(APIView):
    """
    POST /api/grading/grades/bulk-submit/
    Teachers submit marks for all students in an assessment category.
    """

    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = BulkGradeSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            grades = record_student_grades(
                assessment_category_id=str(data["assessment_category_id"]),
                grade_list=data["grades"],
                recorded_by=request.user,
            )
            return Response(
                {
                    "success": True,
                    "message": f"Successfully recorded grades for {len(grades)} student(s).",
                    "data": GradeSerializer(grades, many=True).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {"success": False, "error": {"message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Subject Total View
# ---------------------------------------------------------------------------


class SubjectTotalView(APIView):
    """
    GET /api/grading/subject-total/<uuid:student_id>/<uuid:subject_assignment_id>/
    Calculate weighted total for a student in a specific subject.
    """

    permission_classes = [IsDirectorOrTeacher]

    def get(self, request, student_id, subject_assignment_id):
        result = calculate_subject_total(
            student_id=student_id,
            subject_assignment_id=subject_assignment_id,
        )

        if result is None:
            return Response(
                {
                    "success": False,
                    "error": {"message": "No assessment categories found for this subject."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# Report Card View (Student / Parent / Director)
# ---------------------------------------------------------------------------


class ReportCardView(APIView):
    """
    GET /api/grading/report-card/<uuid:student_id>/<uuid:academic_year_id>/
    Get the full report card for a student in an academic year.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, academic_year_id):
        result = get_student_report_card(
            student_id=student_id,
            academic_year_id=academic_year_id,
        )

        if result is None:
            return Response(
                {
                    "success": False,
                    "error": {"message": "No grading data found for this student and academic year."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReportCardSerializer(result)
        return Response({"success": True, "data": serializer.data})


# ---------------------------------------------------------------------------
# My Report Card (Student views own)
# ---------------------------------------------------------------------------


class MyReportCardView(APIView):
    """
    GET /api/grading/my-report-card/<uuid:academic_year_id>/
    Students can view their own report card.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, academic_year_id):
        from enrollment.selectors import get_student_profile_by_user

        student_profile = get_student_profile_by_user(str(request.user.id))

        if not student_profile:
            return Response(
                {
                    "success": False,
                    "error": {"message": "No student profile found for this user."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        result = get_student_report_card(
            student_id=str(student_profile.id),
            academic_year_id=academic_year_id,
        )

        if result is None:
            return Response(
                {
                    "success": False,
                    "error": {"message": "No grading data found for this academic year."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReportCardSerializer(result)
        return Response({"success": True, "data": serializer.data})
