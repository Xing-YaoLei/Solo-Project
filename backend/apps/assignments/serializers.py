from rest_framework import serializers
from .models import Assignment, AssignmentSubmission, AssignmentChangeLog


class AssignmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'course', 'course_name', 'chapter', 'chapter_title', 'title',
                  'description', 'due_date', 'max_score', 'file_url', 'created_by',
                  'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentChangeLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.username', read_only=True)

    class Meta:
        model = AssignmentChangeLog
        fields = ['id', 'submission', 'changed_by', 'changed_by_name', 'change_type',
                  'field_name', 'old_value', 'new_value', 'reason', 'action',
                  'closed_at', 'closed_by', 'closed_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_due_date = serializers.DateTimeField(source='assignment.due_date', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.username', read_only=True)
    change_logs = AssignmentChangeLogSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'assignment', 'assignment_title', 'assignment_due_date',
                  'student', 'student_name', 'content', 'file_url', 'score',
                  'feedback', 'submitted_at', 'graded_at', 'graded_by', 'graded_by_name',
                  'status', 'created_at', 'updated_at', 'change_logs']
        read_only_fields = ['id', 'created_at', 'updated_at', 'change_logs']
