from django.contrib import admin

from attendance.models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    """Admin configuration for Attendance records."""

    list_display = [
        "id",
        "student",
        "subject_assignment",
        "date",
        "status",
        "recorded_by",
        "created_at",
    ]
    list_filter = ["status", "date", "subject_assignment__subject"]
    search_fields = [
        "student__student_id",
        "student__user__first_name",
        "student__user__last_name",
        "subject_assignment__subject__name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["student", "subject_assignment", "recorded_by"]
    date_hierarchy = "date"
