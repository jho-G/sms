from django.urls import path

from attendance.api.views import (
    AttendanceDetailView,
    AttendanceListView,
    AttendanceRecordView,
    BulkAttendanceSubmitView,
    StudentAbsenceSummaryView,
    SubjectDateAttendanceView,
)

app_name = "attendance"

urlpatterns = [
    # List & detail
    path(
        "",
        AttendanceListView.as_view(),
        name="attendance-list",
    ),
    path(
        "<uuid:pk>/",
        AttendanceDetailView.as_view(),
        name="attendance-detail",
    ),
    # Single record (create / update)
    path(
        "record/",
        AttendanceRecordView.as_view(),
        name="attendance-record",
    ),
    # Bulk submit (teacher daily / subject attendance log)
    path(
        "bulk-submit/",
        BulkAttendanceSubmitView.as_view(),
        name="attendance-bulk-submit",
    ),
    # Subject + date attendance lookup
    path(
        "subject/<uuid:subject_assignment_id>/date/<str:target_date>/",
        SubjectDateAttendanceView.as_view(),
        name="subject-date-attendance",
    ),
    # Student absence summary
    path(
        "student/<uuid:student_id>/absences/",
        StudentAbsenceSummaryView.as_view(),
        name="student-absence-summary",
    ),
]
