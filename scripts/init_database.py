#!/usr/bin/env python
"""初始化数据库表结构和默认用户"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, get_session
from app.models import User, UserScope
from werkzeug.security import generate_password_hash


def main():
    print("=" * 60)
    print("初始化数据库...")
    print("=" * 60)

    init_db()
    print("✅ 数据库表创建完成")

    with get_session() as session:
        admin = session.query(User).filter(User.username == 'admin').first()
        if not admin:
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin123'),
                real_name='系统管理员',
                role='admin',
                email='admin@example.com',
                phone='13800000000',
                is_active=True,
            )
            session.add(admin)
            session.flush()
            session.add(UserScope(user_id=admin.id, scope_type='project', scope_value='*'))
            session.add(UserScope(user_id=admin.id, scope_type='district', scope_value='*'))
            print("✅ 创建默认管理员: admin / admin123")
        else:
            print("ℹ️  管理员账号已存在: admin")

        front = session.query(User).filter(User.username == 'frontline').first()
        if not front:
            front = User(
                username='frontline',
                password_hash=generate_password_hash('front123'),
                real_name='一线管家小张',
                role='frontline',
                email='zhang@example.com',
                phone='13900000001',
                is_active=True,
            )
            session.add(front)
            session.flush()
            session.add(UserScope(user_id=front.id, scope_type='project', scope_value='阳光花园'))
            session.add(UserScope(user_id=front.id, scope_type='project', scope_value='水岸豪庭'))
            print("✅ 创建默认一线人员: frontline / front123")
        else:
            print("ℹ️  一线人员账号已存在: frontline")

        session.commit()

    print("=" * 60)
    print("✅ 数据库初始化完成！")
    print("=" * 60)


if __name__ == '__main__':
    main()
