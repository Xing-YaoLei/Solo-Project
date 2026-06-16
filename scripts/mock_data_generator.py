import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
import numpy as np
from datetime import date, timedelta, datetime
from database.db import SessionLocal, init_db
from database.models import (
    Patient, RehabAssessment, TreatmentPlan, TreatmentRecord,
    MedicalRecord, PaymentRecord, AttendanceRecord, Equipment,
    NursingLog, InsuranceClaim, AnomalyMarker, ReviewNote, DailyMetrics
)
from config.settings import settings
from etl.metrics_calculator import MetricsCalculator
from etl.anomaly_detector import AnomalyDetector

random.seed(42)
np.random.seed(42)

THERAPISTS = ["张医生", "李医生", "王医生", "赵医生", "刘医生", "陈医生"]
NURSES = ["周护士", "吴护士", "郑护士", "孙护士", "钱护士"]
DIAGNOSES = ["脑卒中", "脊髓损伤", "骨折术后", "关节炎", "帕金森病", "脑外伤", "腰椎间盘突出"]
EQUIPMENT_NAMES = ["康复训练器", "跑步机", "功率自行车", "上肢训练器", "下肢训练器", "平衡训练仪", "中频治疗仪", "超声波治疗仪"]
EQUIPMENT_TYPES = ["训练器械", "理疗器械", "评估设备"]
LOCATIONS = ["康复训练室A", "康复训练室B", "理疗室", "评估室"]

def generate_patients(count=50):
    patients = []
    for i in range(count):
        admission_date = date.today() - timedelta(days=random.randint(30, 120))
        discharge_date = None
        if random.random() < 0.3:
            discharge_date = admission_date + timedelta(days=random.randint(14, 60))

        patient = Patient(
            patient_id=f"P{1000+i}",
            name=f"患者{i+1}",
            gender=random.choice(["男", "女"]),
            age=random.randint(18, 85),
            admission_date=admission_date,
            discharge_date=discharge_date,
            primary_diagnosis=random.choice(DIAGNOSES),
            attending_physician=random.choice(THERAPISTS),
        )
        patients.append(patient)
    return patients


def generate_rehab_assessments(patients, days=90):
    assessments = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.discharge_date:
            last_date = min(patient.discharge_date, end_date)
        else:
            last_date = end_date

        assessment_dates = pd.date_range(
            max(patient.admission_date, start_date),
            last_date,
            freq="7D"
        )

        for d in assessment_dates:
            assessment = RehabAssessment(
                patient_id=patient.patient_id,
                assessment_date=d.date(),
                assessment_type=random.choice(["初期评估", "中期评估", "末期评估", "每周评估"]),
                assessor=random.choice(THERAPISTS),
                pain_score=round(random.uniform(1, 8), 1),
                mobility_score=round(random.uniform(30, 95), 1),
                adl_score=round(random.uniform(40, 95), 1),
                cognitive_score=round(random.uniform(50, 100), 1),
                risk_level=random.choice(["低", "中", "高"]),
                notes=f"定期康复评估记录",
            )
            assessment.overall_score = round((assessment.mobility_score + assessment.adl_score + assessment.cognitive_score) / 3, 1)
            assessments.append(assessment)

    return assessments


def generate_treatment_plans(patients, days=90):
    plans = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date:
            continue

        plan_date = max(patient.admission_date, start_date)
        while plan_date <= (patient.discharge_date or end_date):
            planned_sessions = random.randint(3, 7)
            completed_sessions = random.randint(0, planned_sessions)
            if random.random() < 0.15:
                completed_sessions = random.randint(0, max(0, planned_sessions - 2))

            plan = TreatmentPlan(
                patient_id=patient.patient_id,
                plan_date=plan_date,
                treatment_type=random.choice(settings.REHAB_TYPES),
                planned_sessions=planned_sessions,
                completed_sessions=completed_sessions,
                therapist=random.choice(THERAPISTS),
                frequency=random.choice(["每日1次", "每周5次", "每周3次"]),
                duration_per_session=random.choice([30, 45, 60, 90]),
                status=random.choice(["active", "completed", "suspended"]),
            )
            plans.append(plan)
            plan_date += timedelta(days=7)

    return plans


def generate_treatment_records(patients, days=60):
    records = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date:
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end):
            if random.random() < 0.7:
                n_treatments = random.randint(1, 3)
                for _ in range(n_treatments):
                    treatment_type = random.choice(settings.REHAB_TYPES)
                    equipment = None
                    if treatment_type in ["器械训练", "物理治疗"]:
                        equipment = random.choice(EQUIPMENT_NAMES)

                    pain_before = round(random.uniform(3, 8), 1)
                    pain_after = max(1, pain_before - round(random.uniform(0, 4), 1))
                    is_completed = random.random() > 0.1

                    record = TreatmentRecord(
                        patient_id=patient.patient_id,
                        treatment_date=d.date(),
                        treatment_type=treatment_type,
                        therapist=random.choice(THERAPISTS),
                        duration=random.choice([30, 45, 60]),
                        equipment_used=equipment,
                        pain_before=pain_before,
                        pain_after=pain_after,
                        progress_notes=f"{treatment_type}治疗，患者反应{random.choice(['良好', '一般', '有改善'])}",
                        is_completed=is_completed,
                    )
                    records.append(record)

    return records


def generate_medical_records(patients, days=60):
    records = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date:
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end, freq="2D"):
            is_complete = random.random() > 0.12
            missing_fields = None
            if not is_complete:
                missing_fields = random.sample(
                    ["主诉", "现病史", "体格检查", "辅助检查", "诊断", "治疗方案"],
                    k=random.randint(1, 3)
                )

            record = MedicalRecord(
                patient_id=patient.patient_id,
                record_date=d.date(),
                record_type=random.choice(["入院记录", "病程记录", "治疗记录", "出院小结"]),
                content=f"{patient.primary_diagnosis}康复治疗记录",
                is_complete=is_complete,
                missing_fields=missing_fields,
                created_by=random.choice(THERAPISTS),
            )
            records.append(record)

    return records


def generate_payment_records(patients, days=60):
    records = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date:
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end, freq="3D"):
            due_date = d.date() + timedelta(days=1)
            payment_date = d.date() + timedelta(days=random.randint(-1, 5))
            is_delayed = payment_date > due_date
            delay_days = max(0, (payment_date - due_date).days)

            record = PaymentRecord(
                patient_id=patient.patient_id,
                payment_date=payment_date,
                due_date=due_date,
                amount=round(random.uniform(100, 2000), 2),
                payment_type=random.choice(["医保", "自费", "商保"]),
                status=random.choice(["已支付", "未支付", "部分支付"]),
                is_delayed=is_delayed,
                delay_days=delay_days,
            )
            records.append(record)

    return records


def generate_attendance_records(patients, days=45):
    records = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date or (patient.discharge_date and patient.discharge_date < start_date):
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end):
            caliber_version = "v1"
            if d.date() > end_date - timedelta(days=14):
                caliber_version = "v2"

            is_present = random.random() < 0.88
            if caliber_version == "v2":
                is_present = random.random() < 0.75

            punch_in = None
            punch_out = None
            if is_present:
                punch_in = datetime.combine(d.date(), datetime.min.time()) + timedelta(hours=random.randint(7, 9), minutes=random.randint(0, 59))
                punch_out = punch_in + timedelta(hours=random.randint(4, 8), minutes=random.randint(0, 59))

            record = AttendanceRecord(
                patient_id=patient.patient_id,
                attendance_date=d.date(),
                punch_in=punch_in,
                punch_out=punch_out,
                is_present=is_present,
                caliber_version=caliber_version,
            )
            records.append(record)

    return records


def generate_equipment():
    equipment_list = []
    for i, name in enumerate(EQUIPMENT_NAMES):
        status = "active"
        if random.random() < 0.15:
            status = "maintenance"
        elif random.random() < 0.05:
            status = "broken"

        eq = Equipment(
            equipment_id=f"EQ{200+i}",
            name=name,
            type=random.choice(EQUIPMENT_TYPES),
            location=random.choice(LOCATIONS),
            status=status,
            last_maintenance=date.today() - timedelta(days=random.randint(1, 60)),
            next_maintenance=date.today() + timedelta(days=random.randint(1, 30)),
            utilization_rate=round(random.uniform(20, 95), 1),
        )
        equipment_list.append(eq)
    return equipment_list


def generate_nursing_logs(patients, days=30):
    logs = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date or (patient.discharge_date and patient.discharge_date < start_date):
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end):
            for time_slot in ["08:00", "12:00", "16:00", "20:00"]:
                if random.random() < 0.6:
                    has_abnormality = random.random() < 0.1
                    abnormalities = None
                    if has_abnormality:
                        abnormalities = random.choice(["血压偏高", "体温升高", "疼痛加剧", "情绪波动"])

                    log = NursingLog(
                        patient_id=patient.patient_id,
                        log_date=d.date(),
                        log_time=time_slot,
                        nurse=random.choice(NURSES),
                        vital_signs={
                            "体温": round(random.uniform(36, 38), 1),
                            "血压": f"{random.randint(100, 140)}/{random.randint(60, 90)}",
                            "心率": random.randint(60, 100),
                        },
                        nursing_measures=random.choice(["常规护理", "康复指导", "用药观察", "生活护理"]),
                        patient_response=random.choice(["良好", "一般", "需关注"]),
                        abnormalities=abnormalities,
                    )
                    logs.append(log)

    return logs


def generate_insurance_claims(patients, days=60):
    claims = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    for patient in patients:
        if patient.admission_date > end_date:
            continue

        patient_start = max(patient.admission_date, start_date)
        patient_end = patient.discharge_date or end_date

        for d in pd.date_range(patient_start, patient_end, freq="7D"):
            claim_amount = round(random.uniform(1000, 10000), 2)
            status = "approved"
            rejected_amount = 0

            rejection_chance = 0.15
            if d.date() > end_date - timedelta(days=28):
                rejection_chance = 0.35

            if random.random() < rejection_chance:
                status = "rejected"
                rejected_amount = round(claim_amount * random.uniform(0.2, 0.8), 2)
                approved_amount = claim_amount - rejected_amount
                rejection_reason = random.choice([
                    "治疗项目不在医保范围内",
                    "病历记录不完整",
                    "收费标准不符",
                    "无适应症",
                    "超量用药"
                ])
            else:
                approved_amount = claim_amount
                rejection_reason = None

            claim = InsuranceClaim(
                patient_id=patient.patient_id,
                claim_date=d.date(),
                claim_amount=claim_amount,
                approved_amount=approved_amount,
                rejected_amount=rejected_amount,
                status=status,
                rejection_reason=rejection_reason,
            )
            claims.append(claim)

    return claims


def generate_review_notes(anomalies):
    notes = []
    for anomaly in anomalies:
        if random.random() < 0.7:
            n_reviews = random.randint(1, 3)
            for i in range(n_reviews):
                note = ReviewNote(
                    anomaly_marker_id=anomaly.id,
                    review_date=anomaly.marker_date + timedelta(days=i),
                    reviewer=random.choice(THERAPISTS),
                    content=f"复盘记录：{anomaly.description}。已采取相应措施进行整改。",
                    action_items=["核查相关记录", "与相关人员沟通", "完善流程"],
                )
                notes.append(note)
    return notes


def generate_mock_data(days=90):
    print("🚀 开始生成模拟数据...")

    init_db()
    db = SessionLocal()

    try:
        print("📋 生成患者数据...")
        patients = generate_patients(50)
        db.add_all(patients)
        db.flush()

        print("📝 生成康复评估数据...")
        assessments = generate_rehab_assessments(patients, days)
        db.add_all(assessments)

        print("📋 生成治疗计划数据...")
        plans = generate_treatment_plans(patients, days)
        db.add_all(plans)

        print("💊 生成治疗记录数据...")
        treatments = generate_treatment_records(patients, min(days, 60))
        db.add_all(treatments)

        print("📄 生成病历记录数据...")
        records = generate_medical_records(patients, min(days, 60))
        db.add_all(records)

        print("💰 生成收费记录数据...")
        payments = generate_payment_records(patients, min(days, 60))
        db.add_all(payments)

        print("👤 生成打卡记录数据...")
        attendances = generate_attendance_records(patients, min(days, 45))
        db.add_all(attendances)

        print("🏥 生成器械数据...")
        equipment = generate_equipment()
        db.add_all(equipment)

        print("👩‍⚕️ 生成护理日志数据...")
        logs = generate_nursing_logs(patients, min(days, 30))
        db.add_all(logs)

        print("🏛️ 生成医保申报数据...")
        claims = generate_insurance_claims(patients, min(days, 60))
        db.add_all(claims)

        db.commit()
        print("✅ 基础数据生成完成")

        print("🔍 计算每日指标...")
        calculator = MetricsCalculator(db)
        detector = AnomalyDetector(db, settings.ANOMALY_THRESHOLDS)

        end_date = date.today()
        start_date = end_date - timedelta(days=min(days, 60))

        for d in pd.date_range(start_date, end_date):
            target_date = d.date()
            metrics = calculator.calculate_all_metrics(target_date)

            existing = db.query(DailyMetrics).filter(DailyMetrics.metric_date == target_date).first()
            if existing:
                for key, value in metrics.items():
                    setattr(existing, key, value)
            else:
                daily_metrics = DailyMetrics(metric_date=target_date, **metrics)
                db.add(daily_metrics)

        db.commit()
        print("✅ 每日指标计算完成")

        print("⚠️ 检测异常并生成标记...")
        all_anomalies = []
        for d in pd.date_range(start_date, end_date):
            target_date = d.date()

            payment_anomalies = detector.detect_payment_delays(target_date)
            record_anomalies = detector.detect_medical_record_gaps(target_date)
            punchcard_anomalies = detector.detect_punch_card_caliber_changes(target_date)
            insurance_anomalies = detector.detect_insurance_rejection_trends(target_date)

            day_anomalies = payment_anomalies + record_anomalies + punchcard_anomalies + insurance_anomalies

            for anomaly_data in day_anomalies:
                existing = db.query(AnomalyMarker).filter(
                    AnomalyMarker.anomaly_type == anomaly_data["anomaly_type"],
                    AnomalyMarker.marker_date == anomaly_data["marker_date"],
                ).first()

                if not existing:
                    anomaly = AnomalyMarker(**anomaly_data)
                    db.add(anomaly)
                    db.flush()
                    all_anomalies.append(anomaly)

        db.commit()
        print(f"✅ 异常检测完成，共生成 {len(all_anomalies)} 个异常标记")

        print("📝 生成复盘记录...")
        reviews = generate_review_notes(all_anomalies)
        db.add_all(reviews)
        db.commit()
        print(f"✅ 复盘记录生成完成，共 {len(reviews)} 条")

        print("\n🎉 模拟数据生成完成！")
        print(f"📊 数据时间范围: {start_date} 至 {end_date}")
        print(f"👤 患者数: {len(patients)}")
        print(f"💊 治疗记录数: {len(treatments)}")
        print(f"⚠️ 异常标记数: {len(all_anomalies)}")

    except Exception as e:
        db.rollback()
        print(f"❌ 生成数据时出错: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import pandas as pd
    generate_mock_data(days=90)
