from django.db import models


class Student(models.Model):
    STATUS_CHOICES = [
        ("active", "在读"),
        ("graduated", "已结业"),
        ("transferred", "已转出"),
        ("inactive", "停用"),
    ]

    name = models.CharField("姓名", max_length=100)
    class_name = models.CharField("班级", max_length=100, blank=True, default="")
    contact = models.CharField("联系方式", max_length=50, blank=True, default="")
    guardian_contact = models.CharField("监护人联系方式", max_length=50, blank=True, default="")
    status = models.CharField(
        "状态", max_length=20, choices=STATUS_CHOICES, default="active"
    )

    class Meta:
        db_table = "student"
        verbose_name = "学员"
        verbose_name_plural = verbose_name
        ordering = ["id"]
        indexes = [
            models.Index(fields=["status"], name="idx_student_status"),
        ]

    def __str__(self):
        return self.name
