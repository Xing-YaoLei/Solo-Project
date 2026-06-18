from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from transfertracker.models import UserProfile


class Command(BaseCommand):
    help = '创建测试用户和示例数据'

    def handle(self, *args, **options):
        users_data = [
            ('zhangsan', 'zhangsan123', 'specialist'),
            ('lisi', 'lisi123', 'specialist'),
            ('wangwu', 'wangwu123', 'manager'),
            ('zhaoliu', 'zhaoliu123', 'finance'),
        ]
        for username, password, role in users_data:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password(password)
                user.save()
                UserProfile.objects.create(user=user, role=role)
                self.stdout.write(self.style.SUCCESS(f'创建用户: {username} ({role})'))
            else:
                self.stdout.write(f'用户已存在: {username}')
