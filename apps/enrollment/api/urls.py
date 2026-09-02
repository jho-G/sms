from django.urls import path

from enrollment.api.views import (
    ParentChildrenView,
    ParentProfileDetailView,
    ParentProfileListCreateView,
    SetPrimaryGuardianView,
    StudentGuardianDetailView,
    StudentGuardianListCreateView,
    StudentGuardiansView,
    StudentProfilesBySectionView,
    StudentProfileDetailView,
    StudentProfileListCreateView,
    TeacherProfileDetailView,
    TeacherProfileListCreateView,
)

app_name = "enrollment"

urlpatterns = [
    # Student profiles
    path(
        "students/",
        StudentProfileListCreateView.as_view(),
        name="student-list-create",
    ),
    path(
        "students/<uuid:pk>/",
        StudentProfileDetailView.as_view(),
        name="student-detail",
    ),
    path(
        "students/by-section/<uuid:section_id>/",
        StudentProfilesBySectionView.as_view(),
        name="students-by-section",
    ),
    # Teacher profiles
    path(
        "teachers/",
        TeacherProfileListCreateView.as_view(),
        name="teacher-list-create",
    ),
    path(
        "teachers/<uuid:pk>/",
        TeacherProfileDetailView.as_view(),
        name="teacher-detail",
    ),
    # Parent profiles
    path(
        "parents/",
        ParentProfileListCreateView.as_view(),
        name="parent-list-create",
    ),
    path(
        "parents/<uuid:pk>/",
        ParentProfileDetailView.as_view(),
        name="parent-detail",
    ),
    # Student-Guardian links
    path(
        "guardians/",
        StudentGuardianListCreateView.as_view(),
        name="guardian-list-create",
    ),
    path(
        "guardians/<uuid:pk>/",
        StudentGuardianDetailView.as_view(),
        name="guardian-detail",
    ),
    path(
        "guardians/student/<uuid:student_id>/",
        StudentGuardiansView.as_view(),
        name="guardians-by-student",
    ),
    path(
        "guardians/parent/<uuid:parent_id>/",
        ParentChildrenView.as_view(),
        name="children-by-parent",
    ),
    path(
        "guardians/set-primary/",
        SetPrimaryGuardianView.as_view(),
        name="set-primary-guardian",
    ),
]
