from rest_framework import serializers
from .models import (
    InspectionReport, InspectionItemResult, InspectionStatus, InspectionItem, ConditionRating
)


class InspectionItemResultSerializer(serializers.ModelSerializer):
    item_display = serializers.CharField(source='get_item_display', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)

    class Meta:
        model = InspectionItemResult
        fields = '__all__'


class InspectionReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    overall_rating_display = serializers.CharField(source='get_overall_rating_display', read_only=True)
    inspector_info = serializers.SerializerMethodField()
    items = InspectionItemResultSerializer(many=True, required=False)
    items_summary = serializers.SerializerMethodField()

    class Meta:
        model = InspectionReport
        fields = '__all__'
        read_only_fields = ['verified_at', 'created_at', 'updated_at']

    def get_inspector_info(self, obj):
        if obj.inspector:
            return {
                'id': obj.inspector.id,
                'username': obj.inspector.username,
                'name': f'{obj.inspector.first_name}{obj.inspector.last_name}'
            }
        return None

    def get_items_summary(self, obj):
        items = obj.items.all()
        total = items.count()
        excellent = items.filter(rating=ConditionRating.EXCELLENT).count()
        good = items.filter(rating=ConditionRating.GOOD).count()
        poor = items.filter(rating__in=[ConditionRating.POOR, ConditionRating.BAD]).count()
        return {
            'total': total,
            'excellent': excellent,
            'good': good,
            'average': total - excellent - good - poor,
            'poor': poor,
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        report = InspectionReport.objects.create(**validated_data)
        for item_data in items_data:
            InspectionItemResult.objects.create(report=report, **item_data)
        return report

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InspectionItemResult.objects.create(report=instance, **item_data)
        return instance


class VerifyInspectionSerializer(serializers.Serializer):
    verified = serializers.BooleanField(default=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')
