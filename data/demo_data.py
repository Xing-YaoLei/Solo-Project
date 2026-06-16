import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from config.settings import Config

random.seed(42)
np.random.seed(42)


def generate_demo_appointments(days_back=60):
    today = date.today()
    surnames = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴",
                "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"]
    given_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋",
                   "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
    doctor_names = ["王医生", "李医生", "张医生", "刘医生", "陈医生", "赵医生"]
    cleaning_types = [
        ("超声波洁牙", "111"),
        ("喷砂洁牙", "112"),
        ("龈下刮治", "113"),
        ("牙周维护", "121")
    ]
    statuses = ["completed", "completed", "completed", "completed", "completed",
                "scheduled", "no_show", "cancelled", "done"]

    appointments = []
    appt_idx = 0

    for day_offset in range(days_back, -1, -1):
        current_date = today - timedelta(days=day_offset)
        day_of_week = current_date.weekday()

        if day_of_week < 5:
            daily_count = random.randint(8, 18)
        else:
            daily_count = random.randint(12, 25)

        for _ in range(daily_count):
            patient_name = random.choice(surnames) + random.choice(given_names)
            patient_id = random.randint(1, 80)
            doctor = random.choice(doctor_names)
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

            appointments.append({
                "id": appt_idx + 1,
                "appointment_no": f"A{202400000000 + appt_idx:012d}",
                "appointment_date": current_date.isoformat(),
                "appointment_time": f"{random.randint(8,17):02d}:{random.choice(['00','15','30','45'])}",
                "patient_id": patient_id,
                "patient_name": patient_name,
                "patient_number": f"P{20240000 + patient_id:08d}",
                "doctor_name": doctor,
                "procedure_type": proc_name,
                "procedure_code": proc_code,
                "status": status,
                "source": "HIS",
                "his_created_at": his_created.isoformat(),
                "his_updated_at": (synced_at - timedelta(minutes=random.randint(0, 30))).isoformat(),
                "synced_at": synced_at.isoformat(),
                "sync_delay_minutes": round(sync_delay, 2),
                "review_note": review_note_text,
                "anomaly_flag": "|".join(anom_flags) if anom_flags else "",
                "anomaly_types": anom_flags,
                "has_his_delay": "HIS_DELAY" in anom_flags,
                "has_imaging_missing": "IMAGING_MISSING" in anom_flags,
                "has_billing_caliber": "BILLING_CALIBER" in anom_flags,
                "plan_content": f"{proc_name}治疗方案，口腔卫生指导",
                "plan_status": "completed" if status in ["completed", "done"] else "pending",
                "plan_has_cleaning": True,
                "billing_amount": round(random.uniform(200, 2000), 2),
                "caliber_changed": "BILLING_CALIBER" in anom_flags,
                "billing_version": "v2" if "BILLING_CALIBER" in anom_flags else "v1",
                "is_no_show": is_no_show,
                "date_str": current_date.isoformat(),
                "is_weekend": day_of_week >= 5
            })
            appt_idx += 1

    df = pd.DataFrame(appointments)
    df["appointment_date"] = pd.to_datetime(df["appointment_date"])
    return df


def generate_demo_followups(df_appointments):
    if df_appointments.empty:
        return pd.DataFrame()

    today = date.today()
    followups = []
    task_idx = 0

    for _, appt in df_appointments.iterrows():
        if appt["status"] in ["completed", "done"] and appt["appointment_date"].date() < today - timedelta(days=7):
            fu_date = appt["appointment_date"].date() + timedelta(days=random.randint(7, 180))
            if fu_date <= today:
                fu_status = random.choice(["completed", "completed", "pending", "overdue"])
            else:
                fu_status = "pending"

            followups.append({
                "task_id": task_idx + 1,
                "task_no": f"FU{task_idx + 1:010d}",
                "appointment_id": appt["id"],
                "patient_id": appt["patient_id"],
                "patient_name": appt["patient_name"],
                "patient_number": appt["patient_number"],
                "original_appt_date": appt["appointment_date"].date().isoformat(),
                "appt_status": appt["status"],
                "task_date": fu_date.isoformat(),
                "task_type": random.choice(["电话回访", "复查提醒", "微信通知"]),
                "assigned_to": appt["doctor_name"],
                "status": fu_status,
                "completed_at": datetime.combine(fu_date, datetime.min.time()).isoformat() if fu_status == "completed" else None,
                "content": "洁牙后口腔状况检查，牙周情况评估",
                "result_note": "患者情况良好，建议半年复查" if fu_status == "completed" else ""
            })
            task_idx += 1

    return pd.DataFrame(followups)


def generate_demo_imaging(df_appointments):
    if df_appointments.empty:
        return pd.DataFrame()

    imaging_records = []
    img_idx = 0
    img_types = ["全景片", "根尖片", "CBCT"]

    for _, appt in df_appointments.iterrows():
        if appt["status"] in ["completed", "done"]:
            has_missing = appt["has_imaging_missing"]
            if not has_missing:
                imaging_records.append({
                    "image_id": img_idx + 1,
                    "image_no": f"IMG{img_idx + 1:010d}",
                    "appointment_id": appt["id"],
                    "patient_id": appt["patient_id"],
                    "patient_name": appt["patient_name"],
                    "patient_number": appt["patient_number"],
                    "appt_date": appt["appointment_date"].date().isoformat(),
                    "image_type": random.choice(img_types),
                    "image_date": appt["appointment_date"].date().isoformat(),
                    "storage_path": f"/imaging/2024/{appt['date_str'].replace('-','')}/IMG{img_idx + 1:010d}.dcm",
                    "is_missing": False,
                    "missing_note": "",
                    "upload_status": "uploaded",
                    "checksum_verified": True
                })
            else:
                imaging_records.append({
                    "image_id": img_idx + 1,
                    "image_no": f"MISS-{appt['appointment_no']}",
                    "appointment_id": appt["id"],
                    "patient_id": appt["patient_id"],
                    "patient_name": appt["patient_name"],
                    "patient_number": appt["patient_number"],
                    "appt_date": appt["appointment_date"].date().isoformat(),
                    "image_type": "CLEANING_XRAY",
                    "image_date": appt["appointment_date"].date().isoformat(),
                    "storage_path": "",
                    "is_missing": True,
                    "missing_note": "洁牙后影像未上传",
                    "upload_status": "missing",
                    "checksum_verified": False
                })
            img_idx += 1

    return pd.DataFrame(imaging_records)


def generate_demo_plans(df_appointments):
    if df_appointments.empty:
        return pd.DataFrame()

    plans = []
    plan_idx = 0
    stage_options = ["初诊检查", "基础洁治", "深度清洁", "复查评估"]

    for _, appt in df_appointments.iterrows():
        if appt["status"] not in ["no_show", "cancelled"]:
            plans.append({
                "plan_id": plan_idx + 1,
                "plan_no": f"TP{plan_idx + 1:010d}",
                "appointment_id": appt["id"],
                "patient_id": appt["patient_id"],
                "patient_name": appt["patient_name"],
                "patient_number": appt["patient_number"],
                "appt_date": appt["appointment_date"].date().isoformat(),
                "appt_status": appt["status"],
                "plan_date": (appt["appointment_date"].date() - timedelta(days=random.randint(0, 7))).isoformat(),
                "plan_content": f"{appt['procedure_type']}治疗方案，口腔卫生指导",
                "estimated_fee": round(random.uniform(200, 2000), 2),
                "actual_fee": round(random.uniform(180, 2200), 2) if appt["status"] in ["completed", "done"] else 0,
                "status": "completed" if appt["status"] in ["completed", "done"] else random.choice(["pending", "in_progress"]),
                "has_cleaning": True,
                "cleaning_stage": random.choice(stage_options)
            })
            plan_idx += 1

    return pd.DataFrame(plans)


def generate_demo_sync_logs(days_back=60, limit=200):
    today = date.today()
    logs = []

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

            logs.append({
                "log_id": len(logs) + 1,
                "started_at": start_time.isoformat(),
                "completed_at": comp_time.isoformat(),
                "status": "success",
                "records_count": random.randint(15, 80),
                "delay_minutes": delay_min,
                "error_message": ""
            })

    if limit and len(logs) > limit:
        logs = logs[-limit:]

    return pd.DataFrame(logs)
