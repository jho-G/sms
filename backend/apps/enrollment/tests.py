"""
Tests for enrollment permissions and profile self-resolution.
"""
from django.urls import reverse

from common.testing import SchoolTestCase
from enrollment.models import StudentProfile


class MyProfileTests(SchoolTestCase):
    url = "/api/enrollment/me/"

    def test_student_resolves_their_own_profile(self):
        """
        The client holds a User UUID but attendance and grades are keyed by
        StudentProfile UUID; without this endpoint it queried with the wrong
        key and every student page came back empty.
        """
        self.login(self.student_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["role"], "STUDENT")
        self.assertEqual(
            response.data["data"]["profile"]["id"], str(self.student.id)
        )

    def test_parent_resolves_their_own_profile(self):
        self.login(self.parent_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["data"]["profile"]["id"], str(self.parent.id)
        )

    def test_director_has_no_domain_profile(self):
        self.login(self.director)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["data"]["profile"])

    def test_account_without_a_profile_gets_a_clear_error(self):
        from common.testing import make_user

        orphan = make_user("orphan@test.com", "STUDENT")
        self.login(orphan)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)
        self.assertIn("enrollment", response.data["error"]["message"].lower())


class StudentProfilePermissionTests(SchoolTestCase):
    def test_director_sees_every_student(self):
        self.login(self.director)

        response = self.client.get(reverse("enrollment:student-list-create"))

        self.assertEqual(response.data["data"]["count"], 2)

    def test_teacher_sees_every_student(self):
        self.login(self.teacher)

        response = self.client.get(reverse("enrollment:student-list-create"))

        self.assertEqual(response.data["data"]["count"], 2)

    def test_student_sees_only_themselves(self):
        """Any signed-in student could previously list the whole school."""
        self.login(self.student_user)

        response = self.client.get(reverse("enrollment:student-list-create"))

        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            response.data["data"]["results"][0]["id"], str(self.student.id)
        )

    def test_parent_sees_only_their_children(self):
        self.login(self.parent_user)

        response = self.client.get(reverse("enrollment:student-list-create"))

        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            response.data["data"]["results"][0]["id"], str(self.student.id)
        )

    def test_student_cannot_delete_another_student(self):
        """This was wide open to every authenticated user."""
        self.login(self.student_user)

        response = self.client.delete(
            reverse("enrollment:student-detail", args=[self.other_student.id])
        )

        self.assertIn(response.status_code, (403, 404))
        self.assertTrue(
            StudentProfile.objects.filter(id=self.other_student.id).exists()
        )

    def test_student_cannot_create_profiles(self):
        self.login(self.student_user)

        response = self.client.post(
            reverse("enrollment:student-list-create"),
            {
                "user": str(self.other_student_user.id),
                "student_id": "STU-999",
                "date_of_birth": "2009-01-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_director_can_create_a_profile(self):
        from common.testing import make_user

        new_user = make_user("fresh@test.com", "STUDENT")
        self.login(self.director)

        response = self.client.post(
            reverse("enrollment:student-list-create"),
            {
                "user": str(new_user.id),
                "student_id": "STU-003",
                "section": str(self.section.id),
                "date_of_birth": "2009-03-03",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)


class GuardianPermissionTests(SchoolTestCase):
    def test_parent_sees_only_their_own_links(self):
        self.login(self.parent_user)

        response = self.client.get(reverse("enrollment:guardian-list-create"))

        self.assertEqual(response.data["data"]["count"], 1)

    def test_parent_cannot_create_links(self):
        self.login(self.parent_user)

        response = self.client.post(
            reverse("enrollment:guardian-list-create"),
            {
                "parent": str(self.parent.id),
                "student": str(self.other_student.id),
                "relationship": "MOTHER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_parent_children_lookup_returns_their_children(self):
        self.login(self.parent_user)

        response = self.client.get(
            reverse("enrollment:children-by-parent", args=[self.parent.id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(
            str(response.data["data"]["results"][0]["student"]),
            str(self.student.id),
        )

    def test_serializer_exposes_user_full_name(self):
        """The client renders `user_full_name`; keep the contract pinned."""
        self.login(self.director)

        response = self.client.get(reverse("enrollment:student-list-create"))

        row = response.data["data"]["results"][0]
        self.assertIn("user_full_name", row)
        self.assertIn("user_email", row)
