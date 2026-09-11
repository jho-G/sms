from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class AcademicYear(TimeStampedModel):
    """
    Represents an academic year (e.g., 2024-2025).
    """

    name = models.CharField(
        max_length=20,
        unique=True,
        help_text="e.g., 2024-2025",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(
        default=False,
        help_text="Only one academic year can be active at a time",
    )

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "academic year"
        verbose_name_plural = "academic years"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one active academic year
        if self.is_active:
            AcademicYear.objects.filter(is_active=True).exclude(pk=self.pk).update(
                is_active=False
            )
        super().save(*args, **kwargs)


class GradeLevel(TimeStampedModel):
    """
    Represents a grade level (e.g., Grade 9, Grade 10, Grade 11, Grade 12).
    """

    class GradeChoices(models.IntegerChoices):
        GRADE_9 = 9, "Grade 9"
        GRADE_10 = 10, "Grade 10"
        GRADE_11 = 11, "Grade 11"
        GRADE_12 = 12, "Grade 12"

    name = models.CharField(
        max_length=50,
        help_text="e.g., Grade 9",
    )
    level = models.IntegerField(
        choices=GradeChoices.choices,
        unique=True,
        help_text="Numeric grade level (9-12)",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="grade_levels",
    )
    description = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = ["level"]
        unique_together = ["level", "academic_year"]
        verbose_name = "grade level"
        verbose_name_plural = "grade levels"

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"


class ClassSection(TimeStampedModel):
    """
    Represents a specific class section (e.g., 11-A, 12-B).
    """

    grade_level = models.ForeignKey(
        GradeLevel,
        on_delete=models.CASCADE,
        related_name="sections",
    )
    name = models.CharField(
        max_length=20,
        help_text="Section name, e.g., A, B, C",
    )
    capacity = models.PositiveIntegerField(
        default=40,
        help_text="Maximum number of students",
    )
    room_number = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["grade_level", "name"]
        unique_together = ["grade_level", "name"]
        verbose_name = "class section"
        verbose_name_plural = "class sections"

    def __str__(self):
        return f"{self.grade_level.name}-{self.name}"


class Subject(TimeStampedModel):
    """
    Represents a subject/course (e.g., Mathematics, Physics).
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Subject name, e.g., Mathematics",
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Subject code, e.g., MATH101",
    )
    description = models.TextField(
        blank=True,
        default="",
    )
    grade_levels = models.ManyToManyField(
        GradeLevel,
        related_name="subjects",
        blank=True,
        help_text="Grade levels this subject is offered in",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "subject"
        verbose_name_plural = "subjects"

    def __str__(self):
        return f"{self.code} - {self.name}"


class SubjectAssignment(TimeStampedModel):
    """
    Maps a teacher to a subject and section.
    """

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
        limit_choices_to={"role": "TEACHER"},
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    section = models.ForeignKey(
        ClassSection,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["subject", "section"]
        unique_together = ["teacher", "subject", "section", "academic_year"]
        verbose_name = "subject assignment"
        verbose_name_plural = "subject assignments"

    def __str__(self):
        return (
            f"{self.teacher.get_full_name()} - {self.subject.name} - {self.section}"
        )

    def clean(self):
        """Validate that the teacher has the TEACHER role."""
        from django.core.exceptions import ValidationError

        if self.teacher.role != "TEACHER":
            raise ValidationError("Assigned user must have the TEACHER role.")
