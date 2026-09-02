from typing import Optional

from django.db.models import QuerySet

from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)


def get_active_academic_year() -> Optional[AcademicYear]:
    """
    Get the currently active academic year.

    Returns:
        The active AcademicYear instance or None if no active year exists.
    """
    try:
        return AcademicYear.objects.get(is_active=True)
    except AcademicYear.DoesNotExist:
        return None


def get_academic_year_by_name(name: str) -> Optional[AcademicYear]:
    """
    Get an academic year by its name (e.g., '2024-2025').

    Args:
        name: Academic year name

    Returns:
        AcademicYear instance or None
    """
    try:
        return AcademicYear.objects.get(name=name)
    except AcademicYear.DoesNotExist:
        return None


def list_academic_years() -> QuerySet[AcademicYear]:
    """
    Get all academic years ordered by start date (newest first).

    Returns:
        QuerySet of AcademicYear
    """
    return AcademicYear.objects.all()


def list_grade_levels(academic_year_id: Optional[str] = None) -> QuerySet[GradeLevel]:
    """
    Get all grade levels, optionally filtered by academic year.

    Args:
        academic_year_id: Optional academic year UUID to filter by

    Returns:
        QuerySet of GradeLevel
    """
    queryset = GradeLevel.objects.select_related("academic_year").all()
    if academic_year_id:
        queryset = queryset.filter(academic_year_id=academic_year_id)
    return queryset


def list_sections_by_grade(grade_id: str) -> QuerySet[ClassSection]:
    """
    Get all class sections for a specific grade level.

    Args:
        grade_id: GradeLevel UUID

    Returns:
        QuerySet of ClassSection
    """
    return ClassSection.objects.filter(
        grade_level_id=grade_id,
        is_active=True,
    ).select_related("grade_level", "grade_level__academic_year")


def get_section_by_id(section_id: str) -> Optional[ClassSection]:
    """
    Get a specific class section by ID.

    Args:
        section_id: ClassSection UUID

    Returns:
        ClassSection instance or None
    """
    try:
        return ClassSection.objects.select_related(
            "grade_level", "grade_level__academic_year"
        ).get(id=section_id)
    except ClassSection.DoesNotExist:
        return None


def list_subjects() -> QuerySet[Subject]:
    """
    Get all active subjects.

    Returns:
        QuerySet of Subject
    """
    return Subject.objects.filter(is_active=True)


def get_subject_by_code(code: str) -> Optional[Subject]:
    """
    Get a subject by its code (e.g., 'MATH101').

    Args:
        code: Subject code

    Returns:
        Subject instance or None
    """
    try:
        return Subject.objects.get(code=code)
    except Subject.DoesNotExist:
        return None


def get_teacher_assignments(
    teacher_id: str,
    academic_year_id: Optional[str] = None,
) -> QuerySet[SubjectAssignment]:
    """
    Get all subject assignments for a specific teacher.

    Args:
        teacher_id: Teacher's user UUID
        academic_year_id: Optional academic year UUID to filter by

    Returns:
        QuerySet of SubjectAssignment
    """
    queryset = SubjectAssignment.objects.filter(
        teacher_id=teacher_id,
        is_active=True,
    ).select_related(
        "teacher",
        "subject",
        "section",
        "section__grade_level",
        "academic_year",
    )

    if academic_year_id:
        queryset = queryset.filter(academic_year_id=academic_year_id)

    return queryset


def get_section_assignments(section_id: str) -> QuerySet[SubjectAssignment]:
    """
    Get all subject assignments for a specific section.

    Args:
        section_id: ClassSection UUID

    Returns:
        QuerySet of SubjectAssignment
    """
    return SubjectAssignment.objects.filter(
        section_id=section_id,
        is_active=True,
    ).select_related(
        "teacher",
        "subject",
        "section",
        "academic_year",
    )


def check_teacher_availability(
    teacher_id: str,
    subject_id: str,
    section_id: str,
    academic_year_id: str,
) -> bool:
    """
    Check if a teacher is available for a specific subject/section assignment.
    Returns True if no conflict exists.

    Args:
        teacher_id: Teacher's user UUID
        subject_id: Subject UUID
        section_id: ClassSection UUID
        academic_year_id: AcademicYear UUID

    Returns:
        True if available, False if already assigned
    """
    return not SubjectAssignment.objects.filter(
        teacher_id=teacher_id,
        subject_id=subject_id,
        section_id=section_id,
        academic_year_id=academic_year_id,
        is_active=True,
    ).exists()
