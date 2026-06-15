from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import ReminderRule, ReminderLog
from .serializers import ReminderRuleSerializer, ReminderLogSerializer


class ReminderRuleViewSet(viewsets.ModelViewSet):
    queryset = ReminderRule.objects.all()
    serializer_class = ReminderRuleSerializer
    filterset_fields = ["condition_type", "is_active"]
    search_fields = ["name"]


class ReminderLogViewSet(viewsets.ModelViewSet):
    queryset = ReminderLog.objects.select_related("rule", "student").all()
    serializer_class = ReminderLogSerializer
    filterset_fields = ["rule", "student", "is_read"]

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        log = self.get_object()
        log.is_read = True
        log.save(update_fields=["is_read"])
        return Response({"id": log.id, "is_read": True})
