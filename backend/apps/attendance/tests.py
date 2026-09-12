"""
Tests for attendance submission and read scoping.
"""
from datetime import date

from django.urls import reverse

from attendance.models import Attendance
from attendance.services import bulk_mark_attendance
from common.testing import SchoolTestCase


class BulkAttendanceTests(SchoolTestCase):
    url = "/api/attendance/bulk-submit/"

    def test_teacher_can_bulk_submit(self):
        """
        End-to-end regression: the serializer takes UUIDs, the service looks
        them up by UUID, and the model stores UUID keys. Under integer keys
        this returned 400 before it ever reached the service.
        """
        self.login(self.teacher)

        response = self.client.post(
            self.url,
            {
                "subject_assignment_id": str(self.assignment.id),
                "date": "2025-10-01",
                "records": [
                    {"student_id": str(self.student.id), "status": "PRESENT"},
                    {
                        "student_id": str(self.other_student.id),
                        "status": "ABSENT",
                        "remarks": "No show",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Attendance.objects.count(), 2)
        self.assertEqual(
            Attendance.objects.get(student=self.other_student).status, "ABSENT"
        )

    def test_bulk_submit_is_idempotent(self):
        self.login(self.teacher)
        payload = {
            "subject_assignment_id": str(self.assignment.id),
            "date": "2025-10-01",
            "records": [{"student_id": str(self.student.id), "status": "PRESENT"}],
        }

        self.client.post(self.url, payload, format="json")
        payload["records"][0]["status"] = "LATE"
        self.client.post(self.url, payload, format="json")

        self.assertEqual(Attendance.objects.count(), 1)
        self.assertEqual(Attendance.objects.first().status, "LATE")

    def test_service_accepts_uuid_objects_from_the_serializer(self):
        """
        The serializer hands the service ``uuid.UUID`` objects but the lookup
        map is keyed by string; the service must normalise them itself.
        """
        records = bulk_mark_attendance(
            subject_assignment_id=str(self.assignment.id),
            attendance_date=date(2025, 10, 2),
            attendance_data=[
                {"student_id": self.student.id, "status": "PRESENT"},
            ],
            recorded_by=self.teacher,
        )

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].student_id, self.student.id)

    def test_teacher_cannot_submit_for_another_teachers_class(self):
        self.login(self.other_teacher)

        response = self.client.post(
            self.url,
            {
                "subject_assignment_id": str(self.assignment.id),
                "date": "2025-10-01",
                "records": [{"student_id": str(self.student.id), "status": "PRESENT"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_student_cannot_submit_attendance(self):
        self.login(self.student_user)

        response = self.client.post(
            self.url,
            {
                "subject_assignment_id": str(self.assignment.id),
                "date": "2025-10-01",
                "records": [{"student_id": str(self.student.id), "status": "PRESENT"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)


class AttendanceScopingTests(SchoolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        Attendance.objects.create(
            student=cls.student,
            subject_assignment=cls.assignment,
            date=date(2025, 10, 1),
            status="PRESENT",
        )
        Attendance.objects.create(
            student=cls.other_student,
            subject_assignment=cls.assignment,
            date=date(2025, 10, 1),
            status="ABSENT",
        )

    def test_director_sees_all_records(self):
        self.login(self.director)

        response = self.client.get(reverse("attendance:attendance-list"))

        self.assertEqual(response.data["data"]["count"], 2)

    def test_student_sees_only_their_own(self):
        self.login(self.student_user)

        response = self.client.get(reverse("attendance:attendance-list"))

        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            str(response.data["data"]["results"][0]["student"]),
            str(self.student.id),
        )

    def test_student_cannot_read_another_student_by_filter(self):
        """
        The `student_id` filter used to be applied without any scoping, so
        changing one value in the URL exposed another student's record.
        """
        self.login(self.student_user)

        response = self.client.get(
            reverse("attendance:attendance-list"),
            {"student_id": str(self.other_student.id)},
        )

        self.assertEqual(response.data["data"]["count"], 0)

    def test_parent_sees_their_childs_records(self):
        self.login(self.parent_user)

        response = self.client.get(reverse("attendance:attendance-list"))

        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            str(response.data["data"]["results"][0]["student"]),
            str(self.student.id),
        )

    def test_teacher_sees_records_for_their_own_classes(self):
        self.login(self.teacher)

        response = self.client.get(reverse("attendance:attendance-list"))

        self.assertEqual(response.data["data"]["count"], 2)

    def test_other_teacher_sees_nothing(self):
        self.login(self.other_teacher)

        response = self.client.get(reverse("attendance:attendance-list"))

        self.assertEqual(response.data["data"]["count"], 0)
