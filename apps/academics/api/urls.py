from django.urls import path

from academics.api.views import (
    AcademicYearDetailView,
    AcademicYearListView,
    ActiveAcademicYearView,
    ClassSectionByGradeView,
    ClassSectionDetailView,
    ClassSectionListView,
    GradeLevelDetailView,
    GradeLevelListView,
    SectionAssignmentsView,
    SubjectAssignmentDetailView,
    SubjectAssignmentListView,
    SubjectDetailView,
    SubjectListView,
    TeacherAssignmentsView,
)

app_name = "academics"

urlpatterns = [
    # Academic Years
    path("years/", AcademicYearListView.as_view(), name="year-list"),
    path("years/active/", ActiveAcademicYearView.as_view(), name="year-active"),
    path("years/<uuid:pk>/", AcademicYearDetailView.as_view(), name="year-detail"),
    # Grade Levels
    path("grades/", GradeLevelListView.as_view(), name="grade-list"),
    path("grades/<uuid:pk>/", GradeLevelDetailView.as_view(), name="grade-detail"),
    # Class Sections
    path("sections/", ClassSectionListView.as_view(), name="section-list"),
    path(
        "sections/by-grade/<uuid:grade_id>/",
        ClassSectionByGradeView.as_view(),
        name="section-by-grade",
    ),
    path("sections/<uuid:pk>/", ClassSectionDetailView.as_view(), name="section-detail"),
    # Subjects
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("subjects/<uuid:pk>/", SubjectDetailView.as_view(), name="subject-detail"),
    # Subject Assignments
    path("assignments/", SubjectAssignmentListView.as_view(), name="assignment-list"),
    path(
        "assignments/<uuid:pk>/",
        SubjectAssignmentDetailView.as_view(),
        name="assignment-detail",
    ),
    path(
        "assignments/teacher/<uuid:teacher_id>/",
        TeacherAssignmentsView.as_view(),
        name="teacher-assignments",
    ),
    path(
        "assignments/section/<uuid:section_id>/",
        SectionAssignmentsView.as_view(),
        name="section-assignments",
    ),
]
