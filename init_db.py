#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import init_db
from config import Config

if __name__ == '__main__':
    print(f"🗄️  正在初始化数据库...")
    print(f"📦 数据库地址: {Config.DATABASE_URL}")
    try:
        init_db()
        print("✅ 数据库初始化完成！")
        print()
        print("已创建以下数据表:")
        tables = [
            'stores (门店)',
            'members (会员)',
            'drugs (药品)',
            'inventory (库存)',
            'replenishment_orders (补货单)',
            'replenishment_order_items (补货单明细)',
            'cashier_records (收银记录)',
            'cashier_record_items (收银明细)',
            'insurance_records (医保记录)',
            'prescriptions (处方)',
            'prescription_items (处方明细)',
            'prescription_photos (处方照片)',
            'audit_tasks (审核任务)',
            'followup_records (回访记录)',
        ]
        for table in tables:
            print(f"  - {table}")
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        print()
        print("请检查:")
        print("  1. PostgreSQL 服务是否启动")
        print("  2. .env 文件中 DATABASE_URL 配置是否正确")
        print("  3. 数据库是否已创建")
        print()
        print("快速启动命令:")
        print("  brew services start postgresql  # macOS")
        print("  createdb pharmacy_audit         # 创建数据库")
