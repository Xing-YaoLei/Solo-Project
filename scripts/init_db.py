from ticket_dashboard.db.session import Base, engine
from ticket_dashboard.db.models import (
    TicketReservation, TimeSlotCapacity, SlotConflict,
    DataQualityFlag, AttendanceRateRule, SavedView,
    ReviewNote, RefreshLog,
)
from ticket_dashboard.data.quality import run_all_quality_checks
from ticket_dashboard.data.conflict import detect_capacity_conflicts, detect_timeslot_overlaps
from datetime import date, timedelta, time
import random
import json


def init_db():
    Base.metadata.create_all(engine)
    print("数据库表创建完成")


def seed_sample_data():
    from ticket_dashboard.db.session import SessionLocal

    init_db()

    with SessionLocal() as session:
        if session.query(TicketReservation).count() > 0:
            print("数据已存在，跳过种子数据插入")
            return

        areas = [
            ("AREA001", "云山景区"),
            ("AREA002", "碧水景区"),
            ("AREA003", "古寨景区"),
        ]
        ticket_types = ["成人票", "儿童票", "老人票", "团体票"]
        channels = ["online", "offline", "travel_agency", "group"]
        today = date.today()

        for area_id, area_name in areas:
            for day_offset in range(30):
                current_date = today - timedelta(days=day_offset)
                slots = [
                    (time(8, 0), time(10, 0)),
                    (time(10, 0), time(12, 0)),
                    (time(12, 0), time(14, 0)),
                    (time(14, 0), time(16, 0)),
                    (time(16, 0), time(18, 0)),
                ]

                for slot_start, slot_end in slots:
                    base_cap = random.choice([800, 1000, 1200, 1500])
                    cap = TimeSlotCapacity(
                        scenic_area_id=area_id,
                        effective_date=current_date,
                        time_slot_start=slot_start,
                        time_slot_end=slot_end,
                        max_capacity=base_cap,
                        overflow_capacity=int(base_cap * 0.1),
                        capacity_rule_name=f"标准规则_{base_cap}",
                        is_active=True,
                    )
                    session.add(cap)

                    for t_type in ticket_types:
                        for channel in channels:
                            reserved = random.randint(20, base_cap // 2)
                            checked_in = int(reserved * random.uniform(0.65, 0.95))
                            cancelled = random.randint(0, reserved // 10)

                            reservation = TicketReservation(
                                scenic_area_id=area_id,
                                scenic_area_name=area_name,
                                ticket_type=t_type,
                                reservation_date=current_date,
                                time_slot_start=slot_start,
                                time_slot_end=slot_end,
                                reserved_count=reserved,
                                checked_in_count=checked_in,
                                cancelled_count=cancelled,
                                channel=channel,
                            )
                            session.add(reservation)

            default_rule = AttendanceRateRule(
                scenic_area_id=area_id,
                rule_name=f"{area_name}默认到场率",
                numerator_source="checked_in_count",
                denominator_source="reserved_count",
                adjustment_factor=1.0,
                description="签到人数 / 预约人数",
                is_active=True,
                effective_from=today - timedelta(days=90),
                effective_to=today + timedelta(days=90),
            )
            session.add(default_rule)

        session.commit()
        print("种子数据插入完成")


def run_initial_checks():
    result = run_all_quality_checks(date.today())
    print(f"数据质量检查完成: {json.dumps(result, ensure_ascii=False, default=str)}")

    conflicts_c = detect_capacity_conflicts(target_date=date.today())
    conflicts_o = detect_timeslot_overlaps(target_date=date.today())
    print(f"容量冲突: {len(conflicts_c)}, 时段重叠: {len(conflicts_o)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "init":
            init_db()
        elif cmd == "seed":
            seed_sample_data()
        elif cmd == "check":
            run_initial_checks()
        elif cmd == "setup":
            seed_sample_data()
            run_initial_checks()
        else:
            print(f"未知命令: {cmd}")
            print("可用命令: init, seed, check, setup")
    else:
        print("用法: python init_db.py [init|seed|check|setup]")
