from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Student
        fields = ["id", "name", "class_name", "contact", "guardian_contact", "status", "status_display"]
