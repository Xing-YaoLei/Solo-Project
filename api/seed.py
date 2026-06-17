import asyncio
import json
import random
from datetime import date, timedelta

from api.database import async_session, init_db
from api.models import (
    Department,
    Therapist,
    Patient,
    AssessmentScale,
    TrainingPrescription,
    TreatmentSession,
    CheckInRecord,
    EquipmentRecord,
    Settlement,
    RejectionRecord,
    RemarkTask,
    SavedView,
)

DEPARTMENTS = [
    {"name": "康复医学科", "code": "REHAB"},
    {"name": "神经康复科", "code": "NEURO"},
    {"name": "骨关节康复科", "code": "ORTHO"},
    {"name": "儿童康复科", "code": "PEDI"},
]

THERAPISTS = [
    {"name": "张明远", "title": "主任医师", "specialty": "神经康复", "dept_idx": 1},
    {"name": "李婉清", "title": "副主任医师", "specialty": "骨关节康复", "dept_idx": 2},
    {"name": "王志强", "title": "主治医师", "specialty": "运动损伤康复", "dept_idx": 2},
    {"name": "陈雨萱", "title": "主治医师", "specialty": "儿童发育康复", "dept_idx": 3},
    {"name": "刘建国", "title": "住院医师", "specialty": "心肺康复", "dept_idx": 0},
    {"name": "赵芳华", "title": "主管治疗师", "specialty": "言语吞咽康复", "dept_idx": 1},
]

PATIENTS = [
    {"name": "王建国", "gender": "男", "age": 65, "diagnosis": "脑卒中后遗症", "insurance_type": "城镇职工基本医疗保险"},
    {"name": "李秀兰", "gender": "女", "age": 58, "diagnosis": "膝关节置换术后", "insurance_type": "城乡居民基本医疗保险"},
    {"name": "张伟明", "gender": "男", "age": 42, "diagnosis": "腰椎间盘突出症", "insurance_type": "城镇职工基本医疗保险"},
    {"name": "刘美玲", "gender": "女", "age": 35, "diagnosis": "骨折术后康复", "insurance_type": "城乡居民基本医疗保险"},
    {"name": "陈志远", "gender": "男", "age": 70, "diagnosis": "帕金森病", "insurance_type": "城镇职工基本医疗保险"},
    {"name": "孙丽华", "gender": "女", "age": 55, "diagnosis": "脑卒中后遗症", "insurance_type": "城乡居民基本医疗保险"},
    {"name": "周小明", "gender": "男", "age": 6, "diagnosis": "脑性瘫痪", "insurance_type": "城乡居民基本医疗保险"},
    {"name": "吴秀英", "gender": "女", "age": 68, "diagnosis": "骨关节炎", "insurance_type": "城镇职工基本医疗保险"},
    {"name": "郑国强", "gender": "男", "age": 48, "diagnosis": "脊髓损伤", "insurance_type": "城镇职工基本医疗保险"},
    {"name": "黄美芳", "gender": "女", "age": 62, "diagnosis": "肩袖损伤术后", "insurance_type": "城乡居民基本医疗保险"},
]

SCALE_NAMES = [
    "Barthel指数",
    "Fugl-Meyer评定",
    "Berg平衡量表",
    "改良Ashworth量表",
    "简明精神状态检查(MMSE)",
]

PRESCRIPTION_TEMPLATES = [
    {"content": "被动关节活动度训练，每日2次，每次30分钟", "name": "关节活动度训练处方", "equipment": "下肢智能反馈训练系统"},
    {"content": "肌力训练（徒手抗阻），每日1次，每次45分钟", "name": "肌力强化训练处方", "equipment": "上肢机器人康复训练仪"},
    {"content": "平衡功能训练，每日2次，每次20分钟", "name": "平衡功能训练处方", "equipment": "平衡训练仪"},
    {"content": "步态训练，每日1次，每次30分钟", "name": "步态矫正训练处方", "equipment": "下肢智能反馈训练系统"},
    {"content": "作业疗法-日常生活活动训练，每日1次，每次60分钟", "name": "作业治疗处方", "equipment": "上肢机器人康复训练仪"},
    {"content": "言语训练，每日1次，每次30分钟", "name": "言语功能训练处方", "equipment": "经颅磁刺激仪"},
    {"content": "吞咽功能训练，每日2次，每次15分钟", "name": "吞咽功能训练处方", "equipment": "吞咽电刺激仪"},
    {"content": "牵伸训练，每日2次，每次20分钟", "name": "牵伸放松训练处方", "equipment": "超声波治疗仪"},
]

EQUIPMENT_PARAMS = {
    "下肢智能反馈训练系统": {"speed_kmh": 2.5, "resistance_n": 45, "duration_min": 30, "mode": "连续被动"},
    "上肢机器人康复训练仪": {"repetitions": 120, "force_n": 18, "joint_range_deg": 85, "mode": "主被动结合"},
    "平衡训练仪": {"platform_tilt_deg": 12, "sensitivity": "中", "duration_min": 20, "mode": "动态平衡"},
    "电动起立床": {"angle_deg": 65, "duration_min": 45, "weight_bearing_pct": 70, "mode": "渐进站立"},
    "吞咽电刺激仪": {"current_ma": 15, "frequency_hz": 30, "pulse_width_ms": 0.3, "mode": "持续刺激"},
    "经颅磁刺激仪": {"frequency_hz": 5, "intensity_pct": 80, "pulses": 1200, "mode": "重复刺激"},
    "超声波治疗仪": {"frequency_mhz": 1.5, "intensity_wcm2": 1.2, "duration_min": 15, "mode": "脉冲"},
    "气压治疗仪": {"chambers": 6, "pressure_mmhg": 60, "duration_min": 30, "mode": "梯度加压"},
}

REJECTION_REASONS = [
    "超医保目录限定支付范围",
    "缺乏必要的康复评定记录",
    "治疗频次超出医保规定标准",
    "重复收费项目",
    "住院天数超出医保限额",
    "康复治疗与诊断不符",
]

CONCLUSIONS = [
    "已补充材料，同意支付",
    "部分项目调整后支付",
    "维持拒付决定",
]

DIAGNOSIS_SCALE_MAP = {
    "脑卒中后遗症": ["Barthel指数", "Fugl-Meyer评定", "Berg平衡量表"],
    "膝关节置换术后": ["Barthel指数", "Berg平衡量表", "改良Ashworth量表"],
    "腰椎间盘突出症": ["Barthel指数", "改良Ashworth量表"],
    "骨折术后康复": ["Barthel指数", "Berg平衡量表", "改良Ashworth量表"],
    "帕金森病": ["Barthel指数", "简明精神状态检查(MMSE)", "Berg平衡量表"],
    "脑性瘫痪": ["Barthel指数", "Fugl-Meyer评定", "改良Ashworth量表", "简明精神状态检查(MMSE)"],
    "骨关节炎": ["Barthel指数", "Berg平衡量表", "改良Ashworth量表"],
    "脊髓损伤": ["Barthel指数", "Fugl-Meyer评定", "改良Ashworth量表"],
    "肩袖损伤术后": ["Barthel指数", "改良Ashworth量表"],
}

DIAGNOSIS_PRESCRIPTION_MAP = {
    "脑卒中后遗症": [0, 1, 2, 5],
    "膝关节置换术后": [0, 2, 7],
    "腰椎间盘突出症": [0, 1, 7],
    "骨折术后康复": [0, 1, 2, 7],
    "帕金森病": [2, 5, 6],
    "脑性瘫痪": [0, 1, 2, 4],
    "骨关节炎": [0, 2, 7],
    "脊髓损伤": [0, 1, 2, 3],
    "肩袖损伤术后": [1, 7],
}


def _vary_params(base_params: dict) -> dict:
    varied = {}
    for k, v in base_params.items():
        if isinstance(v, (int, float)):
            factor = random.uniform(0.8, 1.2)
            varied[k] = round(v * factor, 2) if isinstance(v, float) else int(v * factor)
        else:
            varied[k] = v
    return varied


async def seed():
    await init_db()
    async with async_session() as db:
        from sqlalchemy import select, func

        existing = await db.execute(select(func.count(Department.id)))
        if existing.scalar() > 0:
            print("数据库已有数据，跳过种子脚本。")
            return

        departments = []
        for d in DEPARTMENTS:
            dept = Department(name=d["name"], code=d["code"])
            db.add(dept)
            departments.append(dept)
        await db.flush()

        therapists = []
        for t in THERAPISTS:
            th = Therapist(
                name=t["name"],
                title=t["title"],
                specialty=t["specialty"],
                department_id=departments[t["dept_idx"]].id,
            )
            db.add(th)
            therapists.append(th)
        await db.flush()

        patients = []
        for i, p in enumerate(PATIENTS):
            dept_idx = i % len(departments)
            admit_date = date(2025, 1, 1) + timedelta(days=random.randint(0, 90))
            pt = Patient(
                name=p["name"],
                gender=p["gender"],
                age=p["age"],
                diagnosis=p["diagnosis"],
                insurance_type=p["insurance_type"],
                department_id=departments[dept_idx].id,
                admission_date=admit_date,
            )
            db.add(pt)
            patients.append(pt)
        await db.flush()

        assessment_objs_by_patient: dict[int, list] = {}
        for pt in patients:
            scale_names = DIAGNOSIS_SCALE_MAP.get(pt.diagnosis, SCALE_NAMES)
            pt_assessments = []
            num_assessments = random.randint(3, 6)
            for j in range(num_assessments):
                scale_name = scale_names[j % len(scale_names)]
                assessed_at = pt.admission_date + timedelta(days=j * random.randint(10, 25))
                if assessed_at > date(2025, 12, 31):
                    break
                base_score = random.uniform(20, 50) if j == 0 else min(random.uniform(30, 95), 95)
                score = round(base_score, 1)
                a = AssessmentScale(
                    patient_id=pt.id,
                    scale_name=scale_name,
                    score=score,
                    assessed_at=assessed_at,
                    linked_prescription_id=None,
                )
                db.add(a)
                pt_assessments.append(a)
            await db.flush()
            assessment_objs_by_patient[pt.id] = pt_assessments

        prescription_objs_by_patient: dict[int, list] = {}
        pending_links: list[tuple] = []
        for pt in patients:
            diag = pt.diagnosis
            rx_indices = DIAGNOSIS_PRESCRIPTION_MAP.get(diag, list(range(len(PRESCRIPTION_TEMPLATES))))
            pt_prescriptions = []
            num_rx = random.randint(1, 3)
            chosen_indices = random.sample(rx_indices, min(num_rx, len(rx_indices)))

            pt_assessments = assessment_objs_by_patient.get(pt.id, [])
            for k, rx_idx in enumerate(chosen_indices):
                tmpl = PRESCRIPTION_TEMPLATES[rx_idx]
                prescribed_at = pt.admission_date + timedelta(days=random.randint(3, 20))
                if prescribed_at > date(2025, 12, 15):
                    continue

                linked_assessment = None
                for a in pt_assessments:
                    if a.assessed_at <= prescribed_at and (prescribed_at - a.assessed_at).days <= 14:
                        linked_assessment = a
                        break

                rx = TrainingPrescription(
                    patient_id=pt.id,
                    assessment_id=linked_assessment.id if linked_assessment else None,
                    content=tmpl["content"],
                    frequency=random.choice(["每日1次", "每日2次", "每周3次"]),
                    prescribed_at=prescribed_at,
                )
                db.add(rx)
                pt_prescriptions.append((rx, tmpl))

                if linked_assessment and linked_assessment.linked_prescription_id is None:
                    pending_links.append((linked_assessment, rx))

            await db.flush()
            prescription_objs_by_patient[pt.id] = pt_prescriptions

        for assessment_obj, rx_obj in pending_links:
            assessment_obj.linked_prescription_id = rx_obj.id
        await db.flush()

        session_objs_by_patient: dict[int, list] = {}
        for pt in patients:
            pt_prescriptions = prescription_objs_by_patient.get(pt.id, [])
            if not pt_prescriptions:
                session_objs_by_patient[pt.id] = []
                continue

            pt_sessions = []
            for rx, tmpl in pt_prescriptions:
                freq = rx.frequency
                if "每日2次" in freq:
                    sessions_per_week = 10
                elif "每日1次" in freq:
                    sessions_per_week = 6
                elif "每周3次" in freq:
                    sessions_per_week = 3
                else:
                    sessions_per_week = 5

                session_date = rx.prescribed_at
                week_count = 0
                sessions_this_week = 0

                while session_date <= date(2025, 12, 31) and week_count < 8:
                    if sessions_this_week >= sessions_per_week:
                        session_date += timedelta(days=(7 - session_date.weekday()) % 7 or 7)
                        sessions_this_week = 0
                        week_count += 1
                        if week_count >= 8:
                            break
                        continue

                    if session_date.weekday() < 6:
                        status = random.choices(
                            ["completed", "missed", "cancelled"],
                            weights=[85, 10, 5],
                        )[0]
                        th = random.choice(therapists)
                        s = TreatmentSession(
                            patient_id=pt.id,
                            therapist_id=th.id,
                            prescription_id=rx.id,
                            treatment_date=session_date,
                            duration_minutes=random.choice([30, 45, 60, 90]),
                            status=status,
                            project_name=tmpl["name"],
                        )
                        db.add(s)
                        pt_sessions.append((s, tmpl))
                        sessions_this_week += 1

                    session_date += timedelta(days=1)

            await db.flush()
            session_objs_by_patient[pt.id] = pt_sessions

        for pt in patients:
            pt_sessions = session_objs_by_patient.get(pt.id, [])
            for s, tmpl in pt_sessions:
                if s.status not in ("completed",):
                    continue
                hour = random.randint(7, 9)
                minute = random.choice([0, 15, 30, 45])
                ci = CheckInRecord(
                    patient_id=pt.id,
                    session_id=s.id,
                    check_in_date=s.treatment_date,
                    check_in_time=f"{hour:02d}:{minute:02d}",
                )
                db.add(ci)
        await db.flush()

        for pt in patients:
            pt_sessions = session_objs_by_patient.get(pt.id, [])
            for s, tmpl in pt_sessions:
                if s.status != "completed":
                    continue
                if random.random() > 0.7:
                    continue

                eq_name = tmpl["equipment"]
                base_params = EQUIPMENT_PARAMS.get(eq_name, {})
                varied_params = _vary_params(base_params)
                eq = EquipmentRecord(
                    session_id=s.id,
                    equipment_name=eq_name,
                    parameters=json.dumps(varied_params, ensure_ascii=False),
                    duration=s.duration_minutes or 30,
                    record_date=s.treatment_date,
                    department_id=pt.department_id,
                )
                db.add(eq)
        await db.flush()

        for pt in patients:
            for month in range(1, 13):
                s_date = date(2025, month, random.randint(1, 28))
                if s_date < pt.admission_date:
                    continue
                total = round(random.uniform(3000, 25000), 2)
                ins_ratio = random.uniform(0.6, 0.85)
                ins_amount = round(total * ins_ratio, 2)
                self_paid = round(total - ins_amount, 2)
                s_type = random.choice(["住院结算", "门诊结算"])
                db.add(Settlement(
                    patient_id=pt.id,
                    settlement_date=s_date,
                    total_amount=total,
                    insurance_amount=ins_amount,
                    self_paid_amount=self_paid,
                    settlement_type=s_type,
                    status="settled",
                ))
        await db.flush()

        for pt in patients:
            for _ in range(random.randint(1, 4)):
                rej_date = date(2025, random.randint(1, 12), random.randint(1, 28))
                if rej_date < pt.admission_date:
                    rej_date = pt.admission_date + timedelta(days=random.randint(7, 60))
                rej_status = random.choice(["pending", "remarked", "concluded"])
                db.add(RejectionRecord(
                    patient_id=pt.id,
                    rejection_date=rej_date,
                    reason=random.choice(REJECTION_REASONS),
                    amount=round(random.uniform(200, 5000), 2),
                    status=rej_status,
                    remark="已与医保办沟通，准备补充材料" if rej_status in ("remarked", "concluded") else None,
                    conclusion=random.choice(CONCLUSIONS) if rej_status == "concluded" else None,
                ))
        await db.flush()

        rejection_stmt = await db.execute(select(RejectionRecord))
        rejection_records = rejection_stmt.scalars().all()
        for rr in rejection_records[:5]:
            db.add(RemarkTask(
                rejection_id=rr.id,
                assigned_to=random.choice([t.name for t in therapists]),
                content="请核实该笔费用并补充相关材料",
                completed=rr.status == "concluded",
            ))
        await db.flush()

        demo_views = [
            {"name": "月度结算总览", "config": '{"granularity":"monthly","metrics":["total_amount","insurance_amount","self_paid_amount"]}'},
            {"name": "季度趋势对比", "config": '{"granularity":"quarterly","metrics":["total_amount","insurance_amount"]}'},
            {"name": "训练完成率看板", "config": '{"filters":{"department_id":1},"metrics":["completion_rate"]}'},
        ]
        for v in demo_views:
            db.add(SavedView(name=v["name"], config=v["config"]))
        await db.commit()

        print("种子数据填充完成！5表链路已建立：assessment→prescription→session→checkin+equipment")


if __name__ == "__main__":
    asyncio.run(seed())
