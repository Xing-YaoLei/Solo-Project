from rest_framework import serializers
from .models import DownloadRecord, MonthlyReview


class DownloadRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)

    class Meta:
        model = DownloadRecord
        fields = ['id', 'user', 'user_name', 'file_name', 'file_url', 'report_type',
                  'filters', 'generated_at', 'generated_by', 'generated_by_name']
        read_only_fields = ['id', 'generated_at']


class MonthlyReviewSerializer(serializers.ModelSerializer):
    counselor_name = serializers.CharField(source='counselor.username', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)

    class Meta:
        model = MonthlyReview
        fields = ['id', 'year', 'month', 'counselor', 'counselor_name',
                  'total_follow_ups', 'completed_follow_ups', 'renewal_count',
                  'completion_rate', 'renewal_rate', 'average_student_progress',
                  'total_students', 'summary', 'generated_at', 'generated_by',
                  'generated_by_name']
        read_only_fields = ['id', 'generated_at']
