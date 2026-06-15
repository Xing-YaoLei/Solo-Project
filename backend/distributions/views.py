from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from materials.models import Material, Tag
from students.models import Student
from .models import Distribution
from .serializers import DistributionSerializer, BatchDistributionSerializer


class DistributionViewSet(viewsets.ModelViewSet):
    queryset = Distribution.objects.select_related("material", "student", "material__course").prefetch_related("tags").all()
    serializer_class = DistributionSerializer
    filterset_fields = ["status", "risk_level", "material", "student", "tags"]
    search_fields = ["student__name", "material__title"]

    def get_queryset(self):
        queryset = super().get_queryset()
        exclude_irrelevant = self.request.query_params.get("exclude_irrelevant", "false").lower() in ("true", "1", "yes")
        if exclude_irrelevant:
            queryset = queryset.filter(student__status="active")
        return queryset

    @action(detail=False, methods=["post"], url_path="batch")
    def batch_create(self, request):
        serializer = BatchDistributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material_id = serializer.validated_data["material_id"]
        student_ids = serializer.validated_data["student_ids"]
        material = Material.objects.get(id=material_id)

        distributions = []
        for student_id in student_ids:
            distribution = Distribution.objects.create(
                material_id=material_id,
                student_id=student_id,
                status="pending",
            )
            distribution.tags.set(material.tags.all())
            distributions.append(distribution)

        result_serializer = DistributionSerializer(distributions, many=True)
        return Response(
            {"created_count": len(distributions), "distributions": result_serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from django.db.models import Count
        qs = Distribution.objects.all()
        exclude_irrelevant = request.query_params.get("exclude_irrelevant", "false").lower() in ("true", "1", "yes")
        if exclude_irrelevant:
            qs = qs.filter(student__status="active")
        stats = qs.values("status").annotate(count=Count("id"))
        result = {item["status"]: item["count"] for item in stats}
        for key, _ in Distribution.STATUS_CHOICES:
            result.setdefault(key, 0)
        return Response(result)
