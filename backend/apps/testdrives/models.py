from django.db import models
from django.conf import settings
from django.utils import timezone


class TestDriveStatus(models.TextChoices):
    SCHEDULED = 'scheduled', '已预约'
    IN_PROGRESS = 'in_progress', '试驾中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class CustomerIntent(models.TextChoices):
    HIGH = 'high', '高意向'
    MEDIUM = 'medium', '中意向'
    LOW = 'low', '低意向'
    NONE = 'none', '无意向'


class TestDriveRecord(models.Model):
    vehicle = models.ForeignKey(
        'vehicles.Vehicle', on_delete=models.CASCADE, related_name='testdrive_records',
        verbose_name='车源'
    )
    record_no = models.CharField(max_length=50, unique=True, verbose_name='试驾单号')
    salesperson = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='testdrives', verbose_name='负责销售'
    )
    customer_name = models.CharField(max_length=50, verbose_name='客户姓名')
    customer_phone = models.CharField(max_length=20, verbose_name='客户电话')
    customer_id_card = models.CharField(max_length=18, blank=True, verbose_name='客户身份证')
    license_number = models.CharField(max_length=50, blank=True, verbose_name='驾驶证号')
    status = models.CharField(max_length=20, choices=TestDriveStatus.choices, default=TestDriveStatus.SCHEDULED, verbose_name='试驾状态')
    scheduled_at = models.DateTimeField(verbose_name='预约时间')
    start_mileage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='出发里程')
    end_mileage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='返回里程')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='出发时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='返回时间')
    route = models.CharField(max_length=500, blank=True, verbose_name='试驾路线')
    feedback = models.TextField(blank=True, verbose_name='客户反馈')
    brake_feeling = models.CharField(max_length=100, blank=True, verbose_name='制动感受')
    shift_feeling = models.CharField(max_length=100, blank=True, verbose_name='换挡感受')
    ride_comfort = models.CharField(max_length=100, blank=True, verbose_name='乘坐舒适性')
    noise_level = models.CharField(max_length=100, blank=True, verbose_name='噪音水平')
    handling = models.CharField(max_length=100, blank=True, verbose_name='操控性能')
    abnormal_noise = models.TextField(blank=True, verbose_name='异常响声')
    other_issues = models.TextField(blank=True, verbose_name='其他问题')
    purchase_intent = models.CharField(max_length=20, choices=CustomerIntent.choices, blank=True, verbose_name='购车意向')
    expected_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='客户期望价(元)')
    remark = models.TextField(blank=True, verbose_name='备注')
    verified = models.BooleanField(default=False, verbose_name='是否已复核')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_testdrives', verbose_name='复核人'
    )
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='复核时间')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '试驾记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.record_no} - {self.vehicle}'

    @property
    def testdrive_distance(self):
        if self.start_mileage and self.end_mileage:
            return float(self.end_mileage) - float(self.start_mileage)
        return None

    @property
    def testdrive_duration(self):
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds() / 60
        return None
