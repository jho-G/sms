from rest_framework import serializers

from attendance.models import Attendance


# ---------------------------------------------------------------------------
# Read Serializer
# ---------------------------------------------------------------------------

class AttendanceSerializer(serializers.ModelSerializer):
    """Read-only serializer for Attendance with nested related info."""

    student_name = serializers.CharField(
        source="student.user.get_full_name", read_only=True
    )
    student_code = serializers.CharField(
        source="student.student_id", read_only=True
    )
    subject_name = serializers.CharField(
        source="subject_assignment.subject.name", read_only=True
    )
    subject_code = serializers.CharField(
        source="subject_assignment.subject.code", read_only=True
    )
    section_name = serializers.CharField(
        source="subject_assignment.section.__str__", read_only=True
    )
    recorded_by_name = serializers.CharField(
        source="recorded_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "subject_assignment",
            "subject_name",
            "subject_code",
            "section_name",
            "date",
            "status",
            "remarks",
            "recorded_by",
            "recorded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Single Create / Update Serializer
# ---------------------------------------------------------------------------

class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating or updating a single attendance record."""

    class Meta:
        model = Attendance
        fields = [
            "student",
            "subject_assignment",
            "date",
            "status",
            "remarks",
        ]

    def validate_status(self, value):
        valid = [c[0] for c in Attendance.Status.choices]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {valid}"
            )
        return value


# ---------------------------------------------------------------------------
# Bulk Submit Serializer (teacher daily / subject attendance log)
# ---------------------------------------------------------------------------

class AttendanceRecordInputSerializer(serializers.Serializer):
    """Single item inside a bulk attendance payload."""

    student_id = serializers.UUIDField(
        help_text="UUID of the StudentProfile",
    )
    status = serializers.ChoiceField(
        choices=Attendance.Status.choices,
        help_text="PRESENT, ABSENT, LATE, or EXCUSED",
    )
    remarks = serializers.CharField(
        required=False,
        default="",
        allow_blank=True,
        help_text="Optional teacher remarks",
    )


class BulkAttendanceSubmitSerializer(serializers.Serializer):
    """
    Serializer for the bulk attendance submission endpoint.
    Teachers submit attendance for an entire subject assignment and date.
    """

    subject_assignment_id = serializers.UUIDField(
        help_text="UUID of the SubjectAssignment",
    )
    date = serializers.DateField(
        help_text="Date of the attendance (YYYY-MM-DD)",
    )
    records = AttendanceRecordInputSerializer(
        many=True,
        help_text="List of student attendance records",
    )

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one attendance record is required."
            )
        return value
