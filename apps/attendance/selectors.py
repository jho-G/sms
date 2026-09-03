from datetime import date
from typing import Optional

from django.db.models import QuerySet

from attendance.models import Attendance


def get_attendance_by_student(
    student_id: str,
    subject_assignment_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> QuerySet[Attendance]:
    """
    Get attendance records for a specific student.

    Args:
        student_id: StudentProfile UUID
        subject_assignment_id: Optional SubjectAssignment UUID filter
        start_date: Optional start date filter (inclusive)
        end_date: Optional end date filter (inclusive)

    Returns:
        QuerySet of Attendance records
    """
    queryset = Attendance.objects.filter(
        student_id=student_id,
    ).select_related(
        "subject_assignment",
        "subject_assignment__subject",
        "subject_assignment__section",
        "recorded_by",
    )

    if subject_assignment_id:
        queryset = queryset.filter(subject_assignment_id=subject_assignment_id)
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    return queryset


def get_attendance_by_subject_assignment(
    subject_assignment_id: str,
    target_date: Optional[date] = None,
) -> QuerySet[Attendance]:
    """
    Get all attendance records for a subject assignment, optionally filtered by date.

    Args:
        subject_assignment_id: SubjectAssignment UUID
        target_date: Optional specific date to filter

    Returns:
        QuerySet of Attendance records
    """
    queryset = Attendance.objects.filter(
        subject_assignment_id=subject_assignment_id,
    ).select_related(
        "student",
        "student__user",
        "recorded_by",
    )

    if target_date:
        queryset = queryset.filter(date=target_date)

    return queryset


def get_attendance_for_date(
    target_date: date,
    subject_assignment_id: Optional[str] = None,
) -> QuerySet[Attendance]:
    """
    Get all attendance records for a specific date across all subject assignments.

    Args:
        target_date: The date to query
        subject_assignment_id: Optional SubjectAssignment UUID filter

    Returns:
        QuerySet of Attendance records
    """
    queryset = Attendance.objects.filter(
        date=target_date,
    ).select_related(
        "student",
        "student__user",
        "subject_assignment",
        "subject_assignment__subject",
        "recorded_by",
    )

    if subject_assignment_id:
        queryset = queryset.filter(subject_assignment_id=subject_assignment_id)

    return queryset


def get_absent_records_for_date(
    target_date: date,
    subject_assignment_id: Optional[str] = None,
) -> QuerySet[Attendance]:
    """
    Get all ABSENT attendance records for a specific date.

    Args:
        target_date: The date to query
        subject_assignment_id: Optional SubjectAssignment UUID filter

    Returns:
        QuerySet of Attendance records with status ABSENT
    """
    queryset = Attendance.objects.filter(
        date=target_date,
        status=Attendance.Status.ABSENT,
    ).select_related(
        "student",
        "student__user",
        "subject_assignment",
        "subject_assignment__subject",
    )

    if subject_assignment_id:
        queryset = queryset.filter(subject_assignment_id=subject_assignment_id)

    return queryset


def get_student_absence_count(
    student_id: str,
    academic_year_id: Optional[str] = None,
) -> int:
    """
    Count the total number of absences for a student.

    Args:
        student_id: StudentProfile UUID
        academic_year_id: Optional AcademicYear UUID to scope the count

    Returns:
        Integer count of ABSENT records
    """
    queryset = Attendance.objects.filter(
        student_id=student_id,
        status=Attendance.Status.ABSENT,
    )

    if academic_year_id:
        queryset = queryset.filter(
            subject_assignment__academic_year_id=academic_year_id,
        )

    return queryset.count()
