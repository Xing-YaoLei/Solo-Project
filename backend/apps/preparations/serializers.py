from rest_framework import serializers
from .models import PreparationOrder, PreparationItem, PrepStatus, PrepCategory


class PreparationItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = PreparationItem
        fields = '__all__'


class PreparationOrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    handler_info = serializers.SerializerMethodField()
    items = PreparationItemSerializer(many=True, required=False)
    total_estimated = serializers.SerializerMethodField()
    total_actual = serializers.SerializerMethodField()
    done_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()

    class Meta:
        model = PreparationOrder
        fields = '__all__'
        read_only_fields = ['verified_at', 'created_at', 'updated_at']

    def get_handler_info(self, obj):
        if obj.handler:
            return {
                'id': obj.handler.id,
                'username': obj.handler.username,
                'name': f'{obj.handler.first_name}{obj.handler.last_name}'
            }
        return None

    def get_total_estimated(self, obj):
        return obj.items.aggregate(total=models.Sum('estimated_cost'))['total'] or 0

    def get_total_actual(self, obj):
        return obj.items.aggregate(total=models.Sum('actual_cost'))['total'] or 0

    def get_done_count(self, obj):
        return obj.items.filter(is_done=True).count()

    def get_total_count(self, obj):
        return obj.items.count()

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = PreparationOrder.objects.create(**validated_data)
        for item_data in items_data:
            PreparationItem.objects.create(order=order, **item_data)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PreparationItem.objects.create(order=instance, **item_data)
        return instance


class VerifyPrepSerializer(serializers.Serializer):
    verified = serializers.BooleanField(default=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


from django.db import models
