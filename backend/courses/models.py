from django.db import models


class Course(models.Model):
    name = models.CharField("课程名称", max_length=200)
    description = models.TextField("课程描述", blank=True, default="")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "course"
        verbose_name = "课程"
        verbose_name_plural = verbose_name
        ordering = ["id"]

    def __str__(self):
        return self.name


class Chapter(models.Model):
    name = models.CharField("章节名称", max_length=200)
    order = models.IntegerField("排序")
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="chapters", verbose_name="所属课程"
    )
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "chapter"
        verbose_name = "章节"
        verbose_name_plural = verbose_name
        ordering = ["course", "order"]

    def __str__(self):
        return f"{self.course.name} - {self.name}"
