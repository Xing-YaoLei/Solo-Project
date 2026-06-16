import polars as pl
import numpy as np
from datetime import date, timedelta
from typing import Tuple, List, Dict
import uuid
import random

from database import get_db


RISK_LEVELS = ["低危", "中低危", "中危", "中高危", "高危"]
RISK_COLORS = {
    "低危": "#10b981",
    "中低危": "#84cc16",
    "中危": "#f59e0b",
    "中高危": "#f97316",
    "高危": "#ef4444"
}

DIAGNOSES = [
    "脑卒中后偏瘫", "脊髓损伤", "骨折术后康复", "关节置换术后",
    "帕金森病", "多发性硬化", "脑瘫", "颈肩腰腿痛",
    "运动损伤", "老年衰弱综合征"
]

INSURANCE_TYPES = ["职工医保", "居民医保", "商业保险", "自费", "工伤保险"]
PHYSICIANS = ["张主任", "李医生", "王医生", "赵医生", "陈主任"]
THERAPISTS = ["刘治疗师", "孙治疗师", "周治疗师", "吴治疗师", "郑治疗师"]
NURSES = ["护士小王", "护士小李", "护士小张", "护士小陈", "护士小刘"]

DEVICE_TYPES = [
    ("D001", "平衡训练仪"),
    ("D002", "下肢机器人"),
    ("D003", "上肢智能训练系统"),
    ("D004", "经颅磁刺激仪"),
    ("D005", "中频电疗仪"),
    ("D006", "超声波治疗仪"),
    ("D007", "步态训练系统"),
    ("D008", "肌力评估训练仪")
]

TREATMENT_TYPES = [
    "运动疗法", "作业疗法", "言语治疗", "物理因子治疗",
    "康复护理", "吞咽训练", "认知训练", "平衡训练"
]


def generate_patients(num_patients: int = 50) -> pl.DataFrame:
    today = date.today()
    patients = []

    for i in range(num_patients):
        patient_id = f"P{10001 + i}"
        admission_date = today - timedelta(days=random.randint(7, 180))
        discharge = random.random() < 0.3
        discharge_date = None
        if discharge:
            discharge_date = admission_date + timedelta(days=random.randint(14, 90))
            if discharge_date > today:
                discharge_date = None

        base_risk = random.random()
        if base_risk < 0.3:
            risk_level = "低危"
            risk_score = round(random.uniform(0, 20), 1)
        elif base_risk < 0.55:
            risk_level = "中低危"
            risk_score = round(random.uniform(20, 40), 1)
        elif base_risk < 0.75:
            risk_level = "中危"
            risk_score = round(random.uniform(40, 60), 1)
        elif base_risk < 0.9:
            risk_level = "中高危"
            risk_score = round(random.uniform(60, 80), 1)
        else:
            risk_level = "高危"
            risk_score = round(random.uniform(80, 100), 1)

        patients.append({
            "patient_id": patient_id,
            "name": f"患者{i+1:03d}",
            "age": random.randint(18, 90),
            "gender": random.choice(["男", "女"]),
            "admission_date": admission_date,
            "discharge_date": discharge_date,
            "primary_diagnosis": random.choice(DIAGNOSES),
            "risk_level": risk_level,
            "risk_score": risk_score,
            "insurance_type": random.choice(INSURANCE_TYPES),
            "attending_physician": random.choice(PHYSICIANS)
        })

    return pl.DataFrame(patients)


def generate_risk_daily(patients_df: pl.DataFrame, days: int = 90) -> Tuple[pl.DataFrame, pl.DataFrame, pl.DataFrame, pl.DataFrame, pl.DataFrame]:
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    risk_records = []
    fee_sync_logs = []
    medical_gaps = []
    device_changes = []
    insurance_denials = []

    patient_ids = patients_df["patient_id"].to_list()
    admission_dates = dict(zip(patients_df["patient_id"].to_list(), patients_df["admission_date"].to_list()))

    fee_delay_dates = []
    for _ in range(3):
        delay_date = start_date + timedelta(days=random.randint(5, days - 10))
        delay_days = random.randint(1, 7)
        fee_delay_dates.append(delay_date)
        fee_sync_logs.append({
            "sync_id": f"FEE-{uuid.uuid4().hex[:8]}",
            "sync_date": delay_date + timedelta(days=delay_days),
            "expected_date": delay_date,
            "delay_days": delay_days,
            "sync_status": "completed_with_delay",
            "affected_records": random.randint(20, 100),
            "note": f"收费系统升级导致延迟{delay_days}天"
        })

    device_change_dates = []
    for _ in range(2):
        change_date = start_date + timedelta(days=random.randint(10, days - 5))
        device_id, device_name = random.choice(DEVICE_TYPES)
        device_change_dates.append(change_date)
        device_changes.append({
            "change_id": f"DEV-{uuid.uuid4().hex[:8]}",
            "device_id": device_id,
            "device_name": device_name,
            "change_date": change_date,
            "old_version": f"v{random.randint(1, 3)}.{random.randint(0, 9)}",
            "new_version": f"v{random.randint(2, 4)}.{random.randint(0, 9)}",
            "change_description": f"{device_name}固件升级，校准参数调整",
            "affected_patients": random.randint(5, 25)
        })

    insurance_denial_periods = []
    for _ in range(2):
        denial_start = start_date + timedelta(days=random.randint(15, days - 20))
        denial_duration = random.randint(7, 21)
        insurance_denial_periods.append((denial_start, denial_start + timedelta(days=denial_duration)))

        for pid in random.sample(patient_ids, random.randint(5, 15)):
            denial_date = denial_start + timedelta(days=random.randint(0, denial_duration))
            insurance_denials.append({
                "denial_id": f"INS-{uuid.uuid4().hex[:8]}",
                "patient_id": pid,
                "denial_date": denial_date,
                "denial_code": f"CO-{random.randint(1, 50)}",
                "denial_reason": random.choice([
                    "诊疗项目不在医保目录",
                    "治疗频次超出规定",
                    "缺少必要的前置审批",
                    "诊断与治疗项目不匹配",
                    "超过支付限额"
                ]),
                "denial_amount": round(random.uniform(100, 5000), 2),
                "appealed": random.random() < 0.4,
                "appeal_result": random.choice([None, "申诉成功", "申诉驳回", "待审核"])
            })

    medical_gap_dates = []
    for pid in random.sample(patient_ids, min(15, len(patient_ids))):
        gap_date = start_date + timedelta(days=random.randint(3, days - 3))
        medical_gap_dates.append((pid, gap_date))
        medical_gaps.append({
            "gap_id": f"GAP-{uuid.uuid4().hex[:8]}",
            "patient_id": pid,
            "gap_date": gap_date,
            "gap_type": random.choice(["病程记录缺失", "评估量表未填写", "医嘱未执行", "知情同意书缺失"]),
            "description": "病历系统数据录入延迟",
            "resolved": random.random() < 0.6,
            "resolved_date": gap_date + timedelta(days=random.randint(1, 5))
        })

    device_versions = {}
    current_version = "v1.0"
    version_change_date = None
    for change in sorted(device_changes, key=lambda x: x["change_date"]):
        if change["change_date"]:
            version_change_date = change["change_date"]
            current_version = change["new_version"]

    for pid in patient_ids:
        patient_admission = admission_dates[pid]

        for d in range(days):
            record_date = start_date + timedelta(days=d)
            if record_date < patient_admission:
                continue

            day_offset = (record_date - patient_admission).days
            base_score = 50 - day_offset * 0.3 + random.uniform(-15, 15)
            base_score = max(0, min(100, base_score + random.uniform(-10, 10)))

            vital = round(max(0, min(100, 80 - day_offset * 0.2 + random.uniform(-15, 15))), 1)
            mobility = round(max(0, min(100, 40 + day_offset * 0.5 + random.uniform(-15, 15))), 1)
            cognitive = round(max(0, min(100, 70 - day_offset * 0.1 + random.uniform(-10, 10))), 1)
            nutrition = round(max(0, min(100, 75 + random.uniform(-10, 10))), 1)
            complication = round(max(0, min(100, 20 + day_offset * 0.1 + random.uniform(-5, 20))), 1)

            risk_score = round(
                vital * 0.25 +
                (100 - mobility) * 0.30 +
                (100 - cognitive) * 0.15 +
                (100 - nutrition) * 0.10 +
                complication * 0.20 +
                random.uniform(-5, 5),
                1
            )
            risk_score = max(0, min(100, risk_score))

            if risk_score < 20:
                risk_level = "低危"
            elif risk_score < 40:
                risk_level = "中低危"
            elif risk_score < 60:
                risk_level = "中危"
            elif risk_score < 80:
                risk_level = "中高危"
            else:
                risk_level = "高危"

            fee_updated = record_date not in fee_delay_dates
            if not fee_updated:
                risk_score = min(100, risk_score + random.uniform(2, 8))

            has_gap = (pid, record_date) in medical_gap_dates
            record_complete = not has_gap
            if not record_complete:
                risk_score = min(100, risk_score + random.uniform(1, 5))

            device_calibration_current = record_date not in device_change_dates
            device_version = current_version
            if not device_calibration_current:
                risk_score = min(100, risk_score + random.uniform(3, 10))

            in_denial_period = any(
                start <= record_date <= end
                for start, end in insurance_denial_periods
            )
            insurance_denial_flag = in_denial_period and random.random() < 0.3
            denial_amount = round(random.uniform(100, 2000), 2) if insurance_denial_flag else 0
            if insurance_denial_flag:
                risk_score = min(100, risk_score + random.uniform(5, 15))

            planned_sessions = random.randint(1, 4)
            completed_sessions = max(0, planned_sessions - random.randint(0, 2))
            training_rate = round(completed_sessions / planned_sessions * 100, 1) if planned_sessions > 0 else 0

            risk_records.append({
                "record_id": f"R-{pid}-{record_date.strftime('%Y%m%d')}",
                "patient_id": pid,
                "record_date": record_date,
                "risk_level": risk_level,
                "risk_score": round(risk_score, 1),
                "vital_signs_score": vital,
                "mobility_score": mobility,
                "cognitive_score": cognitive,
                "nutrition_score": nutrition,
                "complication_score": complication,
                "fee_table_updated": fee_updated,
                "medical_record_complete": record_complete,
                "device_calibration_current": device_calibration_current,
                "device_calibration_version": device_version,
                "insurance_denial": insurance_denial_flag,
                "insurance_denial_amount": denial_amount,
                "training_completion_rate": training_rate
            })

    return (
        pl.DataFrame(risk_records),
        pl.DataFrame(fee_sync_logs),
        pl.DataFrame(medical_gaps),
        pl.DataFrame(device_changes),
        pl.DataFrame(insurance_denials)
    )


def generate_treatment_calendar(patients_df: pl.DataFrame, days: int = 30) -> pl.DataFrame:
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    treatments = []

    patient_ids = patients_df["patient_id"].to_list()
    admission_dates = dict(zip(patients_df["patient_id"].to_list(), patients_df["admission_date"].to_list()))

    for pid in patient_ids:
        patient_admission = admission_dates[pid]
        for d in range(days):
            treat_date = start_date + timedelta(days=d)
            if treat_date < patient_admission:
                continue

            num_treatments = random.randint(0, 3)
            for _ in range(num_treatments):
                device_id, device_name = random.choice(DEVICE_TYPES)
                treatments.append({
                    "treatment_id": f"T-{uuid.uuid4().hex[:12]}",
                    "patient_id": pid,
                    "treatment_date": treat_date,
                    "treatment_type": random.choice(TREATMENT_TYPES),
                    "treatment_duration": random.choice([20, 30, 45, 60, 90]),
                    "therapist": random.choice(THERAPISTS),
                    "treatment_status": random.choice(["已完成", "已完成", "已完成", "进行中", "已取消", "未执行"]),
                    "device_id": device_id,
                    "notes": random.choice([None, None, None, "患者配合良好", "需调整强度", "出现轻度疲劳"])
                })

    return pl.DataFrame(treatments)


def generate_device_status(days: int = 30) -> pl.DataFrame:
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    statuses = []

    for d in range(days):
        status_date = start_date + timedelta(days=d)
        for device_id, device_name in DEVICE_TYPES:
            status_options = ["正常运行", "正常运行", "正常运行", "维护中", "校准中", "故障"]
            status = random.choice(status_options)
            util_rate = round(random.uniform(30, 95), 1) if status == "正常运行" else 0
            statuses.append({
                "status_id": f"S-{device_id}-{status_date.strftime('%Y%m%d')}",
                "device_id": device_id,
                "device_name": device_name,
                "status_date": status_date,
                "device_status": status,
                "utilization_rate": util_rate,
                "calibration_due": random.random() < 0.1,
                "maintenance_due": random.random() < 0.05,
                "error_count": random.randint(0, 3) if status != "正常运行" else 0
            })

    return pl.DataFrame(statuses)


def generate_nursing_logs(patients_df: pl.DataFrame, days: int = 30) -> pl.DataFrame:
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    logs = []

    patient_ids = patients_df["patient_id"].to_list()
    admission_dates = dict(zip(patients_df["patient_id"].to_list(), patients_df["admission_date"].to_list()))

    shifts = ["早班", "中班", "晚班"]

    for pid in patient_ids:
        patient_admission = admission_dates[pid]
        for d in range(days):
            log_date = start_date + timedelta(days=d)
            if log_date < patient_admission:
                continue

            for shift in shifts:
                sys = random.randint(100, 160)
                dia = random.randint(60, 100)
                logs.append({
                    "log_id": f"N-{pid}-{log_date.strftime('%Y%m%d')}-{shift}",
                    "patient_id": pid,
                    "log_date": log_date,
                    "nurse_id": f"NUR{random.randint(101, 110)}",
                    "nurse_name": random.choice(NURSES),
                    "shift": shift,
                    "blood_pressure": f"{sys}/{dia}",
                    "heart_rate": random.randint(60, 110),
                    "temperature": round(random.uniform(36.0, 38.5), 1),
                    "oxygen_saturation": round(random.uniform(92, 100), 1),
                    "pain_level": random.randint(0, 10),
                    "notes": random.choice([
                        None, None, None, None,
                        "患者精神状态良好",
                        "夜间睡眠欠佳",
                        "食欲正常",
                        "诉轻微疼痛，已对症处理",
                        "康复训练后稍有疲劳"
                    ])
                })

    return pl.DataFrame(logs)


def generate_review_notes(patients_df: pl.DataFrame, risk_daily_df: pl.DataFrame) -> pl.DataFrame:
    notes = []

    anomaly_records = risk_daily_df.filter(
        (pl.col("fee_table_updated") == False) |
        (pl.col("medical_record_complete") == False) |
        (pl.col("device_calibration_current") == False) |
        (pl.col("insurance_denial") == True)
    )

    sampled = anomaly_records.sample(fraction=0.3, seed=42)

    for row in sampled.iter_rows(named=True):
        anomaly_types = []
        if not row["fee_table_updated"]:
            anomaly_types.append("收费表延迟")
        if not row["medical_record_complete"]:
            anomaly_types.append("病历缺失")
        if not row["device_calibration_current"]:
            anomaly_types.append("设备口径变化")
        if row["insurance_denial"]:
            anomaly_types.append("医保拒付")

        notes.append({
            "note_id": f"NOTE-{uuid.uuid4().hex[:12]}",
            "patient_id": row["patient_id"],
            "related_record_id": row["record_id"],
            "note_date": row["record_date"],
            "anomaly_type": "、".join(anomaly_types),
            "anomaly_description": f"风险评分异常升高至{row['risk_score']}",
            "review_note": random.choice([
                "已核实为数据延迟导致，实际风险无显著变化",
                "需关注患者状态变化，已通知主管医生",
                "设备校准已完成，后续数据可恢复正常",
                "正在申诉医保拒付，已准备相关材料",
                "病历已补录，数据完整性已恢复"
            ]),
            "reviewer": random.choice(PHYSICIANS),
            "follow_up_action": random.choice([
                "持续监测3天",
                "增加评估频次",
                "调整治疗方案",
                "无需特殊处理",
                "组织病例讨论"
            ]),
            "resolved": random.random() < 0.7
        })

    return pl.DataFrame(notes)


def initialize_all_data():
    db = get_db()
    conn = db.get_connection()

    patients = generate_patients(60)
    db.insert_dataframe("patients", patients)

    risk_daily, fee_logs, med_gaps, dev_changes, ins_denials = generate_risk_daily(patients, 90)
    db.insert_dataframe("patient_risk_daily", risk_daily)
    db.insert_dataframe("fee_table_sync_log", fee_logs)
    db.insert_dataframe("medical_record_gaps", med_gaps)
    db.insert_dataframe("device_calibration_changes", dev_changes)
    db.insert_dataframe("insurance_denials", ins_denials)

    treatments = generate_treatment_calendar(patients, 60)
    db.insert_dataframe("treatment_calendar", treatments)

    device_status = generate_device_status(60)
    db.insert_dataframe("device_status", device_status)

    nursing = generate_nursing_logs(patients, 60)
    db.insert_dataframe("nursing_logs", nursing)

    review_notes = generate_review_notes(patients, risk_daily)
    db.insert_dataframe("review_notes", review_notes)

    print("模拟数据初始化完成！")
    print(f"  患者数: {len(patients)}")
    print(f"  风险记录: {len(risk_daily)}")
    print(f"  治疗记录: {len(treatments)}")
    print(f"  护理记录: {len(nursing)}")


def calculate_training_completion_rule() -> Dict:
    return {
        "规则说明": "训练完成率计算规则",
        "计算公式": "训练完成率 = 实际完成治疗项目数 / 计划治疗项目数 × 100%",
        "计划治疗项目数定义": "基于患者康复处方，当日应完成的所有治疗项目数量总和",
        "实际完成治疗项目数定义": "当日治疗状态为'已完成'的项目数量总和",
        "不计入的情况": [
            "状态为'已取消'且有正当理由的项目（需备注说明）",
            "因患者请假/外出而取消的项目",
            "因设备故障无法执行的项目（需设备科确认）"
        ],
        "数据来源": [
            "治疗日历表（treatment_calendar）",
            "康复处方系统",
            "治疗师执行记录"
        ],
        "考核标准": [
            "优秀: ≥90%",
            "良好: 80%-89%",
            "合格: 70%-79%",
            "待改进: <70%"
        ],
        "注意事项": [
            "统计周期以自然日为准（00:00-24:00）",
            "跨日治疗按治疗开始日期计入",
            "每月初5个工作日内完成上月数据核对"
        ]
    }
