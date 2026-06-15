from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tag, Material
from .serializers import TagSerializer, MaterialSerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    search_fields = ["name"]


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.select_related("course").prefetch_related("tags").all()
    serializer_class = MaterialSerializer
    filterset_fields = ["course", "tags"]
    search_fields = ["title", "description"]
