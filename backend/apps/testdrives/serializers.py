from rest_framework import serializers
from .models import TestDriveRecord, TestDriveStatus, CustomerIntent


class TestDriveRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    purchase_intent_display = serializers.CharField(source='get_purchase_intent_display', read_only=True)
    salesperson_info = serializers.SerializerMethodField()
    testdrive_distance = serializers.ReadOnlyField()
    testdrive_duration = serializers.ReadOnlyField()

    class Meta:
        model = TestDriveRecord
        fields = '__all__'
        read_only_fields = ['verified_at', 'created_at', 'updated_at']

    def get_salesperson_info(self, obj):
        if obj.salesperson:
            return {
                'id': obj.salesperson.id,
                'username': obj.salesperson.username,
                'name': f'{obj.salesperson.first_name}{obj.salesperson.last_name}'
            }
        return None


class VerifyTestDriveSerializer(serializers.Serializer):
    verified = serializers.BooleanField(default=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')
