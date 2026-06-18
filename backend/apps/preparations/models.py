from django.db import models
from django.conf import settings
from django.utils import timezone


class PrepStatus(models.TextChoices):
    PENDING = 'pending', '待整备'
    IN_PROGRESS = 'in_progress', '整备中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class PrepCategory(models.TextChoices):
    APPEARANCE = 'appearance', '外观整备'
    INTERIOR = 'interior', '内饰清洁'
    MECHANICAL = 'mechanical', '机械维修'
    ELECTRIC = 'electric', '电气维修'
    PAINT = 'paint', '喷漆修复'
    TIRE = 'tire', '轮胎更换'
    DETAILING = 'detailing', '精细美容'
    OTHER = 'other', '其他'


class PreparationOrder(models.Model):
    vehicle = models.ForeignKey(
        'vehicles.Vehicle', on_delete=models.CASCADE, related_name='preparation_orders',
        verbose_name='车源'
    )
    order_no = models.CharField(max_length=50, unique=True, verbose_name='整备单号')
    status = models.CharField(max_length=20, choices=PrepStatus.choices, default=PrepStatus.PENDING, verbose_name='整备状态')
    handler = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='preparations', verbose_name='整备负责人'
    )
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='预估费用(元)')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='实际费用(元)')
    start_date = models.DateField(null=True, blank=True, verbose_name='开始日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='完成日期')
    remark = models.TextField(blank=True, verbose_name='备注')
    verified = models.BooleanField(default=False, verbose_name='是否已复核')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_preparations', verbose_name='复核人'
    )
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='复核时间')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '整备工单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no} - {self.vehicle}'


class PreparationItem(models.Model):
    order = models.ForeignKey(PreparationOrder, on_delete=models.CASCADE, related_name='items', verbose_name='整备工单')
    category = models.CharField(max_length=30, choices=PrepCategory.choices, verbose_name='整备类别')
    name = models.CharField(max_length=200, verbose_name='整备项目')
    description = models.TextField(blank=True, verbose_name='项目描述')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='预估费用(元)')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='实际费用(元)')
    is_done = models.BooleanField(default=False, verbose_name='是否完成')
    done_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    photos = models.JSONField(default=list, blank=True, verbose_name='前后对比照片')

    class Meta:
        verbose_name = '整备项目'
        verbose_name_plural = verbose_name
        ordering = ['id']

    def __str__(self):
        return self.name
