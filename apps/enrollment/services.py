from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

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
    get_student_profile_by_student_id,
    get_teacher_profile_by_user,
)

User = get_user_model()


@transaction.atomic
def register_student(
    user_id: str,
    student_id: str,
    section_id: str,
    date_of_birth,
    guardian_contact: str = "",
    medical_notes: str = "",
) -> StudentProfile:
    """
    Register a student by creating their StudentProfile.

    Args:
        user_id: UUID of the User with STUDENT role
        student_id: Institutional student ID (e.g., STU-2024-001)
        section_id: ClassSection UUID to assign the student to
        date_of_birth: Student's date of birth
        guardian_contact: Optional primary guardian phone number
        medical_notes: Optional medical/allergy notes

    Returns:
        Created StudentProfile instance

    Raises:
        ValidationError: If user not found, wrong role, duplicate student_id, etc.
    """
    # Validate user exists and has STUDENT role
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValidationError("User not found.")

    if user.role != User.Role.STUDENT:
        raise ValidationError("User must have the STUDENT role.")

    # Check for existing profile
    if get_student_profile_by_user(user_id):
        raise ValidationError("A student profile already exists for this user.")

    # Check duplicate student_id
    if get_student_profile_by_student_id(student_id):
        raise ValidationError(
            f"Student ID '{student_id}' is already in use."
        )

    # Validate section exists
    from academics.models import ClassSection

    try:
        section = ClassSection.objects.get(id=section_id)
    except ClassSection.DoesNotExist:
        raise ValidationError("Class section not found.")

    profile = StudentProfile(
        user=user,
        student_id=student_id,
        section=section,
        date_of_birth=date_of_birth,
        guardian_contact=guardian_contact,
        medical_notes=medical_notes,
    )
    profile.full_clean()
    profile.save()

    return profile


@transaction.atomic
def register_teacher(
    user_id: str,
    employee_id: str,
    department: str = "",
    specialization: str = "",
    qualification: str = "",
) -> TeacherProfile:
    """
    Register a teacher by creating their TeacherProfile.

    Args:
        user_id: UUID of the User with TEACHER role
        employee_id: Institutional employee ID (e.g., TCH-2024-001)
        department: Optional department name
        specialization: Optional specialization areas
        qualification: Optional highest qualification

    Returns:
        Created TeacherProfile instance

    Raises:
        ValidationError: If user not found, wrong role, duplicate employee_id, etc.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValidationError("User not found.")

    if user.role != User.Role.TEACHER:
        raise ValidationError("User must have the TEACHER role.")

    if get_teacher_profile_by_user(user_id):
        raise ValidationError("A teacher profile already exists for this user.")

    if TeacherProfile.objects.filter(employee_id=employee_id).exists():
        raise ValidationError(
            f"Employee ID '{employee_id}' is already in use."
        )

    profile = TeacherProfile(
        user=user,
        employee_id=employee_id,
        department=department,
        specialization=specialization,
        qualification=qualification,
    )
    profile.full_clean()
    profile.save()

    return profile


@transaction.atomic
def register_parent(
    user_id: str,
    occupation: str = "",
    address: str = "",
    secondary_phone: str = "",
) -> ParentProfile:
    """
    Register a parent by creating their ParentProfile.

    Args:
        user_id: UUID of the User with PARENT role
        occupation: Optional occupation
        address: Optional address
        secondary_phone: Optional secondary phone number

    Returns:
        Created ParentProfile instance

    Raises:
        ValidationError: If user not found, wrong role, duplicate profile, etc.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValidationError("User not found.")

    if user.role != User.Role.PARENT:
        raise ValidationError("User must have the PARENT role.")

    if get_parent_profile_by_user(user_id):
        raise ValidationError("A parent profile already exists for this user.")

    profile = ParentProfile(
        user=user,
        occupation=occupation,
        address=address,
        secondary_phone=secondary_phone,
    )
    profile.full_clean()
    profile.save()

    return profile


@transaction.atomic
def link_parent_to_student(
    parent_id: str,
    student_id: str,
    relationship: str = StudentGuardian.Relationship.OTHER,
    is_primary: bool = False,
) -> StudentGuardian:
    """
    Link a parent to a student as a guardian.

    Args:
        parent_id: ParentProfile UUID
        student_id: StudentProfile UUID
        relationship: Relationship type (FATHER, MOTHER, GUARDIAN, SIBLING, OTHER)
        is_primary: Whether this is the primary guardian

    Returns:
        Created StudentGuardian instance

    Raises:
        ValidationError: If profiles not found, already linked, or primary conflict.
    """
    # Validate parent profile exists
    try:
        parent = ParentProfile.objects.get(id=parent_id)
    except ParentProfile.DoesNotExist:
        raise ValidationError("Parent profile not found.")

    # Validate student profile exists
    try:
        student = StudentProfile.objects.get(id=student_id)
    except StudentProfile.DoesNotExist:
        raise ValidationError("Student profile not found.")

    # Check for duplicate link
    if StudentGuardian.objects.filter(parent=parent, student=student).exists():
        raise ValidationError(
            "This parent is already linked to this student."
        )

    # Validate relationship choices
    valid_relationships = [c[0] for c in StudentGuardian.Relationship.choices]
    if relationship not in valid_relationships:
        raise ValidationError(
            f"Invalid relationship. Must be one of: {valid_relationships}"
        )

    link = StudentGuardian(
        parent=parent,
        student=student,
        relationship=relationship,
        is_primary=is_primary,
    )
    link.full_clean()
    link.save()

    return link


@transaction.atomic
def unlink_parent_from_student(
    parent_id: str,
    student_id: str,
) -> None:
    """
    Remove a parent-student guardian link.

    Args:
        parent_id: ParentProfile UUID
        student_id: StudentProfile UUID

    Raises:
        ValidationError: If the link does not exist.
    """
    deleted_count, _ = StudentGuardian.objects.filter(
        parent_id=parent_id,
        student_id=student_id,
    ).delete()

    if deleted_count == 0:
        raise ValidationError("Guardian link not found.")


@transaction.atomic
def set_primary_guardian(
    student_id: str,
    parent_id: str,
) -> StudentGuardian:
    """
    Set a specific parent as the primary guardian for a student.

    Args:
        student_id: StudentProfile UUID
        parent_id: ParentProfile UUID to mark as primary

    Returns:
        Updated StudentGuardian instance

    Raises:
        ValidationError: If the link does not exist.
    """
    try:
        link = StudentGuardian.objects.get(
            student_id=student_id,
            parent_id=parent_id,
        )
    except StudentGuardian.DoesNotExist:
        raise ValidationError("Guardian link not found.")

    link.is_primary = True
    link.full_clean()
    link.save()

    return link
