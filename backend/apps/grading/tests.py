"""
Tests for mark entry, report cards and grade read scoping.
"""
from decimal import Decimal

from django.urls import reverse

from common.testing import SchoolTestCase
from grading.models import Grade
from grading.services import record_student_grades


class BulkGradeTests(SchoolTestCase):
    url = "/api/grading/grades/bulk-submit/"

    def test_teacher_can_bulk_submit_marks(self):
        self.login(self.teacher)

        response = self.client.post(
            self.url,
            {
                "assessment_category_id": str(self.category.id),
                "grades": [
                    {
                        "student_id": str(self.student.id),
                        "score": 85,
                        "max_score": 100,
                    },
                    {
                        "student_id": str(self.other_student.id),
                        "score": 72,
                        "max_score": 100,
                        "remarks": "Needs improvement",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Grade.objects.count(), 2)

    def test_service_accepts_uuid_objects_from_the_serializer(self):
        """
        The bulk service must normalise the ``uuid.UUID`` ids the serializer
        produces instead of treating them as unknown students.
        """
        grades = record_student_grades(
            assessment_category_id=str(self.category.id),
            grade_list=[
                {"student_id": self.student.id, "score": 80, "max_score": 100},
            ],
            recorded_by=self.teacher,
        )

        self.assertEqual(len(grades), 1)
        self.assertEqual(grades[0].student_id, self.student.id)

    def test_teacher_cannot_submit_for_another_teachers_category(self):
        self.login(self.other_teacher)

        response = self.client.post(
            self.url,
            {
                "assessment_category_id": str(self.category.id),
                "grades": [
                    {"student_id": str(self.student.id), "score": 100, "max_score": 100}
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Grade.objects.count(), 0)

    def test_score_above_max_is_rejected(self):
        self.login(self.teacher)

        response = self.client.post(
            self.url,
            {
                "assessment_category_id": str(self.category.id),
                "grades": [
                    {"student_id": str(self.student.id), "score": 120, "max_score": 100}
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Grade.objects.count(), 0)


class CategoryTests(SchoolTestCase):
    def test_category_exposes_section_id(self):
        """The mark-entry screen needs the section to load its roster."""
        self.login(self.teacher)

        response = self.client.get(
            reverse("grading:category-detail", args=[self.category.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["section"], str(self.section.id))

    def test_teacher_only_sees_their_own_categories(self):
        self.login(self.other_teacher)

        response = self.client.get(reverse("grading:category-list-create"))

        self.assertEqual(response.data["data"]["count"], 0)

    def test_teacher_cannot_define_assessments_for_others(self):
        self.login(self.other_teacher)

        response = self.client.post(
            reverse("grading:category-list-create"),
            {
                "name": "Sneaky",
                "subject_assignment": str(self.assignment.id),
                "weight": "10.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_total_weight_cannot_exceed_100(self):
        self.login(self.teacher)

        response = self.client.post(
            reverse("grading:category-list-create"),
            {
                "name": "Final",
                "subject_assignment": str(self.assignment.id),
                "weight": "80.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class GradeScopingTests(SchoolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        Grade.objects.create(
            student=cls.student,
            assessment_category=cls.category,
            score=Decimal("85.00"),
            max_score=Decimal("100.00"),
        )
        Grade.objects.create(
            student=cls.other_student,
            assessment_category=cls.category,
            score=Decimal("72.00"),
            max_score=Decimal("100.00"),
        )

    def test_student_sees_only_their_own_marks(self):
        self.login(self.student_user)

        response = self.client.get(reverse("grading:grade-list"))

        self.assertEqual(response.data["data"]["count"], 1)

    def test_student_cannot_read_another_student_by_filter(self):
        self.login(self.student_user)

        response = self.client.get(
            reverse("grading:grade-list"), {"student_id": str(self.other_student.id)}
        )

        self.assertEqual(response.data["data"]["count"], 0)

    def test_parent_sees_their_childs_marks(self):
        self.login(self.parent_user)

        response = self.client.get(reverse("grading:grade-list"))

        self.assertEqual(response.data["data"]["count"], 1)


class ReportCardTests(SchoolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        Grade.objects.create(
            student=cls.student,
            assessment_category=cls.category,
            score=Decimal("90.00"),
            max_score=Decimal("100.00"),
        )

    def url(self, student):
        return reverse("grading:report-card", args=[student.id, self.year.id])

    def test_student_can_read_their_own_report_card(self):
        self.login(self.student_user)

        response = self.client.get(self.url(self.student))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["student_id_code"], "STU-001")

    def test_student_cannot_read_another_students_report_card(self):
        """This endpoint was open to every authenticated user."""
        self.login(self.student_user)

        response = self.client.get(self.url(self.other_student))

        self.assertEqual(response.status_code, 403)

    def test_parent_can_read_their_childs_report_card(self):
        self.login(self.parent_user)

        response = self.client.get(self.url(self.student))

        self.assertEqual(response.status_code, 200)

    def test_parent_cannot_read_an_unrelated_students_report_card(self):
        self.login(self.parent_user)

        response = self.client.get(self.url(self.other_student))

        self.assertEqual(response.status_code, 403)

    def test_director_can_read_any_report_card(self):
        self.login(self.director)

        response = self.client.get(self.url(self.student))

        self.assertEqual(response.status_code, 200)

    def test_my_report_card_resolves_the_callers_profile(self):
        self.login(self.student_user)

        response = self.client.get(
            reverse("grading:my-report-card", args=[self.year.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["student_id_code"], "STU-001")
