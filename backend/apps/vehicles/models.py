from django.db import models
from django.conf import settings
from django.utils import timezone


class VehicleStatus(models.TextChoices):
    PENDING_EVALUATION = 'pending_evaluation', '待评估'
    PENDING_INSPECTION = 'pending_inspection', '待检测'
    PENDING_PREPARATION = 'pending_preparation', '待整备'
    PENDING_TESTDRIVE = 'pending_testdrive', '待试驾'
    PENDING_REVIEW = 'pending_review', '待审核'
    LISTED = 'listed', '已上架'
    SOLD = 'sold', '已售出'
    OFF_SHELF = 'off_shelf', '已下架'
    REJECTED = 'rejected', '审核驳回'


class ReviewStatus(models.TextChoices):
    PENDING = 'pending', '待复核'
    PASS = 'pass', '复核通过'
    REJECT = 'reject', '资料缺失'
    SUPPLEMENTED = 'supplemented', '已补充待再审'


class DocumentType(models.TextChoices):
    REGISTRATION_CERT = 'registration_cert', '登记证书'
    DRIVING_LICENSE = 'driving_license', '行驶证'
    INSURANCE = 'insurance', '保险单'
    MAINTENANCE_RECORD = 'maintenance_record', '保养记录'
    KEYS = 'keys', '车钥匙'
    INVOICE = 'invoice', '购车发票'
    OTHER = 'other', '其他'


class FuelType(models.TextChoices):
    GASOLINE = 'gasoline', '汽油'
    DIESEL = 'diesel', '柴油'
    HYBRID = 'hybrid', '混动'
    ELECTRIC = 'electric', '纯电'
    OTHER = 'other', '其他'


class Transmission(models.TextChoices):
    MANUAL = 'manual', '手动'
    AUTOMATIC = 'automatic', '自动'
    CVT = 'cvt', 'CVT'
    DUAL_CLUTCH = 'dual_clutch', '双离合'


class Vehicle(models.Model):
    vin = models.CharField(max_length=17, unique=True, verbose_name='车架号/VIN')
    plate_number = models.CharField(max_length=20, blank=True, verbose_name='车牌号')
    brand = models.CharField(max_length=100, verbose_name='品牌')
    model = models.CharField(max_length=100, verbose_name='车型')
    year = models.IntegerField(verbose_name='年款')
    color = models.CharField(max_length=50, blank=True, verbose_name='颜色')
    mileage = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='公里数(km)')
    displacement = models.CharField(max_length=50, blank=True, verbose_name='排量')
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices, default=FuelType.GASOLINE, verbose_name='燃料类型')
    transmission = models.CharField(max_length=20, choices=Transmission.choices, default=Transmission.AUTOMATIC, verbose_name='变速箱')
    first_register_date = models.DateField(blank=True, null=True, verbose_name='首次上牌日期')
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='收车价(元)')
    expected_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='期望售价(元)')
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='实际售价(元)')
    status = models.CharField(max_length=30, choices=VehicleStatus.choices, default=VehicleStatus.PENDING_EVALUATION, verbose_name='车源状态')
    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING, verbose_name='复核状态')
    source = models.CharField(max_length=100, blank=True, verbose_name='车源来源')
    owner_name = models.CharField(max_length=50, blank=True, verbose_name='原车主姓名')
    owner_phone = models.CharField(max_length=20, blank=True, verbose_name='原车主电话')
    description = models.TextField(blank=True, verbose_name='车辆描述')
    remark = models.TextField(blank=True, verbose_name='备注')

    appraiser = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='appraised_vehicles', verbose_name='评估师'
    )
    salesperson = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sold_vehicles', verbose_name='负责销售'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_vehicles', verbose_name='创建人'
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    listed_at = models.DateTimeField(null=True, blank=True, verbose_name='上架时间')
    sold_at = models.DateTimeField(null=True, blank=True, verbose_name='售出时间')

    class Meta:
        verbose_name = '车源/车辆档案'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.brand} {self.model} ({self.vin[-6:]})'

    @property
    def inventory_days(self):
        end = self.sold_at or timezone.now()
        return (end - self.created_at).days

    @property
    def document_status(self):
        from apps.documents.models import VehicleDocument
        required = [
            DocumentType.REGISTRATION_CERT,
            DocumentType.DRIVING_LICENSE,
            DocumentType.INSURANCE,
        ]
        existed = set(
            VehicleDocument.objects.filter(vehicle=self).values_list('document_type', flat=True)
        )
        missing = [t for t in required if t not in existed]
        return {
            'complete': len(missing) == 0,
            'missing_count': len(missing),
            'missing_types': missing,
        }

    @property
    def stage_completion(self):
        from apps.inspections.models import InspectionReport
        from apps.preparations.models import PreparationOrder
        from apps.testdrives.models import TestDriveRecord
        stages = {
            'evaluation': self.appraiser_id is not None and self.purchase_price is not None,
            'inspection': InspectionReport.objects.filter(vehicle=self, verified=True).exists(),
            'preparation': PreparationOrder.objects.filter(vehicle=self, status='completed').exists(),
            'testdrive': TestDriveRecord.objects.filter(vehicle=self).exists(),
        }
        total = len(stages)
        done = sum(1 for v in stages.values() if v)
        return {
            'total': total,
            'done': done,
            'percentage': round(done / total * 100, 1) if total else 0,
            'stages': stages,
        }


class ReviewRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='review_records', verbose_name='车源')
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='reviews', verbose_name='复核人'
    )
    status = models.CharField(max_length=20, choices=ReviewStatus.choices, verbose_name='复核结论')
    comment = models.TextField(blank=True, verbose_name='复核意见')
    missing_items = models.JSONField(default=list, blank=True, verbose_name='缺失材料列表')
    conclusion = models.TextField(blank=True, verbose_name='关闭结论')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')

    class Meta:
        verbose_name = '复核记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.vehicle} - {self.get_status_display()}'


class StatusChangeLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='status_logs', verbose_name='车源')
    from_status = models.CharField(max_length=30, choices=VehicleStatus.choices, verbose_name='原状态')
    to_status = models.CharField(max_length=30, choices=VehicleStatus.choices, verbose_name='新状态')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='status_changes', verbose_name='操作人'
    )
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='操作时间')

    class Meta:
        verbose_name = '状态变更日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
