from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = '初始化系统角色和演示账号'

    def handle(self, *args, **options):
        demo_users = [
            {
                'username': 'manager',
                'password': '123456',
                'email': 'manager@cardealer.com',
                'first_name': '张',
                'last_name': '店长',
                'role': Role.MANAGER,
                'employee_id': 'M001',
                'phone': '13800000001',
            },
            {
                'username': 'appraiser',
                'password': '123456',
                'email': 'appraiser@cardealer.com',
                'first_name': '李',
                'last_name': '评估师',
                'role': Role.APPRAISER,
                'employee_id': 'A001',
                'phone': '13800000002',
            },
            {
                'username': 'appraiser2',
                'password': '123456',
                'email': 'appraiser2@cardealer.com',
                'first_name': '王',
                'last_name': '评估师',
                'role': Role.APPRAISER,
                'employee_id': 'A002',
                'phone': '13800000003',
            },
            {
                'username': 'sales',
                'password': '123456',
                'email': 'sales@cardealer.com',
                'first_name': '赵',
                'last_name': '销售',
                'role': Role.SALES,
                'employee_id': 'S001',
                'phone': '13800000004',
            },
            {
                'username': 'sales2',
                'password': '123456',
                'email': 'sales2@cardealer.com',
                'first_name': '刘',
                'last_name': '销售',
                'role': Role.SALES,
                'employee_id': 'S002',
                'phone': '13800000005',
            },
            {
                'username': 'finance',
                'password': '123456',
                'email': 'finance@cardealer.com',
                'first_name': '陈',
                'last_name': '金融',
                'role': Role.FINANCE,
                'employee_id': 'F001',
                'phone': '13800000006',
            },
        ]

        created = 0
        for data in demo_users:
            username = data.pop('username')
            password = data.pop('password')
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password, **data)
                created += 1
                self.stdout.write(self.style.SUCCESS(f'创建用户: {username} ({user.get_role_display()})'))
            else:
                self.stdout.write(self.style.WARNING(f'用户已存在: {username}，跳过'))

        # 创建超级管理员
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@cardealer.com',
                password='admin123',
                first_name='系统',
                last_name='管理员',
                role=Role.MANAGER,
                employee_id='ADMIN001',
                phone='13900000000',
            )
            self.stdout.write(self.style.SUCCESS(f'创建超级管理员: admin/admin123'))
        else:
            self.stdout.write(self.style.WARNING('超级管理员已存在: admin，跳过'))

        self.stdout.write(self.style.SUCCESS(f'\n初始化完成！共创建 {created} 个演示用户。'))
        self.stdout.write(self.style.WARNING('所有演示账号密码均为: 123456'))
