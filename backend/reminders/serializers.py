from rest_framework import serializers
from .models import ReminderRule, ReminderLog


class ReminderRuleSerializer(serializers.ModelSerializer):
    condition_type_display = serializers.CharField(source="get_condition_type_display", read_only=True)
    remind_method_display = serializers.CharField(source="get_remind_method_display", read_only=True)

    class Meta:
        model = ReminderRule
        fields = [
            "id", "name", "condition_type", "condition_type_display",
            "threshold", "remind_method", "remind_method_display",
            "frequency_days", "is_active",
        ]


class ReminderLogSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)

    class Meta:
        model = ReminderLog
        fields = ["id", "rule", "rule_name", "student", "student_name", "message", "sent_at", "is_read"]
        read_only_fields = ["sent_at"]
