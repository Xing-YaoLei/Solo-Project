from rest_framework import serializers
from .models import User, StudentProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'avatar']
        read_only_fields = ['id']


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    counselor_name = serializers.CharField(source='counselor.username', read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'user_id', 'grade', 'school', 'parent_name', 'parent_phone',
                  'address', 'enroll_date', 'counselor', 'counselor_name']


class UserDetailSerializer(UserSerializer):
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['student_profile']
