"""
Factory Boy definitions for realistic testing fixtures across the system.
"""
import factory
from django.contrib.auth import get_user_model
from datetime import date
from faker import Faker

fake = Faker()
User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory generating realistic User instances."""

    class Meta:
        model = User
        django_get_or_create = ("email",)

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user_{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = "STUDENT"
    is_active = True
    is_email_verified = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "TestPassword123!")
        user = super()._create(model_class, *args, **kwargs)
        user.set_password(password)
        user.save()
        return user


class DirectorFactory(UserFactory):
    """Convenience factory for director users."""

    role = "DIRECTOR"
    is_staff = True


class TeacherUserFactory(UserFactory):
    """Convenience factory for teacher users."""

    role = "TEACHER"


class StudentUserFactory(UserFactory):
    """Convenience factory for student users."""

    role = "STUDENT"


class ParentUserFactory(UserFactory):
    """Convenience factory for parent users."""

    role = "PARENT"


# ---------------------------------------------------------------------------
# Academics Factories
# ---------------------------------------------------------------------------
class AcademicYearFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "academics.AcademicYear"
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"202{n}-202{n+1}")
    start_date = factory.LazyFunction(lambda: date(2026, 9, 1))
    end_date = factory.LazyFunction(lambda: date(2027, 6, 30))
    is_active = True


class GradeLevelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "academics.GradeLevel"

    name = factory.Sequence(lambda n: f"Grade {n+1}")
    level = factory.Sequence(lambda n: n + 1)
    academic_year = factory.SubFactory(AcademicYearFactory)
    description = "Test Grade Level"


class ClassSectionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "academics.ClassSection"

    grade_level = factory.SubFactory(GradeLevelFactory)
    name = factory.Sequence(lambda n: chr(65 + (n % 26)))  # Section A, B, C...
    capacity = 30
    room_number = factory.Sequence(lambda n: f"Room-{100+n}")
    is_active = True


class SubjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "academics.Subject"
        django_get_or_create = ("code",)

    name = factory.Sequence(lambda n: f"Subject {n}")
    code = factory.Sequence(lambda n: f"SUB{100+n}")
    description = "Core academic subject"


class SubjectAssignmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "academics.SubjectAssignment"

    teacher = factory.SubFactory(TeacherUserFactory)
    subject = factory.SubFactory(SubjectFactory)
    section = factory.SubFactory(ClassSectionFactory)
    academic_year = factory.SubFactory(AcademicYearFactory)


# ---------------------------------------------------------------------------
# Enrollment Factories
# ---------------------------------------------------------------------------
class StudentProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "enrollment.StudentProfile"

    user = factory.SubFactory(StudentUserFactory)
    student_id = factory.Sequence(lambda n: f"STU-2026-{n+1:04d}")
    section = factory.SubFactory(ClassSectionFactory)
    date_of_birth = factory.LazyFunction(lambda: date(2010, 5, 20))
    guardian_contact = "+15550199"
    is_active = True


class TeacherProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "enrollment.TeacherProfile"

    user = factory.SubFactory(TeacherUserFactory)
    employee_id = factory.Sequence(lambda n: f"TCH-2026-{n+1:03d}")
    department = "Science"
    specialization = "Mathematics"
    qualification = "M.Sc."
    is_active = True


class ParentProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "enrollment.ParentProfile"

    user = factory.SubFactory(ParentUserFactory)
    occupation = "Software Engineer"
    secondary_phone = "+15550188"


class StudentGuardianFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "enrollment.StudentGuardian"

    parent = factory.SubFactory(ParentProfileFactory)
    student = factory.SubFactory(StudentProfileFactory)
    relationship = "MOTHER"
    is_primary = True
