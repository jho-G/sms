from typing import Optional

from django.db.models import QuerySet

from enrollment.models import (
    ParentProfile,
    StudentGuardian,
    StudentProfile,
    TeacherProfile,
)


def get_student_profile_by_user(user_id: str) -> Optional[StudentProfile]:
    """
    Get a student profile by user UUID.

    Args:
        user_id: User UUID

    Returns:
        StudentProfile or None
    """
    try:
        return StudentProfile.objects.select_related("user", "section").get(
            user_id=user_id
        )
    except StudentProfile.DoesNotExist:
        return None


def get_student_profile_by_student_id(student_id: str) -> Optional[StudentProfile]:
    """
    Get a student profile by institutional student ID.

    Args:
        student_id: Institutional student ID (e.g., STU-2024-001)

    Returns:
        StudentProfile or None
    """
    try:
        return StudentProfile.objects.select_related("user", "section").get(
            student_id=student_id
        )
    except StudentProfile.DoesNotExist:
        return None


def get_teacher_profile_by_user(user_id: str) -> Optional[TeacherProfile]:
    """
    Get a teacher profile by user UUID.

    Args:
        user_id: User UUID

    Returns:
        TeacherProfile or None
    """
    try:
        return TeacherProfile.objects.select_related("user").get(user_id=user_id)
    except TeacherProfile.DoesNotExist:
        return None


def get_parent_profile_by_user(user_id: str) -> Optional[ParentProfile]:
    """
    Get a parent profile by user UUID.

    Args:
        user_id: User UUID

    Returns:
        ParentProfile or None
    """
    try:
        return ParentProfile.objects.select_related("user").get(user_id=user_id)
    except ParentProfile.DoesNotExist:
        return None


def get_student_guardians(student_id: str) -> QuerySet[StudentGuardian]:
    """
    Get all guardians linked to a student.

    Args:
        student_id: StudentProfile UUID

    Returns:
        QuerySet of StudentGuardian with related parent and user
    """
    return (
        StudentGuardian.objects.filter(student_id=student_id)
        .select_related("parent", "parent__user")
        .order_by("-is_primary")
    )


def get_parent_children(parent_id: str) -> QuerySet[StudentGuardian]:
    """
    Get all children linked to a parent.

    Args:
        parent_id: ParentProfile UUID

    Returns:
        QuerySet of StudentGuardian with related student and user
    """
    return (
        StudentGuardian.objects.filter(parent_id=parent_id)
        .select_related("student", "student__user", "student__section")
        .order_by("student__student_id")
    )


def list_students_by_section(section_id: str) -> QuerySet[StudentProfile]:
    """
    Get all active students in a given section.

    Args:
        section_id: ClassSection UUID

    Returns:
        QuerySet of StudentProfile
    """
    return StudentProfile.objects.filter(
        section_id=section_id,
        is_active=True,
    ).select_related("user")


def list_active_student_profiles() -> QuerySet[StudentProfile]:
    """
    Get all active student profiles.

    Returns:
        QuerySet of StudentProfile
    """
    return StudentProfile.objects.filter(is_active=True).select_related("user", "section")


def list_active_teacher_profiles() -> QuerySet[TeacherProfile]:
    """
    Get all active teacher profiles.

    Returns:
        QuerySet of TeacherProfile
    """
    return TeacherProfile.objects.filter(is_active=True).select_related("user")


def list_active_parent_profiles() -> QuerySet[ParentProfile]:
    """
    Get all active parent profiles.

    Returns:
        QuerySet of ParentProfile
    """
    return ParentProfile.objects.filter(is_active=True).select_related("user")
