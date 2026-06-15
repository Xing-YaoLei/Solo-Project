from django.db import models
from students.models import Student


class ReminderRule(models.Model):
    CONDITION_TYPE_CHOICES = [
        ("progress_below", "进度低于"),
        ("no_update_days", "未更新天数"),
        ("grade_below", "成绩低于"),
    ]

    REMIND_METHOD_CHOICES = [
        ("in_app", "站内"),
        ("email", "邮件"),
        ("both", "站内+邮件"),
    ]

    name = models.CharField("规则名称", max_length=200)
    condition_type = models.CharField("触发条件类型", max_length=50, choices=CONDITION_TYPE_CHOICES)
    threshold = models.IntegerField("阈值")
    remind_method = models.CharField("提醒方式", max_length=20, choices=REMIND_METHOD_CHOICES, default="in_app")
    frequency_days = models.IntegerField("提醒频次（天）", default=7)
    is_active = models.BooleanField("是否启用", default=True)

    class Meta:
        db_table = "reminder_rule"
        verbose_name = "提醒规则"
        verbose_name_plural = verbose_name
        ordering = ["id"]

    def __str__(self):
        return self.name


class ReminderLog(models.Model):
    rule = models.ForeignKey(
        ReminderRule, on_delete=models.CASCADE, related_name="logs", verbose_name="提醒规则"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="reminder_logs", verbose_name="学员"
    )
    message = models.TextField("提醒内容")
    sent_at = models.DateTimeField("发送时间", auto_now_add=True)
    is_read = models.BooleanField("是否已读", default=False)

    class Meta:
        db_table = "reminder_log"
        verbose_name = "提醒记录"
        verbose_name_plural = verbose_name
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["student_id"], name="idx_reminder_log_student"),
            models.Index(fields=["is_read"], name="idx_reminder_log_read"),
        ]

    def __str__(self):
        return f"{self.rule.name} - {self.student.name}"
