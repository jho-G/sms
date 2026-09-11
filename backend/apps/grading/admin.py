from django.contrib import admin

from grading.models import AssessmentCategory, Grade


@admin.register(AssessmentCategory)
class AssessmentCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for AssessmentCategory."""

    list_display = [
        "id",
        "name",
        "subject_assignment",
        "weight",
        "graded_count_display",
        "created_at",
    ]
    list_filter = ["subject_assignment__subject", "weight"]
    search_fields = [
        "name",
        "subject_assignment__subject__name",
        "subject_assignment__teacher__first_name",
        "subject_assignment__teacher__last_name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["subject_assignment"]

    def graded_count_display(self, obj):
        return obj.grades.count()

    graded_count_display.short_description = "Grades"


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    """Admin configuration for Grade."""

    list_display = [
        "id",
        "student",
        "assessment_category",
        "score",
        "max_score",
        "percentage_display",
        "recorded_by",
        "created_at",
    ]
    list_filter = [
        "assessment_category__name",
        "assessment_category__subject_assignment__subject",
    ]
    search_fields = [
        "student__student_id",
        "student__user__first_name",
        "student__user__last_name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["student", "assessment_category", "recorded_by"]

    def percentage_display(self, obj):
        return f"{obj.percentage:.1f}%"

    percentage_display.short_description = "Percentage"
