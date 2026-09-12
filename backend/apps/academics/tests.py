"""
Tests for academic structure, UUID routing and teacher scoping.
"""
import uuid
from datetime import date

from django.urls import reverse

from academics.models import AcademicYear, GradeLevel, SubjectAssignment
from common.testing import SchoolTestCase


class UuidRoutingTests(SchoolTestCase):
    """
    Domain models carry UUID primary keys, so the `<uuid:...>` routes
    resolve. With the old integer keys every detail route 404'd at the URL
    resolver.
    """

    def test_primary_keys_are_uuids(self):
        self.assertIsInstance(self.year.id, uuid.UUID)
        self.assertIsInstance(self.section.id, uuid.UUID)
        self.assertIsInstance(self.student.id, uuid.UUID)
        self.assertIsInstance(self.category.id, uuid.UUID)

    def test_detail_route_resolves(self):
        self.login(self.director)

        response = self.client.get(
            reverse("academics:section-detail", args=[self.section.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["name"], "A")

    def test_nested_lookup_route_resolves(self):
        self.login(self.director)

        response = self.client.get(
            reverse("academics:section-by-grade", args=[self.grade.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["count"], 1)


class GradeLevelTests(SchoolTestCase):
    def test_same_level_allowed_in_a_second_year(self):
        """
        `level` used to be globally unique, so a school could never open a
        second academic year.
        """
        next_year = AcademicYear.objects.create(
            name="2026-2027",
            start_date=date(2026, 9, 1),
            end_date=date(2027, 6, 30),
        )

        GradeLevel.objects.create(
            name="Grade 11", level=11, academic_year=next_year
        )

        self.assertEqual(GradeLevel.objects.filter(level=11).count(), 2)

    def test_same_level_still_rejected_within_one_year(self):
        self.login(self.director)

        response = self.client.post(
            reverse("academics:grade-list"),
            {"name": "Grade 11 again", "level": 11, "academic_year": str(self.year.id)},
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class SubjectAssignmentTests(SchoolTestCase):
    def test_create_with_explicit_academic_year(self):
        """
        The view used to pass `str(academic_year)` -- the year's *name* -- as
        the id, so this path always failed with "not a valid UUID".
        """
        self.login(self.director)

        response = self.client.post(
            reverse("academics:assignment-list"),
            {
                "teacher": str(self.other_teacher.id),
                "subject": str(self.subject.id),
                "section": str(self.section.id),
                "academic_year": str(self.year.id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            response.data["data"]["academic_year_name"], "2025-2026"
        )

    def test_create_without_academic_year_falls_back_to_active(self):
        self.login(self.director)

        response = self.client.post(
            reverse("academics:assignment-list"),
            {
                "teacher": str(self.other_teacher.id),
                "subject": str(self.subject.id),
                "section": str(self.section.id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)

    def test_student_count_is_real(self):
        """The serializer used to hard-code 0."""
        self.login(self.director)

        response = self.client.get(
            reverse("academics:section-detail", args=[self.section.id])
        )

        self.assertEqual(response.data["data"]["student_count"], 2)


class AssignmentAccessTests(SchoolTestCase):
    def test_teacher_can_list_their_own_assignments(self):
        """Academics was director-only, which broke every teacher page."""
        self.login(self.teacher)

        response = self.client.get(reverse("academics:assignment-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["count"], 1)

    def test_teacher_does_not_see_other_teachers_assignments(self):
        SubjectAssignment.objects.create(
            teacher=self.other_teacher,
            subject=self.subject,
            section=self.section,
            academic_year=self.year,
        )
        self.login(self.teacher)

        response = self.client.get(reverse("academics:assignment-list"))

        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            response.data["data"]["results"][0]["id"], str(self.assignment.id)
        )

    def test_teacher_cannot_create_assignments(self):
        self.login(self.teacher)

        response = self.client.post(
            reverse("academics:assignment-list"),
            {
                "teacher": str(self.teacher.id),
                "subject": str(self.subject.id),
                "section": str(self.section.id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_student_cannot_read_assignments(self):
        self.login(self.student_user)

        response = self.client.get(reverse("academics:assignment-list"))

        self.assertEqual(response.status_code, 403)
