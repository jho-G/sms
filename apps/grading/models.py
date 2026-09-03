from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


class AssessmentCategory(TimeStampedModel):
    """
    Defines a weighted assessment category within a subject assignment.
    e.g., Midterm (30%), Final (50%), Quizzes (20%).
    The sum of all category weights for a subject assignment must not exceed 100%.
    """

    name = models.CharField(
        max_length=100,
        help_text="Category name, e.g., Midterm, Final Exam, Quizzes",
    )
    subject_assignment = models.ForeignKey(
        "academics.SubjectAssignment",
        on_delete=models.CASCADE,
        related_name="assessment_categories",
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Weight as percentage, e.g., 30.00 for 30%",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional description of this assessment category",
    )

    class Meta:
        ordering = ["subject_assignment", "name"]
        unique_together = ["name", "subject_assignment"]
        verbose_name = "assessment category"
        verbose_name_plural = "assessment categories"

    def __str__(self):
        return (
            f"{self.name} ({self.weight}%) - "
            f"{self.subject_assignment.subject.name}"
        )

    def clean(self):
        """Validate weight is between 0 and 100, and total doesn't exceed 100%."""
        if self.weight <= 0:
            raise ValidationError("Weight must be greater than 0.")
        if self.weight > 100:
            raise ValidationError("Weight cannot exceed 100%.")

        # Check total weight for this subject assignment
        existing_total = (
            AssessmentCategory.objects.filter(
                subject_assignment=self.subject_assignment
            )
            .exclude(pk=self.pk)
            .values_list("weight", flat=True)
        )
        total = sum(existing_total) + self.weight
        if total > 100:
            raise ValidationError(
                f"Total weight for this subject assignment would be "
                f"{total}%, which exceeds 100%."
            )


class Grade(TimeStampedModel):
    """
    Stores a student's score for a specific assessment category.
    The weighted score is calculated as: (score / max_score) * category_weight.
    """

    student = models.ForeignKey(
        "enrollment.StudentProfile",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    assessment_category = models.ForeignKey(
        AssessmentCategory,
        on_delete=models.CASCADE,
        related_name="grades",
    )
    score = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Student's raw score",
    )
    max_score = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Maximum possible score for this assessment",
    )
    remarks = models.TextField(
        blank=True,
        default="",
        help_text="Optional teacher remarks for this grade",
    )
    recorded_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grades_recorded",
        help_text="Teacher or staff who recorded this grade",
    )

    class Meta:
        ordering = ["-assessment_category", "student"]
        unique_together = ["student", "assessment_category"]
        verbose_name = "grade"
        verbose_name_plural = "grades"

    def __str__(self):
        return (
            f"{self.student} - {self.assessment_category.name}: "
            f"{self.score}/{self.max_score}"
        )

    def clean(self):
        """Validate score is within valid range."""
        if self.score < 0:
            raise ValidationError("Score cannot be negative.")
        if self.max_score <= 0:
            raise ValidationError("Max score must be greater than 0.")
        if self.score > self.max_score:
            raise ValidationError("Score cannot exceed max score.")

    @property
    def percentage(self):
        """Return the raw percentage for this grade."""
        if self.max_score == 0:
            return 0
        return (self.score / self.max_score) * 100

    @property
    def weighted_score(self):
        """Return the weighted contribution of this grade."""
        return self.percentage * (self.assessment_category.weight / 100)
