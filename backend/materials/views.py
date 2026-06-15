from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

    @action(detail=True, methods=["post"], url_path="upload")
    def upload_file(self, request, pk=None):
        material = self.get_object()
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {"error": "未找到上传的文件"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from core.minio_storage import upload_file
            content_type = uploaded_file.content_type or "application/pdf"
            object_name, file_url = upload_file(
                uploaded_file,
                content_type=content_type,
            )
            material.file_url = file_url
            material.file_object = object_name if hasattr(material, "file_object") else None
            material.save()
            return Response({
                "id": material.id,
                "file_url": file_url,
                "file_name": uploaded_file.name,
            })
        except ImportError:
            material.file_url = f"/uploads/{uploaded_file.name}"
            material.save()
            return Response({
                "id": material.id,
                "file_url": material.file_url,
                "file_name": uploaded_file.name,
            })
        except Exception as e:
            return Response(
                {"error": f"上传失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
