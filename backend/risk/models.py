from django.db import models
from distributions.models import Distribution


class RiskRecord(models.Model):
    RISK_LEVEL_CHOICES = [
        ("high", "高"),
        ("medium", "中"),
        ("low", "低"),
    ]

    distribution = models.ForeignKey(
        Distribution, on_delete=models.CASCADE, related_name="risk_records", verbose_name="发放记录"
    )
    risk_level = models.CharField("风险等级", max_length=10, choices=RISK_LEVEL_CHOICES)
    reason = models.TextField("风险原因", blank=True, default="")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        db_table = "risk_record"
        verbose_name = "风险记录"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["risk_level"], name="idx_risk_record_level"),
        ]

    def __str__(self):
        return f"{self.distribution} - {self.get_risk_level_display()}"


class Communication(models.Model):
    COMM_TYPE_CHOICES = [
        ("phone", "电话"),
        ("email", "邮件"),
        ("in_person", "面谈"),
        ("online", "线上"),
    ]

    risk = models.ForeignKey(
        RiskRecord, on_delete=models.CASCADE, related_name="communications", verbose_name="风险记录"
    )
    content = models.TextField("沟通内容")
    comm_type = models.CharField("沟通方式", max_length=20, choices=COMM_TYPE_CHOICES)
    created_by = models.IntegerField("创建人ID", null=True, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "communication"
        verbose_name = "沟通记录"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_comm_type_display()} - {self.content[:20]}"


class ReviewConclusion(models.Model):
    risk = models.ForeignKey(
        RiskRecord, on_delete=models.CASCADE, related_name="review_conclusions", verbose_name="风险记录"
    )
    conclusion = models.TextField("复核结论")
    reviewer_id = models.IntegerField("复核人ID", null=True, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "review_conclusion"
        verbose_name = "复核结论"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.conclusion[:30]
