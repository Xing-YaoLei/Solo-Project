from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, Chapter
from .serializers import CourseSerializer, ChapterSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filterset_fields = ["name"]
    search_fields = ["name", "description"]


class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    filterset_fields = ["course"]
    search_fields = ["name"]
