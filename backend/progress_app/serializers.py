from rest_framework import serializers
from django.utils import timezone
from .models import Progress, ChapterCompletion, Grade


class ChapterCompletionSerializer(serializers.ModelSerializer):
    chapter_name = serializers.CharField(source="chapter.name", read_only=True)

    class Meta:
        model = ChapterCompletion
        fields = ["id", "progress", "chapter", "chapter_name", "completed", "completed_at"]

    def update(self, instance, validated_data):
        if validated_data.get("completed", False) and not instance.completed:
            validated_data["completed_at"] = timezone.now()
        return super().update(instance, validated_data)


class GradeSerializer(serializers.ModelSerializer):
    chapter_name = serializers.CharField(source="chapter.name", read_only=True)

    class Meta:
        model = Grade
        fields = ["id", "progress", "chapter", "chapter_name", "score", "feedback", "graded_by", "graded_at"]
        read_only_fields = ["graded_at"]


class ProgressSerializer(serializers.ModelSerializer):
    chapter_completions = ChapterCompletionSerializer(many=True, read_only=True)
    grades = GradeSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source="distribution.student.name", read_only=True)
    material_title = serializers.CharField(source="distribution.material.title", read_only=True)

    class Meta:
        model = Progress
        fields = [
            "id", "distribution", "percentage", "last_updated",
            "chapter_completions", "grades",
            "student_name", "material_title",
        ]
        read_only_fields = ["last_updated"]

    def update(self, instance, validated_data):
        instance.percentage = validated_data.get("percentage", instance.percentage)
        instance.last_updated = timezone.now()
        instance.save()
        return instance
