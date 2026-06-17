from datetime import time, date, datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Apartment, TimeSlot, CleaningSchedule,
    UserRole, CleaningStatus, AttendanceStatus
)
from app.security import get_password_hash
from app.crud import create_schedule_code


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).count() == 0:
            print("创建初始用户...")
            users = [
                User(
                    username="admin",
                    email="admin@example.com",
                    full_name="系统管理员",
                    phone="13800000001",
                    role=UserRole.ADMIN,
                    hashed_password=get_password_hash("admin123"),
                    skills=["系统管理", "排班调度"]
                ),
                User(
                    username="supervisor1",
                    email="sup1@example.com",
                    full_name="张伟主管",
                    phone="13800000002",
                    role=UserRole.SUPERVISOR,
                    hashed_password=get_password_hash("super123"),
                    skills=["质量管理", "员工培训"]
                ),
                User(
                    username="supervisor2",
                    email="sup2@example.com",
                    full_name="李娜主管",
                    phone="13800000003",
                    role=UserRole.SUPERVISOR,
                    hashed_password=get_password_hash("super123"),
                    skills=["客户服务", "调度协调"]
                ),
                User(
                    username="cleaner1",
                    email="cleaner1@example.com",
                    full_name="王芳",
                    phone="13800000010",
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("clean123"),
                    skills=["深度清洁", "玻璃清洁"]
                ),
                User(
                    username="cleaner2",
                    email="cleaner2@example.com",
                    full_name="赵强",
                    phone="13800000011",
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("clean123"),
                    skills=["厨房清洁", "卫浴清洁"]
                ),
                User(
                    username="cleaner3",
                    email="cleaner3@example.com",
                    full_name="陈静",
                    phone="13800000012",
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("clean123"),
                    skills=["日常清洁", "快速整理"]
                ),
                User(
                    username="cleaner4",
                    email="cleaner4@example.com",
                    full_name="刘洋",
                    phone="13800000013",
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("clean123"),
                    skills=["深度清洁", "家电清洁"]
                ),
            ]
            db.add_all(users)
            db.flush()
            print(f"  创建了 {len(users)} 个用户")

        if db.query(TimeSlot).count() == 0:
            print("创建时段...")
            time_slots = [
                TimeSlot(slot_name="上午早班", start_time=time(8, 0), end_time=time(10, 0), is_peak=False, capacity=4),
                TimeSlot(slot_name="上午常规", start_time=time(10, 0), end_time=time(12, 0), is_peak=True, capacity=5),
                TimeSlot(slot_name="午间时段", start_time=time(12, 0), end_time=time(14, 0), is_peak=False, capacity=3),
                TimeSlot(slot_name="下午常规", start_time=time(14, 0), end_time=time(16, 0), is_peak=True, capacity=5),
                TimeSlot(slot_name="下午晚班", start_time=time(16, 0), end_time=time(18, 0), is_peak=True, capacity=4),
                TimeSlot(slot_name="晚间加班", start_time=time(18, 0), end_time=time(20, 0), is_peak=False, capacity=2),
            ]
            db.add_all(time_slots)
            db.flush()
            print(f"  创建了 {len(time_slots)} 个时段")

        if db.query(Apartment).count() == 0:
            print("创建公寓...")
            apartments = []
            buildings = ["A栋", "B栋", "C栋"]
            for b_idx, building in enumerate(buildings):
                for unit in range(1, 5):
                    for room in range(1, 6):
                        apt_code = f"{building[0]}{unit:02d}{room:02d}"
                        apartments.append(Apartment(
                            apartment_code=apt_code,
                            building=building,
                            unit=f"{unit}单元",
                            room_number=f"{room}0{room % 9}",
                            floor=room + b_idx * 5,
                            area_sqm=45 + (room % 3) * 20,
                            apartment_type=["单间", "一居室", "两居室"][room % 3],
                            resident_name=f"租客{apt_code}",
                            resident_phone=f"139{10000000 + b_idx*100 + unit*20 + room:08d}",
                            door_lock_info=f"密码锁: 1234{room}",
                            special_instructions="注意保护地板" if room % 3 == 0 else None
                        ))
            db.add_all(apartments)
            db.flush()
            print(f"  创建了 {len(apartments)} 套公寓")

        if db.query(CleaningSchedule).count() == 0:
            print("创建示例排班...")
            cleaners = db.query(User).filter(User.role == UserRole.CLEANER).all()
            apartments = db.query(Apartment).all()
            time_slots = db.query(TimeSlot).all()
            supervisors = db.query(User).filter(User.role == UserRole.SUPERVISOR).all()
            admin = db.query(User).filter(User.role == UserRole.ADMIN).first()

            today = date.today()
            schedules = []

            for day_offset in range(-2, 8):
                current_date = today + timedelta(days=day_offset)
                for i in range(5):
                    apartment = apartments[(day_offset * 5 + i) % len(apartments)]
                    cleaner = cleaners[(day_offset * 5 + i) % len(cleaners)]
                    slot = time_slots[(day_offset * 2 + i) % len(time_slots)]
                    supervisor = supervisors[i % len(supervisors)]

                    start_dt = datetime.combine(current_date, slot.start_time)
                    end_dt = datetime.combine(current_date, slot.end_time)

                    if day_offset < 0:
                        statuses = [CleaningStatus.COMPLETED, CleaningStatus.COMPLETED, CleaningStatus.NO_SHOW]
                        status = statuses[i % len(statuses)]
                    elif day_offset == 0:
                        if i < 2:
                            status = CleaningStatus.IN_PROGRESS
                        elif i == 2:
                            status = CleaningStatus.CONFIRMED
                        else:
                            status = CleaningStatus.PENDING
                    else:
                        statuses = [CleaningStatus.CONFIRMED, CleaningStatus.PENDING, CleaningStatus.PENDING]
                        status = statuses[i % len(statuses)]

                    schedule = CleaningSchedule(
                        schedule_code=create_schedule_code() + str(len(schedules)),
                        apartment_id=apartment.id,
                        cleaner_id=cleaner.id,
                        supervisor_id=supervisor.id,
                        created_by_id=admin.id,
                        scheduled_date=current_date,
                        time_slot_id=slot.id,
                        start_time=start_dt,
                        end_time=end_dt,
                        duration_minutes=120,
                        status=status,
                        attendance_status=AttendanceStatus.ARRIVED if status in [CleaningStatus.COMPLETED, CleaningStatus.IN_PROGRESS] else AttendanceStatus.NOT_STARTED,
                        cleaning_type=["routine", "deep", "routine", "checkout"][i % 4],
                        priority=i % 3,
                        customer_notes="请重点清洁厨房" if i % 2 == 0 else None,
                        internal_notes="新入住前清洁" if i == 0 else None,
                        check_in_time=start_dt + timedelta(minutes=5) if status in [CleaningStatus.COMPLETED, CleaningStatus.IN_PROGRESS] else None,
                        check_out_time=end_dt if status == CleaningStatus.COMPLETED else None,
                        completion_time=end_dt if status == CleaningStatus.COMPLETED else None,
                        quality_score=90 + (i % 3) * 3 if status == CleaningStatus.COMPLETED else None,
                        has_conflict=(day_offset == 1 and i == 0),
                    )
                    schedules.append(schedule)

            db.add_all(schedules)
            print(f"  创建了 {len(schedules)} 条排班记录")

        db.commit()
        print("\n数据库初始化完成！")
        print("=" * 50)
        print("初始账号：")
        print("  管理员: admin / admin123")
        print("  主管: supervisor1 / super123")
        print("  保洁员: cleaner1 / clean123")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"初始化出错: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
