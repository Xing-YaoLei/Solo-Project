import asyncio
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

PRESCRIPTIONS = [
    "被动关节活动度训练，每日2次，每次30分钟",
    "肌力训练（徒手抗阻），每日1次，每次45分钟",
    "平衡功能训练，每日2次，每次20分钟",
    "步态训练，每日1次，每次30分钟",
    "作业疗法-日常生活活动训练，每日1次，每次60分钟",
    "言语训练，每日1次，每次30分钟",
    "吞咽功能训练，每日2次，每次15分钟",
    "牵伸训练，每日2次，每次20分钟",
]

EQUIPMENT_NAMES = [
    "下肢智能反馈训练系统",
    "上肢机器人康复训练仪",
    "平衡训练仪",
    "电动起立床",
    "吞咽电刺激仪",
    "经颅磁刺激仪",
    "超声波治疗仪",
    "气压治疗仪",
]

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
            admit_date = date(2025, 1, 1) + timedelta(days=random.randint(0, 180))
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

        for pt in patients:
            for _ in range(random.randint(2, 5)):
                scale_name = random.choice(SCALE_NAMES)
                assessed_at = pt.admission_date + timedelta(days=random.randint(0, 90))
                score = round(random.uniform(20, 95), 1)
                db.add(AssessmentScale(
                    patient_id=pt.id,
                    scale_name=scale_name,
                    score=score,
                    assessed_at=assessed_at,
                ))
        await db.flush()

        for pt in patients:
            for _ in range(random.randint(1, 3)):
                content = random.choice(PRESCRIPTIONS)
                prescribed_at = pt.admission_date + timedelta(days=random.randint(0, 30))
                freq = random.choice(["每日1次", "每日2次", "每周3次"])
                db.add(TrainingPrescription(
                    patient_id=pt.id,
                    content=content,
                    frequency=freq,
                    prescribed_at=prescribed_at,
                ))
        await db.flush()

        for pt in patients:
            num_sessions = random.randint(15, 60)
            for j in range(num_sessions):
                t_date = pt.admission_date + timedelta(days=j)
                if t_date > date(2025, 12, 31):
                    break
                th_idx = random.randint(0, len(therapists) - 1)
                status = random.choices(["completed", "missed", "cancelled"], weights=[85, 10, 5])[0]
                db.add(TreatmentSession(
                    patient_id=pt.id,
                    therapist_id=therapists[th_idx].id,
                    treatment_date=t_date,
                    duration_minutes=random.choice([30, 45, 60, 90]),
                    status=status,
                ))
        await db.flush()

        for pt in patients:
            for j in range(random.randint(10, 50)):
                ci_date = pt.admission_date + timedelta(days=j)
                if ci_date > date(2025, 12, 31):
                    break
                hour = random.randint(7, 16)
                minute = random.choice([0, 15, 30, 45])
                db.add(CheckInRecord(
                    patient_id=pt.id,
                    check_in_date=ci_date,
                    check_in_time=f"{hour:02d}:{minute:02d}",
                ))
        await db.flush()

        for month in range(1, 13):
            for eq_name in EQUIPMENT_NAMES:
                db.add(EquipmentRecord(
                    equipment_name=eq_name,
                    usage_count=random.randint(20, 200),
                    record_date=date(2025, month, 1),
                    department_id=departments[random.randint(0, len(departments) - 1)].id,
                ))
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

        print("种子数据填充完成！")


if __name__ == "__main__":
    asyncio.run(seed())
