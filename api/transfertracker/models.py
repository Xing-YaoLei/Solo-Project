import uuid

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('specialist', '过户专员'),
        ('manager', '门店经理'),
        ('finance', '财务人员'),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='specialist')

    class Meta:
        verbose_name = '用户角色'
        verbose_name_plural = '用户角色'

    def __str__(self):
        return f'{self.user.username} - {self.get_role_display()}'


class TransferRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('review', '待复核'),
        ('completed', '已完成'),
        ('exception', '异常'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_no = models.CharField('合同编号', max_length=50, unique=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    buyer_name = models.CharField('买方姓名', max_length=100)
    buyer_id_no = models.CharField('买方身份证号', max_length=30)
    seller_name = models.CharField('卖方姓名', max_length=100)
    seller_id_no = models.CharField('卖方身份证号', max_length=30)
    transfer_tax = models.DecimalField('过户税费', max_digits=12, decimal_places=2, default=0)
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='assigned_records', verbose_name='负责人')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_records', verbose_name='复核人')
    reviewed_at = models.DateTimeField('复核时间', null=True, blank=True)
    review_note = models.TextField('复核备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '过户记录'
        verbose_name_plural = '过户记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract_no} - {self.get_status_display()}'


class Quotation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(TransferRecord, on_delete=models.CASCADE, related_name='quotations', verbose_name='过户记录')
    price = models.DecimalField('报价金额', max_digits=12, decimal_places=2)
    note = models.TextField('备注', blank=True)
    quoted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='报价人')
    quoted_at = models.DateTimeField('报价时间', auto_now_add=True)

    class Meta:
        verbose_name = '报价记录'
        verbose_name_plural = '报价记录'
        ordering = ['-quoted_at']

    def __str__(self):
        return f'{self.record.contract_no} - ¥{self.price}'


class FinanceDoc(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.OneToOneField(TransferRecord, on_delete=models.CASCADE, related_name='finance_doc', verbose_name='过户记录')
    loan_scheme = models.CharField('贷款方案', max_length=100, blank=True)
    down_payment_ratio = models.DecimalField('首付比例', max_digits=5, decimal_places=4, null=True, blank=True)
    monthly_payment = models.DecimalField('月供金额', max_digits=12, decimal_places=2, null=True, blank=True)
    months = models.IntegerField('贷款月数', null=True, blank=True)
    institution = models.CharField('金融机构', max_length=200, blank=True)

    class Meta:
        verbose_name = '金融资料'
        verbose_name_plural = '金融资料'

    def __str__(self):
        return f'{self.record.contract_no} - 金融资料'


class VehicleProfile(models.Model):
    GRADE_CHOICES = [
        ('A', 'A-优秀'),
        ('B', 'B-良好'),
        ('C', 'C-一般'),
        ('D', 'D-较差'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.OneToOneField(TransferRecord, on_delete=models.CASCADE, related_name='vehicle_profile', verbose_name='过户记录')
    brand = models.CharField('品牌', max_length=100)
    model = models.CharField('型号', max_length=100)
    vin = models.CharField('VIN码', max_length=17, unique=True)
    mileage = models.IntegerField('里程数(km)', null=True, blank=True)
    condition_grade = models.CharField('车况评级', max_length=1, choices=GRADE_CHOICES, null=True, blank=True)
    registration_date = models.DateField('初次登记日期', null=True, blank=True)
    source_channel = models.CharField('来源渠道', max_length=50, blank=True)

    class Meta:
        verbose_name = '车辆档案'
        verbose_name_plural = '车辆档案'

    def __str__(self):
        return f'{self.brand} {self.model} ({self.vin})'


class FileAttachment(models.Model):
    RELATED_TYPE_CHOICES = [
        ('finance', '金融资料'),
        ('vehicle_license', '行驶证'),
        ('vehicle_registration', '登记证'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.CharField('文件类型', max_length=50)
    file_name = models.CharField('文件名', max_length=255)
    file = models.FileField('文件', upload_to='attachments/')
    file_size = models.IntegerField('文件大小(bytes)')
    related_obj_id = models.UUIDField('关联对象ID')
    related_obj_type = models.CharField('关联对象类型', max_length=50, choices=RELATED_TYPE_CHOICES)
    uploaded_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '文件附件'
        verbose_name_plural = '文件附件'
        indexes = [
            models.Index(fields=['related_obj_type', 'related_obj_id'], name='idx_file_related'),
        ]

    def __str__(self):
        return self.file_name


class ExceptionItem(models.Model):
    MISSING_TYPE_CHOICES = [
        ('buyer_id', '买方身份证'),
        ('seller_id', '卖方身份证'),
        ('license', '行驶证'),
        ('registration', '登记证'),
        ('contract', '合同'),
        ('finance', '金融资料'),
        ('other', '其他'),
    ]
    URGENCY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
    ]
    STATUS_CHOICES = [
        ('open', '待处理'),
        ('reminded', '已催办'),
        ('escalated', '已升级'),
        ('resolved', '已补齐'),
        ('closed', '已关闭'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(TransferRecord, on_delete=models.CASCADE, related_name='exception_items', verbose_name='过户记录')
    missing_type = models.CharField('缺失类型', max_length=30, choices=MISSING_TYPE_CHOICES)
    urgency = models.CharField('紧急程度', max_length=10, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField('状态', max_length=15, choices=STATUS_CHOICES, default='open')
    discovered_at = models.DateTimeField('发现时间', auto_now_add=True)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)

    class Meta:
        verbose_name = '异常项'
        verbose_name_plural = '异常项'
        indexes = [
            models.Index(fields=['status'], name='idx_exception_status'),
            models.Index(fields=['urgency'], name='idx_exception_urgency'),
        ]

    def __str__(self):
        return f'{self.record.contract_no} - {self.get_missing_type_display()}'


class ExceptionNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exception_item = models.ForeignKey(ExceptionItem, on_delete=models.CASCADE, related_name='notes', verbose_name='异常项')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='记录人')
    content = models.TextField('内容')
    created_at = models.DateTimeField('记录时间', auto_now_add=True)

    class Meta:
        verbose_name = '异常处理记录'
        verbose_name_plural = '异常处理记录'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.exception_item} - 备注'


class ReviewTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(TransferRecord, on_delete=models.CASCADE, related_name='review_tags', verbose_name='过户记录')
    tag_name = models.CharField('标签名', max_length=50)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '复盘标签'
        verbose_name_plural = '复盘标签'
        indexes = [
            models.Index(fields=['tag_name'], name='idx_tag_name'),
        ]
        unique_together = ['record', 'tag_name']

    def __str__(self):
        return self.tag_name
