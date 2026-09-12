"""
Shared fixtures for the API test suites.

Builds a minimal but complete school -- one year, one section, one subject
with a teacher assigned, one enrolled student and a linked parent -- so each
test module can focus on the behaviour it is checking.
"""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)
from enrollment.models import ParentProfile, StudentGuardian, StudentProfile, TeacherProfile
from grading.models import AssessmentCategory

User = get_user_model()


def make_user(email, role, **extra):
    """Create a user with a known password."""
    user = User.objects.create_user(
        email=email,
        username=email.split("@")[0],
        password="testpass123",
        first_name=extra.pop("first_name", role.title()),
        last_name=extra.pop("last_name", "User"),
        role=role,
        **extra,
    )
    return user


class SchoolTestCase(APITestCase):
    """Base case with a fully wired demo school."""

    @classmethod
    def setUpTestData(cls):
        cls.director = make_user("director@test.com", "DIRECTOR")
        cls.teacher = make_user("teacher@test.com", "TEACHER", first_name="Tariq")
        cls.other_teacher = make_user("teacher2@test.com", "TEACHER", first_name="Nia")
        cls.student_user = make_user("student@test.com", "STUDENT", first_name="Sam")
        cls.other_student_user = make_user("student2@test.com", "STUDENT", first_name="Ola")
        cls.parent_user = make_user("parent@test.com", "PARENT", first_name="Priya")

        cls.year = AcademicYear.objects.create(
            name="2025-2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            is_active=True,
        )
        cls.grade = GradeLevel.objects.create(
            name="Grade 11", level=11, academic_year=cls.year
        )
        cls.section = ClassSection.objects.create(
            grade_level=cls.grade, name="A", capacity=30
        )
        cls.subject = Subject.objects.create(name="Mathematics", code="MATH101")
        cls.subject.grade_levels.add(cls.grade)

        cls.assignment = SubjectAssignment.objects.create(
            teacher=cls.teacher,
            subject=cls.subject,
            section=cls.section,
            academic_year=cls.year,
        )

        cls.teacher_profile = TeacherProfile.objects.create(
            user=cls.teacher, employee_id="TCH-001", department="Science"
        )
        cls.student = StudentProfile.objects.create(
            user=cls.student_user,
            student_id="STU-001",
            section=cls.section,
            date_of_birth=date(2009, 1, 1),
        )
        cls.other_student = StudentProfile.objects.create(
            user=cls.other_student_user,
            student_id="STU-002",
            section=cls.section,
            date_of_birth=date(2009, 2, 2),
        )
        cls.parent = ParentProfile.objects.create(
            user=cls.parent_user, occupation="Engineer"
        )
        StudentGuardian.objects.create(
            parent=cls.parent,
            student=cls.student,
            relationship="MOTHER",
            is_primary=True,
        )

        cls.category = AssessmentCategory.objects.create(
            name="Midterm",
            subject_assignment=cls.assignment,
            weight=Decimal("30.00"),
        )

    def login(self, user):
        """Authenticate subsequent requests as ``user``."""
        self.client.force_authenticate(user=user)
        return user
