from rest_framework import serializers
from .models import Course, Chapter, Enrollment


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'course', 'title', 'description', 'order', 'duration', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    chapters_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'category', 'status', 'total_hours', 'total_chapters',
                  'teacher', 'teacher_name', 'cover_image', 'created_at', 'updated_at', 'chapters_count']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseDetailSerializer(CourseSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['chapters']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_category = serializers.CharField(source='course.category', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_name', 'course_category',
                  'status', 'progress', 'enroll_date', 'end_date', 'renewal_due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
