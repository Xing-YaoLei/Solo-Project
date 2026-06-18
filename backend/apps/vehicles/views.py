from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, NumberFilter
from .models import Vehicle, VehicleStatus, ReviewStatus, ReviewRecord, StatusChangeLog, DocumentType
from .serializers import (
    VehicleListSerializer, VehicleSerializer, ReviewRecordSerializer,
    StatusChangeLogSerializer, StatusChangeSerializer, BatchActionSerializer,
)
from apps.users.models import Role
from apps.users.permissions import IsManager, IsAppraiserOrManager, IsSalesOrManager


class VehicleFilter(FilterSet):
    min_inventory_days = NumberFilter(method='filter_inventory_days_gte')
    max_inventory_days = NumberFilter(method='filter_inventory_days_lte')
    created_from = CharFilter(method='filter_created_from')
    created_to = CharFilter(method='filter_created_to')
    has_missing_docs = CharFilter(method='filter_missing_docs')

    class Meta:
        model = Vehicle
        fields = ['status', 'review_status', 'brand', 'year', 'fuel_type',
                  'appraiser', 'salesperson', 'created_by']

    def filter_inventory_days_gte(self, queryset, name, value):
        threshold = timezone.now() - timezone.timedelta(days=int(value))
        sold_q = Q(sold_at__isnull=False) & Q(sold_at__gte=threshold)
        unsold_q = Q(sold_at__isnull=True) & Q(created_at__lte=threshold)
        return queryset.filter(sold_q | unsold_q)

    def filter_inventory_days_lte(self, queryset, name, value):
        threshold = timezone.now() - timezone.timedelta(days=int(value))
        sold_q = Q(sold_at__isnull=False) & Q(sold_at__lte=threshold)
        unsold_q = Q(sold_at__isnull=True) & Q(created_at__gte=threshold)
        return queryset.filter(sold_q | unsold_q)

    def filter_created_from(self, queryset, name, value):
        return queryset.filter(created_at__date__gte=value)

    def filter_created_to(self, queryset, name, value):
        return queryset.filter(created_at__date__lte=value)

    def filter_missing_docs(self, queryset, name, value):
        if value.lower() in ['true', '1', 'yes']:
            required = [DocumentType.REGISTRATION_CERT, DocumentType.DRIVING_LICENSE, DocumentType.INSURANCE]
            return queryset.annotate(
                reg_count=Count('documents', filter=Q(documents__document_type=DocumentType.REGISTRATION_CERT)),
                lic_count=Count('documents', filter=Q(documents__document_type=DocumentType.DRIVING_LICENSE)),
                ins_count=Count('documents', filter=Q(documents__document_type=DocumentType.INSURANCE)),
            ).exclude(Q(reg_count__gt=0) & Q(lic_count__gt=0) & Q(ins_count__gt=0))
        return queryset


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related('appraiser', 'salesperson', 'created_by').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilter
    search_fields = ['vin', 'plate_number', 'brand', 'model', 'owner_name', 'owner_phone']
    ordering_fields = ['created_at', 'updated_at', 'mileage', 'year', 'expected_price']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'documents', 'inspection', 'preparations',
                           'testdrives', 'review_records', 'status_logs']:
            return [IsAuthenticated()]
        if self.action in ['create']:
            return [IsAppraiserOrManager()]
        if self.action in ['batch_action', 'change_status']:
            return [IsManager()]
        if self.action in ['review', 'export']:
            return [IsAppraiserOrManager()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        with transaction.atomic():
            serializer.save()
            if old_status != new_status:
                StatusChangeLog.objects.create(
                    vehicle=instance,
                    from_status=old_status,
                    to_status=new_status,
                    operator=self.request.user,
                )
                if new_status == VehicleStatus.LISTED and not instance.listed_at:
                    instance.listed_at = timezone.now()
                    instance.save(update_fields=['listed_at'])
                if new_status == VehicleStatus.SOLD and not instance.sold_at:
                    instance.sold_at = timezone.now()
                    instance.save(update_fields=['sold_at'])

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        vehicle = self.get_object()
        serializer = StatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['to_status']
        remark = serializer.validated_data.get('remark', '')
        old_status = vehicle.status

        with transaction.atomic():
            vehicle.status = new_status
            if new_status == VehicleStatus.LISTED and not vehicle.listed_at:
                vehicle.listed_at = timezone.now()
            if new_status == VehicleStatus.SOLD and not vehicle.sold_at:
                vehicle.sold_at = timezone.now()
            vehicle.save()
            StatusChangeLog.objects.create(
                vehicle=vehicle,
                from_status=old_status,
                to_status=new_status,
                operator=request.user,
                remark=remark,
            )
        return Response(VehicleSerializer(vehicle).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        vehicle = self.get_object()
        serializer = ReviewRecordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(vehicle=vehicle)
        return Response(VehicleSerializer(vehicle).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='review-records')
    def review_records(self, request, pk=None):
        vehicle = self.get_object()
        records = vehicle.review_records.select_related('reviewer').all()
        return Response(ReviewRecordSerializer(records, many=True).data)

    @action(detail=True, methods=['get'], url_path='status-logs')
    def status_logs(self, request, pk=None):
        vehicle = self.get_object()
        logs = vehicle.status_logs.select_related('operator').all()
        return Response(StatusChangeLogSerializer(logs, many=True).data)

    @action(detail=False, methods=['post'], url_path='batch-action')
    def batch_action(self, request):
        serializer = BatchActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        ids = data['vehicle_ids']
        action = data['action']
        remark = data.get('remark', '')
        target_user_id = data.get('target_user_id')

        qs = Vehicle.objects.filter(id__in=ids)
        results = {'success': 0, 'failed': 0, 'failed_ids': []}

        with transaction.atomic():
            for vehicle in qs:
                try:
                    old_status = vehicle.status
                    if action == 'set_review_pass':
                        vehicle.review_status = ReviewStatus.PASS
                        vehicle.status = VehicleStatus.LISTED
                        vehicle.listed_at = vehicle.listed_at or timezone.now()
                    elif action == 'set_review_reject':
                        vehicle.review_status = ReviewStatus.REJECT
                    elif action == 'assign_appraiser':
                        vehicle.appraiser_id = target_user_id
                    elif action == 'assign_salesperson':
                        vehicle.salesperson_id = target_user_id
                    elif action == 'advance_stage':
                        flow = [
                            VehicleStatus.PENDING_EVALUATION,
                            VehicleStatus.PENDING_INSPECTION,
                            VehicleStatus.PENDING_PREPARATION,
                            VehicleStatus.PENDING_TESTDRIVE,
                            VehicleStatus.PENDING_REVIEW,
                            VehicleStatus.LISTED,
                        ]
                        if old_status in flow:
                            idx = flow.index(old_status)
                            if idx + 1 < len(flow):
                                vehicle.status = flow[idx + 1]
                    vehicle.save()
                    if old_status != vehicle.status:
                        StatusChangeLog.objects.create(
                            vehicle=vehicle,
                            from_status=old_status,
                            to_status=vehicle.status,
                            operator=request.user,
                            remark=remark,
                        )
                    results['success'] += 1
                except Exception:
                    results['failed'] += 1
                    results['failed_ids'].append(vehicle.id)

        return Response(results)

    @action(detail=False, methods=['get'], url_path='missing-documents')
    def missing_documents(self, request):
        required = [DocumentType.REGISTRATION_CERT, DocumentType.DRIVING_LICENSE, DocumentType.INSURANCE]
        qs = Vehicle.objects.annotate(
            reg_count=Count('documents', filter=Q(documents__document_type=DocumentType.REGISTRATION_CERT)),
            lic_count=Count('documents', filter=Q(documents__document_type=DocumentType.DRIVING_LICENSE)),
            ins_count=Count('documents', filter=Q(documents__document_type=DocumentType.INSURANCE)),
        ).exclude(Q(reg_count__gt=0) & Q(lic_count__gt=0) & Q(ins_count__gt=0))
        page = self.paginate_queryset(qs)
        serializer = VehicleListSerializer(page or qs, many=True)
        data = []
        for item in serializer.data:
            vid = item['id']
            existing = set(
                Vehicle.objects.get(id=vid).documents.values_list('document_type', flat=True)
            )
            item['missing_doc_types'] = [t for t in required if t not in existing]
            data.append(item)
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

    @action(detail=True, methods=['post'], url_path='mark-documents-supplemented')
    def mark_documents_supplemented(self, request, pk=None):
        vehicle = self.get_object()
        doc_types = request.data.get('document_types', [])
        remark = request.data.get('remark', '')
        from apps.documents.models import VehicleDocument
        updated = 0
        with transaction.atomic():
            for doc_type in doc_types:
                docs = VehicleDocument.objects.filter(
                    vehicle=vehicle, document_type=doc_type, is_closed=False
                )
                for doc in docs:
                    doc.add_process_log('supplemented', operator=request.user, note=remark or '资料已补充')
                    updated += 1
            if doc_types:
                vehicle.review_status = ReviewStatus.SUPPLEMENTED
                vehicle.save(update_fields=['review_status'])
        return Response({
            'vehicle_id': vehicle.id,
            'updated_documents': updated,
            'supplemented_types': doc_types,
        })

    @action(detail=False, methods=['post'], url_path='batch-notify-missing')
    def batch_notify_missing(self, request):
        vehicle_ids = request.data.get('vehicle_ids', [])
        vehicles = Vehicle.objects.filter(id__in=vehicle_ids)
        results = []
        for vehicle in vehicles:
            missing = vehicle.document_status.get('missing_types', [])
            handler = vehicle.appraiser or vehicle.salesperson or vehicle.created_by
            results.append({
                'vehicle_id': vehicle.id,
                'vin': vehicle.vin,
                'missing_types': missing,
                'notified_user': handler.username if handler else None,
                'notified_user_id': handler.id if handler else None,
            })
        return Response({
            'notified_count': len(results),
            'details': results,
        })

    @action(detail=False, methods=['post'], url_path='batch-assign')
    def batch_assign(self, request):
        vehicle_ids = request.data.get('vehicle_ids', [])
        handler_id = request.data.get('handler_id')
        notify_types = request.data.get('notify_types', ['system'])
        remark = request.data.get('remark', '')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            handler = User.objects.get(id=handler_id)
        except User.DoesNotExist:
            return Response({'error': '处理人不存在'}, status=status.HTTP_400_BAD_REQUEST)
        vehicles = Vehicle.objects.filter(id__in=vehicle_ids)
        assigned = 0
        with transaction.atomic():
            for vehicle in vehicles:
                vehicle.appraiser_id = handler_id
                vehicle.save(update_fields=['appraiser'])
                StatusChangeLog.objects.create(
                    vehicle=vehicle,
                    from_status=vehicle.status,
                    to_status=vehicle.status,
                    operator=request.user,
                    remark=f'分配给 {handler.username}: {remark}',
                )
                assigned += 1
        return Response({
            'assigned_count': assigned,
            'handler': handler.username,
            'notify_types': notify_types,
        })


class ReviewRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReviewRecord.objects.select_related('vehicle', 'reviewer').all()
    serializer_class = ReviewRecordSerializer
    filterset_fields = ['status', 'reviewer']
    search_fields = ['vehicle__vin', 'vehicle__brand', 'vehicle__model']
