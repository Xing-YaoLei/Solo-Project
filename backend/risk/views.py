from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import RiskRecord, Communication, ReviewConclusion
from .serializers import (
    RiskRecordSerializer, RiskRecordListSerializer,
    CommunicationSerializer, ReviewConclusionSerializer,
)


class RiskRecordViewSet(viewsets.ModelViewSet):
    queryset = RiskRecord.objects.select_related(
        "distribution", "distribution__student", "distribution__material", "distribution__material__course"
    ).prefetch_related("communications", "review_conclusions").all()
    filterset_fields = ["risk_level", "distribution", "distribution__material__course"]
    search_fields = ["distribution__student__name", "reason"]

    def get_serializer_class(self):
        if self.action == "list":
            return RiskRecordListSerializer
        return RiskRecordSerializer


class CommunicationCreateView(generics.CreateAPIView):
    serializer_class = CommunicationSerializer
    queryset = Communication.objects.all()


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewConclusionSerializer
    queryset = ReviewConclusion.objects.all()
