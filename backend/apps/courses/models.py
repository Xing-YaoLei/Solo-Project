from django.db import models
from apps.users.models import User


class Course(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_ACTIVE = 'active'
    STATUS_ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_ACTIVE, '进行中'),
        (STATUS_ARCHIVED, '已归档'),
    ]

    CATEGORY_CHOICES = [
        ('math', '数学'),
        ('english', '英语'),
        ('chinese', '语文'),
        ('physics', '物理'),
        ('chemistry', '化学'),
        ('programming', '编程'),
        ('art', '艺术'),
        ('other', '其他'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    total_hours = models.IntegerField(default=0)
    total_chapters = models.IntegerField(default=0)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='teaching_courses',
                                limit_choices_to={'role': 'teacher'})
    cover_image = models.ImageField(upload_to='course_covers/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Chapter(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    duration = models.IntegerField(default=0)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chapters'
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.course.name} - {self.title}'


class Enrollment(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_DROPPED = 'dropped'
    STATUS_PAUSED = 'paused'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, '进行中'),
        (STATUS_COMPLETED', '已完成'),
        (STATUS_DROPPED', '已退学'),
        (STATUS_PAUSED, '已暂停'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments',
                                limit_choices_to={'role': 'student'})
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    progress = models.IntegerField(default=0)
    enroll_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    renewal_due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['student', 'course']

    def __str__(self):
        return f'{self.student.username} - {self.course.name}'
