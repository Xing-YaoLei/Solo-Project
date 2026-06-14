from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'content', 'type', 'related_type', 'related_id',
                  'is_read', 'read_at', 'created_at']
        read_only_fields = ['id', 'created_at']
