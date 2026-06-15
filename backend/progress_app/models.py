from django.db import models
from django.utils import timezone
from distributions.models import Distribution
from courses.models import Chapter


class Progress(models.Model):
    distribution = models.OneToOneField(
        Distribution, on_delete=models.CASCADE, related_name="progress", verbose_name="发放记录"
    )
    percentage = models.IntegerField("完成百分比", default=0)
    last_updated = models.DateTimeField("最后更新时间", default=timezone.now)

    class Meta:
        db_table = "progress"
        verbose_name = "学习进度"
        verbose_name_plural = verbose_name
        ordering = ["-last_updated"]
        indexes = [
            models.Index(fields=["last_updated"], name="idx_progress_last_updated"),
        ]

    def __str__(self):
        return f"{self.distribution} - {self.percentage}%"


class ChapterCompletion(models.Model):
    progress = models.ForeignKey(
        Progress, on_delete=models.CASCADE, related_name="chapter_completions", verbose_name="学习进度"
    )
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="completions", verbose_name="章节"
    )
    completed = models.BooleanField("是否完成", default=False)
    completed_at = models.DateTimeField("完成时间", null=True, blank=True)

    class Meta:
        db_table = "chapter_completion"
        verbose_name = "章节完成记录"
        verbose_name_plural = verbose_name
        unique_together = [("progress", "chapter")]

    def __str__(self):
        status = "已完成" if self.completed else "未完成"
        return f"{self.chapter.name} - {status}"


class Grade(models.Model):
    progress = models.ForeignKey(
        Progress, on_delete=models.CASCADE, related_name="grades", verbose_name="学习进度"
    )
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="grades", verbose_name="章节"
    )
    score = models.IntegerField("成绩")
    feedback = models.TextField("反馈", blank=True, default="")
    graded_by = models.IntegerField("评分人ID", null=True, blank=True)
    graded_at = models.DateTimeField("评分时间", auto_now_add=True)

    class Meta:
        db_table = "grade"
        verbose_name = "成绩"
        verbose_name_plural = verbose_name
        ordering = ["-graded_at"]

    def __str__(self):
        return f"{self.chapter.name} - {self.score}分"
