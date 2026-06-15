from rest_framework import serializers
from students.serializers import StudentSerializer
from materials.serializers import TagSerializer
from .models import Distribution, DistributionTag


class DistributionTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributionTag
        fields = ["distribution", "tag"]


class DistributionSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentSerializer.Meta.model.objects.all(),
        source="student", write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=TagSerializer.Meta.model.objects.all(),
        many=True, write_only=True, source="tags", required=False
    )
    material_title = serializers.CharField(source="material.title", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    risk_level_display = serializers.CharField(source="get_risk_level_display", read_only=True, default=None)

    class Meta:
        model = Distribution
        fields = [
            "id", "material", "material_title", "student", "student_id",
            "status", "status_display", "distributed_at",
            "risk_level", "risk_level_display",
            "tags", "tag_ids",
        ]
        read_only_fields = ["distributed_at"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        distribution = Distribution.objects.create(**validated_data)
        if tags:
            distribution.tags.set(tags)
        return distribution

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class BatchDistributionSerializer(serializers.Serializer):
    material_id = serializers.IntegerField()
    student_ids = serializers.ListField(child=serializers.IntegerField())

    def validate_material_id(self, value):
        from materials.models import Material
        if not Material.objects.filter(id=value).exists():
            raise serializers.ValidationError("教材不存在")
        return value

    def validate_student_ids(self, value):
        from students.models import Student
        existing = set(Student.objects.filter(id__in=value).values_list("id", flat=True))
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(f"学员ID不存在: {missing}")
        return value
