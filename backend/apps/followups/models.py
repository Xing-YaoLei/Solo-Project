from django.db import models
from apps.users.models import User
from apps.courses.models import Enrollment


class ReminderRule(models.Model):
    TRIGGER_PROGRESS_BEHIND = 'progress_behind'
    TRIGGER_DUE_DATE = 'due_date'
    TRIGGER_SCORE_LOW = 'score_low'
    TRIGGER_INACTIVITY = 'inactivity'

    TRIGGER_CHOICES = [
        (TRIGGER_PROGRESS_BEHIND, '进度落后'),
        (TRIGGER_DUE_DATE, '续费到期'),
        (TRIGGER_SCORE_LOW, '成绩偏低'),
        (TRIGGER_INACTIVITY, '长期不活跃'),
    ]

    name = models.CharField(max_length=100)
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_CHOICES)
    threshold = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    notify_counselor = models.BooleanField(default=True)
    notify_teacher = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reminder_rules'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class RenewalFollowUp(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_CLOSED = 'closed'
    STATUS_RENEWED = 'renewed'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待跟进'),
        (STATUS_IN_PROGRESS, '跟进中'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_CLOSED, '已关闭'),
        (STATUS_RENEWED, '已续费'),
    ]

    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, '低'),
        (PRIORITY_MEDIUM, '中'),
        (PRIORITY_HIGH, '高'),
        (PRIORITY_URGENT, '紧急'),
    ]

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='follow_ups')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_follow_ups',
                                limit_choices_to={'role': 'student'})
    counselor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                  related_name='counselor_follow_ups',
                                  limit_choices_to={'role__in': ['counselor', 'admin']})
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    reminder_rule = models.ForeignKey(ReminderRule, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='follow_ups')
    reason = models.TextField(blank=True)
    next_follow_up_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_follow_ups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'renewal_follow_ups'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.username} - 续费跟进'


class FollowUpRecord(models.Model):
    METHOD_CALL = 'call'
    METHOD_WECHAT = 'wechat'
    METHOD_VISIT = 'visit'
    METHOD_OTHER = 'other'

    METHOD_CHOICES = [
        (METHOD_CALL, '电话'),
        (METHOD_WECHAT, '微信'),
        (METHOD_VISIT, '家访'),
        (METHOD_OTHER, '其他'),
    ]

    follow_up = models.ForeignKey(RenewalFollowUp, on_delete=models.CASCADE, related_name='records')
    content = models.TextField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_OTHER)
    contact_person = models.CharField(max_length=50, blank=True)
    next_action = models.TextField(blank=True)
    next_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follow_up_records'
        ordering = ['-created_at']

    def __str__(self):
        return f'跟进记录 - {self.follow_up.id}'


class ScoreFeedback(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='score_feedbacks')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='score_feedbacks',
                                limit_choices_to={'role': 'student'})
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='score_feedbacks')
    score = models.IntegerField(null=True, blank=True)
    max_score = models.IntegerField(default=100)
    feedback = models.TextField(blank=True)
    teacher_comments = models.TextField(blank=True)
    improvement_suggestions = models.TextField(blank=True)
    feedback_date = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_feedbacks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'score_feedbacks'
        ordering = ['-feedback_date']

    def __str__(self):
        return f'{self.student.username} - 成绩反馈'
