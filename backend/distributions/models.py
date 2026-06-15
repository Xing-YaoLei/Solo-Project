from django.db import models
from materials.models import Tag, Material
from students.models import Student


class Distribution(models.Model):
    STATUS_CHOICES = [
        ("pending", "待发放"),
        ("following", "待跟进"),
        ("reviewing", "待复核"),
        ("completed", "已完成"),
    ]

    RISK_LEVEL_CHOICES = [
        ("high", "高"),
        ("medium", "中"),
        ("low", "低"),
    ]

    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="distributions", verbose_name="教材"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="distributions", verbose_name="学员"
    )
    status = models.CharField("状态", max_length=20, choices=STATUS_CHOICES, default="pending")
    distributed_at = models.DateTimeField("发放时间", auto_now_add=True)
    risk_level = models.CharField(
        "风险等级", max_length=10, choices=RISK_LEVEL_CHOICES, null=True, blank=True
    )
    tags = models.ManyToManyField(Tag, through="DistributionTag", related_name="distributions", verbose_name="标签")

    class Meta:
        db_table = "distribution"
        verbose_name = "发放记录"
        verbose_name_plural = verbose_name
        ordering = ["-distributed_at"]
        indexes = [
            models.Index(fields=["status"], name="idx_distribution_status"),
            models.Index(fields=["risk_level"], name="idx_distribution_risk"),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.material.title} ({self.get_status_display()})"


class DistributionTag(models.Model):
    distribution = models.ForeignKey(Distribution, on_delete=models.CASCADE, verbose_name="发放记录")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, verbose_name="标签")

    class Meta:
        db_table = "distribution_tags"
        verbose_name = "发放记录标签"
        verbose_name_plural = verbose_name
        unique_together = [("distribution", "tag")]

    def __str__(self):
        return f"{self.distribution.id} - {self.tag.name}"
