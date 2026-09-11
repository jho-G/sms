import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


class StudentProfile(TimeStampedModel):
    """
    Student profile linked to a User with role STUDENT.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
        limit_choices_to={"role": "STUDENT"},
    )
    student_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Institutional student ID, e.g., STU-2024-001",
    )
    section = models.ForeignKey(
        "academics.ClassSection",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    date_of_birth = models.DateField()
    enrollment_date = models.DateField(auto_now_add=True)
    guardian_contact = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Primary guardian phone number",
    )
    medical_notes = models.TextField(
        blank=True,
        default="",
        help_text="Allergies, conditions, etc.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["student_id"]
        verbose_name = "student profile"
        verbose_name_plural = "student profiles"

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.student_id})"

    def clean(self):
        """Validate that the linked user has the STUDENT role."""
        if self.user.role != "STUDENT":
            raise ValidationError("Linked user must have the STUDENT role.")


class TeacherProfile(TimeStampedModel):
    """
    Teacher profile linked to a User with role TEACHER.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
        limit_choices_to={"role": "TEACHER"},
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Institutional employee ID, e.g., TCH-2024-001",
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Department name, e.g., Mathematics",
    )
    specialization = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Areas of specialization",
    )
    qualification = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Highest qualification, e.g., M.Sc. Mathematics",
    )
    hire_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["employee_id"]
        verbose_name = "teacher profile"
        verbose_name_plural = "teacher profiles"

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    def clean(self):
        """Validate that the linked user has the TEACHER role."""
        if self.user.role != "TEACHER":
            raise ValidationError("Linked user must have the TEACHER role.")


class ParentProfile(TimeStampedModel):
    """
    Parent profile linked to a User with role PARENT.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="parent_profile",
        limit_choices_to={"role": "PARENT"},
    )
    occupation = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    address = models.TextField(
        blank=True,
        default="",
    )
    secondary_phone = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "parent profile"
        verbose_name_plural = "parent profiles"

    def __str__(self):
        return f"Parent: {self.user.get_full_name()}"

    def clean(self):
        """Validate that the linked user has the PARENT role."""
        if self.user.role != "PARENT":
            raise ValidationError("Linked user must have the PARENT role.")


class StudentGuardian(TimeStampedModel):
    """
    Junction model linking parents to their children.
    A parent can have multiple children; a student can have multiple guardians.
    """

    class Relationship(models.TextChoices):
        FATHER = "FATHER", "Father"
        MOTHER = "MOTHER", "Mother"
        GUARDIAN = "GUARDIAN", "Guardian"
        SIBLING = "SIBLING", "Sibling"
        OTHER = "OTHER", "Other"

    parent = models.ForeignKey(
        ParentProfile,
        on_delete=models.CASCADE,
        related_name="children_links",
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="guardian_links",
    )
    relationship = models.CharField(
        max_length=20,
        choices=Relationship.choices,
        default=Relationship.OTHER,
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Mark as the primary/guardian of record",
    )

    class Meta:
        unique_together = ["parent", "student"]
        ordering = ["-is_primary", "parent"]
        verbose_name = "student guardian"
        verbose_name_plural = "student guardians"

    def __str__(self):
        return (
            f"{self.parent.user.get_full_name()} -> "
            f"{self.student.user.get_full_name()} ({self.relationship})"
        )

    def clean(self):
        """
        Ensure only one primary guardian per student,
        and that parent & student refer to correct roles.
        """
        if self.parent.user.role != "PARENT":
            raise ValidationError("Parent profile must link to a PARENT user.")
        if self.student.user.role != "STUDENT":
            raise ValidationError("Student profile must link to a STUDENT user.")

        if self.is_primary:
            existing_primary = StudentGuardian.objects.filter(
                student=self.student,
                is_primary=True,
            ).exclude(pk=self.pk)
            if existing_primary.exists():
                raise ValidationError(
                    "This student already has a primary guardian. "
                    "Unset the other one first."
                )
