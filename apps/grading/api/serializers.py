from rest_framework import serializers

from grading.models import AssessmentCategory, Grade


# ---------------------------------------------------------------------------
# Assessment Category Serializers
# ---------------------------------------------------------------------------


class AssessmentCategorySerializer(serializers.ModelSerializer):
    """Read-only serializer for AssessmentCategory with nested info."""

    subject_name = serializers.CharField(
        source="subject_assignment.subject.name", read_only=True
    )
    subject_code = serializers.CharField(
        source="subject_assignment.subject.code", read_only=True
    )
    section_name = serializers.CharField(
        source="subject_assignment.section.__str__", read_only=True
    )
    teacher_name = serializers.CharField(
        source="subject_assignment.teacher.get_full_name", read_only=True
    )
    graded_count = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentCategory
        fields = [
            "id",
            "name",
            "subject_assignment",
            "subject_name",
            "subject_code",
            "section_name",
            "teacher_name",
            "weight",
            "description",
            "graded_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_graded_count(self, obj):
        """Number of students who have grades in this category."""
        return obj.grades.count()


class AssessmentCategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an AssessmentCategory."""

    class Meta:
        model = AssessmentCategory
        fields = ["name", "subject_assignment", "weight", "description"]


# ---------------------------------------------------------------------------
# Grade Serializers
# ---------------------------------------------------------------------------


class GradeSerializer(serializers.ModelSerializer):
    """Read-only serializer for Grade with nested info."""

    student_name = serializers.CharField(
        source="student.user.get_full_name", read_only=True
    )
    student_code = serializers.CharField(
        source="student.student_id", read_only=True
    )
    category_name = serializers.CharField(
        source="assessment_category.name", read_only=True
    )
    category_weight = serializers.DecimalField(
        source="assessment_category.weight",
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    subject_name = serializers.CharField(
        source="assessment_category.subject_assignment.subject.name",
        read_only=True,
    )
    recorded_by_name = serializers.CharField(
        source="recorded_by.get_full_name", read_only=True, default=None
    )
    percentage = serializers.SerializerMethodField()
    weighted_score = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "assessment_category",
            "category_name",
            "category_weight",
            "subject_name",
            "score",
            "max_score",
            "percentage",
            "weighted_score",
            "remarks",
            "recorded_by",
            "recorded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_percentage(self, obj):
        return float(obj.percentage)

    def get_weighted_score(self, obj):
        return float(obj.weighted_score)


class GradeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating or updating a single grade."""

    class Meta:
        model = Grade
        fields = ["student", "assessment_category", "score", "max_score", "remarks"]


# ---------------------------------------------------------------------------
# Bulk Grade Input Serializer (teacher marks entry)
# ---------------------------------------------------------------------------


class GradeInputSerializer(serializers.Serializer):
    """Single item inside a bulk grade payload."""

    student_id = serializers.UUIDField(
        help_text="UUID of the StudentProfile",
    )
    score = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Student's raw score",
    )
    max_score = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Maximum possible score",
    )
    remarks = serializers.CharField(
        required=False,
        default="",
        allow_blank=True,
        help_text="Optional teacher remarks",
    )


class BulkGradeSubmitSerializer(serializers.Serializer):
    """
    Serializer for the bulk grade submission endpoint.
    Teachers submit marks for all students in an assessment category.
    """

    assessment_category_id = serializers.UUIDField(
        help_text="UUID of the AssessmentCategory",
    )
    grades = GradeInputSerializer(
        many=True,
        help_text="List of student grade entries",
    )

    def validate_grades(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one grade entry is required."
            )
        return value


# ---------------------------------------------------------------------------
# Report Card Serializers
# ---------------------------------------------------------------------------


class SubjectGradeDetailSerializer(serializers.Serializer):
    """Serializer for a single subject's grade breakdown in the report card."""

    subject_name = serializers.CharField()
    subject_code = serializers.CharField()
    total_weighted_percentage = serializers.FloatField()
    total_weight = serializers.FloatField()
    graded_weight = serializers.FloatField()
    is_complete = serializers.BooleanField()
    grades = serializers.ListField()


class ReportCardSerializer(serializers.Serializer):
    """Serializer for the full student report card."""

    student_name = serializers.CharField()
    student_id_code = serializers.CharField()
    section = serializers.CharField(allow_null=True)
    academic_year = serializers.CharField()
    subjects = SubjectGradeDetailSerializer(many=True)
    overall_weighted_percentage = serializers.FloatField()
    overall_gpa = serializers.FloatField()
    letter_grade = serializers.CharField()
