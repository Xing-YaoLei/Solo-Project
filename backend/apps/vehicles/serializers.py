from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Vehicle, VehicleStatus, ReviewStatus, ReviewRecord, StatusChangeLog

User = get_user_model()


class SimpleUserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role_display']


class VehicleListSerializer(serializers.ModelSerializer):
    appraiser_info = SimpleUserSerializer(source='appraiser', read_only=True)
    salesperson_info = SimpleUserSerializer(source='salesperson', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    document_status = serializers.SerializerMethodField()
    stage_completion = serializers.SerializerMethodField()
    inventory_days = serializers.ReadOnlyField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'vin', 'plate_number', 'brand', 'model', 'year', 'color',
            'mileage', 'fuel_type', 'status', 'status_display',
            'review_status', 'review_status_display',
            'purchase_price', 'expected_price', 'selling_price',
            'appraiser', 'appraiser_info', 'salesperson', 'salesperson_info',
            'document_status', 'stage_completion', 'inventory_days',
            'source', 'created_at', 'updated_at', 'listed_at', 'sold_at',
        ]

    def get_document_status(self, obj):
        return obj.document_status

    def get_stage_completion(self, obj):
        return obj.stage_completion


class VehicleSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    document_status = serializers.SerializerMethodField()
    stage_completion = serializers.SerializerMethodField()
    inventory_days = serializers.ReadOnlyField()
    review_records_count = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_document_status(self, obj):
        return obj.document_status

    def get_stage_completion(self, obj):
        return obj.stage_completion

    def get_review_records_count(self, obj):
        return obj.review_records.count()

    def get_documents_count(self, obj):
        return obj.documents.count()

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class StatusChangeSerializer(serializers.Serializer):
    to_status = serializers.ChoiceField(choices=VehicleStatus.choices)
    remark = serializers.CharField(required=False, allow_blank=True)


class ReviewRecordSerializer(serializers.ModelSerializer):
    reviewer_info = SimpleUserSerializer(source='reviewer', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReviewRecord
        fields = '__all__'
        read_only_fields = ['created_at']

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        record = super().create(validated_data)
        vehicle = record.vehicle
        vehicle.review_status = record.status
        if record.status == ReviewStatus.PASS:
            if vehicle.status == VehicleStatus.PENDING_REVIEW:
                vehicle.status = VehicleStatus.LISTED
                vehicle.listed_at = __import__('django.utils.timezone', fromlist=['now']).now()
        vehicle.save()
        return record


class StatusChangeLogSerializer(serializers.ModelSerializer):
    operator_info = SimpleUserSerializer(source='operator', read_only=True)
    from_status_display = serializers.CharField(source='get_from_status_display', read_only=True)
    to_status_display = serializers.CharField(source='get_to_status_display', read_only=True)

    class Meta:
        model = StatusChangeLog
        fields = '__all__'


class BatchActionSerializer(serializers.Serializer):
    vehicle_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=[
        'advance_stage', 'set_review_pass', 'set_review_reject',
        'assign_appraiser', 'assign_salesperson',
    ])
    target_user_id = serializers.IntegerField(required=False, allow_null=True)
    remark = serializers.CharField(required=False, allow_blank=True, default='')


class DocumentMissingFilterSerializer(serializers.Serializer):
    only_missing = serializers.BooleanField(default=False)
