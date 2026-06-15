from rest_framework import serializers
from distributions.serializers import DistributionSerializer
from .models import RiskRecord, Communication, ReviewConclusion


class CommunicationSerializer(serializers.ModelSerializer):
    comm_type_display = serializers.CharField(source="get_comm_type_display", read_only=True)

    class Meta:
        model = Communication
        fields = ["id", "risk", "content", "comm_type", "comm_type_display", "created_by", "created_at"]
        read_only_fields = ["created_at"]


class ReviewConclusionSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewConclusion
        fields = ["id", "risk", "conclusion", "reviewer_id", "reviewer_name", "created_at"]
        read_only_fields = ["created_at"]

    def get_reviewer_name(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=obj.reviewer_id)
            return user.get_username()
        except (User.DoesNotExist, TypeError):
            return None


class RiskRecordSerializer(serializers.ModelSerializer):
    distribution = DistributionSerializer(read_only=True)
    distribution_id = serializers.PrimaryKeyRelatedField(
        queryset=DistributionSerializer.Meta.model.objects.all(),
        source="distribution", write_only=True
    )
    communications = CommunicationSerializer(many=True, read_only=True)
    review_conclusions = ReviewConclusionSerializer(many=True, read_only=True)
    risk_level_display = serializers.CharField(source="get_risk_level_display", read_only=True)

    class Meta:
        model = RiskRecord
        fields = [
            "id", "distribution", "distribution_id", "risk_level", "risk_level_display",
            "reason", "communications", "review_conclusions",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class RiskRecordListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="distribution.student.name", read_only=True)
    material_title = serializers.CharField(source="distribution.material.title", read_only=True)
    risk_level_display = serializers.CharField(source="get_risk_level_display", read_only=True)

    class Meta:
        model = RiskRecord
        fields = [
            "id", "distribution", "risk_level", "risk_level_display", "reason",
            "student_name", "material_title", "created_at", "updated_at",
        ]
