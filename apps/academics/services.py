from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)
from academics.selectors import (
    check_teacher_availability,
    get_active_academic_year,
)

User = get_user_model()


@transaction.atomic
def create_academic_year(
    name: str,
    start_date,
    end_date,
    is_active: bool = False,
) -> AcademicYear:
    """
    Create a new academic year.

    Args:
        name: Academic year name (e.g., '2024-2025')
        start_date: Start date
        end_date: End date
        is_active: Whether this is the active year

    Returns:
        Created AcademicYear instance

    Raises:
        ValidationError: If validation fails
    """
    if start_date >= end_date:
        raise ValidationError("Start date must be before end date.")

    if AcademicYear.objects.filter(name=name).exists():
        raise ValidationError(f"Academic year '{name}' already exists.")

    academic_year = AcademicYear(
        name=name,
        start_date=start_date,
        end_date=end_date,
        is_active=is_active,
    )
    academic_year.full_clean()
    academic_year.save()

    return academic_year


@transaction.atomic
def create_grade_level(
    name: str,
    level: int,
    academic_year_id: str,
    description: str = "",
) -> GradeLevel:
    """
    Create a new grade level.

    Args:
        name: Grade level name (e.g., 'Grade 9')
        level: Numeric level (9-12)
        academic_year_id: AcademicYear UUID
        description: Optional description

    Returns:
        Created GradeLevel instance

    Raises:
        ValidationError: If validation fails
    """
    if level not in range(9, 13):
        raise ValidationError("Grade level must be between 9 and 12.")

    try:
        academic_year = AcademicYear.objects.get(id=academic_year_id)
    except AcademicYear.DoesNotExist:
        raise ValidationError("Academic year not found.")

    if GradeLevel.objects.filter(level=level, academic_year=academic_year).exists():
        raise ValidationError(
            f"Grade level {level} already exists for {academic_year.name}."
        )

    grade_level = GradeLevel(
        name=name,
        level=level,
        academic_year=academic_year,
        description=description,
    )
    grade_level.full_clean()
    grade_level.save()

    return grade_level


@transaction.atomic
def create_class_section(
    grade_level_id: str,
    name: str,
    capacity: int = 40,
    room_number: str = "",
) -> ClassSection:
    """
    Create a new class section.

    Args:
        grade_level_id: GradeLevel UUID
        name: Section name (e.g., 'A', 'B')
        capacity: Maximum students (default: 40)
        room_number: Optional room number

    Returns:
        Created ClassSection instance

    Raises:
        ValidationError: If validation fails
    """
    try:
        grade_level = GradeLevel.objects.get(id=grade_level_id)
    except GradeLevel.DoesNotExist:
        raise ValidationError("Grade level not found.")

    if ClassSection.objects.filter(grade_level=grade_level, name=name).exists():
        raise ValidationError(
            f"Section '{name}' already exists for {grade_level.name}."
        )

    section = ClassSection(
        grade_level=grade_level,
        name=name,
        capacity=capacity,
        room_number=room_number,
    )
    section.full_clean()
    section.save()

    return section


@transaction.atomic
def create_subject(
    name: str,
    code: str,
    description: str = "",
    grade_level_ids: Optional[list] = None,
) -> Subject:
    """
    Create a new subject.

    Args:
        name: Subject name (e.g., 'Mathematics')
        code: Subject code (e.g., 'MATH101')
        description: Optional description
        grade_level_ids: List of GradeLevel UUIDs this subject is offered in

    Returns:
        Created Subject instance

    Raises:
        ValidationError: If validation fails
    """
    if Subject.objects.filter(code=code).exists():
        raise ValidationError(f"Subject with code '{code}' already exists.")

    if Subject.objects.filter(name=name).exists():
        raise ValidationError(f"Subject with name '{name}' already exists.")

    subject = Subject(
        name=name,
        code=code,
        description=description,
    )
    subject.full_clean()
    subject.save()

    # Add grade levels if provided
    if grade_level_ids:
        grade_levels = GradeLevel.objects.filter(id__in=grade_level_ids)
        subject.grade_levels.set(grade_levels)

    return subject


@transaction.atomic
def assign_teacher_to_subject(
    teacher_id: str,
    subject_id: str,
    section_id: str,
    academic_year_id: Optional[str] = None,
) -> SubjectAssignment:
    """
    Assign a teacher to a subject and section.

    Args:
        teacher_id: Teacher's user UUID
        subject_id: Subject UUID
        section_id: ClassSection UUID
        academic_year_id: Optional AcademicYear UUID (uses active year if not provided)

    Returns:
        Created SubjectAssignment instance

    Raises:
        ValidationError: If validation fails
    """
    # Get academic year (use active if not provided)
    if academic_year_id:
        try:
            academic_year = AcademicYear.objects.get(id=academic_year_id)
        except AcademicYear.DoesNotExist:
            raise ValidationError("Academic year not found.")
    else:
        academic_year = get_active_academic_year()
        if not academic_year:
            raise ValidationError("No active academic year found. Please specify one.")

    # Validate teacher
    try:
        teacher = User.objects.get(id=teacher_id, role="TEACHER")
    except User.DoesNotExist:
        raise ValidationError("Teacher not found or user is not a teacher.")

    # Validate subject
    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        raise ValidationError("Subject not found.")

    # Validate section
    try:
        section = ClassSection.objects.get(id=section_id)
    except ClassSection.DoesNotExist:
        raise ValidationError("Class section not found.")

    # Check availability
    if not check_teacher_availability(teacher_id, subject_id, section_id, academic_year.id):
        raise ValidationError(
            "This teacher is already assigned to this subject and section."
        )

    assignment = SubjectAssignment(
        teacher=teacher,
        subject=subject,
        section=section,
        academic_year=academic_year,
    )
    assignment.full_clean()
    assignment.save()

    return assignment


@transaction.atomic
def update_class_section(
    section_id: str,
    **update_fields,
) -> ClassSection:
    """
    Update a class section.

    Args:
        section_id: ClassSection UUID
        **update_fields: Fields to update (capacity, room_number, is_active)

    Returns:
        Updated ClassSection instance

    Raises:
        ValidationError: If section not found
    """
    try:
        section = ClassSection.objects.get(id=section_id)
    except ClassSection.DoesNotExist:
        raise ValidationError("Class section not found.")

    for field, value in update_fields.items():
        if hasattr(section, field):
            setattr(section, field, value)

    section.full_clean()
    section.save()

    return section


@transaction.atomic
def deactivate_subject_assignment(assignment_id: str) -> SubjectAssignment:
    """
    Deactivate a subject assignment (soft delete).

    Args:
        assignment_id: SubjectAssignment UUID

    Returns:
        Updated SubjectAssignment instance

    Raises:
        ValidationError: If assignment not found
    """
    try:
        assignment = SubjectAssignment.objects.get(id=assignment_id)
    except SubjectAssignment.DoesNotExist:
        raise ValidationError("Subject assignment not found.")

    assignment.is_active = False
    assignment.save()

    return assignment
