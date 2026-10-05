from datetime import datetime

from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import SubjectAssignment
from attendance.api.serializers import (
    AttendanceCreateSerializer,
    AttendanceRecordInputSerializer,
    AttendanceSerializer,
    BulkAttendanceSubmitSerializer,
)
from attendance.models import Attendance
from attendance.selectors import (
    get_absent_records_for_date,
    get_attendance_by_student,
    get_attendance_by_subject_assignment,
    get_attendance_for_date,
    get_student_absence_count,
    scope_attendance_to_user,
)
from attendance.services import bulk_mark_attendance, mark_single_attendance
from authentication.permissions import IsDirector, IsTeacher, IsDirectorOrTeacher


# ---------------------------------------------------------------------------
# Attendance List & Detail Views
# ---------------------------------------------------------------------------


class AttendanceListView(generics.ListAPIView):
    """
    GET /api/attendance/
    List attendance records with optional filters.

    Results are always narrowed to what the caller may read before the
    query-parameter filters are applied.
    """

    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.select_related(
            "student",
            "student__user",
            "subject_assignment",
            "subject_assignment__subject",
            "subject_assignment__section",
            "recorded_by",
        ).all()

        queryset = scope_attendance_to_user(queryset, self.request.user)

        # Filter by student
        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Filter by subject assignment
        subject_assignment_id = self.request.query_params.get(
            "subject_assignment_id"
        )
        if subject_assignment_id:
            queryset = queryset.filter(
                subject_assignment_id=subject_assignment_id
            )

        # Filter by date
        target_date = self.request.query_params.get("date")
        if target_date:
            queryset = queryset.filter(date=target_date)

        # Filter by status
        attendance_status = self.request.query_params.get("status")
        if attendance_status:
            queryset = queryset.filter(status=attendance_status)

        return queryset


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/attendance/<uuid>/
    Retrieve, update, or delete a single attendance record.

    Teachers are limited to records on their own subject assignments.
    """

    serializer_class = AttendanceSerializer
    permission_classes = [IsDirectorOrTeacher]

    def get_queryset(self):
        return scope_attendance_to_user(
            Attendance.objects.select_related(
                "student",
                "student__user",
                "subject_assignment",
                "subject_assignment__subject",
                "subject_assignment__section",
                "recorded_by",
            ).all(),
            self.request.user,
        )


# ---------------------------------------------------------------------------
# Single Attendance Record (create / update)
# ---------------------------------------------------------------------------


class AttendanceRecordView(APIView):
    """
    POST /api/attendance/record/
    Create or update a single attendance record.

    Accepts: student_id, subject_assignment_id, date, status, remarks
    """

    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        if data["subject_assignment"].teacher_id != request.user.id:
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "You can only record attendance for your own classes."
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            record = mark_single_attendance(
                student_id=str(data["student"].id),
                subject_assignment_id=str(data["subject_assignment"].id),
                attendance_date=data["date"],
                status=data["status"],
                remarks=data.get("remarks", ""),
                recorded_by=request.user,
            )
            return Response(
                {
                    "success": True,
                    "message": "Attendance recorded successfully.",
                    "data": AttendanceSerializer(record).data,
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


# ---------------------------------------------------------------------------
# Bulk Attendance Submission (teacher daily / subject attendance log)
# ---------------------------------------------------------------------------


class BulkAttendanceSubmitView(APIView):
    """
    POST /api/attendance/bulk-submit/
    Teachers submit daily or subject-level attendance logs.

    Accepts:
        subject_assignment_id (uuid)
        date (YYYY-MM-DD)
        records: [
            { student_id, status, remarks? },
            ...
        ]
    """

    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = BulkAttendanceSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        if not SubjectAssignment.objects.filter(
            id=data["subject_assignment_id"], teacher_id=request.user.id
        ).exists():
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "You can only record attendance for your own classes."
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            records = bulk_mark_attendance(
                subject_assignment_id=str(data["subject_assignment_id"]),
                attendance_date=data["date"],
                attendance_data=data["records"],
                recorded_by=request.user,
            )
            return Response(
                {
                    "success": True,
                    "message": f"Successfully recorded attendance for {len(records)} student(s).",
                    "data": AttendanceSerializer(records, many=True).data,
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


# ---------------------------------------------------------------------------
# Subject-Date Attendance View (teacher sees today's roll for a subject)
# ---------------------------------------------------------------------------


class SubjectDateAttendanceView(APIView):
    """
    GET /api/attendance/subject/<uuid>/date/<date>/
    Get all attendance records for a subject assignment on a specific date.
    """

    permission_classes = [IsDirectorOrTeacher]

    def get(self, request, subject_assignment_id, target_date):
        # Parse string date (YYYY-MM-DD) into date object
        try:
            parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {
                    "success": False,
                    "error": {"message": "Invalid date format. Use YYYY-MM-DD."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        records = get_attendance_by_subject_assignment(
            subject_assignment_id=subject_assignment_id,
            target_date=parsed_date,
        )
        records = scope_attendance_to_user(records, request.user)

        return Response(
            {
                "success": True,
                "data": AttendanceSerializer(records, many=True).data,
            }
        )


# ---------------------------------------------------------------------------
# Student Absence Summary
# ---------------------------------------------------------------------------


class StudentAbsenceSummaryView(APIView):
    """
    GET /api/attendance/student/<uuid>/absences/
    Get absence count and recent absent records for a student.
    """

    permission_classes = [IsDirectorOrTeacher]

    def get(self, request, student_id):
        academic_year_id = request.query_params.get("academic_year_id")

        # Scope first, then count, so a teacher only ever sees absences from
        # their own classes rather than the student's school-wide total.
        absences = scope_attendance_to_user(
            Attendance.objects.filter(
                student_id=student_id,
                status=Attendance.Status.ABSENT,
            ),
            request.user,
        )
        if academic_year_id:
            absences = absences.filter(
                subject_assignment__academic_year_id=academic_year_id,
            )

        recent_absences = absences.select_related(
            "student",
            "student__user",
            "subject_assignment",
            "subject_assignment__subject",
            "subject_assignment__section",
            "recorded_by",
        )[:20]

        return Response(
            {
                "success": True,
                "data": {
                    "total_absences": absences.count(),
                    "recent_absences": AttendanceSerializer(
                        recent_absences, many=True
                    ).data,
                },
            }
        )
