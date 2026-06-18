from django.db import models
from django.conf import settings
from django.utils import timezone


class InspectionStatus(models.TextChoices):
    PENDING = 'pending', '待检测'
    IN_PROGRESS = 'in_progress', '检测中'
    COMPLETED = 'completed', '已完成'


class InspectionItem(models.TextChoices):
    EXTERIOR = 'exterior', '外观'
    INTERIOR = 'interior', '内饰'
    ENGINE = 'engine', '发动机'
    CHASSIS = 'chassis', '底盘'
    ELECTRIC = 'electric', '电器系统'
    TIRES = 'tires', '轮胎'
    BRAKES = 'brakes', '制动系统'
    SUSPENSION = 'suspension', '悬挂系统'
    AIRBAG = 'airbag', '安全气囊'
    ACCIDENT = 'accident', '事故痕迹'
    WATER_DAMAGE = 'water_damage', '泡水痕迹'
    FIRE_DAMAGE = 'fire_damage', '火烧痕迹'


class ConditionRating(models.TextChoices):
    EXCELLENT = 'excellent', '优秀'
    GOOD = 'good', '良好'
    AVERAGE = 'average', '一般'
    POOR = 'poor', '较差'
    BAD = 'bad', '严重'


class InspectionReport(models.Model):
    vehicle = models.OneToOneField(
        'vehicles.Vehicle', on_delete=models.CASCADE, related_name='inspection_report',
        verbose_name='车源'
    )
    report_no = models.CharField(max_length=50, unique=True, verbose_name='检测单号')
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inspections', verbose_name='检测师'
    )
    status = models.CharField(max_length=20, choices=InspectionStatus.choices, default=InspectionStatus.PENDING, verbose_name='检测状态')
    mileage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='检测时里程')
    overall_rating = models.CharField(max_length=20, choices=ConditionRating.choices, blank=True, verbose_name='综合评级')
    has_accident = models.BooleanField(default=False, verbose_name='是否事故车')
    has_water_damage = models.BooleanField(default=False, verbose_name='是否泡水车')
    has_fire_damage = models.BooleanField(default=False, verbose_name='是否火烧车')
    has_structural_damage = models.BooleanField(default=False, verbose_name='是否结构性损伤')
    general_condition = models.TextField(blank=True, verbose_name='车况总结')
    issues = models.TextField(blank=True, verbose_name='存在问题')
    suggestions = models.TextField(blank=True, verbose_name='建议')
    verified = models.BooleanField(default=False, verbose_name='是否已复核')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_inspections', verbose_name='复核人'
    )
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='复核时间')
    inspection_date = models.DateField(default=timezone.now, verbose_name='检测日期')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '检测报告'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.report_no} - {self.vehicle}'


class InspectionItemResult(models.Model):
    report = models.ForeignKey(InspectionReport, on_delete=models.CASCADE, related_name='items', verbose_name='检测报告')
    item = models.CharField(max_length=30, choices=InspectionItem.choices, verbose_name='检测项')
    rating = models.CharField(max_length=20, choices=ConditionRating.choices, default=ConditionRating.GOOD, verbose_name='评级')
    description = models.TextField(blank=True, verbose_name='详细描述')
    photos = models.JSONField(default=list, blank=True, verbose_name='照片列表')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')

    class Meta:
        verbose_name = '检测项结果'
        verbose_name_plural = verbose_name
        unique_together = [['report', 'item']]

    def __str__(self):
        return f'{self.get_item_display()} - {self.get_rating_display()}'
