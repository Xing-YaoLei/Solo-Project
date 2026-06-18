from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    APPRAISER = 'appraiser', '评估师'
    SALES = 'sales', '销售'
    FINANCE = 'finance', '金融专员'
    MANAGER = 'manager', '店长'


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SALES,
        verbose_name='角色'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='工号')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'
