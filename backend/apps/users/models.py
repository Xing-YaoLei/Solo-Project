from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_STUDENT = 'student'
    ROLE_TEACHER = 'teacher'
    ROLE_COUNSELOR = 'counselor'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = [
        (ROLE_STUDENT, '学员'),
        (ROLE_TEACHER, '老师'),
        (ROLE_COUNSELOR, '咨询师'),
        (ROLE_ADMIN, '管理员'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class StudentProfile(models.Model):
    GRADE_CHOICES = [
        ('primary_1', '一年级'),
        ('primary_2', '二年级'),
        ('primary_3', '三年级'),
        ('primary_4', '四年级'),
        ('primary_5', '五年级'),
        ('primary_6', '六年级'),
        ('junior_1', '初一'),
        ('junior_2', '初二'),
        ('junior_3', '初三'),
        ('senior_1', '高一'),
        ('senior_2', '高二'),
        ('senior_3', '高三'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    grade = models.CharField(max_length=20, choices=GRADE_CHOICES, blank=True)
    school = models.CharField(max_length=100, blank=True)
    parent_name = models.CharField(max_length=50, blank=True)
    parent_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    enroll_date = models.DateField(null=True, blank=True)
    counselor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        limit_choices_to={'role': 'counselor'}
    )

    class Meta:
        db_table = 'student_profiles'

    def __str__(self):
        return f'{self.user.username} - 学员档案'
