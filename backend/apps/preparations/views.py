from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import FilterSet
from .models import PreparationOrder, PrepStatus
from .serializers import PreparationOrderSerializer, VerifyPrepSerializer
from apps.users.permissions import IsAppraiserOrManager, IsManager


class PreparationFilter(FilterSet):
    class Meta:
        model = PreparationOrder
        fields = ['status', 'verified', 'handler', 'vehicle']


class PreparationOrderViewSet(viewsets.ModelViewSet):
    queryset = PreparationOrder.objects.select_related(
        'vehicle', 'handler', 'verified_by'
    ).prefetch_related('items').all()
    serializer_class = PreparationOrderSerializer
    filterset_class = PreparationFilter
    search_fields = ['order_no', 'vehicle__vin', 'vehicle__brand', 'vehicle__model']
    ordering_fields = ['created_at', 'start_date', 'end_date']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [viewsets.permissions.IsAuthenticated()]
        if self.action in ['verify']:
            return [IsManager()]
        return [IsAppraiserOrManager()]

    def perform_create(self, serializer):
        if not serializer.validated_data.get('handler'):
            serializer.save(handler=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        order = self.get_object()
        serializer = VerifyPrepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verified = serializer.validated_data['verified']
        order.verified = verified
        order.verified_by = request.user
        order.verified_at = timezone.now()
        if verified:
            order.status = PrepStatus.COMPLETED
            order.actual_cost = sum(
                item.actual_cost for item in order.items.all()
            )
        order.save()

        if verified:
            vehicle = order.vehicle
            if vehicle.status == 'pending_preparation':
                vehicle.status = 'pending_testdrive'
                vehicle.save()

        return Response(PreparationOrderSerializer(order).data)
