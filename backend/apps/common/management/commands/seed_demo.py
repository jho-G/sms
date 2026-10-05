"""
Seed the database with a small, coherent demo school.

Creates the four accounts advertised on the login page, one academic year
with a grade level and section, two subjects with teacher assignments,
assessment categories, and a fortnight of attendance and marks -- enough to
exercise every dashboard without hand-clicking through the UI.

Safe to re-run: every object is looked up before it is created.

    python manage.py seed_demo
    python manage.py seed_demo --flush   # wipe demo rows first
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)
from attendance.models import Attendance
from enrollment.models import (
    ParentProfile,
    StudentGuardian,
    StudentProfile,
    TeacherProfile,
)
from grading.models import AssessmentCategory, Grade

User = get_user_model()

DEMO_ACCOUNTS = [
    ("director@sms.com", "director123", "DIRECTOR", "Dana", "Director"),
    ("teacher@sms.com", "teacher123", "TEACHER", "Tariq", "Teacher"),
    ("student@sms.com", "student123", "STUDENT", "Sam", "Student"),
    ("parent@sms.com", "parent123", "PARENT", "Priya", "Parent"),
]

EXTRA_STUDENTS = [
    ("amina@sms.com", "Amina", "Bekele", "STU-2025-002"),
    ("luca@sms.com", "Luca", "Rossi", "STU-2025-003"),
    ("mei@sms.com", "Mei", "Tanaka", "STU-2025-004"),
]


class Command(BaseCommand):
    help = "Seed the database with a coherent demo school."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing demo data before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing demo data...")
            Grade.objects.all().delete()
            AssessmentCategory.objects.all().delete()
            Attendance.objects.all().delete()
            StudentGuardian.objects.all().delete()
            StudentProfile.objects.all().delete()
            TeacherProfile.objects.all().delete()
            ParentProfile.objects.all().delete()
            SubjectAssignment.objects.all().delete()
            Subject.objects.all().delete()
            ClassSection.objects.all().delete()
            GradeLevel.objects.all().delete()
            AcademicYear.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        users = self._create_users()
        year = self._create_academic_year()
        grade, section = self._create_structure(year)
        subjects = self._create_subjects(grade)
        assignments = self._create_assignments(users, subjects, section, year)
        students = self._create_students(users, section)
        self._create_guardians(users, students)
        categories = self._create_categories(assignments)
        self._create_grades(students, categories)
        self._create_attendance(students, assignments)

        self.stdout.write(self.style.SUCCESS("\nDemo data ready. Sign in with:"))
        for email, password, role, *_ in DEMO_ACCOUNTS:
            self.stdout.write(f"  {role:<9} {email:<20} {password}")

    # -- steps ----------------------------------------------------------

    def _create_users(self):
        users = {}
        for email, password, role, first, last in DEMO_ACCOUNTS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": first,
                    "last_name": last,
                    "role": role,
                },
            )
            if created:
                user.set_password(password)
                user.save()
            users[role] = user

        for email, first, last, _student_id in EXTRA_STUDENTS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": first,
                    "last_name": last,
                    "role": "STUDENT",
                },
            )
            if created:
                user.set_password("student123")
                user.save()
            users[email] = user

        self.stdout.write(f"Users: {User.objects.count()}")
        return users

    def _create_academic_year(self):
        today = date.today()
        start = date(today.year, 9, 1)
        if today < start:
            start = date(today.year - 1, 9, 1)

        year, _ = AcademicYear.objects.get_or_create(
            name=f"{start.year}-{start.year + 1}",
            defaults={
                "start_date": start,
                "end_date": date(start.year + 1, 6, 30),
                "is_active": True,
            },
        )
        return year

    def _create_structure(self, year):
        grade, _ = GradeLevel.objects.get_or_create(
            level=11,
            academic_year=year,
            defaults={"name": "Grade 11", "description": "Junior year"},
        )
        section, _ = ClassSection.objects.get_or_create(
            grade_level=grade,
            name="A",
            defaults={"capacity": 30, "room_number": "101"},
        )
        return grade, section

    def _create_subjects(self, grade):
        subjects = []
        for name, code in [("Mathematics", "MATH101"), ("Physics", "PHYS101")]:
            subject, _ = Subject.objects.get_or_create(
                code=code, defaults={"name": name}
            )
            subject.grade_levels.add(grade)
            subjects.append(subject)
        return subjects

    def _create_assignments(self, users, subjects, section, year):
        assignments = []
        for subject in subjects:
            assignment, _ = SubjectAssignment.objects.get_or_create(
                teacher=users["TEACHER"],
                subject=subject,
                section=section,
                academic_year=year,
            )
            assignments.append(assignment)
        return assignments

    def _create_students(self, users, section):
        students = []

        profile, _ = StudentProfile.objects.get_or_create(
            user=users["STUDENT"],
            defaults={
                "student_id": "STU-2025-001",
                "section": section,
                "date_of_birth": date(2009, 4, 12),
                "guardian_contact": "+15550100",
            },
        )
        students.append(profile)

        for email, _first, _last, student_id in EXTRA_STUDENTS:
            profile, _ = StudentProfile.objects.get_or_create(
                user=users[email],
                defaults={
                    "student_id": student_id,
                    "section": section,
                    "date_of_birth": date(2009, 6, 1),
                },
            )
            students.append(profile)

        TeacherProfile.objects.get_or_create(
            user=users["TEACHER"],
            defaults={
                "employee_id": "TCH-2025-001",
                "department": "Science",
                "specialization": "Mathematics and Physics",
                "qualification": "M.Sc.",
            },
        )
        return students

    def _create_guardians(self, users, students):
        parent, _ = ParentProfile.objects.get_or_create(
            user=users["PARENT"],
            defaults={"occupation": "Engineer", "secondary_phone": "+15550111"},
        )
        StudentGuardian.objects.get_or_create(
            parent=parent,
            student=students[0],
            defaults={"relationship": "MOTHER", "is_primary": True},
        )
        return parent

    def _create_categories(self, assignments):
        categories = []
        for assignment in assignments:
            for name, weight in [
                ("Midterm", Decimal("30.00")),
                ("Final", Decimal("50.00")),
                ("Quizzes", Decimal("20.00")),
            ]:
                category, _ = AssessmentCategory.objects.get_or_create(
                    name=name,
                    subject_assignment=assignment,
                    defaults={"weight": weight},
                )
                categories.append(category)
        return categories

    def _create_grades(self, students, categories):
        # Deterministic spread so report cards show a range of letter grades.
        scores = [92, 78, 85, 64]
        for category in categories:
            for index, student in enumerate(students):
                Grade.objects.get_or_create(
                    student=student,
                    assessment_category=category,
                    defaults={
                        "score": Decimal(scores[index % len(scores)]),
                        "max_score": Decimal("100.00"),
                    },
                )

    def _create_attendance(self, students, assignments):
        today = date.today()
        created = 0

        for offset in range(14):
            day = today - timedelta(days=offset)
            if day.weekday() >= 5:  # skip weekends
                continue

            for assignment in assignments:
                for index, student in enumerate(students):
                    # One absence and one late per student per fortnight.
                    if offset == index:
                        status = Attendance.Status.ABSENT
                    elif offset == index + 5:
                        status = Attendance.Status.LATE
                    else:
                        status = Attendance.Status.PRESENT

                    _, was_created = Attendance.objects.get_or_create(
                        student=student,
                        subject_assignment=assignment,
                        date=day,
                        defaults={"status": status},
                    )
                    created += int(was_created)

        self.stdout.write(f"Attendance records: {created} new")
