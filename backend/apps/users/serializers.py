from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Role

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'role_display', 'phone', 'employee_id', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name',
                  'role', 'phone', 'employee_id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'role_display', 'phone', 'employee_id', 'permissions']
        read_only_fields = ['id', 'role', 'permissions']

    def get_permissions(self, obj):
        role_perms = {
            Role.APPRAISER: ['vehicle:create', 'vehicle:view', 'inspection:*', 'preparation:view',
                             'document:upload', 'document:view', 'review:conduct'],
            Role.SALES: ['vehicle:view', 'testdrive:*', 'document:view', 'review:view'],
            Role.FINANCE: ['vehicle:view', 'document:view', 'document:upload', 'review:view'],
            Role.MANAGER: ['*'],
        }
        return role_perms.get(obj.role, [])


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
