from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import FilterSet
from .models import TestDriveRecord, TestDriveStatus
from .serializers import TestDriveRecordSerializer, VerifyTestDriveSerializer
from apps.users.permissions import IsSalesOrManager, IsManager


class TestDriveFilter(FilterSet):
    class Meta:
        model = TestDriveRecord
        fields = ['status', 'verified', 'salesperson', 'vehicle', 'purchase_intent']


class TestDriveRecordViewSet(viewsets.ModelViewSet):
    queryset = TestDriveRecord.objects.select_related(
        'vehicle', 'salesperson', 'verified_by'
    ).all()
    serializer_class = TestDriveRecordSerializer
    filterset_class = TestDriveFilter
    search_fields = ['record_no', 'vehicle__vin', 'vehicle__brand',
                     'vehicle__model', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'scheduled_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action in ['verify']:
            return [IsManager()]
        return [IsSalesOrManager()]

    def perform_create(self, serializer):
        if not serializer.validated_data.get('salesperson'):
            serializer.save(salesperson=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        record = self.get_object()
        serializer = VerifyTestDriveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verified = serializer.validated_data['verified']
        record.verified = verified
        record.verified_by = request.user
        record.verified_at = timezone.now()
        if verified:
            record.status = TestDriveStatus.COMPLETED
        record.save()

        if verified:
            vehicle = record.vehicle
            if vehicle.status == 'pending_testdrive':
                vehicle.status = 'pending_review'
                vehicle.save()

        return Response(TestDriveRecordSerializer(record).data)
