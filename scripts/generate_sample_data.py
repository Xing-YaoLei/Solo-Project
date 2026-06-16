import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
import numpy as np
from datetime import datetime, timedelta, date
from database.connection import get_session
from database.models import (
    Patient, Doctor, Appointment, TreatmentPlan, FollowUpTask,
    ImagingRecord, BillingRecord, SyncLog
)
from config.settings import Config

random.seed(42)
np.random.seed(42)


def generate_patients(count=50):
    session = get_session()
    surnames = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴",
                "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"]
    given_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋",
                   "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
    patients = []
    for i in range(count):
        p = Patient(
            patient_no=f"P{20240000 + i:08d}",
            name=random.choice(surnames) + random.choice(given_names),
            phone=f"1{random.choice(['3','5','7','8','9'])}{random.randint(100000000, 999999999)}",
            gender=random.choice(["男", "女"]),
            birth_date=date.today() - timedelta(days=random.randint(18*365, 70*365))
        )
        patients.append(p)
        session.add(p)
    session.commit()
    print(f"✅ 生成患者数据: {len(patients)} 条")
    return patients


def generate_doctors(count=6):
    session = get_session()
    doctor_names = [
        ("D001", "王医生", "牙周科", "主治医师"),
        ("D002", "李医生", "牙周科", "副主任医师"),
        ("D003", "张医生", "预防科", "主治医师"),
        ("D004", "刘医生", "牙周科", "主任医师"),
        ("D005", "陈医生", "预防科", "住院医师"),
        ("D006", "赵医生", "综合科", "主治医师")
    ]
    doctors = []
    for no, name, dept, title in doctor_names:
        d = Doctor(doctor_no=no, name=name, department=dept, title=title, is_active=True)
        doctors.append(d)
        session.add(d)
    session.commit()
    print(f"✅ 生成医生数据: {len(doctors)} 条")
    return doctors


def generate_appointments(patients, doctors, days_back=60):
    session = get_session()
    appointments = []
    today = date.today()
    statuses = ["completed", "completed", "completed", "completed", "completed",
                "scheduled", "no_show", "cancelled", "done"]
    cleaning_types = [
        ("超声波洁牙", "111"),
        ("喷砂洁牙", "112"),
        ("龈下刮治", "113"),
        ("牙周维护", "121")
    ]
    appt_idx = 0
    for day_offset in range(days_back, -1, -1):
        current_date = today - timedelta(days=day_offset)
        day_of_week = current_date.weekday()
        daily_count = 0
        if day_of_week < 5:
            daily_count = random.randint(8, 18)
        else:
            daily_count = random.randint(12, 25)

        for _ in range(daily_count):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            proc_name, proc_code = random.choice(cleaning_types)

            if current_date >= today:
                status = "scheduled"
            else:
                status = random.choice(statuses)

            his_created = datetime.combine(current_date, datetime.min.time()) + timedelta(
                days=-random.randint(1, 14),
                hours=random.randint(8, 20),
                minutes=random.randint(0, 59)
            )
            synced_at = his_created + timedelta(
                minutes=random.randint(5, 240)
            )
            sync_delay = (synced_at - his_created).total_seconds() / 60

            anom_flags = []
            if sync_delay > Config.HIS_DELAY_THRESHOLD_MINUTES and random.random() < 0.3:
                anom_flags.append("HIS_DELAY")
            if status in ["completed", "done"] and current_date < today - timedelta(days=1) and random.random() < 0.12:
                anom_flags.append("IMAGING_MISSING")
            if random.random() < 0.05:
                anom_flags.append("BILLING_CALIBER")

            is_no_show = status in ["no_show", "cancelled", "missed"]
            if day_offset in [12, 13, 14, 15] and random.random() < 0.25:
                status = "no_show"
                is_no_show = True
            if day_offset in [35, 36, 37] and random.random() < 0.22:
                status = "cancelled"
                is_no_show = True

            review_notes = {
                "HIS_DELAY": ["HIS系统维护导致数据延迟同步", "网络中断导致同步延迟", "周末同步任务积压"],
                "IMAGING_MISSING": ["患者拒绝拍X光", "影像设备故障", "影像传输失败待补拍"],
                "BILLING_CALIBER": ["收费项目编码调整v2版本", "折扣规则口径变更", "医保目录更新"]
            }
            review_note_text = ""
            if anom_flags:
                notes = []
                for af in anom_flags:
                    if random.random() < 0.7:
                        notes.append(random.choice(review_notes.get(af, ["已登记待处理"])))
                review_note_text = " | ".join(notes)

            appt = Appointment(
                appointment_no=f"A{202400000000 + appt_idx:012d}",
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=current_date,
                appointment_time=f"{random.randint(8,17):02d}:{random.choice(['00','15','30','45'])}",
                procedure_type=proc_name,
                procedure_code=proc_code,
                status=status,
                status_changed_at=synced_at,
                is_cleaning=True,
                source="HIS",
                his_created_at=his_created,
                his_updated_at=synced_at - timedelta(minutes=random.randint(0, 30)),
                synced_at=synced_at,
                sync_delay_minutes=sync_delay,
                anomaly_flag="|".join(anom_flags) if anom_flags else None,
                review_note=review_note_text
            )
            appointments.append(appt)
            session.add(appt)
            appt_idx += 1

    session.commit()
    print(f"✅ 生成预约数据: {len(appointments)} 条")
    return appointments


def generate_related_data(patients, appointments, doctors):
    session = get_session()
    plans = []
    followups = []
    imaging_records = []
    billing_records = []

    stage_options = ["初诊检查", "基础洁治", "深度清洁", "复查评估"]

    for appt in appointments:
        if appt.status not in ["no_show", "cancelled"]:
            tp = TreatmentPlan(
                plan_no=f"TP{appt.id:010d}",
                appointment_id=appt.id,
                patient_id=appt.patient_id,
                plan_date=appt.appointment_date - timedelta(days=random.randint(0, 7)),
                plan_content=f"{appt.procedure_type}治疗方案，口腔卫生指导",
                estimated_fee=round(random.uniform(200, 2000), 2),
                actual_fee=round(random.uniform(180, 2200), 2) if appt.status in ["completed", "done"] else 0,
                status="completed" if appt.status in ["completed", "done"] else random.choice(["pending", "in_progress"]),
                has_cleaning=True,
                cleaning_stage=random.choice(stage_options)
            )
            plans.append(tp)
            session.add(tp)

        if appt.status in ["completed", "done"] and appt.appointment_date < date.today() - timedelta(days=7):
            fu_date = appt.appointment_date + timedelta(days=random.randint(7, 180))
            if fu_date <= date.today():
                fu_status = random.choice(["completed", "completed", "pending", "overdue"])
            else:
                fu_status = "pending"
            fu = FollowUpTask(
                task_no=f"FU{appt.id:010d}",
                appointment_id=appt.id,
                patient_id=appt.patient_id,
                task_date=fu_date,
                task_type=random.choice(["电话回访", "复查提醒", "微信通知"]),
                assigned_to=random.choice(doctors).name,
                status=fu_status,
                completed_at=datetime.combine(fu_date, datetime.min.time()) + timedelta(hours=10) if fu_status == "completed" else None,
                content="洁牙后口腔状况检查，牙周情况评估",
                result_note="患者情况良好，建议半年复查" if fu_status == "completed" else ""
            )
            followups.append(fu)
            session.add(fu)

        has_imaging_missing = appt.anomaly_flag and "IMAGING_MISSING" in (appt.anomaly_flag or "")
        if not has_imaging_missing and appt.status in ["completed", "done"]:
            img_types = ["全景片", "根尖片", "CBCT"]
            img = ImagingRecord(
                image_no=f"IMG{appt.id:010d}",
                appointment_id=appt.id,
                patient_id=appt.patient_id,
                image_type=random.choice(img_types),
                image_date=appt.appointment_date,
                storage_path=f"/imaging/2024/{appt.appointment_date.strftime('%Y%m')}/IMG{appt.id:010d}.dcm",
                upload_status="uploaded",
                is_missing=False,
                checksum_verified=True
            )
            imaging_records.append(img)
            session.add(img)

        if appt.status in ["completed", "done"]:
            caliber_changed = appt.anomaly_flag and "BILLING_CALIBER" in (appt.anomaly_flag or "")
            br = BillingRecord(
                billing_no=f"BR{appt.id:010d}",
                appointment_id=appt.id,
                patient_id=appt.patient_id,
                billing_date=appt.appointment_date,
                total_amount=round(random.uniform(200, 2000), 2),
                paid_amount=round(random.uniform(180, 2200), 2),
                payment_method=random.choice(["微信", "支付宝", "医保", "现金"]),
                procedure_codes=appt.procedure_code,
                data_version="v2" if caliber_changed else "v1",
                caliber_changed=caliber_changed,
                caliber_change_note="收费口径于2024-06变更" if caliber_changed else "",
                caliber_effective_date=date(2024, 6, 1) if caliber_changed else None
            )
            billing_records.append(br)
            session.add(br)

    session.commit()
    print(f"✅ 生成治疗计划: {len(plans)} 条")
    print(f"✅ 生成随访任务: {len(followups)} 条")
    print(f"✅ 生成影像记录: {len(imaging_records)} 条")
    print(f"✅ 生成收费记录: {len(billing_records)} 条")
    return plans, followups, imaging_records, billing_records


def generate_sync_logs(days_back=60):
    session = get_session()
    logs = []
    today = date.today()
    for day_offset in range(days_back, -1, -1):
        current_date = today - timedelta(days=day_offset)
        for sync_hour in [0, 4, 8, 12, 16, 20]:
            start_time = datetime.combine(current_date, datetime.min.time()) + timedelta(
                hours=sync_hour, minutes=random.randint(0, 10)
            )
            delay_min = random.randint(3, 90)
            if day_offset in [5, 22, 40] and sync_hour == 8:
                delay_min = random.randint(120, 300)
            comp_time = start_time + timedelta(minutes=delay_min)
            log = SyncLog(
                sync_type="HIS_SYNC",
                source_system="HIS",
                started_at=start_time,
                completed_at=comp_time,
                records_count=random.randint(15, 80),
                status="success",
                delay_minutes=delay_min
            )
            logs.append(log)
            session.add(log)
    session.commit()
    print(f"✅ 生成同步日志: {len(logs)} 条")
    return logs


def generate_all_sample_data():
    print("=" * 60)
    print("  🦷 生成洁牙预约监测系统示例数据")
    print("=" * 60)
    print()

    from scripts.init_db import init_database
    init_database()
    print()

    session = get_session()
    try:
        session.query(SyncLog).delete()
        session.query(ImagingRecord).delete()
        session.query(BillingRecord).delete()
        session.query(FollowUpTask).delete()
        session.query(TreatmentPlan).delete()
        session.query(Appointment).delete()
        session.query(Patient).delete()
        session.query(Doctor).delete()
        session.commit()
        print("🗑️  清空旧数据完成")
    except Exception as e:
        session.rollback()
        print(f"⚠️  清空旧数据: {e}")
    finally:
        session.close()

    patients = generate_patients(80)
    doctors = generate_doctors(6)
    appointments = generate_appointments(patients, doctors, days_back=60)
    generate_related_data(patients, appointments, doctors)
    generate_sync_logs(days_back=60)

    print()
    print("=" * 60)
    print("  ✅ 示例数据生成完成！")
    print("  启动看板: python run_dashboard.py")
    print("  访问地址: http://localhost:8050")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_sample_data()
