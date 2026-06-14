from django.db import models
from apps.users.models import User


class Notification(models.Model):
    TYPE_SYSTEM = 'system'
    TYPE_REMINDER = 'reminder'
    TYPE_FOLLOWUP = 'followup'
    TYPE_ASSIGNMENT = 'assignment'

    TYPE_CHOICES = [
        (TYPE_SYSTEM, '系统通知'),
        (TYPE_REMINDER, '提醒通知'),
        (TYPE_FOLLOWUP, '跟进通知'),
        (TYPE_ASSIGNMENT, '作业通知'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_SYSTEM)
    related_type = models.CharField(max_length=50, blank=True)
    related_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.title}'
