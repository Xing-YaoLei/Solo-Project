from rest_framework import serializers
from .models import Course, Chapter


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["id", "name", "order", "course", "created_at"]
        read_only_fields = ["created_at"]


class CourseSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "name", "description", "chapters", "created_at"]
        read_only_fields = ["created_at"]
