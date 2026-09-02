from rest_framework import serializers

from academics.models import (
    AcademicYear,
    ClassSection,
    GradeLevel,
    Subject,
    SubjectAssignment,
)


class AcademicYearSerializer(serializers.ModelSerializer):
    """
    Serializer for AcademicYear model.
    """

    class Meta:
        model = AcademicYear
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AcademicYearCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating AcademicYear.
    """

    class Meta:
        model = AcademicYear
        fields = [
            "name",
            "start_date",
            "end_date",
            "is_active",
        ]


class GradeLevelSerializer(serializers.ModelSerializer):
    """
    Serializer for GradeLevel model.
    """

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = GradeLevel
        fields = [
            "id",
            "name",
            "level",
            "academic_year",
            "academic_year_name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GradeLevelCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating GradeLevel.
    """

    class Meta:
        model = GradeLevel
        fields = [
            "name",
            "level",
            "academic_year",
            "description",
        ]


class ClassSectionSerializer(serializers.ModelSerializer):
    """
    Serializer for ClassSection model.
    """

    grade_level_name = serializers.CharField(
        source="grade_level.name",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="grade_level.academic_year.name",
        read_only=True,
    )
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSection
        fields = [
            "id",
            "grade_level",
            "grade_level_name",
            "academic_year_name",
            "name",
            "capacity",
            "room_number",
            "is_active",
            "student_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_student_count(self, obj):
        """Get the number of students in this section (placeholder)."""
        # This will be implemented when the student module is created
        return 0


class ClassSectionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating ClassSection.
    """

    class Meta:
        model = ClassSection
        fields = [
            "grade_level",
            "name",
            "capacity",
            "room_number",
        ]


class SubjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Subject model.
    """

    grade_level_names = serializers.StringRelatedField(
        source="grade_levels",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "description",
            "grade_levels",
            "grade_level_names",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Subject.
    """

    class Meta:
        model = Subject
        fields = [
            "name",
            "code",
            "description",
            "grade_levels",
        ]


class SubjectAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for SubjectAssignment model.
    """

    teacher_name = serializers.CharField(
        source="teacher.get_full_name",
        read_only=True,
    )
    teacher_email = serializers.EmailField(
        source="teacher.email",
        read_only=True,
    )
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )
    subject_code = serializers.CharField(
        source="subject.code",
        read_only=True,
    )
    section_name = serializers.CharField(
        source="section.__str__",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = SubjectAssignment
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "teacher_email",
            "subject",
            "subject_name",
            "subject_code",
            "section",
            "section_name",
            "academic_year",
            "academic_year_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectAssignmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating SubjectAssignment.
    """

    class Meta:
        model = SubjectAssignment
        fields = [
            "teacher",
            "subject",
            "section",
            "academic_year",
        ]

    def validate_teacher(self, value):
        """Validate that the user is a teacher."""
        if value.role != "TEACHER":
            raise serializers.ValidationError("Assigned user must have the TEACHER role.")
        return value
