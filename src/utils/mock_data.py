import polars as pl
import random
import uuid
from datetime import date, timedelta, datetime
from typing import List, Tuple


class MockDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.apartments = ["APT-A", "APT-B", "APT-C", "APT-D", "APT-E"]
        self.rooms_per_apt = 5
        self.cleaners = ["CL001", "CL002", "CL003", "CL004", "CL005"]
        self.cleaner_names = {
            "CL001": "张师傅",
            "CL002": "李师傅",
            "CL003": "王师傅",
            "CL004": "赵师傅",
            "CL005": "刘师傅",
        }
        self.time_slots = ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"]
        self.weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

    def _gen_id(self) -> str:
        return str(uuid.uuid4())[:8]

    def generate_all_rooms(self) -> List[Tuple[str, str]]:
        rooms = []
        for apt in self.apartments:
            for i in range(1, self.rooms_per_apt + 1):
                rooms.append((apt, f"{apt}-{i:02d}"))
        return rooms

    def generate_meter_readings(self, start_date: date, end_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        current = start_date
        while current <= end_date:
            for apt_id, room_id in random.sample(rooms, k=random.randint(len(rooms) // 2, len(rooms))):
                data.append({
                    "id": self._gen_id(),
                    "apartment_id": apt_id,
                    "room_id": room_id,
                    "reading_date": current,
                    "water_meter": round(random.uniform(50, 200), 2),
                    "electric_meter": round(random.uniform(100, 500), 2),
                    "gas_meter": round(random.uniform(20, 80), 2),
                    "source": random.choice(["manual", "smart"]),
                    "version": 1,
                    "created_at": datetime.now(),
                })
            current += timedelta(days=random.randint(5, 15))
        return pl.DataFrame(data)

    def generate_e_contracts(self, as_of_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        for i, (apt_id, room_id) in enumerate(rooms):
            frequency = random.choice(["每周一次", "每周两次", "每两周一次"])
            weekday = random.choice(self.weekdays)
            time_slot = random.choice(self.time_slots)

            data.append({
                "id": self._gen_id(),
                "contract_no": f"HT{2024}{i + 1:04d}",
                "apartment_id": apt_id,
                "room_id": room_id,
                "tenant_name": f"租户{i + 1:03d}",
                "start_date": as_of_date - timedelta(days=random.randint(30, 365)),
                "end_date": as_of_date + timedelta(days=random.randint(30, 365)),
                "cleaning_frequency": frequency,
                "cleaning_weekday": weekday,
                "cleaning_time_slot": time_slot,
                "version": 1,
                "is_current": True,
                "created_at": datetime.now(),
            })
        return pl.DataFrame(data)

    def generate_crm_schedules(self, start_date: date, end_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        current = start_date
        schedule_id = 1
        while current <= end_date:
            for apt_id, room_id in rooms:
                if random.random() < 0.6:
                    time_slot = random.choice(self.time_slots)
                    cleaner = random.choice(self.cleaners)
                    status = random.choices(
                        ["scheduled", "completed", "cancelled", "rescheduled"],
                        weights=[0.3, 0.5, 0.1, 0.1]
                    )[0]

                    if random.random() < 0.08:
                        dup_room = random.choice(rooms)
                        if dup_room[1] != room_id:
                            pass

                    data.append({
                        "id": f"SCH{schedule_id:06d}",
                        "apartment_id": apt_id,
                        "room_id": room_id,
                        "cleaning_date": current,
                        "time_slot": time_slot,
                        "cleaner_id": cleaner,
                        "cleaner_name": self.cleaner_names[cleaner],
                        "status": status,
                        "source": "CRM",
                        "created_at": datetime.now(),
                    })
                    schedule_id += 1
            current += timedelta(days=1)

        for i in range(random.randint(3, 8)):
            apt_id = random.choice(self.apartments)
            apt_rooms = [r for r in rooms if r[0] == apt_id]
            if len(apt_rooms) >= 2:
                room1, room2 = random.sample(apt_rooms, 2)
                conflict_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
                time_slot = random.choice(self.time_slots)
                cleaner = random.choice(self.cleaners)

                data.append({
                    "id": f"SCH{schedule_id:06d}",
                    "apartment_id": apt_id,
                    "room_id": room1[1],
                    "cleaning_date": conflict_date,
                    "time_slot": time_slot,
                    "cleaner_id": cleaner,
                    "cleaner_name": self.cleaner_names[cleaner],
                    "status": "scheduled",
                    "source": "CRM",
                    "created_at": datetime.now(),
                })
                schedule_id += 1
                data.append({
                    "id": f"SCH{schedule_id:06d}",
                    "apartment_id": apt_id,
                    "room_id": room2[1],
                    "cleaning_date": conflict_date,
                    "time_slot": time_slot,
                    "cleaner_id": cleaner,
                    "cleaner_name": self.cleaner_names[cleaner],
                    "status": "scheduled",
                    "source": "CRM",
                    "created_at": datetime.now(),
                })
                schedule_id += 1

        return pl.DataFrame(data)

    def generate_reschedule_records(self, start_date: date, end_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        for i in range(random.randint(20, 40)):
            apt_id, room_id = random.choice(rooms)
            orig_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            orig_slot = random.choice(self.time_slots)
            new_date = orig_date + timedelta(days=random.randint(1, 7))
            new_slot = random.choice(self.time_slots)

            data_quality = random.choices(
                ["complete", "missing_reason", "missing_operator", "incomplete"],
                weights=[0.7, 0.1, 0.1, 0.1]
            )[0]

            reason = ""
            operator = ""
            if data_quality == "complete":
                reason = random.choice(["租户临时有事", "保洁员调班", "设备故障", "天气原因"])
                operator = random.choice(["调度员A", "调度员B", "调度员C"])
            elif data_quality == "missing_reason":
                operator = random.choice(["调度员A", "调度员B"])
            elif data_quality == "missing_operator":
                reason = random.choice(["租户临时有事", "保洁员调班"])

            data.append({
                "id": f"RES{i + 1:05d}",
                "original_schedule_id": f"SCH{random.randint(1000, 9999):06d}",
                "apartment_id": apt_id,
                "room_id": room_id,
                "original_date": orig_date,
                "original_time_slot": orig_slot,
                "new_date": new_date,
                "new_time_slot": new_slot,
                "reason": reason,
                "operator": operator,
                "status": random.choice(["completed", "pending", "cancelled"]),
                "data_quality": data_quality,
                "created_at": datetime.now(),
            })
        return pl.DataFrame(data)

    def generate_attendance_records(self, start_date: date, end_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        record_id = 1
        current = start_date
        while current <= end_date:
            for apt_id, room_id in rooms:
                if random.random() < 0.55:
                    time_slot = random.choice(self.time_slots)
                    status = random.choices(
                        ["arrived", "late", "no_show", "abnormal"],
                        weights=[0.75, 0.12, 0.08, 0.05]
                    )[0]

                    actual_arrival = None
                    actual_departure = None
                    remark = ""

                    if status in ["arrived", "late"]:
                        slot_hour = int(time_slot.split(":")[0])
                        slot_minute = int(time_slot.split("-")[0].split(":")[1]) if "-" in time_slot else 0
                        base_time = datetime(
                            current.year, current.month, current.day,
                            slot_hour, slot_minute
                        )
                        offset_min = random.randint(0, 59)
                        if status == "late":
                            offset_min += random.randint(30, 90)
                        actual_arrival = base_time + timedelta(minutes=offset_min)
                        actual_departure = actual_arrival + timedelta(hours=random.randint(1, 2))
                    elif status == "no_show":
                        remark = "保洁员未到场"
                    elif status == "abnormal":
                        remark = random.choice(["保洁质量不达标", "租户投诉", "中途离场"])

                    data.append({
                        "id": f"ATT{record_id:06d}",
                        "schedule_id": f"SCH{random.randint(1000, 9999):06d}",
                        "apartment_id": apt_id,
                        "room_id": room_id,
                        "scheduled_date": current,
                        "scheduled_time_slot": time_slot,
                        "actual_arrival_time": actual_arrival,
                        "actual_departure_time": actual_departure,
                        "status": status,
                        "remark": remark,
                        "created_at": datetime.now(),
                    })
                    record_id += 1
            current += timedelta(days=1)
        return pl.DataFrame(data)

    def generate_alert_list(self, start_date: date, end_date: date) -> pl.DataFrame:
        rooms = self.generate_all_rooms()
        data = []
        for i in range(random.randint(10, 20)):
            apt_id, room_id = random.choice(rooms)
            alert_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            alert_type = random.choice(["attendance", "conflict", "quality", "safety"])
            severity = random.choices(["high", "medium", "low"], weights=[0.3, 0.4, 0.3])[0]
            descriptions = {
                "attendance": "连续3天未到场",
                "conflict": "时段冲突未解决",
                "quality": "保洁质量投诉",
                "safety": "安全隐患",
            }
            data.append({
                "id": f"ALT{i + 1:05d}",
                "alert_type": alert_type,
                "apartment_id": apt_id,
                "room_id": room_id,
                "schedule_id": f"SCH{random.randint(1000, 9999):06d}",
                "alert_date": alert_date,
                "description": descriptions[alert_type],
                "severity": severity,
                "is_resolved": random.choice([True, False]),
                "created_at": datetime.now(),
            })
        return pl.DataFrame(data)

    def populate_database(self, db, start_date: date, end_date: date):
        meter = self.generate_meter_readings(start_date, end_date)
        contracts = self.generate_e_contracts(start_date)
        crm = self.generate_crm_schedules(start_date, end_date)
        reschedule = self.generate_reschedule_records(start_date, end_date)
        attendance = self.generate_attendance_records(start_date, end_date)
        alerts = self.generate_alert_list(start_date, end_date)

        db.insert_dataframe("meter_readings", meter)
        db.insert_dataframe("e_contracts", contracts)
        db.insert_dataframe("crm_schedules", crm)
        db.insert_dataframe("reschedule_records", reschedule)
        db.insert_dataframe("attendance_records", attendance)
        db.insert_dataframe("alert_list", alerts)

        return {
            "meter_readings": len(meter),
            "e_contracts": len(contracts),
            "crm_schedules": len(crm),
            "reschedule_records": len(reschedule),
            "attendance_records": len(attendance),
            "alert_list": len(alerts),
        }
