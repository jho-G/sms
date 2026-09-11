from decimal import Decimal
from typing import List

from django.core.exceptions import ValidationError
from django.db import transaction

from grading.models import AssessmentCategory, Grade


@transaction.atomic
def create_assessment_category(
    name: str,
    subject_assignment_id: str,
    weight: Decimal,
    description: str = "",
) -> AssessmentCategory:
    """
    Create a new assessment category for a subject assignment.

    Args:
        name: Category name (e.g., 'Midterm', 'Final Exam')
        subject_assignment_id: SubjectAssignment UUID
        weight: Weight as percentage (e.g., Decimal('30.00') for 30%)
        description: Optional description

    Returns:
        Created AssessmentCategory instance

    Raises:
        ValidationError: If validation fails
    """
    from academics.models import SubjectAssignment

    try:
        subject_assignment = SubjectAssignment.objects.get(
            id=subject_assignment_id
        )
    except SubjectAssignment.DoesNotExist:
        raise ValidationError("Subject assignment not found.")

    if not subject_assignment.is_active:
        raise ValidationError("Subject assignment is no longer active.")

    # Check for duplicate category name
    if AssessmentCategory.objects.filter(
        name=name, subject_assignment=subject_assignment
    ).exists():
        raise ValidationError(
            f"Assessment category '{name}' already exists "
            f"for this subject assignment."
        )

    category = AssessmentCategory(
        name=name,
        subject_assignment=subject_assignment,
        weight=weight,
        description=description,
    )
    category.full_clean()
    category.save()

    return category


@transaction.atomic
def record_student_grades(
    assessment_category_id: str,
    grade_list: List[dict],
    recorded_by=None,
) -> List[Grade]:
    """
    Bulk-record grades for multiple students in an assessment category.

    Each entry in ``grade_list`` should contain:
        - student_id (str): UUID of the StudentProfile
        - score (Decimal/float): Student's raw score
        - max_score (Decimal/float): Maximum possible score
        - remarks (str, optional): Teacher remarks

    Args:
        assessment_category_id: AssessmentCategory UUID
        grade_list: List of dicts with student_id, score, max_score, remarks
        recorded_by: Optional User who is recording

    Returns:
        List of created/updated Grade instances

    Raises:
        ValidationError: If the assessment category is invalid or
                         any grade entry fails validation.
    """
    try:
        category = AssessmentCategory.objects.select_related(
            "subject_assignment"
        ).get(id=assessment_category_id)
    except AssessmentCategory.DoesNotExist:
        raise ValidationError("Assessment category not found.")

    # Validate all student IDs upfront
    from enrollment.models import StudentProfile

    student_ids = [entry["student_id"] for entry in grade_list]
    students_map = {
        str(s.id): s
        for s in StudentProfile.objects.filter(
            id__in=student_ids, is_active=True
        ).select_related("user")
    }

    missing_ids = set(student_ids) - set(students_map.keys())
    if missing_ids:
        raise ValidationError(
            f"Student profiles not found or inactive: {', '.join(missing_ids)}"
        )

    created_records: List[Grade] = []

    for entry in grade_list:
        student_id = entry["student_id"]
        score = Decimal(str(entry["score"]))
        max_score = Decimal(str(entry["max_score"]))
        remarks = entry.get("remarks", "")

        # Validate score
        if score < 0:
            raise ValidationError(f"Score cannot be negative for student {student_id}.")
        if max_score <= 0:
            raise ValidationError(f"Max score must be greater than 0 for student {student_id}.")
        if score > max_score:
            raise ValidationError(
                f"Score ({score}) cannot exceed max score ({max_score}) "
                f"for student {student_id}."
            )

        student = students_map[student_id]

        # Upsert: get existing or create new
        record, created = Grade.objects.get_or_create(
            student=student,
            assessment_category=category,
            defaults={
                "score": score,
                "max_score": max_score,
                "remarks": remarks,
                "recorded_by": recorded_by,
            },
        )

        if not created:
            record.score = score
            record.max_score = max_score
            record.remarks = remarks
            if recorded_by:
                record.recorded_by = recorded_by
            record.save()

        created_records.append(record)

    return created_records


@transaction.atomic
def record_single_grade(
    student_id: str,
    assessment_category_id: str,
    score: Decimal,
    max_score: Decimal,
    remarks: str = "",
    recorded_by=None,
) -> Grade:
    """
    Record a single grade for one student in an assessment category.

    Args:
        student_id: StudentProfile UUID
        assessment_category_id: AssessmentCategory UUID
        score: Student's raw score
        max_score: Maximum possible score
        remarks: Optional teacher remarks
        recorded_by: Optional User who is recording

    Returns:
        Created or updated Grade instance

    Raises:
        ValidationError: If validation fails
    """
    return record_student_grades(
        assessment_category_id=assessment_category_id,
        grade_list=[
            {
                "student_id": student_id,
                "score": score,
                "max_score": max_score,
                "remarks": remarks,
            }
        ],
        recorded_by=recorded_by,
    )[0]
