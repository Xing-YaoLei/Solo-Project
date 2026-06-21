from models import init_db
from models import get_db, Rider, SubsidyRule
from datetime import datetime, timedelta
import random
import sys


def init_database():
    print("正在创建数据库表...")
    init_db()
    print("数据库表创建完成")


def seed_riders():
    db = next(get_db())
    try:
        existing_count = db.query(Rider).count()
        if existing_count >= 50:
            print(f"骑手已存在 {existing_count} 条，跳过")
            return

        for i in range(1, 51):
            existing = db.query(Rider).filter(Rider.rider_no == f"R{i:04d}").first()
            if not existing:
                rider = Rider(
                    rider_no=f"R{i:04d}",
                    name=f"骑手{i:03d}",
                    phone=f"138{random.randint(10000000, 99999999)}",
                    status="active",
                    level=random.choice(["normal", "silver", "gold", "diamond"]),
                    total_orders=random.randint(100, 5000),
                    reject_rate=round(random.uniform(0.02, 0.2), 3),
                    on_time_rate=round(random.uniform(0.75, 0.99), 3),
                )
                db.add(rider)

        db.commit()
        print("50 条骑手数据已生成")
    except Exception as e:
        db.rollback()
        print(f"生成骑手数据失败: {e}")
        raise
    finally:
        db.close()


def seed_subsidy_rules():
    db = next(get_db())
    try:
        existing = db.query(SubsidyRule).count()
        if existing >= 5:
            print(f"补贴规则已存在 {existing} 条，跳过")
            return

        default_rules = [
            {
                "rule_name": "新用户首单补贴",
                "rule_type": "new_user",
                "conditions": {"user_type": "new", "order_count": 1},
                "subsidy_amount": 10.0,
                "subsidy_percentage": 0,
                "saved_view_name": "新用户补贴订单",
            },
            {
                "rule_name": "远距离订单补贴",
                "rule_type": "distance",
                "conditions": {"min_distance_km": 5.0},
                "subsidy_amount": 0,
                "subsidy_percentage": 0.15,
                "saved_view_name": "远距离订单",
            },
            {
                "rule_name": "高峰时段补贴",
                "rule_type": "peak_hour",
                "conditions": {"hours": [11, 12, 13, 17, 18, 19]},
                "subsidy_amount": 3.0,
                "subsidy_percentage": 0,
                "saved_view_name": "高峰时段订单",
            },
            {
                "rule_name": "恶劣天气补贴",
                "rule_type": "weather",
                "conditions": {"weather": ["rain", "snow", "extreme_heat"]},
                "subsidy_amount": 5.0,
                "subsidy_percentage": 0,
                "saved_view_name": "恶劣天气订单",
            },
            {
                "rule_name": "夜间配送补贴",
                "rule_type": "night",
                "conditions": {"hours": [22, 23, 0, 1, 2, 3, 4, 5, 6]},
                "subsidy_amount": 4.0,
                "subsidy_percentage": 0,
                "saved_view_name": "夜间订单",
            },
        ]

        now = datetime.utcnow()
        for rule_data in default_rules:
            rule = SubsidyRule(
                **rule_data,
                is_active=True,
                effective_from=now - timedelta(days=30),
                effective_to=now + timedelta(days=365),
            )
            db.add(rule)

        db.commit()
        print("5 条补贴规则已生成")
    except Exception as e:
        db.rollback()
        print(f"生成补贴规则失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "all":
        init_database()
        seed_riders()
        seed_subsidy_rules()
        print("\n=== 初始化完成 ===")
    else:
        init_database()
