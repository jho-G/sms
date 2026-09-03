from django.urls import path

from grading.api.views import (
    AssessmentCategoryDetailView,
    AssessmentCategoryListView,
    BulkGradeSubmitView,
    GradeDetailView,
    GradeListView,
    GradeRecordView,
    MyReportCardView,
    ReportCardView,
    SubjectTotalView,
)

app_name = "grading"

urlpatterns = [
    # Assessment Categories
    path(
        "categories/",
        AssessmentCategoryListView.as_view(),
        name="category-list-create",
    ),
    path(
        "categories/<uuid:pk>/",
        AssessmentCategoryDetailView.as_view(),
        name="category-detail",
    ),
    # Grades
    path(
        "grades/",
        GradeListView.as_view(),
        name="grade-list",
    ),
    path(
        "grades/<uuid:pk>/",
        GradeDetailView.as_view(),
        name="grade-detail",
    ),
    # Single grade record
    path(
        "grades/record/",
        GradeRecordView.as_view(),
        name="grade-record",
    ),
    # Bulk grade submission
    path(
        "grades/bulk-submit/",
        BulkGradeSubmitView.as_view(),
        name="grade-bulk-submit",
    ),
    # Subject total
    path(
        "subject-total/<uuid:student_id>/<uuid:subject_assignment_id>/",
        SubjectTotalView.as_view(),
        name="subject-total",
    ),
    # Report Card
    path(
        "report-card/<uuid:student_id>/<uuid:academic_year_id>/",
        ReportCardView.as_view(),
        name="report-card",
    ),
    # My Report Card (student self-service)
    path(
        "my-report-card/<uuid:academic_year_id>/",
        MyReportCardView.as_view(),
        name="my-report-card",
    ),
]
