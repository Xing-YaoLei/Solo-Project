from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    TransferRecord, Quotation, FinanceDoc, VehicleProfile,
    FileAttachment, ExceptionItem, ExceptionNote, ReviewTag, UserProfile,
)


class UserSummarySerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', default='specialist')

    class Meta:
        model = User
        fields = ['id', 'username', 'role']


class FileAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = FileAttachment
        fields = ['id', 'file_name', 'file_url', 'file_size', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else ''


class ExceptionNoteSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = ExceptionNote
        fields = ['id', 'author', 'content', 'created_at']


class ExceptionItemSerializer(serializers.ModelSerializer):
    notes = ExceptionNoteSerializer(many=True, read_only=True)

    class Meta:
        model = ExceptionItem
        fields = ['id', 'record', 'missing_type', 'urgency', 'status', 'discovered_at', 'resolved_at', 'notes']


class ReviewTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewTag
        fields = ['id', 'tag_name', 'created_at']


class QuotationSerializer(serializers.ModelSerializer):
    quoted_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = Quotation
        fields = ['id', 'record', 'price', 'note', 'quoted_by', 'quoted_at']


class FinanceDocSerializer(serializers.ModelSerializer):
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = FinanceDoc
        fields = ['id', 'record', 'loan_scheme', 'down_payment_ratio', 'monthly_payment', 'months', 'institution', 'attachments']

    def get_attachments(self, obj):
        attachments = FileAttachment.objects.filter(related_obj_id=obj.id, related_obj_type='finance')
        return FileAttachmentSerializer(attachments, many=True, context=self.context).data


class VehicleProfileSerializer(serializers.ModelSerializer):
    license_images = serializers.SerializerMethodField()
    registration_images = serializers.SerializerMethodField()

    class Meta:
        model = VehicleProfile
        fields = ['id', 'record', 'brand', 'model', 'vin', 'mileage', 'condition_grade', 'registration_date', 'source_channel', 'license_images', 'registration_images']

    def get_license_images(self, obj):
        attachments = FileAttachment.objects.filter(related_obj_id=obj.id, related_obj_type='vehicle_license')
        return FileAttachmentSerializer(attachments, many=True, context=self.context).data

    def get_registration_images(self, obj):
        attachments = FileAttachment.objects.filter(related_obj_id=obj.id, related_obj_type='vehicle_registration')
        return FileAttachmentSerializer(attachments, many=True, context=self.context).data


class TransferRecordListSerializer(serializers.ModelSerializer):
    assignee = UserSummarySerializer(read_only=True)
    reviewer = UserSummarySerializer(read_only=True)
    review_tags = serializers.SerializerMethodField()
    exception_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = TransferRecord
        fields = ['id', 'contract_no', 'status', 'buyer_name', 'seller_name', 'transfer_tax', 'assignee', 'reviewer', 'reviewed_at', 'created_at', 'updated_at', 'review_tags', 'exception_count']

    def get_review_tags(self, obj):
        return list(obj.review_tags.values_list('tag_name', flat=True))


class TransferRecordDetailSerializer(serializers.ModelSerializer):
    assignee = UserSummarySerializer(read_only=True)
    reviewer = UserSummarySerializer(read_only=True)
    exception_items = ExceptionItemSerializer(many=True, read_only=True)
    review_tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = TransferRecord
        fields = [
            'id', 'contract_no', 'status', 'buyer_name', 'buyer_id_no',
            'seller_name', 'seller_id_no', 'transfer_tax',
            'assignee', 'reviewer', 'reviewed_at', 'review_note',
            'exception_items', 'review_tags',
            'created_at', 'updated_at',
        ]


class TransferRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRecord
        fields = ['contract_no', 'buyer_name', 'buyer_id_no', 'seller_name', 'seller_id_no', 'transfer_tax', 'assignee']


class TransferRecordUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRecord
        fields = ['contract_no', 'buyer_name', 'buyer_id_no', 'seller_name', 'seller_id_no', 'transfer_tax', 'status', 'review_note']

    def validate_status(self, value):
        instance = self.instance
        if instance and instance.status == 'completed' and value != 'completed':
            raise serializers.ValidationError('已完成的记录不可修改状态')
        return value


class QuotationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = ['price', 'note']


class FinanceDocUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceDoc
        fields = ['loan_scheme', 'down_payment_ratio', 'monthly_payment', 'months', 'institution']


class VehicleProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleProfile
        fields = ['brand', 'model', 'vin', 'mileage', 'condition_grade', 'registration_date', 'source_channel']


class ExceptionItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionItem
        fields = ['urgency', 'status', 'resolved_at']


class ExceptionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionItem
        fields = ['record', 'missing_type', 'urgency']


class ExceptionNoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExceptionNote
        fields = ['content']


class ReviewTagCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewTag
        fields = ['tag_name']


class AnalyticsOverviewSerializer(serializers.Serializer):
    turnover_avg_days = serializers.FloatField()
    turnover_trend = serializers.ListField(child=serializers.DictField())
    channel_stats = serializers.ListField(child=serializers.DictField())
    assignee_stats = serializers.ListField(child=serializers.DictField())
    tag_cloud = serializers.ListField(child=serializers.DictField())
