from typing import List, Dict, Any
from datetime import date, timedelta
import random

from utils.db_adapter import get_session
from utils.db_adapter import Region, Coach, Member


def get_date_range(start_date: date = None, end_date: date = None, days: int = 30):
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=days)
    return start_date, end_date


def get_all_regions() -> List[Dict]:
    session = get_session()
    try:
        regions = session.query(Region).filter_by(is_active=True).all()
        return [
            {"id": r.id, "region_code": r.region_code, "region_name": r.region_name}
            for r in regions
        ]
    finally:
        session.close()


def get_all_coaches(region_id: int = None) -> List[Dict]:
    session = get_session()
    try:
        query = session.query(Coach).filter_by(is_active=True)
        if region_id:
            query = query.filter_by(region_id=region_id)
        coaches = query.all()
        return [
            {"id": c.id, "coach_no": c.coach_no, "coach_name": c.coach_name, "region_id": c.region_id}
            for c in coaches
        ]
    finally:
        session.close()


def get_all_members(region_id: int = None) -> List[Dict]:
    session = get_session()
    try:
        query = session.query(Member).filter_by(is_active=True)
        if region_id:
            query = query.filter_by(region_id=region_id)
        members = query.all()
        return [
            {"id": m.id, "member_no": m.member_no, "member_name": m.member_name, "region_id": m.region_id}
            for m in members
        ]
    finally:
        session.close()


def mock_fetch_schedules(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    regions = get_all_regions()
    coaches = get_all_coaches()
    schedules = []
    current = start_date
    time_slots = [
        ("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"),
        ("14:00", "15:00"), ("15:00", "16:00"), ("16:00", "17:00"),
        ("17:00", "18:00"), ("18:00", "19:00"), ("19:00", "20:00"), ("20:00", "21:00"),
    ]
    course_types = ["私教课", "拉伸课", "康复课", "拳击课", "瑜伽课"]

    schedule_counter = 1
    while current <= end_date:
        if current.weekday() >= 5:
            day_factor = 1.3
        else:
            day_factor = 1.0

        slots_per_coach = int(4 * day_factor)

        for coach in coaches:
            selected_slots = random.sample(time_slots, min(slots_per_coach, len(time_slots)))
            for start_t, end_t in selected_slots:
                region_id = coach["region_id"] or random.choice(regions)["id"]
                sched_date = current
                schedule_no = f"SCH{current.strftime('%Y%m%d')}{schedule_counter:05d}"
                schedule_counter += 1

                schedules.append({
                    "schedule_no": schedule_no,
                    "course_date": sched_date,
                    "start_time": start_t,
                    "end_time": end_t,
                    "coach_id": coach["id"],
                    "region_id": region_id,
                    "course_type": random.choice(course_types),
                    "course_name": random.choice(["一对一", "一对二"]) + " " + random.choice(course_types),
                    "max_capacity": random.choice([1, 1, 1, 2]),
                    "actual_capacity": random.randint(0, 1),
                    "status": random.choice(["scheduled", "completed", "cancelled"]),
                })
        current += timedelta(days=1)
    return schedules


def mock_fetch_appointments(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    from utils.db_adapter import CourseSchedule

    session = get_session()
    try:
        schedules = session.query(CourseSchedule).filter(
            CourseSchedule.course_date >= start_date,
            CourseSchedule.course_date <= end_date
        ).all()
        members = get_all_members()

        appointments = []
        appt_counter = 1
        for sched in schedules:
            if sched.status == "cancelled":
                continue
            if sched.actual_capacity <= 0:
                continue
            if random.random() < 0.85:
                num_booked = sched.actual_capacity
                selected_members = random.sample(members, min(num_booked, len(members)))
                for member in selected_members:
                    appointment_no = f"APT{sched.course_date.strftime('%Y%m%d')}{appt_counter:06d}"
                    appt_counter += 1
                    is_rescheduled = random.random() < 0.12
                    status_choices = ["booked", "attended", "cancelled", "no_show"]
                    status_weights = [0.15, 0.60, 0.15, 0.10]
                    status = random.choices(status_choices, weights=status_weights)[0]

                    appointments.append({
                        "appointment_no": appointment_no,
                        "schedule_id": sched.id,
                        "member_id": member["id"],
                        "coach_id": sched.coach_id,
                        "region_id": sched.region_id,
                        "appointment_date": sched.course_date,
                        "start_time": sched.start_time,
                        "end_time": sched.end_time,
                        "status": status,
                        "booked_at": f"{sched.course_date - timedelta(days=random.randint(1, 7))} 10:00:00",
                        "is_rescheduled": is_rescheduled,
                        "original_appointment_no": f"APT{(sched.course_date - timedelta(days=random.randint(3, 10))).strftime('%Y%m%d')}{random.randint(1000, 9999):06d}" if is_rescheduled else None,
                    })
        return appointments
    finally:
        session.close()


def mock_fetch_access_records(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    members = get_all_members()
    regions = get_all_regions()
    records = []
    record_counter = 1
    current = start_date

    while current <= end_date:
        is_weekend = current.weekday() >= 5
        daily_records = int(len(members) * (0.45 if is_weekend else 0.30))

        selected = random.sample(members, min(daily_records, len(members)))
        for member in selected:
            region_id = member["region_id"] or random.choice(regions)["id"]
            check_in_hour = random.choice([7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
            check_in_min = random.randint(0, 59)
            in_time = f"{current.isoformat()} {check_in_hour:02d}:{check_in_min:02d}:00"

            record_no = f"ACC{current.strftime('%Y%m%d')}{record_counter:06d}"
            record_counter += 1
            records.append({
                "record_no": record_no,
                "member_id": member["id"],
                "member_no": member["member_no"],
                "region_id": region_id,
                "access_type": "entry",
                "access_time": in_time,
                "access_date": current,
                "device_no": f"DEV{random.randint(1, 5):02d}",
            })

            if random.random() < 0.8:
                out_hour = min(check_in_hour + random.randint(1, 3), 22)
                out_min = random.randint(0, 59)
                out_time = f"{current.isoformat()} {out_hour:02d}:{out_min:02d}:00"
                record_no_out = f"ACC{current.strftime('%Y%m%d')}{record_counter:06d}"
                record_counter += 1
                records.append({
                    "record_no": record_no_out,
                    "member_id": member["id"],
                    "member_no": member["member_no"],
                    "region_id": region_id,
                    "access_type": "exit",
                    "access_time": out_time,
                    "access_date": current,
                    "device_no": f"DEV{random.randint(1, 5):02d}",
                })
        current += timedelta(days=1)
    return records


def mock_fetch_bodytest_records(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    members = get_all_members()
    records = []
    test_counter = 1
    current = start_date

    while current <= end_date:
        if current.weekday() in [0, 3, 5]:
            num_tests = max(1, int(len(members) * 0.06))
            selected = random.sample(members, min(num_tests, len(members)))
            for member in selected:
                region_id = member["region_id"] or (get_all_regions()[0]["id"] if get_all_regions() else 1)
                test_no = f"BODY{current.strftime('%Y%m%d')}{test_counter:05d}"
                test_counter += 1
                height = round(random.uniform(155, 190), 2)
                weight = round(random.uniform(45, 100), 2)
                bmi = round(weight / ((height / 100) ** 2), 1)
                records.append({
                    "test_no": test_no,
                    "member_id": member["id"],
                    "member_no": member["member_no"],
                    "region_id": region_id,
                    "test_date": current,
                    "height": height,
                    "weight": weight,
                    "bmi": bmi,
                    "body_fat_rate": round(random.uniform(10, 35), 1),
                    "muscle_mass": round(random.uniform(30, 70), 2),
                    "basal_metabolism": random.randint(1100, 2200),
                    "visceral_fat_level": random.randint(1, 12),
                    "moisture_rate": round(random.uniform(40, 65), 1),
                })
        current += timedelta(days=1)
    return records


def mock_fetch_reschedule_records(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    from utils.db_adapter import Appointment, CourseSchedule

    session = get_session()
    try:
        appointments = session.query(Appointment).filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
            Appointment.is_rescheduled == True
        ).all()

        records = []
        rec_counter = 1
        for appt in appointments:
            original_schedule = session.query(CourseSchedule).filter_by(id=appt.schedule_id).first()
            if not original_schedule:
                continue

            old_date = appt.appointment_date - timedelta(days=random.randint(1, 7))
            time_slots = [("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"),
                          ("14:00", "15:00"), ("15:00", "16:00"), ("16:00", "17:00"),
                          ("17:00", "18:00"), ("18:00", "19:00"), ("19:00", "20:00")]
            old_slot = random.choice(time_slots)
            reasons = ["会员临时有事", "教练临时调课", "会员身体不适", "系统操作失误", "天气原因"]
            types = ["member", "coach", "system"]

            record_no = f"RES{appt.appointment_date.strftime('%Y%m%d')}{rec_counter:05d}"
            rec_counter += 1
            records.append({
                "record_no": record_no,
                "appointment_no": appt.appointment_no,
                "old_schedule_id": random.randint(1, 500),
                "new_schedule_id": appt.schedule_id,
                "old_date": old_date,
                "old_start_time": old_slot[0],
                "old_end_time": old_slot[1],
                "new_date": appt.appointment_date,
                "new_start_time": str(appt.start_time),
                "new_end_time": str(appt.end_time),
                "reschedule_reason": random.choice(reasons),
                "reschedule_type": random.choice(types),
                "operator": random.choice(["admin", "前台小丽", "前台小王", "系统"]),
            })
        return records
    finally:
        session.close()
