import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta, datetime, time
import random
import uuid
import pandas as pd
import numpy as np

DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()

if DB_TYPE == "sqlite":
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, declarative_base
    import sqlite3

    DB_PATH = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "fitness_pt.db"
    )
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URI,
        connect_args={"check_same_thread": False}
    )
    Base = declarative_base()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    from sqlalchemy import (
        Column, Integer, String, DateTime, Date, Time, Boolean,
        Float, ForeignKey, Text, Numeric, Index
    )
    from sqlalchemy.orm import relationship

else:
    from utils.database import Base, engine, SessionLocal
    from models.models import *


if DB_TYPE == "sqlite":
    class SyncBatch(Base):
        __tablename__ = "sync_batches"
        id = Column(Integer, primary_key=True, autoincrement=True)
        batch_no = Column(String(64), unique=True, nullable=False, index=True)
        source_type = Column(String(32), nullable=False, index=True)
        status = Column(String(16), nullable=False, default="pending")
        total_count = Column(Integer, default=0)
        success_count = Column(Integer, default=0)
        fail_count = Column(Integer, default=0)
        start_time = Column(DateTime, default=datetime.now)
        end_time = Column(DateTime, nullable=True)
        error_message = Column(Text, nullable=True)
        data_range_start = Column(Date, nullable=True)
        data_range_end = Column(Date, nullable=True)
        created_by = Column(String(64), default="system")


    class Region(Base):
        __tablename__ = "regions"
        id = Column(Integer, primary_key=True, autoincrement=True)
        region_code = Column(String(32), unique=True, nullable=False, index=True)
        region_name = Column(String(64), nullable=False)
        city = Column(String(32))
        address = Column(String(256))
        capacity = Column(Integer, default=0)
        is_active = Column(Boolean, default=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class Coach(Base):
        __tablename__ = "coaches"
        id = Column(Integer, primary_key=True, autoincrement=True)
        coach_no = Column(String(32), unique=True, nullable=False, index=True)
        coach_name = Column(String(64), nullable=False)
        gender = Column(String(8))
        phone = Column(String(32))
        region_id = Column(Integer, ForeignKey("regions.id"))
        specialty = Column(String(128))
        level = Column(String(16))
        is_active = Column(Boolean, default=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class Member(Base):
        __tablename__ = "members"
        id = Column(Integer, primary_key=True, autoincrement=True)
        member_no = Column(String(32), unique=True, nullable=False, index=True)
        member_name = Column(String(64), nullable=False)
        gender = Column(String(8))
        phone = Column(String(32))
        region_id = Column(Integer, ForeignKey("regions.id"))
        member_level = Column(String(16))
        is_active = Column(Boolean, default=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class CourseSchedule(Base):
        __tablename__ = "course_schedules"
        id = Column(Integer, primary_key=True, autoincrement=True)
        schedule_no = Column(String(64), unique=True, nullable=False, index=True)
        course_date = Column(Date, nullable=False, index=True)
        start_time = Column(Time, nullable=False)
        end_time = Column(Time, nullable=False)
        coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
        region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
        course_type = Column(String(32))
        course_name = Column(String(128))
        max_capacity = Column(Integer, default=1)
        actual_capacity = Column(Integer, default=0)
        status = Column(String(16), default="scheduled")
        batch_no = Column(String(64), index=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class Appointment(Base):
        __tablename__ = "appointments"
        id = Column(Integer, primary_key=True, autoincrement=True)
        appointment_no = Column(String(64), unique=True, nullable=False, index=True)
        schedule_id = Column(Integer, ForeignKey("course_schedules.id"), nullable=False)
        member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
        coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
        region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
        appointment_date = Column(Date, nullable=False, index=True)
        start_time = Column(Time, nullable=False)
        end_time = Column(Time, nullable=False)
        status = Column(String(16), default="booked")
        booked_at = Column(DateTime, default=datetime.now)
        cancelled_at = Column(DateTime, nullable=True)
        cancel_reason = Column(String(256), nullable=True)
        is_rescheduled = Column(Boolean, default=False)
        original_appointment_no = Column(String(64), nullable=True, index=True)
        batch_no = Column(String(64), index=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class RescheduleRecord(Base):
        __tablename__ = "reschedule_records"
        id = Column(Integer, primary_key=True, autoincrement=True)
        record_no = Column(String(64), unique=True, nullable=False, index=True)
        appointment_no = Column(String(64), nullable=False, index=True)
        old_schedule_id = Column(Integer, nullable=True)
        new_schedule_id = Column(Integer, nullable=True)
        old_date = Column(Date, nullable=False)
        old_start_time = Column(Time, nullable=False)
        old_end_time = Column(Time, nullable=False)
        new_date = Column(Date, nullable=False)
        new_start_time = Column(Time, nullable=False)
        new_end_time = Column(Time, nullable=False)
        reschedule_reason = Column(String(256))
        reschedule_type = Column(String(16))
        operator = Column(String(64))
        rescheduled_at = Column(DateTime, default=datetime.now)
        batch_no = Column(String(64), index=True)


    class AccessRecord(Base):
        __tablename__ = "access_records"
        id = Column(Integer, primary_key=True, autoincrement=True)
        record_no = Column(String(64), unique=True, nullable=False, index=True)
        member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
        member_no = Column(String(32), index=True)
        region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
        access_type = Column(String(16), nullable=False)
        access_time = Column(DateTime, nullable=False, index=True)
        access_date = Column(Date, nullable=False, index=True)
        device_no = Column(String(32))
        batch_no = Column(String(64), index=True)
        created_at = Column(DateTime, default=datetime.now)


    class BodyTestRecord(Base):
        __tablename__ = "body_test_records"
        id = Column(Integer, primary_key=True, autoincrement=True)
        test_no = Column(String(64), unique=True, nullable=False, index=True)
        member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
        member_no = Column(String(32), index=True)
        region_id = Column(Integer, ForeignKey("regions.id"), nullable=False, index=True)
        test_date = Column(Date, nullable=False, index=True)
        test_time = Column(DateTime, default=datetime.now)
        height = Column(Float)
        weight = Column(Float)
        bmi = Column(Float)
        body_fat_rate = Column(Float)
        muscle_mass = Column(Float)
        basal_metabolism = Column(Integer)
        visceral_fat_level = Column(Integer)
        moisture_rate = Column(Float)
        batch_no = Column(String(64), index=True)
        created_at = Column(DateTime, default=datetime.now)


    class AttendanceRecord(Base):
        __tablename__ = "attendance_records"
        id = Column(Integer, primary_key=True, autoincrement=True)
        appointment_id = Column(Integer, nullable=False, index=True)
        appointment_no = Column(String(64), index=True)
        member_id = Column(Integer, nullable=True)
        coach_id = Column(Integer, nullable=True)
        region_id = Column(Integer, nullable=True, index=True)
        check_in_time = Column(DateTime, nullable=True)
        check_out_time = Column(DateTime, nullable=True)
        actual_start_time = Column(DateTime, nullable=True)
        actual_end_time = Column(DateTime, nullable=True)
        is_attended = Column(Boolean, default=False)
        attendance_status = Column(String(16), default="pending")
        late_minutes = Column(Integer, default=0)
        early_leave_minutes = Column(Integer, default=0)
        matched_access_id = Column(Integer, nullable=True)
        created_at = Column(DateTime, default=datetime.now)
        updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    class ConflictRecord(Base):
        __tablename__ = "conflict_records"
        id = Column(Integer, primary_key=True, autoincrement=True)
        conflict_no = Column(String(64), unique=True, nullable=False, index=True)
        conflict_type = Column(String(32), nullable=False, index=True)
        region_id = Column(Integer, nullable=True, index=True)
        coach_id = Column(Integer, nullable=True, index=True)
        member_id = Column(Integer, nullable=True, index=True)
        conflict_date = Column(Date, nullable=False, index=True)
        conflict_start_time = Column(Time, nullable=False)
        conflict_end_time = Column(Time, nullable=False)
        appointment_no_1 = Column(String(64))
        appointment_no_2 = Column(String(64))
        schedule_no_1 = Column(String(64))
        schedule_no_2 = Column(String(64))
        description = Column(Text)
        severity = Column(String(16), default="warning")
        is_resolved = Column(Boolean, default=False)
        resolved_at = Column(DateTime, nullable=True)
        resolution_note = Column(Text, nullable=True)
        detected_at = Column(DateTime, default=datetime.now)


ALL_MODELS_SQLITE = [
    SyncBatch, Region, Coach, Member, CourseSchedule, Appointment,
    RescheduleRecord, AccessRecord, BodyTestRecord, AttendanceRecord, ConflictRecord
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    return SessionLocal()


def init_db():
    print(f"使用数据库: {DB_TYPE} ({SQLALCHEMY_DATABASE_URI if DB_TYPE=='sqlite' else 'PostgreSQL'})")
    print("开始创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")


def seed_test_data(days: int = 60):
    init_db()
    session = get_session()

    try:
        region_count = session.query(Region).count()
        if region_count > 0:
            print("数据库已有数据，跳过测试数据生成。如需重新生成请先删除 fitness_pt.db")
            return

        print("开始生成测试数据...")
        random.seed(42)
        np.random.seed(42)

        regions_data = [
            {"region_code": "SH-PD", "region_name": "上海浦东店", "city": "上海", "capacity": 15},
            {"region_code": "SH-HP", "region_name": "上海黄浦店", "city": "上海", "capacity": 12},
            {"region_code": "SH-JA", "region_name": "上海静安店", "city": "上海", "capacity": 18},
            {"region_code": "BJ-CY", "region_name": "北京朝阳店", "city": "北京", "capacity": 20},
            {"region_code": "BJ-HD", "region_name": "北京海淀店", "city": "北京", "capacity": 16},
        ]
        for r in regions_data:
            session.add(Region(**r))
        session.flush()

        region_ids = [r.id for r in session.query(Region).all()]

        coach_first_names = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴",
                             "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"]
        coach_last_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋",
                            "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
        specialties = ["力量训练", "减脂塑形", "康复训练", "拳击格斗", "瑜伽普拉提",
                       "功能性训练", "孕产恢复", "青少年体能"]
        levels = ["初级教练", "中级教练", "高级教练", "资深教练", "明星教练"]

        coaches_count = 35
        for i in range(1, coaches_count + 1):
            name = random.choice(coach_first_names) + random.choice(coach_last_names)
            session.add(Coach(
                coach_no=f"C{i:04d}",
                coach_name=name,
                gender=random.choice(["男", "女"]),
                phone=f"138{random.randint(10000000, 99999999)}",
                region_id=random.choice(region_ids),
                specialty=random.choice(specialties),
                level=random.choices(levels, weights=[2, 3, 2, 2, 1])[0],
            ))
        session.flush()
        coach_ids = [c.id for c in session.query(Coach).all()]

        member_first_names = ["王", "李", "张", "刘", "陈", "杨", "黄", "赵", "吴", "周",
                              "徐", "孙", "马", "朱", "胡", "林", "郭", "何", "高", "梁",
                              "郑", "罗", "宋", "谢", "唐", "韩", "曹", "许", "邓", "萧"]
        member_last_names = [
            "秀英", "敏", "静", "丽", "娟", "燕", "艳", "芳", "磊", "强",
            "军", "洋", "勇", "艳", "杰", "涛", "明", "超", "霞", "平",
            "刚", "桂英", "文", "华", "建华", "志强", "晓明", "丽娟", "玉兰", "桂兰"
        ]
        member_levels = ["普通会员", "银卡会员", "金卡会员", "钻石会员", "黑卡会员"]

        members_count = 180
        for i in range(1, members_count + 1):
            name = random.choice(member_first_names) + random.choice(member_last_names)
            while True:
                if not any(m.member_name == name for m in locals().get("_member_check", [])):
                    break
                name = random.choice(member_first_names) + random.choice(member_last_names) + str(i)
            session.add(Member(
                member_no=f"M{i:05d}",
                member_name=name,
                gender=random.choice(["男", "女"]),
                phone=f"139{random.randint(10000000, 99999999)}",
                region_id=random.choice(region_ids),
                member_level=random.choices(member_levels, weights=[4, 3, 2, 0.7, 0.3])[0],
            ))
        session.flush()
        member_ids = [m.id for m in session.query(Member).all()]
        members_list = session.query(Member).all()
        coaches_list = session.query(Coach).all()
        regions_list = session.query(Region).all()

        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        time_slots = [
            (time(8, 0), time(9, 0)),
            (time(9, 0), time(10, 0)),
            (time(10, 0), time(11, 0)),
            (time(11, 0), time(12, 0)),
            (time(14, 0), time(15, 0)),
            (time(15, 0), time(16, 0)),
            (time(16, 0), time(17, 0)),
            (time(17, 0), time(18, 0)),
            (time(18, 0), time(19, 0)),
            (time(19, 0), time(20, 0)),
            (time(20, 0), time(21, 0)),
        ]
        course_types = ["私教课", "拉伸课", "康复课", "拳击课", "瑜伽课", "普拉提"]

        current = start_date
        schedule_counter = 1
        schedules_list = []
        conflict_injected = 0
        while current <= end_date:
            dow = current.weekday()
            day_factor = 1.3 if dow >= 5 else (1.15 if dow in [2, 4] else 1.0)

            for coach in coaches_list:
                slots_per_coach = max(1, int(round(random.gauss(4, 1.5) * day_factor)))
                slots_per_coach = min(slots_per_coach, 8)

                selected_slots = random.sample(time_slots, min(slots_per_coach, len(time_slots)))

                for start_t, end_t in selected_slots:
                    region_id = coach.region_id or random.choice(region_ids)
                    schedule_no = f"SCH{current.strftime('%Y%m%d')}{schedule_counter:06d}"
                    schedule_counter += 1
                    max_cap = random.choices([1, 1, 1, 2], weights=[70, 15, 10, 5])[0]
                    if random.random() < 0.055:
                        actual = max_cap + random.randint(1, 3)
                    elif random.random() < 0.82:
                        actual = random.randint(0, max_cap)
                    else:
                        actual = 0

                    status_choices = ["scheduled", "completed", "cancelled"]
                    if current < end_date - timedelta(days=1):
                        status_weights = [5, 88, 7]
                    else:
                        status_weights = [85, 10, 5]
                    status = random.choices(status_choices, weights=status_weights)[0]

                    sched = CourseSchedule(
                        schedule_no=schedule_no,
                        course_date=current,
                        start_time=start_t,
                        end_time=end_t,
                        coach_id=coach.id,
                        region_id=region_id,
                        course_type=random.choice(course_types),
                        course_name=random.choice(["一对一", "一对二"]) + "私教课",
                        max_capacity=max_cap,
                        actual_capacity=actual,
                        status=status,
                        batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
                    )
                    schedules_list.append(sched)
            current += timedelta(days=1)

        for s in schedules_list:
            session.add(s)
        session.flush()
        schedule_no_to_id = {s.schedule_no: s.id for s in schedules_list}
        print(f"  生成课程排期: {len(schedules_list)} 条")

        schedules_df = pd.DataFrame([{
            "id": s.id,
            "schedule_no": s.schedule_no,
            "course_date": s.course_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "coach_id": s.coach_id,
            "region_id": s.region_id,
            "max_capacity": s.max_capacity,
            "actual_capacity": s.actual_capacity,
            "status": s.status,
        } for s in schedules_list])

        appointments_list = []
        attendance_list = []
        appt_counter = 1

        appt_status_choices = ["booked", "attended", "cancelled", "no_show"]

        inject_conflict_schedule_ids = set()
        num_conflict_inject = 15
        if len(schedules_list) >= num_conflict_inject:
            selected_for_conflict = random.sample(
                [s for s in schedules_list if s.status != "cancelled"],
                min(num_conflict_inject, len(schedules_list))
            )
            inject_conflict_schedule_ids = {s.id for s in selected_for_conflict}

        for idx, sched in enumerate(schedules_list):
            if sched.status == "cancelled":
                continue
            if sched.actual_capacity <= 0:
                continue

            if sched.course_date < end_date - timedelta(days=0):
                book_prob = 0.87
            else:
                book_prob = 0.72

            if random.random() < book_prob:
                num_booked = sched.actual_capacity

                member_pool = [m for m in members_list
                               if m.region_id is None or m.region_id == sched.region_id]
                if not member_pool:
                    member_pool = members_list
                sample_size = min(num_booked, len(member_pool))
                selected_members = random.sample(member_pool, sample_size)

                for member in selected_members:
                    appointment_no = f"APT{sched.course_date.strftime('%Y%m%d')}{appt_counter:06d}"
                    appt_counter += 1

                    is_rescheduled = random.random() < 0.12
                    original_no = None
                    if is_rescheduled:
                        original_no = f"APT{(sched.course_date - timedelta(days=random.randint(3, 10))).strftime('%Y%m%d')}{random.randint(1000, 99999):06d}"

                    if sched.status == "completed":
                        weights = [3, 72, 13, 12]
                    elif sched.course_date > end_date - timedelta(days=1):
                        weights = [80, 10, 7, 3]
                    else:
                        weights = [15, 58, 15, 12]
                    status = random.choices(appt_status_choices, weights=weights)[0]

                    book_days_before = max(0, min(14, int(random.gauss(5, 3))))
                    booked_at_date = sched.course_date - timedelta(days=book_days_before)
                    booked_at = datetime.combine(booked_at_date, time(random.randint(9, 21), random.randint(0, 59)))

                    appt = Appointment(
                        appointment_no=appointment_no,
                        schedule_id=sched.id,
                        member_id=member.id,
                        coach_id=sched.coach_id,
                        region_id=sched.region_id,
                        appointment_date=sched.course_date,
                        start_time=sched.start_time,
                        end_time=sched.end_time,
                        status=status,
                        booked_at=booked_at,
                        cancelled_at=(datetime.combine(sched.course_date - timedelta(days=random.randint(0, 2)),
                                                       time(random.randint(8, 22), random.randint(0, 59)))
                                      if status == "cancelled" else None),
                        cancel_reason=random.choice(["临时有事", "身体不适", "工作加班", None, None])
                        if status == "cancelled" else None,
                        is_rescheduled=is_rescheduled,
                        original_appointment_no=original_no,
                        batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
                    )
                    appointments_list.append(appt)

                    if status == "attended":
                        st = sched.start_time
                        late_min = max(0, int(random.gauss(2, 5)))
                        actual_start = datetime.combine(
                            sched.course_date,
                            time(st.hour, st.minute)
                        ) + timedelta(minutes=late_min)
                        dur_h = (sched.end_time.hour * 60 + sched.end_time.minute -
                                 sched.start_time.hour * 60 - sched.start_time.minute)
                        actual_end = actual_start + timedelta(minutes=max(20, dur_h + random.randint(-10, 15)))

                        attendance_list.append({
                            "appointment_no": appointment_no,
                            "member_id": member.id,
                            "coach_id": sched.coach_id,
                            "region_id": sched.region_id,
                            "check_in_time": actual_start,
                            "check_out_time": actual_end,
                            "actual_start_time": actual_start,
                            "actual_end_time": actual_end,
                            "is_attended": True,
                            "attendance_status": "attended",
                            "late_minutes": late_min,
                            "early_leave_minutes": 0,
                            "matched_access_id": None,
                        })

        for a in appointments_list:
            session.add(a)
        session.flush()
        appt_no_to_id = {a.appointment_no: a.id for a in appointments_list}

        attendance_records = []
        for att_dict in attendance_list:
            rec = AttendanceRecord(
                appointment_id=appt_no_to_id.get(att_dict["appointment_no"], 0),
                appointment_no=att_dict["appointment_no"],
                member_id=att_dict["member_id"],
                coach_id=att_dict["coach_id"],
                region_id=att_dict["region_id"],
                check_in_time=att_dict["check_in_time"],
                check_out_time=att_dict["check_out_time"],
                actual_start_time=att_dict["actual_start_time"],
                actual_end_time=att_dict["actual_end_time"],
                is_attended=att_dict["is_attended"],
                attendance_status=att_dict["attendance_status"],
                late_minutes=att_dict["late_minutes"],
                early_leave_minutes=att_dict["early_leave_minutes"],
                matched_access_id=att_dict["matched_access_id"],
            )
            attendance_records.append(rec)

        for r in attendance_records:
            session.add(r)
        session.flush()
        print(f"  生成预约记录: {len(appointments_list)} 条")
        print(f"  生成考勤记录: {len(attendance_records)} 条")

        reschedule_list = []
        resched_counter = 1
        rescheduled_appts = [a for a in appointments_list if a.is_rescheduled]
        for appt in rescheduled_appts:
            old_date = appt.appointment_date - timedelta(days=random.randint(1, 10))
            old_slot = random.choice(time_slots)
            reasons = ["会员临时有事", "教练临时调课", "会员身体不适", "系统操作失误",
                       "天气原因", "会员要求改期", "场馆临时维护"]
            types = ["member", "coach", "system"]
            operators = ["admin", "前台小丽", "前台小王", "系统", "教练本人", "会员自助"]

            reschedule_list.append(RescheduleRecord(
                record_no=f"RES{appt.appointment_date.strftime('%Y%m%d')}{resched_counter:05d}",
                appointment_no=appt.appointment_no,
                old_schedule_id=random.randint(1, max(1, len(schedules_list))),
                new_schedule_id=appt.schedule_id,
                old_date=old_date,
                old_start_time=old_slot[0],
                old_end_time=old_slot[1],
                new_date=appt.appointment_date,
                new_start_time=appt.start_time,
                new_end_time=appt.end_time,
                reschedule_reason=random.choice(reasons),
                reschedule_type=random.choices(types, weights=[55, 25, 20])[0],
                operator=random.choice(operators),
                rescheduled_at=datetime.combine(
                    old_date, time(random.randint(9, 22), random.randint(0, 59))
                ) if old_date else datetime.now(),
                batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
            ))
            resched_counter += 1
        for r in reschedule_list:
            session.add(r)
        session.flush()
        print(f"  生成改约记录: {len(reschedule_list)} 条")

        access_list = []
        access_counter = 1
        current = start_date
        while current <= end_date:
            is_weekend = current.weekday() >= 5
            daily_ratio = 0.50 if is_weekend else 0.34
            daily_access = max(10, int(len(members_list) * daily_ratio * random.uniform(0.8, 1.2)))

            selected = random.sample(members_list, min(daily_access, len(members_list)))
            for member in selected:
                region_id = member.region_id or random.choice(region_ids)

                check_in_hour = random.choices(
                    [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
                    weights=[3, 8, 12, 10, 6, 3, 3, 7, 9, 10, 11, 14, 13, 7, 2]
                )[0]
                check_in_min = random.randint(0, 59)
                in_dt = datetime.combine(current, time(check_in_hour, check_in_min))

                access_list.append(AccessRecord(
                    record_no=f"ACC{current.strftime('%Y%m%d')}{access_counter:06d}",
                    member_id=member.id,
                    member_no=member.member_no,
                    region_id=region_id,
                    access_type="entry",
                    access_time=in_dt,
                    access_date=current,
                    device_no=f"DEV{random.randint(1, 4):02d}",
                    batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
                ))
                access_counter += 1

                if random.random() < 0.78:
                    stay_min = max(20, int(random.gauss(75, 30)))
                    out_dt = in_dt + timedelta(minutes=stay_min)
                    if out_dt.date() == current:
                        access_list.append(AccessRecord(
                            record_no=f"ACC{current.strftime('%Y%m%d')}{access_counter:06d}",
                            member_id=member.id,
                            member_no=member.member_no,
                            region_id=region_id,
                            access_type="exit",
                            access_time=out_dt,
                            access_date=current,
                            device_no=f"DEV{random.randint(1, 4):02d}",
                            batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
                        ))
                        access_counter += 1
            current += timedelta(days=1)
        for acc in access_list:
            session.add(acc)
        session.flush()
        print(f"  生成门禁记录: {len(access_list)} 条")

        bodytest_list = []
        test_counter = 1
        current = start_date
        while current <= end_date:
            if current.weekday() in [0, 2, 3, 5, 6]:
                num_tests = max(2, int(len(members_list) * 0.07 * random.uniform(0.7, 1.3)))
                selected = random.sample(members_list, min(num_tests, len(members_list)))
                for member in selected:
                    region_id = member.region_id or random.choice(region_ids)
                    height = round(random.uniform(150, 195), 2)
                    weight = round(random.uniform(42, 105), 2)
                    bmi = round(weight / ((height / 100) ** 2), 1)
                    test_hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
                    test_dt = datetime.combine(current, time(test_hour, random.randint(0, 59)))

                    bodytest_list.append(BodyTestRecord(
                        test_no=f"BODY{current.strftime('%Y%m%d')}{test_counter:05d}",
                        member_id=member.id,
                        member_no=member.member_no,
                        region_id=region_id,
                        test_date=current,
                        test_time=test_dt,
                        height=height,
                        weight=weight,
                        bmi=bmi,
                        body_fat_rate=round(random.uniform(10, 38), 1),
                        muscle_mass=round(random.uniform(28, 75), 2),
                        basal_metabolism=random.randint(1050, 2300),
                        visceral_fat_level=random.randint(1, 14),
                        moisture_rate=round(random.uniform(38, 68), 1),
                        batch_no=f"SEED_{datetime.now().strftime('%Y%m%d%H')}",
                    ))
                    test_counter += 1
            current += timedelta(days=1)
        for bt in bodytest_list:
            session.add(bt)
        session.flush()
        print(f"  生成体测记录: {len(bodytest_list)} 条")

        conflict_list = []
        conflict_counter = 1

        sorted_appts = sorted(
            [a for a in appointments_list if a.status != "cancelled"],
            key=lambda a: (a.coach_id, a.appointment_date, str(a.start_time))
        )
        for i in range(len(sorted_appts) - 1):
            a = sorted_appts[i]
            b = sorted_appts[i + 1]
            if (a.coach_id == b.coach_id and
                a.appointment_date == b.appointment_date and
                str(a.end_time) > str(b.start_time) and
                random.random() < 0.08):
                conflict_list.append(ConflictRecord(
                    conflict_no=f"CF{a.appointment_date.strftime('%Y%m%d')}{conflict_counter:05d}",
                    conflict_type="coach_double_book",
                    region_id=a.region_id,
                    coach_id=a.coach_id,
                    member_id=a.member_id,
                    conflict_date=a.appointment_date,
                    conflict_start_time=b.start_time,
                    conflict_end_time=a.end_time,
                    appointment_no_1=a.appointment_no,
                    appointment_no_2=b.appointment_no,
                    description=f"教练课程重叠:{a.start_time}-{a.end_time}与{b.start_time}-{b.end_time}",
                    severity="error",
                    is_resolved=random.random() < 0.35,
                    detected_at=datetime.now(),
                ))
                conflict_counter += 1

        sorted_appts_m = sorted(
            [a for a in appointments_list if a.status != "cancelled"],
            key=lambda a: (a.member_id, a.appointment_date, str(a.start_time))
        )
        for i in range(len(sorted_appts_m) - 1):
            a = sorted_appts_m[i]
            b = sorted_appts_m[i + 1]
            if (a.member_id == b.member_id and
                a.appointment_date == b.appointment_date and
                a.coach_id != b.coach_id and
                str(a.end_time) > str(b.start_time) and
                random.random() < 0.05):
                conflict_list.append(ConflictRecord(
                    conflict_no=f"CF{a.appointment_date.strftime('%Y%m%d')}{conflict_counter:05d}",
                    conflict_type="member_double_book",
                    region_id=a.region_id,
                    coach_id=a.coach_id,
                    member_id=a.member_id,
                    conflict_date=a.appointment_date,
                    conflict_start_time=b.start_time,
                    conflict_end_time=a.end_time,
                    appointment_no_1=a.appointment_no,
                    appointment_no_2=b.appointment_no,
                    description=f"会员课程重叠:{a.start_time}-{a.end_time}与{b.start_time}-{b.end_time}",
                    severity="warning",
                    is_resolved=random.random() < 0.55,
                    detected_at=datetime.now(),
                ))
                conflict_counter += 1

        for sched_id in inject_conflict_schedule_ids:
            target = next((s for s in schedules_list if s.id == sched_id), None)
            if target and target.actual_capacity > target.max_capacity:
                conflict_list.append(ConflictRecord(
                    conflict_no=f"CF{target.course_date.strftime('%Y%m%d')}{conflict_counter:05d}",
                    conflict_type="capacity_exceeded",
                    region_id=target.region_id,
                    coach_id=target.coach_id,
                    conflict_date=target.course_date,
                    conflict_start_time=target.start_time,
                    conflict_end_time=target.end_time,
                    schedule_no_1=target.schedule_no,
                    description=f"容量超出:{target.actual_capacity}/{target.max_capacity}",
                    severity="warning",
                    is_resolved=random.random() < 0.5,
                    detected_at=datetime.now(),
                ))
                conflict_counter += 1

        for cf in conflict_list:
            session.add(cf)
        session.flush()
        print(f"  生成冲突记录: {len(conflict_list)} 条")

        session.commit()
        print(f"\n测试数据生成完成！共计 {days} 天数据")
        print(f"  区域: {len(regions_list)} 个  教练: {len(coaches_list)} 个  会员: {len(members_list)} 个")
        print(f"  排期: {len(schedules_list)}  预约: {len(appointments_list)}  改约: {len(reschedule_list)}")
        print(f"  门禁: {len(access_list)}  体测: {len(bodytest_list)}  冲突: {len(conflict_list)}")

    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise e
    finally:
        session.close()
