from rest_framework import serializers
from .models import VehicleDocument, DocumentCategory, SourceType


class VehicleDocumentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    uploaded_by_info = serializers.SerializerMethodField()
    file_url = serializers.ReadOnlyField()
    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = VehicleDocument
        fields = '__all__'
        read_only_fields = ['file_path', 'file_size', 'content_type', 'uploaded_by',
                            'verified_at', 'closed_at', 'created_at', 'updated_at']

    def get_uploaded_by_info(self, obj):
        if obj.uploaded_by:
            return {
                'id': obj.uploaded_by.id,
                'username': obj.uploaded_by.username,
                'name': f'{obj.uploaded_by.first_name}{obj.uploaded_by.last_name}',
                'role': obj.uploaded_by.role,
            }
        return None


class DocumentUploadSerializer(serializers.Serializer):
    vehicle_id = serializers.IntegerField()
    document_type = serializers.CharField(max_length=50)
    category = serializers.ChoiceField(choices=DocumentCategory.choices, default=DocumentCategory.OTHER)
    source = serializers.ChoiceField(choices=SourceType.choices, default=SourceType.UPLOADED)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    expire_date = serializers.DateField(required=False, allow_null=True, default=None)
    file = serializers.FileField()


class DocumentVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField(default=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class DocumentCloseSerializer(serializers.Serializer):
    conclusion = serializers.CharField(required=False, allow_blank=True, default='')
    action = serializers.ChoiceField(choices=['close', 'reopen'], default='close')


class ProcessLogSerializer(serializers.Serializer):
    action = serializers.CharField(max_length=50)
    note = serializers.CharField(required=False, allow_blank=True, default='')
