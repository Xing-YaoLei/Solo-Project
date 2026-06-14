from rest_framework import serializers
from .models import ReminderRule, RenewalFollowUp, FollowUpRecord, ScoreFeedback


class ReminderRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderRule
        fields = ['id', 'name', 'trigger_type', 'threshold', 'description',
                  'notify_counselor', 'notify_teacher', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FollowUpRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = FollowUpRecord
        fields = ['id', 'follow_up', 'content', 'method', 'contact_person',
                  'next_action', 'next_date', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ScoreFeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = ScoreFeedback
        fields = ['id', 'enrollment', 'student', 'student_name', 'course', 'course_name',
                  'score', 'max_score', 'feedback', 'teacher_comments',
                  'improvement_suggestions', 'feedback_date', 'created_by',
                  'created_by_name', 'created_at']
        read_only_fields = ['id', 'feedback_date', 'created_at']


class RenewalFollowUpSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    counselor_name = serializers.CharField(source='counselor.username', read_only=True)
    reminder_rule_name = serializers.CharField(source='reminder_rule.name', read_only=True)
    course_name = serializers.CharField(source='enrollment.course.name', read_only=True)
    progress = serializers.IntegerField(source='enrollment.progress', read_only=True)
    renewal_due_date = serializers.DateField(source='enrollment.renewal_due_date', read_only=True)
    records_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = RenewalFollowUp
        fields = ['id', 'enrollment', 'student', 'student_name', 'counselor',
                  'counselor_name', 'status', 'priority', 'reminder_rule',
                  'reminder_rule_name', 'reason', 'next_follow_up_date',
                  'completed_at', 'created_by', 'created_at', 'updated_at',
                  'course_name', 'progress', 'renewal_due_date', 'records_count']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RenewalFollowUpDetailSerializer(RenewalFollowUpSerializer):
    records = FollowUpRecordSerializer(many=True, read_only=True)
    score_feedbacks = serializers.SerializerMethodField()
    chapters = serializers.SerializerMethodField()
    reminder_rules = serializers.SerializerMethodField()

    def get_score_feedbacks(self, obj):
        from apps.courses.models import Enrollment
        feedbacks = ScoreFeedback.objects.filter(enrollment=obj.enrollment).order_by('-feedback_date')[:10]
        return ScoreFeedbackSerializer(feedbacks, many=True).data

    def get_chapters(self, obj):
        from apps.courses.models import Chapter
        chapters = Chapter.objects.filter(course=obj.enrollment.course).order_by('order')
        from apps.courses.serializers import ChapterSerializer
        return ChapterSerializer(chapters, many=True).data

    def get_reminder_rules(self, obj):
        rules = ReminderRule.objects.filter(is_active=True)
        return ReminderRuleSerializer(rules, many=True).data

    class Meta(RenewalFollowUpSerializer.Meta):
        fields = RenewalFollowUpSerializer.Meta.fields + ['records', 'score_feedbacks', 'chapters', 'reminder_rules']
