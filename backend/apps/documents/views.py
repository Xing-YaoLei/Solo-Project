from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import FilterSet
from .models import VehicleDocument, DocumentCategory, SourceType
from .serializers import (
    VehicleDocumentSerializer, DocumentUploadSerializer,
    DocumentVerifySerializer, DocumentCloseSerializer, ProcessLogSerializer,
)
from .storage import storage
from apps.users.permissions import IsManager


class DocumentFilter(FilterSet):
    class Meta:
        model = VehicleDocument
        fields = ['vehicle', 'document_type', 'category', 'source',
                  'is_verified', 'is_closed', 'uploaded_by']


class VehicleDocumentViewSet(viewsets.ModelViewSet):
    queryset = VehicleDocument.objects.select_related(
        'vehicle', 'uploaded_by', 'verified_by', 'closed_by'
    ).all()
    serializer_class = VehicleDocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_class = DocumentFilter
    search_fields = ['title', 'document_type', 'file_name', 'description',
                     'vehicle__vin', 'vehicle__brand', 'vehicle__model']
    ordering_fields = ['created_at', 'expire_date', 'file_size']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'download']:
            return [IsAuthenticated()]
        if self.action in ['verify', 'close', 'add_process_log']:
            return [IsManager()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='upload')
    def upload_document(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        uploaded_file = data.pop('file')
        vehicle_id = data['vehicle_id']

        object_path = storage.upload(
            file_obj=uploaded_file,
            vehicle_id=vehicle_id,
            category=data['category'],
            filename=uploaded_file.name,
            content_type=uploaded_file.content_type or 'application/octet-stream',
        )

        doc = VehicleDocument.objects.create(
            **data,
            file_path=object_path,
            file_name=uploaded_file.name,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type or '',
            uploaded_by=request.user,
        )
        doc.add_process_log('上传', request.user, f'上传文件: {uploaded_file.name}')
        return Response(
            VehicleDocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        doc = self.get_object()
        from rest_framework.exceptions import NotFound
        stat = storage.stat(doc.file_path)
        if not stat:
            raise NotFound('文件不存在')
        return Response({
            'url': doc.file_url,
            'file_name': doc.file_name,
            'file_size': doc.file_size,
            'content_type': doc.content_type,
        })

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        doc = self.get_object()
        serializer = DocumentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        doc.is_verified = data['is_verified']
        doc.verified_by = request.user
        doc.verified_at = timezone.now()
        doc.verification_note = data.get('note', '')
        doc.save()
        action_text = '核验通过' if doc.is_verified else '核验不通过'
        doc.add_process_log(action_text, request.user, data.get('note', ''))
        return Response(VehicleDocumentSerializer(doc).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        doc = self.get_object()
        serializer = DocumentCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data['action'] == 'close':
            doc.is_closed = True
            doc.close_conclusion = data.get('conclusion', '')
            doc.closed_by = request.user
            doc.closed_at = timezone.now()
            doc.add_process_log('关闭', request.user, data.get('conclusion', ''))
        else:
            doc.is_closed = False
            doc.add_process_log('重新打开', request.user)
        doc.save()
        return Response(VehicleDocumentSerializer(doc).data)

    @action(detail=True, methods=['post'], url_path='process-log')
    def add_process_log(self, request, pk=None):
        doc = self.get_object()
        serializer = ProcessLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        doc.add_process_log(data['action'], request.user, data.get('note', ''))
        return Response(VehicleDocumentSerializer(doc).data)

    def perform_destroy(self, instance):
        storage.delete(instance.file_path)
        instance.delete()
