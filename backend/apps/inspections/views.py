from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import FilterSet
from .models import InspectionReport, InspectionStatus
from .serializers import (
    InspectionReportSerializer, VerifyInspectionSerializer,
)
from apps.users.permissions import IsAppraiserOrManager, IsManager


class InspectionFilter(FilterSet):
    class Meta:
        model = InspectionReport
        fields = ['status', 'verified', 'inspector', 'vehicle']


class InspectionReportViewSet(viewsets.ModelViewSet):
    queryset = InspectionReport.objects.select_related(
        'vehicle', 'inspector', 'verified_by'
    ).prefetch_related('items').all()
    serializer_class = InspectionReportSerializer
    filterset_class = InspectionFilter
    search_fields = ['report_no', 'vehicle__vin', 'vehicle__brand', 'vehicle__model']
    ordering_fields = ['created_at', 'inspection_date']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [viewsets.permissions.IsAuthenticated()]
        if self.action in ['verify']:
            return [IsManager()]
        return [IsAppraiserOrManager()]

    def perform_create(self, serializer):
        if not serializer.validated_data.get('inspector'):
            serializer.save(inspector=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        report = self.get_object()
        serializer = VerifyInspectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verified = serializer.validated_data['verified']
        report.verified = verified
        report.verified_by = request.user
        report.verified_at = timezone.now()
        report.status = InspectionStatus.COMPLETED
        report.save()

        if verified:
            vehicle = report.vehicle
            if vehicle.status == 'pending_inspection':
                vehicle.status = 'pending_preparation'
                vehicle.save()

        return Response(InspectionReportSerializer(report).data)
