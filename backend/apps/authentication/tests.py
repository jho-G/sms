"""
Tests for authentication, registration and privilege boundaries.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse

from common.testing import SchoolTestCase

User = get_user_model()


class RegistrationTests(SchoolTestCase):
    url = "/api/auth/register/"

    def test_anonymous_can_self_register_as_student(self):
        response = self.client.post(
            self.url,
            {
                "email": "new@test.com",
                "username": "new",
                "first_name": "New",
                "last_name": "Student",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
                "role": "STUDENT",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        # Self-registration signs the new account in.
        self.assertIn("tokens", response.data["data"])

    def test_anonymous_cannot_self_assign_director(self):
        """The open registration endpoint must not mint directors."""
        response = self.client.post(
            self.url,
            {
                "email": "attacker@test.com",
                "username": "attacker",
                "first_name": "Mal",
                "last_name": "Actor",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
                "role": "DIRECTOR",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="attacker@test.com").exists())

    def test_anonymous_cannot_self_assign_teacher(self):
        response = self.client.post(
            self.url,
            {
                "email": "attacker2@test.com",
                "username": "attacker2",
                "first_name": "Mal",
                "last_name": "Actor",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
                "role": "TEACHER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="attacker2@test.com").exists())

    def test_director_can_create_a_teacher(self):
        self.login(self.director)

        response = self.client.post(
            self.url,
            {
                "email": "newteacher@test.com",
                "username": "newteacher",
                "first_name": "New",
                "last_name": "Teacher",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
                "role": "TEACHER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="newteacher@test.com").exists())

    def test_director_creating_a_user_gets_no_tokens_back(self):
        """
        Returning tokens here made the browser client swap the director into
        the account they had just created.
        """
        self.login(self.director)

        response = self.client.post(
            self.url,
            {
                "email": "pupil@test.com",
                "username": "pupil",
                "first_name": "Pup",
                "last_name": "Il",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
                "role": "STUDENT",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("tokens", response.data["data"])

    def test_weak_password_is_rejected_with_a_400(self):
        """A weak password used to escape as a 500 from create_user."""
        response = self.client.post(
            self.url,
            {
                "email": "weak@test.com",
                "username": "weak",
                "first_name": "Weak",
                "last_name": "Pass",
                "password": "password",
                "password_confirm": "password",
                "role": "STUDENT",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="weak@test.com").exists())


class ChangePasswordTests(SchoolTestCase):
    url = "/api/auth/change-password/"

    def test_change_password_succeeds_with_confirmation(self):
        self.login(self.student_user)

        response = self.client.post(
            self.url,
            {
                "old_password": "testpass123",
                "new_password": "brandnewpass456",
                "new_password_confirm": "brandnewpass456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.check_password("brandnewpass456"))

    def test_mismatched_confirmation_is_rejected(self):
        self.login(self.student_user)

        response = self.client.post(
            self.url,
            {
                "old_password": "testpass123",
                "new_password": "brandnewpass456",
                "new_password_confirm": "somethingelse789",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_weak_new_password_is_rejected_with_a_400(self):
        self.login(self.student_user)

        response = self.client.post(
            self.url,
            {
                "old_password": "testpass123",
                "new_password": "password",
                "new_password_confirm": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class ProfileUpdateTests(SchoolTestCase):
    def test_patch_me_updates_profile(self):
        """Regression: this used to import through a duplicate module path."""
        self.login(self.student_user)

        response = self.client.patch(
            reverse("authentication:me"),
            {"first_name": "Samantha"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.student_user.refresh_from_db()
        self.assertEqual(self.student_user.first_name, "Samantha")
