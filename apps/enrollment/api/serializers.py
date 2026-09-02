from rest_framework import serializers

from enrollment.models import (
    ParentProfile,
    StudentGuardian,
    StudentProfile,
    TeacherProfile,
)


class StudentProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for StudentProfile with nested user info."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_full_name = serializers.CharField(
        source="user.get_full_name", read_only=True
    )
    section_name = serializers.CharField(
        source="section.__str__", read_only=True, default=None
    )

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "student_id",
            "section",
            "section_name",
            "date_of_birth",
            "enrollment_date",
            "guardian_contact",
            "medical_notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "enrollment_date", "created_at", "updated_at"]


class StudentProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a StudentProfile via API."""

    class Meta:
        model = StudentProfile
        fields = [
            "user",
            "student_id",
            "section",
            "date_of_birth",
            "guardian_contact",
            "medical_notes",
        ]

    def validate_student_id(self, value):
        if StudentProfile.objects.filter(student_id=value).exists():
            raise serializers.ValidationError(
                f"Student ID '{value}' is already in use."
            )
        return value

    def validate(self, attrs):
        user = attrs.get("user")
        if user and user.role != "STUDENT":
            raise serializers.ValidationError(
                {"user": "User must have the STUDENT role."}
            )
        return attrs


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for TeacherProfile with nested user info."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_full_name = serializers.CharField(
        source="user.get_full_name", read_only=True
    )

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "employee_id",
            "department",
            "specialization",
            "qualification",
            "hire_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "hire_date", "created_at", "updated_at"]


class TeacherProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a TeacherProfile via API."""

    class Meta:
        model = TeacherProfile
        fields = [
            "user",
            "employee_id",
            "department",
            "specialization",
            "qualification",
        ]

    def validate_employee_id(self, value):
        if TeacherProfile.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError(
                f"Employee ID '{value}' is already in use."
            )
        return value

    def validate(self, attrs):
        user = attrs.get("user")
        if user and user.role != "TEACHER":
            raise serializers.ValidationError(
                {"user": "User must have the TEACHER role."}
            )
        return attrs


class ParentProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for ParentProfile with nested user info."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_full_name = serializers.CharField(
        source="user.get_full_name", read_only=True
    )

    class Meta:
        model = ParentProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "occupation",
            "address",
            "secondary_phone",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ParentProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a ParentProfile via API."""

    class Meta:
        model = ParentProfile
        fields = [
            "user",
            "occupation",
            "address",
            "secondary_phone",
        ]

    def validate(self, attrs):
        user = attrs.get("user")
        if user and user.role != "PARENT":
            raise serializers.ValidationError(
                {"user": "User must have the PARENT role."}
            )
        return attrs


class StudentGuardianSerializer(serializers.ModelSerializer):
    """Read-only serializer for StudentGuardian with nested profile info."""

    parent_name = serializers.CharField(
        source="parent.user.get_full_name", read_only=True
    )
    student_name = serializers.CharField(
        source="student.user.get_full_name", read_only=True
    )
    student_id_code = serializers.CharField(
        source="student.student_id", read_only=True
    )

    class Meta:
        model = StudentGuardian
        fields = [
            "id",
            "parent",
            "parent_name",
            "student",
            "student_name",
            "student_id_code",
            "relationship",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentGuardianCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a StudentGuardian link via API."""

    class Meta:
        model = StudentGuardian
        fields = [
            "parent",
            "student",
            "relationship",
            "is_primary",
        ]

    def validate(self, attrs):
        parent = attrs.get("parent")
        student = attrs.get("student")

        if parent and parent.user.role != "PARENT":
            raise serializers.ValidationError(
                {"parent": "Parent profile must link to a PARENT user."}
            )
        if student and student.user.role != "STUDENT":
            raise serializers.ValidationError(
                {"student": "Student profile must link to a STUDENT user."}
            )

        if parent and student:
            if StudentGuardian.objects.filter(
                parent=parent, student=student
            ).exists():
                raise serializers.ValidationError(
                    "This parent is already linked to this student."
                )

        return attrs
