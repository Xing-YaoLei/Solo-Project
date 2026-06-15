from django.db import models
from courses.models import Course


class Tag(models.Model):
    name = models.CharField("标签名称", max_length=100, unique=True)
    color = models.CharField("标签颜色", max_length=7, default="#1B3A5C")

    class Meta:
        db_table = "tag"
        verbose_name = "标签"
        verbose_name_plural = verbose_name
        ordering = ["id"]

    def __str__(self):
        return self.name


class Material(models.Model):
    title = models.CharField("教材标题", max_length=300)
    description = models.TextField("教材描述", blank=True, default="")
    file_url = models.CharField("文件地址", max_length=500, blank=True, default="")
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="materials", verbose_name="所属课程"
    )
    tags = models.ManyToManyField(Tag, through="MaterialTag", related_name="materials", verbose_name="标签")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        db_table = "material"
        verbose_name = "教材"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class MaterialTag(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name="教材")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, verbose_name="标签")

    class Meta:
        db_table = "material_tags"
        verbose_name = "教材标签"
        verbose_name_plural = verbose_name
        unique_together = [("material", "tag")]

    def __str__(self):
        return f"{self.material.title} - {self.tag.name}"
