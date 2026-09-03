from datetime import date
from typing import List

from django.core.exceptions import ValidationError
from django.db import transaction

from attendance.models import Attendance
from attendance.signals import student_marked_absent


@transaction.atomic
def bulk_mark_attendance(
    subject_assignment_id: str,
    attendance_date: date,
    attendance_data: List[dict],
    recorded_by=None,
) -> List[Attendance]:
    """
    Bulk-create or update attendance records for a subject assignment on a given date.

    Each entry in ``attendance_data`` should contain:
        - student_id (str): UUID of the StudentProfile
        - status (str): One of PRESENT, ABSENT, LATE, EXCUSED
        - remarks (str, optional): Teacher remarks

    When an ABSENT record is created or updated to ABSENT, the
    ``student_marked_absent`` signal is emitted so that downstream
    subscribers (e.g. parent notifications) can react.

    Args:
        subject_assignment_id: SubjectAssignment UUID
        attendance_date: The date for the attendance records
        attendance_data: List of dicts with student_id, status, and optional remarks
        recorded_by: Optional User who is recording (teacher / staff)

    Returns:
        List of created/updated Attendance instances

    Raises:
        ValidationError: If the subject assignment is invalid or
                         any attendance entry fails validation.
    """
    # Validate the subject assignment exists
    from academics.models import SubjectAssignment

    try:
        subject_assignment = SubjectAssignment.objects.select_related(
            "subject", "section"
        ).get(id=subject_assignment_id)
    except SubjectAssignment.DoesNotExist:
        raise ValidationError("Subject assignment not found.")

    if not subject_assignment.is_active:
        raise ValidationError("Subject assignment is no longer active.")

    # Validate all student IDs upfront
    from enrollment.models import StudentProfile

    student_ids = [entry["student_id"] for entry in attendance_data]
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

    created_records: List[Attendance] = []

    for entry in attendance_data:
        student_id = entry["student_id"]
        status = entry.get("status", Attendance.Status.PRESENT)
        remarks = entry.get("remarks", "")

        # Validate status choice
        valid_statuses = [c[0] for c in Attendance.Status.choices]
        if status not in valid_statuses:
            raise ValidationError(
                f"Invalid status '{status}'. Must be one of: {valid_statuses}"
            )

        student = students_map[student_id]

        # Use get_or_create to handle upsert (update if already exists)
        record, created = Attendance.objects.get_or_create(
            student=student,
            subject_assignment=subject_assignment,
            date=attendance_date,
            defaults={
                "status": status,
                "remarks": remarks,
                "recorded_by": recorded_by,
            },
        )

        if not created:
            # Update existing record
            previous_status = record.status
            record.status = status
            record.remarks = remarks
            if recorded_by:
                record.recorded_by = recorded_by
            record.save()

            # Emit signal if status changed to ABSENT
            if previous_status != Attendance.Status.ABSENT and status == Attendance.Status.ABSENT:
                student_marked_absent.send(
                    sender=Attendance,
                    student_id=str(student.id),
                    date=attendance_date,
                    subject=subject_assignment.subject.name,
                )
        else:
            # Emit signal for newly created ABSENT records
            if status == Attendance.Status.ABSENT:
                student_marked_absent.send(
                    sender=Attendance,
                    student_id=str(student.id),
                    date=attendance_date,
                    subject=subject_assignment.subject.name,
                )

        created_records.append(record)

    return created_records


@transaction.atomic
def mark_single_attendance(
    student_id: str,
    subject_assignment_id: str,
    attendance_date: date,
    status: str,
    remarks: str = "",
    recorded_by=None,
) -> Attendance:
    """
    Create or update a single attendance record.

    Emits ``student_marked_absent`` when the record is ABSENT.

    Args:
        student_id: StudentProfile UUID
        subject_assignment_id: SubjectAssignment UUID
        attendance_date: Date of attendance
        status: One of PRESENT, ABSENT, LATE, EXCUSED
        remarks: Optional teacher remarks
        recorded_by: Optional User who is recording

    Returns:
        Created or updated Attendance instance

    Raises:
        ValidationError: If validation fails
    """
    return bulk_mark_attendance(
        subject_assignment_id=subject_assignment_id,
        attendance_date=attendance_date,
        attendance_data=[
            {
                "student_id": student_id,
                "status": status,
                "remarks": remarks,
            }
        ],
        recorded_by=recorded_by,
    )[0]
