from rest_framework import serializers
from .models import Tag, Material, MaterialTag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color"]


class MaterialTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialTag
        fields = ["material", "tag"]


class MaterialSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, source="tags", required=False
    )
    course_name = serializers.CharField(source="course.name", read_only=True, default=None)

    class Meta:
        model = Material
        fields = ["id", "title", "description", "file_url", "course", "course_name", "tags", "tag_ids", "created_at"]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        material = Material.objects.create(**validated_data)
        if tags:
            material.tags.set(tags)
        return material

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance
