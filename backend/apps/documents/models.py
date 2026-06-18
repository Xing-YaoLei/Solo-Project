from django.db import models
from django.conf import settings
from django.utils import timezone


class DocumentCategory(models.TextChoices):
    VEHICLE_ARCHIVE = 'vehicle_archive', '车辆档案'
    INSPECTION = 'inspection', '检测报告'
    PREPARATION = 'preparation', '整备资料'
    TESTDRIVE = 'testdrive', '试驾资料'
    FINANCE = 'finance', '金融资料'
    OTHER = 'other', '其他'


class SourceType(models.TextChoices):
    UPLOADED = 'uploaded', '手动上传'
    SCANNED = 'scanned', '扫描生成'
    SYSTEM = 'system', '系统生成'
    IMPORTED = 'imported', '外部导入'


class VehicleDocument(models.Model):
    vehicle = models.ForeignKey(
        'vehicles.Vehicle', on_delete=models.CASCADE, related_name='documents',
        verbose_name='车源'
    )
    document_type = models.CharField(max_length=50, verbose_name='证件/材料类型',
        help_text='如: registration_cert, driving_license, insurance 等')
    category = models.CharField(max_length=30, choices=DocumentCategory.choices,
        default=DocumentCategory.VEHICLE_ARCHIVE, verbose_name='资料类别')
    source = models.CharField(max_length=20, choices=SourceType.choices,
        default=SourceType.UPLOADED, verbose_name='材料来源')
    title = models.CharField(max_length=200, verbose_name='文件标题')
    description = models.TextField(blank=True, verbose_name='描述说明')
    file_path = models.CharField(max_length=500, verbose_name='MinIO 对象路径')
    file_name = models.CharField(max_length=200, verbose_name='原始文件名')
    file_size = models.BigIntegerField(default=0, verbose_name='文件大小(字节)')
    content_type = models.CharField(max_length=100, blank=True, verbose_name='MIME类型')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='uploaded_documents', verbose_name='上传人'
    )
    is_verified = models.BooleanField(default=False, verbose_name='是否已核验')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_documents', verbose_name='核验人'
    )
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='核验时间')
    verification_note = models.TextField(blank=True, verbose_name='核验备注')
    expire_date = models.DateField(null=True, blank=True, verbose_name='有效期至')
    process_history = models.JSONField(default=list, blank=True, verbose_name='处理过程记录')
    close_conclusion = models.TextField(blank=True, verbose_name='关闭结论')
    is_closed = models.BooleanField(default=False, verbose_name='是否关闭')
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='closed_documents', verbose_name='关闭人'
    )
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name='关闭时间')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '车辆附件文档'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.vehicle}'

    def add_process_log(self, action, operator=None, note=''):
        log = {
            'action': action,
            'operator': operator.username if operator else '系统',
            'operator_id': operator.id if operator else None,
            'note': note,
            'timestamp': timezone.now().isoformat(),
        }
        self.process_history.append(log)
        self.save(update_fields=['process_history', 'updated_at'])

    @property
    def file_url(self):
        from .storage import storage
        return storage.get_url(self.file_path)

    @property
    def file_size_display(self):
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f'{size:.1f} {unit}'
            size /= 1024.0
        return f'{size:.1f} TB'
