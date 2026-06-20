import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.models import (
    User, PerformanceSchedule, SeatAllocation, Order, SignCode,
    CheckinRecord, Sponsor, CameraStatistic, MetricDefinition,
    RoleEnum, OrderSourceEnum, SignCodeTypeEnum
)
from app.core.security import get_password_hash


def seed_data():
    db = SessionLocal()
    try:
        print("开始初始化模拟数据...")

        if db.query(User).count() == 0:
            users = [
                User(username="admin", email="admin@scenic.com", full_name="系统管理员",
                     hashed_password=get_password_hash("admin123"), role=RoleEnum.ADMIN),
                User(username="ops_manager", email="ops@scenic.com", full_name="运营经理张经理",
                     hashed_password=get_password_hash("ops123"), role=RoleEnum.OPERATION_MANAGER),
                User(username="analyst", email="analyst@scenic.com", full_name="分析师小李",
                     hashed_password=get_password_hash("analyst123"), role=RoleEnum.ANALYST),
                User(username="viewer", email="viewer@scenic.com", full_name="普通查看用户",
                     hashed_password=get_password_hash("viewer123"), role=RoleEnum.VIEWER),
            ]
            db.add_all(users)
            db.commit()
            print(f"已创建 {len(users)} 个用户")

        if db.query(PerformanceSchedule).count() == 0:
            performances = []
            for i in range(5):
                perf_date = datetime.now() + timedelta(days=i - 2)
                start = perf_date.replace(hour=19, minute=30, second=0, microsecond=0)
                end = start + timedelta(hours=1, minutes=30)
                perf = PerformanceSchedule(
                    performance_name=f"《梦幻山水》第 {i+1} 场",
                    venue=f"主剧场 {i+1} 号厅",
                    performance_date=perf_date,
                    start_time=start,
                    end_time=end,
                    total_seats=500,
                    status="completed" if i < 3 else "scheduled",
                    risk_level=random.choice(["normal", "low", "medium", "high"]),
                    risk_notes="正常" if i < 2 else "上座率偏低，建议推广",
                )
                performances.append(perf)
            db.add_all(performances)
            db.commit()
            print(f"已创建 {len(performances)} 个演出排期")

        schedules = db.query(PerformanceSchedule).all()
        for schedule in schedules:
            if db.query(SeatAllocation).filter(SeatAllocation.schedule_id == schedule.id).count() == 0:
                seat_zones = ["VIP区", "A区", "B区", "C区"]
                seat_types = {"VIP区": 580, "A区": 380, "B区": 280, "C区": 180}
                allocations = []
                seat_no = 1
                for zone in seat_zones:
                    for _ in range(125):
                        status = random.choices(
                            ["available", "sold", "reserved"],
                            weights=[0.15, 0.75, 0.1]
                        )[0]
                        allocations.append(SeatAllocation(
                            schedule_id=schedule.id,
                            seat_zone=zone,
                            seat_number=f"{zone[:1]}-{seat_no:03d}",
                            seat_type=zone,
                            price=Decimal(str(seat_types[zone])),
                            status=status,
                            recorded_at=schedule.start_time - timedelta(days=random.randint(1, 10), hours=random.randint(1, 23)),
                        ))
                        seat_no += 1
                db.add_all(allocations)
                print(f"排期 {schedule.id} 已创建 {len(allocations)} 个座位")
        db.commit()

        for schedule in schedules:
            if db.query(Order).filter(Order.schedule_id == schedule.id).count() == 0:
                sources = [OrderSourceEnum.MINIAPP, OrderSourceEnum.MERCHANT, OrderSourceEnum.ONSITE, OrderSourceEnum.SPONSOR]
                orders = []
                for j in range(random.randint(80, 150)):
                    ticket_count = random.randint(1, 6)
                    source = random.choices(sources, weights=[0.5, 0.25, 0.15, 0.1])[0]
                    merchants = [("M001", "携程"), ("M002", "美团"), ("M003", "飞猪")]
                    merchant = random.choice(merchants) if source == OrderSourceEnum.MERCHANT else (None, None)
                    orders.append(Order(
                        schedule_id=schedule.id,
                        order_no=f"ORD{schedule.id:04d}{j:05d}",
                        source=source,
                        user_id=f"USER{random.randint(10000, 99999)}",
                        user_name=f"用户{j+1}",
                        user_phone=f"138{random.randint(10000000, 99999999)}",
                        total_amount=Decimal(str(ticket_count * random.choice([180, 280, 380, 580]))),
                        ticket_count=ticket_count,
                        status="paid",
                        paid_at=schedule.start_time - timedelta(days=random.randint(1, 5), hours=random.randint(1, 23)),
                        merchant_id=merchant[0],
                        merchant_name=merchant[1],
                    ))
                db.add_all(orders)
                print(f"排期 {schedule.id} 已创建 {len(orders)} 个订单")
        db.commit()

        orders = db.query(Order).all()
        for order in orders:
            if db.query(SignCode).filter(SignCode.order_id == order.id).count() == 0:
                code_types = [SignCodeTypeEnum.QR, SignCodeTypeEnum.BARCODE, SignCodeTypeEnum.NFC, SignCodeTypeEnum.MANUAL]
                codes = []
                for k in range(order.ticket_count):
                    is_used = random.random() > 0.15
                    codes.append(SignCode(
                        order_id=order.id,
                        code=f"SC{order.order_no}-{k:03d}",
                        code_type=random.choices(code_types, weights=[0.6, 0.2, 0.1, 0.1])[0],
                        is_used=is_used,
                        used_at=order.schedule.start_time - timedelta(minutes=random.randint(5, 120)) if is_used else None,
                    ))
                db.add_all(codes)
        db.commit()
        print(f"已创建签到码记录")

        for schedule in schedules[:3]:
            sign_codes = db.query(SignCode).join(Order).filter(Order.schedule_id == schedule.id, SignCode.is_used == True).all()
            if db.query(CheckinRecord).filter(CheckinRecord.schedule_id == schedule.id).count() == 0:
                records = []
                for idx, sc in enumerate(sign_codes):
                    is_anomaly = random.random() < 0.08
                    anomaly_types = ["重复核销", "无效签到码", "人脸不匹配", "票种不符", "超员入场"]
                    records.append(CheckinRecord(
                        schedule_id=schedule.id,
                        order_id=sc.order_id,
                        sign_code_id=sc.id,
                        user_identifier=f"USER{random.randint(10000, 99999)}",
                        checkin_time=sc.used_at,
                        checkin_channel=random.choice(["staff", "gate", "self_service"]),
                        camera_verified=random.random() > 0.3,
                        camera_snapshot_id=f"SNAP{idx:06d}" if random.random() > 0.3 else None,
                        is_anomaly=is_anomaly,
                        anomaly_type=random.choice(anomaly_types) if is_anomaly else None,
                        anomaly_description=random.choice(["该码已使用过", "签到码过期", "摄像头采集照片与购票人不匹配"]) if is_anomaly else None,
                        staff_id=f"STF{random.randint(1, 20):03d}",
                        staff_name=random.choice(["王检票", "李核验", "赵引导"]),
                    ))
                db.add_all(records)
                print(f"排期 {schedule.id} 已创建 {len(records)} 条核销记录")
        db.commit()

        for schedule in schedules:
            if db.query(Sponsor).filter(Sponsor.schedule_id == schedule.id).count() == 0:
                sponsors_data = [
                    ("山水文旅集团", "现金赞助", "冠名", 50000, "场地布置物资", 30),
                    ("清风饮料", "实物赞助", "联合", 10000, "定制饮品500箱", 20),
                    ("云端科技", "技术赞助", "支持", 20000, "人脸识别系统", 10),
                ]
                sponsors = []
                for name, stype, level, amount, inkind, tickets in sponsors_data:
                    sponsors.append(Sponsor(
                        schedule_id=schedule.id,
                        sponsor_name=name,
                        sponsor_type=stype,
                        sponsorship_level=level,
                        contribution_amount=Decimal(str(amount)),
                        in_kind_items=inkind,
                        ticket_allocation=tickets,
                        contact_person=f"{name}联系人",
                        contact_phone=f"010-{random.randint(10000000, 99999999)}",
                        contract_no=f"HT{schedule.id:04d}{random.randint(1000, 9999)}",
                        status="confirmed",
                        notes=f"{level}赞助商，已签约",
                    ))
                db.add_all(sponsors)
                print(f"排期 {schedule.id} 已创建 {len(sponsors)} 个赞助商")
        db.commit()

        if db.query(MetricDefinition).count() == 0:
            metrics = [
                MetricDefinition(
                    metric_code="checkin_efficiency",
                    metric_name="核销效率",
                    category="运营指标",
                    definition="实际核销人数与应核销人数的比率，反映票务核销的完成情况与入场秩序。",
                    calculation_formula="核销效率 = 有效核销记录数 / 已支付订单票务总数 × 100%",
                    unit="%",
                    data_source="核销记录表(checkin_records)、订单表(orders)",
                    refresh_frequency="实时",
                    version="1.0",
                ),
                MetricDefinition(
                    metric_code="occupancy_rate",
                    metric_name="上座率",
                    category="销售指标",
                    definition="已售座位数占总可用座位数的比例，反映演出的受欢迎程度。",
                    calculation_formula="上座率 = (已售票数 + 赞助赠票数) / 总可用座位数 × 100%",
                    unit="%",
                    data_source="座位分配表(seat_allocations)、订单表(orders)",
                    refresh_frequency="每小时",
                    version="1.0",
                ),
                MetricDefinition(
                    metric_code="revenue",
                    metric_name="收入金额",
                    category="财务指标",
                    definition="已支付订单的实付总金额，包含票款及服务费用，不含退款。",
                    calculation_formula="收入金额 = SUM(已支付订单实付金额)",
                    unit="元",
                    data_source="订单表(orders)",
                    refresh_frequency="每小时",
                    version="1.0",
                ),
                MetricDefinition(
                    metric_code="ticket_sold",
                    metric_name="售票数量",
                    category="销售指标",
                    definition="通过各渠道售出的票务总数量。",
                    calculation_formula="售票数量 = SUM(已支付订单票数量)",
                    unit="张",
                    data_source="订单表(orders)",
                    refresh_frequency="每小时",
                    version="1.0",
                ),
                MetricDefinition(
                    metric_code="anomaly_rate",
                    metric_name="异常核销率",
                    category="风险指标",
                    definition="异常核销记录占总核销记录的比例，反映入场核验风险。",
                    calculation_formula="异常核销率 = 异常核销记录数 / 总核销记录数 × 100%",
                    unit="%",
                    data_source="核销记录表(checkin_records)",
                    refresh_frequency="实时",
                    version="1.0",
                ),
                MetricDefinition(
                    metric_code="sponsor_contribution",
                    metric_name="赞助金额",
                    category="财务指标",
                    definition="赞助商提供的现金赞助总金额，不含实物折算。",
                    calculation_formula="赞助金额 = SUM(赞助商现金贡献金额)",
                    unit="元",
                    data_source="赞助商表(sponsors)",
                    refresh_frequency="每日",
                    version="1.0",
                ),
            ]
            db.add_all(metrics)
            db.commit()
            print(f"已创建 {len(metrics)} 个指标定义")

        print("数据初始化完成！")
        print("\n默认登录账号：")
        print("  运营经理: ops_manager / ops123")
        print("  分析师:   analyst / analyst123")
        print("  管理员:   admin / admin123")
        print("  查看者:   viewer / viewer123")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
