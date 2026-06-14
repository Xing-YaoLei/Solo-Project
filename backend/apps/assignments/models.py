from django.db import models
from apps.users.models import User
from apps.courses.models import Course, Chapter


class Assignment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_SUBMITTED = 'submitted'
    STATUS_GRADED = 'graded'
    STATUS_OVERDUE = 'overdue'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待提交'),
        (STATUS_SUBMITTED, '已提交'),
        (STATUS_GRADED, '已批改'),
        (STATUS_OVERDUE, '已逾期'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    max_score = models.IntegerField(default=100)
    file_url = models.URLField(max_length=500, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_assignments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignments'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions',
                                limit_choices_to={'role': 'student'})
    content = models.TextField(blank=True)
    file_url = models.URLField(max_length=500, blank=True)
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                  related_name='graded_submissions',
                                  limit_choices_to={'role__in': ['teacher', 'admin']})
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignment_submissions'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.student.username} - {self.assignment.title}'


class AssignmentChangeLog(models.Model):
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE,
                                   related_name='change_logs')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    change_type = models.CharField(max_length=50)
    field_name = models.CharField(max_length=50, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    reason = models.TextField(blank=True)
    action = models.CharField(max_length=100, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                  related_name='closed_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assignment_change_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.submission.id} - {self.change_type}'
