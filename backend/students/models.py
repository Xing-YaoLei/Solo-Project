from django.db import models


class Student(models.Model):
    name = models.CharField("姓名", max_length=100)
    class_name = models.CharField("班级", max_length=100, blank=True, default="")
    contact = models.CharField("联系方式", max_length=50, blank=True, default="")
    guardian_contact = models.CharField("监护人联系方式", max_length=50, blank=True, default="")

    class Meta:
        db_table = "student"
        verbose_name = "学员"
        verbose_name_plural = verbose_name
        ordering = ["id"]

    def __str__(self):
        return self.name
