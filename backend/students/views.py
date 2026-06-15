from rest_framework import viewsets
from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filterset_fields = ["class_name", "status"]
    search_fields = ["name", "contact"]

    def get_queryset(self):
        queryset = super().get_queryset()
        exclude_irrelevant = self.request.query_params.get("exclude_irrelevant", "false").lower() in ("true", "1", "yes")
        if exclude_irrelevant:
            queryset = queryset.filter(status="active")
        return queryset
