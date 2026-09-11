from decimal import Decimal
from typing import Optional

from django.db.models import QuerySet

from grading.models import AssessmentCategory, Grade


def get_student_grades(
    student_id: str,
    subject_assignment_id: Optional[str] = None,
) -> QuerySet[Grade]:
    """
    Get all grades for a student, optionally filtered by subject assignment.

    Args:
        student_id: StudentProfile UUID
        subject_assignment_id: Optional SubjectAssignment UUID filter

    Returns:
        QuerySet of Grade records
    """
    queryset = Grade.objects.filter(
        student_id=student_id,
    ).select_related(
        "assessment_category",
        "assessment_category__subject_assignment",
        "assessment_category__subject_assignment__subject",
        "recorded_by",
    )

    if subject_assignment_id:
        queryset = queryset.filter(
            assessment_category__subject_assignment_id=subject_assignment_id
        )

    return queryset


def get_grades_by_assessment_category(
    assessment_category_id: str,
) -> QuerySet[Grade]:
    """
    Get all grades for a specific assessment category.

    Args:
        assessment_category_id: AssessmentCategory UUID

    Returns:
        QuerySet of Grade records
    """
    return Grade.objects.filter(
        assessment_category_id=assessment_category_id,
    ).select_related(
        "student",
        "student__user",
        "recorded_by",
    )


def get_assessment_categories_by_subject(
    subject_assignment_id: str,
) -> QuerySet[AssessmentCategory]:
    """
    Get all assessment categories for a subject assignment.

    Args:
        subject_assignment_id: SubjectAssignment UUID

    Returns:
        QuerySet of AssessmentCategory records
    """
    return AssessmentCategory.objects.filter(
        subject_assignment_id=subject_assignment_id,
    )


def calculate_subject_total(
    student_id: str,
    subject_assignment_id: str,
) -> Optional[dict]:
    """
    Calculate the weighted total for a student in a specific subject assignment.

    Returns a dict with:
        - subject_name: Name of the subject
        - total_weighted_percentage: Sum of weighted percentages
        - total_weight: Sum of category weights (should be 100% if complete)
        - grades: List of individual grade dicts
        - is_complete: Whether all categories have been graded

    Returns None if no grades exist.
    """
    categories = AssessmentCategory.objects.filter(
        subject_assignment_id=subject_assignment_id,
    ).prefetch_related("grades").order_by("name")

    if not categories.exists():
        return None

    grades_data = []
    total_weighted_percentage = Decimal("0")
    total_weight = Decimal("0")
    graded_weight = Decimal("0")

    for category in categories:
        grade = category.grades.filter(student_id=student_id).first()

        if grade:
            percentage = grade.percentage
            weighted = grade.weighted_score
            total_weighted_percentage += weighted
            graded_weight += category.weight
            grades_data.append(
                {
                    "category_name": category.name,
                    "category_weight": float(category.weight),
                    "score": float(grade.score),
                    "max_score": float(grade.max_score),
                    "percentage": float(percentage),
                    "weighted_score": float(weighted),
                    "remarks": grade.remarks,
                }
            )
        else:
            grades_data.append(
                {
                    "category_name": category.name,
                    "category_weight": float(category.weight),
                    "score": None,
                    "max_score": None,
                    "percentage": None,
                    "weighted_score": 0,
                    "remarks": "",
                }
            )

        total_weight += category.weight

    return {
        "subject_name": categories.first()
        .subject_assignment.subject.name,
        "subject_code": categories.first()
        .subject_assignment.subject.code,
        "total_weighted_percentage": float(total_weighted_percentage),
        "total_weight": float(total_weight),
        "graded_weight": float(graded_weight),
        "is_complete": graded_weight == total_weight,
        "grades": grades_data,
    }


def get_student_report_card(
    student_id: str,
    academic_year_id: str,
) -> Optional[dict]:
    """
    Calculate the overall weighted percentage and GPA across all subjects
    for a student in a given academic year.

    GPA Scale (4.0):
        90-100% -> A  (4.0)
        80-89%  -> B  (3.0)
        70-79%  -> C  (2.0)
        60-69%  -> D  (1.0)
        0-59%   -> F  (0.0)

    Returns a dict with:
        - student_name: Student's full name
        - student_id_code: Institutional student ID
        - academic_year: Academic year name
        - subjects: List of per-subject totals
        - overall_weighted_percentage: Weighted average across subjects
        - overall_gpa: GPA on a 4.0 scale
        - letter_grade: Letter grade for overall percentage
    """
    from academics.models import SubjectAssignment

    assignments = SubjectAssignment.objects.filter(
        section__students__id=student_id,
        academic_year_id=academic_year_id,
        is_active=True,
    ).select_related("subject", "section")

    if not assignments.exists():
        return None

    subjects_data = []
    overall_weighted_percentage = Decimal("0")
    total_weight_sum = Decimal("0")

    for assignment in assignments:
        subject_result = calculate_subject_total(
            student_id=student_id,
            subject_assignment_id=str(assignment.id),
        )
        if subject_result:
            subjects_data.append(subject_result)
            # Each subject contributes equally to the overall
            # (equal weighting across subjects)
            weighted = Decimal(str(subject_result["total_weighted_percentage"]))
            overall_weighted_percentage += weighted
            total_weight_sum += 1

    if total_weight_sum == 0:
        return None

    overall_percentage = overall_weighted_percentage / total_weight_sum
    gpa = _percentage_to_gpa(overall_percentage)
    letter = _percentage_to_letter(overall_percentage)

    # Get student info
    from enrollment.models import StudentProfile

    student = StudentProfile.objects.select_related(
        "user", "section"
    ).get(id=student_id)

    return {
        "student_name": student.user.get_full_name(),
        "student_id_code": student.student_id,
        "section": str(student.section) if student.section else None,
        "academic_year": assignments.first().academic_year.name,
        "subjects": subjects_data,
        "overall_weighted_percentage": float(
            overall_percentage.quantize(Decimal("0.01"))
        ),
        "overall_gpa": float(gpa.quantize(Decimal("0.01"))),
        "letter_grade": letter,
    }


def _percentage_to_gpa(percentage: Decimal) -> Decimal:
    """Convert a percentage to a 4.0 GPA scale."""
    if percentage >= 90:
        return Decimal("4.0")
    elif percentage >= 80:
        return Decimal("3.0")
    elif percentage >= 70:
        return Decimal("2.0")
    elif percentage >= 60:
        return Decimal("1.0")
    else:
        return Decimal("0.0")


def _percentage_to_letter(percentage: Decimal) -> str:
    """Convert a percentage to a letter grade."""
    if percentage >= 90:
        return "A"
    elif percentage >= 80:
        return "B"
    elif percentage >= 70:
        return "C"
    elif percentage >= 60:
        return "D"
    else:
        return "F"
