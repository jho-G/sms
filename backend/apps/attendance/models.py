from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


class Attendance(TimeStampedModel):
    """
    Records a student's attendance for a specific subject assignment on a given date.
    Enforces uniqueness per student + subject assignment + date.
    """

    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        EXCUSED = "EXCUSED", "Excused"

    student = models.ForeignKey(
        "enrollment.StudentProfile",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    subject_assignment = models.ForeignKey(
        "academics.SubjectAssignment",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField(
        help_text="Date of the attendance record",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PRESENT,
    )
    remarks = models.TextField(
        blank=True,
        default="",
        help_text="Optional teacher remarks for this attendance record",
    )
    recorded_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_recorded",
        help_text="Teacher or staff who recorded this attendance",
    )

    class Meta:
        ordering = ["-date", "student"]
        unique_together = ["student", "subject_assignment", "date"]
        verbose_name = "attendance"
        verbose_name_plural = "attendance records"

    def __str__(self):
        return (
            f"{self.student} - {self.subject_assignment.subject.name} - "
            f"{self.date} ({self.get_status_display()})"
        )

    def clean(self):
        """Validate that the student belongs to the section of the subject assignment."""
        if (
            self.student
            and self.subject_assignment
            and self.student.section_id
            and self.student.section_id != self.subject_assignment.section_id
        ):
            raise ValidationError(
                "Student does not belong to the section of this subject assignment."
            )
