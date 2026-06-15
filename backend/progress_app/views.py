from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Progress, Grade, ChapterCompletion
from .serializers import ProgressSerializer, GradeSerializer, ChapterCompletionSerializer


class ProgressViewSet(viewsets.ModelViewSet):
    queryset = Progress.objects.select_related(
        "distribution", "distribution__student", "distribution__material"
    ).prefetch_related("chapter_completions", "chapter_completions__chapter", "grades").all()
    serializer_class = ProgressSerializer
    filterset_fields = ["distribution", "distribution__student", "distribution__material__course"]
    search_fields = ["distribution__student__name"]


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related("chapter").all()
    serializer_class = GradeSerializer
    filterset_fields = ["progress", "chapter"]


class ChapterCompletionViewSet(viewsets.ModelViewSet):
    queryset = ChapterCompletion.objects.select_related("chapter").all()
    serializer_class = ChapterCompletionSerializer
    filterset_fields = ["progress", "chapter", "completed"]
