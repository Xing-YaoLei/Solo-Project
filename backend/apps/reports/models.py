from django.db import models
from apps.users.models import User


class DownloadRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='downloads')
    file_name = models.CharField(max_length=200)
    file_url = models.URLField(max_length=500, blank=True)
    report_type = models.CharField(max_length=50)
    filters = models.JSONField(default=dict, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                     related_name='generated_reports')

    class Meta:
        db_table = 'download_records'
        ordering = ['-generated_at']

    def __str__(self):
        return f'{self.report_type} - {self.file_name}'


class MonthlyReview(models.Model):
    year = models.IntegerField()
    month = models.IntegerField()
    counselor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                  related_name='monthly_reviews',
                                  limit_choices_to={'role__in': ['counselor', 'admin']})
    total_follow_ups = models.IntegerField(default=0)
    completed_follow_ups = models.IntegerField(default=0)
    renewal_count = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    renewal_rate = models.FloatField(default=0.0)
    average_student_progress = models.FloatField(default=0.0)
    total_students = models.IntegerField(default=0)
    summary = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                     related_name='generated_monthly_reviews')

    class Meta:
        db_table = 'monthly_reviews'
        unique_together = ['year', 'month', 'counselor']
        ordering = ['-year', '-month']

    def __str__(self):
        return f'{self.year}年{self.month}月复盘'
