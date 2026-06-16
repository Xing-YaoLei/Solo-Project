"""
模拟数据生成器
用于生成口腔诊所的测试数据
"""
import polars as pl
import numpy as np
from datetime import datetime, timedelta
import random
from src.config import Config


def generate_patients(count=200) -> pl.DataFrame:
    """生成患者数据"""
    first_names = ["张", "李", "王", "刘", "陈", "杨", "黄", "赵", "周", "吴",
                   "徐", "孙", "马", "朱", "胡", "郭", "何", "高", "林", "罗"]
    last_names = ["伟", "芳", "娜", "敏", "静", "强", "磊", "军", "洋", "勇",
                  "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平", "刚"]

    doctors = ["王医生", "李医生", "张医生", "刘医生", "陈医生"]
    member_levels = ["普通会员", "银卡会员", "金卡会员", "钻石会员"]

    patients = []
    for i in range(1, count + 1):
        register_date = datetime.now() - timedelta(days=random.randint(30, 1095))
        patients.append({
            "patient_id": f"P{i:06d}",
            "patient_name": f"{random.choice(first_names)}{random.choice(last_names)}",
            "gender": random.choice(["男", "女"]),
            "age": random.randint(5, 80),
            "phone": f"1{random.randint(300, 999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}",
            "member_level": random.choices(member_levels, weights=[50, 25, 15, 10])[0],
            "register_date": register_date.date(),
            "responsible_doctor": random.choice(doctors),
            "batch_id": None
        })

    return pl.DataFrame(patients)


def generate_appointments(patients_df: pl.DataFrame, count=500) -> pl.DataFrame:
    """生成预约数据"""
    statuses = ["已完成", "待复诊", "爽约", "已取消", "进行中"]
    status_weights = [45, 25, 15, 10, 5]

    appointments = []
    patient_ids = patients_df["patient_id"].to_list()
    doctor_names = patients_df["responsible_doctor"].unique().to_list()

    for i in range(1, count + 1):
        patient_id = random.choice(patient_ids)
        patient_row = patients_df.filter(pl.col("patient_id") == patient_id).row(0, named=True)

        appt_date = datetime.now() - timedelta(days=random.randint(0, 180))
        status = random.choices(statuses, weights=status_weights)[0]

        next_appt = None
        if status in ["已完成", "进行中"] and random.random() > 0.3:
            next_appt = (appt_date + timedelta(days=random.randint(30, 180))).date()

        appointments.append({
            "appointment_id": f"A{i:06d}",
            "patient_id": patient_id,
            "appointment_date": appt_date.date(),
            "appointment_time": f"{random.randint(8, 17):02d}:{random.choice(['00', '30'])}",
            "department": random.choice(["口腔内科", "口腔外科", "正畸科", "修复科", "牙周科", "儿童牙科"]),
            "doctor_name": patient_row["responsible_doctor"],
            "treatment_type": random.choice(Config.TREATMENT_TYPES),
            "status": status,
            "is_member": True,
            "risk_level": "normal",
            "next_appointment_date": next_appt,
            "batch_id": None
        })

    return pl.DataFrame(appointments)


def generate_imaging(patients_df: pl.DataFrame, appointments_df: pl.DataFrame, count=300) -> pl.DataFrame:
    """生成影像记录数据"""
    image_types = ["口腔全景片", "根尖片", "CBCT", "头颅侧位片", "口腔内窥镜", "牙片"]

    imaging = []
    patient_ids = patients_df["patient_id"].to_list()
    appointment_ids = appointments_df["appointment_id"].to_list()

    for i in range(1, count + 1):
        patient_id = random.choice(patient_ids)
        appt_id = random.choice(appointment_ids) if random.random() > 0.2 else None

        image_date = datetime.now() - timedelta(days=random.randint(0, 180))

        imaging.append({
            "image_id": f"IMG{i:06d}",
            "patient_id": patient_id,
            "appointment_id": appt_id,
            "image_type": random.choice(image_types),
            "image_date": image_date.date(),
            "file_path": f"/images/{image_date.strftime('%Y%m')}/IMG{i:06d}.dcm",
            "file_size": random.randint(100000, 50000000),
            "description": f"{random.choice(image_types)}检查影像",
            "batch_id": None
        })

    return pl.DataFrame(imaging)


def generate_charges(patients_df: pl.DataFrame, appointments_df: pl.DataFrame, count=400) -> pl.DataFrame:
    """生成收费记录数据"""
    payment_methods = ["微信", "支付宝", "医保", "现金", "银行卡"]
    treatment_prices = {
        "洁牙": (200, 500),
        "补牙": (300, 1500),
        "根管治疗": (800, 3000),
        "拔牙": (200, 2000),
        "种植牙": (5000, 20000),
        "正畸": (8000, 30000),
        "烤瓷牙": (1000, 5000),
        "贴面": (2000, 8000),
        "牙周治疗": (500, 3000),
        "儿童牙科": (100, 800)
    }

    charges = []
    patient_ids = patients_df["patient_id"].to_list()
    appointment_ids = appointments_df["appointment_id"].to_list()

    for i in range(1, count + 1):
        patient_id = random.choice(patient_ids)
        appt_id = random.choice(appointment_ids) if random.random() > 0.1 else None
        treatment = random.choice(Config.TREATMENT_TYPES)
        price_range = treatment_prices.get(treatment, (100, 1000))
        amount = round(random.uniform(*price_range), 2)

        charge_date = datetime.now() - timedelta(days=random.randint(0, 180))

        charges.append({
            "charge_id": f"C{i:06d}",
            "patient_id": patient_id,
            "appointment_id": appt_id,
            "charge_date": charge_date.date(),
            "treatment_item": treatment,
            "amount": amount,
            "payment_method": random.choice(payment_methods),
            "is_paid": random.random() > 0.05,
            "batch_id": None
        })

    return pl.DataFrame(charges)


def generate_treatment_plans(patients_df: pl.DataFrame, count=150) -> pl.DataFrame:
    """生成治疗计划数据"""
    plan_names = ["正畸治疗方案", "种植牙方案", "根管治疗方案", "牙周治疗方案", "修复方案"]

    plans = []
    patient_ids = patients_df["patient_id"].to_list()
    doctor_names = patients_df["responsible_doctor"].unique().to_list()

    for i in range(1, count + 1):
        patient_id = random.choice(patient_ids)
        patient_row = patients_df.filter(pl.col("patient_id") == patient_id).row(0, named=True)
        treatment_type = random.choice(Config.TREATMENT_TYPES)
        total_sessions = random.randint(1, 12)
        completed = random.randint(0, total_sessions)
        plan_date = datetime.now() - timedelta(days=random.randint(0, 365))

        status = "进行中"
        if completed >= total_sessions:
            status = "已完成"
        elif random.random() < 0.1:
            status = "已暂停"

        plans.append({
            "plan_id": f"PL{i:06d}",
            "patient_id": patient_id,
            "plan_name": f"{treatment_type}-{random.choice(plan_names)}",
            "treatment_type": treatment_type,
            "total_sessions": total_sessions,
            "completed_sessions": completed,
            "plan_date": plan_date.date(),
            "expected_end_date": (plan_date + timedelta(days=random.randint(30, 365))).date(),
            "status": status,
            "doctor_name": patient_row["responsible_doctor"],
            "batch_id": None
        })

    return pl.DataFrame(plans)


def generate_followup_tasks(patients_df: pl.DataFrame, appointments_df: pl.DataFrame, count=200) -> pl.DataFrame:
    """生成随访任务数据"""
    task_types = ["术后随访", "复诊提醒", "满意度调查", "治疗计划跟进", "健康宣教"]
    task_statuses = ["待处理", "进行中", "已完成", "已取消"]
    status_weights = [30, 20, 40, 10]

    tasks = []
    patient_ids = patients_df["patient_id"].to_list()
    appointment_ids = appointments_df["appointment_id"].to_list()
    doctors = patients_df["responsible_doctor"].unique().to_list()

    for i in range(1, count + 1):
        patient_id = random.choice(patient_ids)
        appt_id = random.choice(appointment_ids) if random.random() > 0.3 else None
        create_date = datetime.now() - timedelta(days=random.randint(0, 60))
        status = random.choices(task_statuses, weights=status_weights)[0]

        complete_date = None
        if status == "已完成":
            complete_date = (create_date + timedelta(days=random.randint(1, 7))).date()

        tasks.append({
            "task_id": f"T{i:06d}",
            "patient_id": patient_id,
            "appointment_id": appt_id,
            "task_type": random.choice(task_types),
            "task_status": status,
            "assigned_to": random.choice(doctors),
            "create_date": create_date.date(),
            "due_date": (create_date + timedelta(days=random.randint(3, 14))).date(),
            "complete_date": complete_date,
            "batch_id": None
        })

    return pl.DataFrame(tasks)


def generate_system_users() -> pl.DataFrame:
    """生成系统用户数据"""
    users = [
        {"user_id": "U001", "user_name": "张院长", "role": "management", "department": "院办", "is_active": True},
        {"user_id": "U002", "user_name": "李主任", "role": "management", "department": "医务科", "is_active": True},
        {"user_id": "U003", "user_name": "王医生", "role": "frontline", "department": "口腔内科", "is_active": True},
        {"user_id": "U004", "user_name": "李医生", "role": "frontline", "department": "正畸科", "is_active": True},
        {"user_id": "U005", "user_name": "张医生", "role": "frontline", "department": "修复科", "is_active": True},
        {"user_id": "U006", "user_name": "刘医生", "role": "frontline", "department": "牙周科", "is_active": True},
        {"user_id": "U007", "user_name": "陈医生", "role": "frontline", "department": "儿童牙科", "is_active": True},
    ]
    return pl.DataFrame(users)


def initialize_sample_data():
    """初始化所有模拟数据并导入数据库"""
    from src.data_processor import (
        process_his_data,
        merge_imaging_data,
        merge_charge_data,
        merge_treatment_plans,
        merge_followup_tasks
    )
    from src.database import get_db_connection, init_database

    print("正在初始化数据库...")
    init_database()

    print("正在生成模拟数据...")

    patients = generate_patients(200)
    appointments = generate_appointments(patients, 500)
    print(f"  - 生成患者数据: {len(patients)} 条")
    print(f"  - 生成预约数据: {len(appointments)} 条")

    result = process_his_data(patients, appointments)
    print(f"  - HIS数据导入完成, 批次ID: {result['batch_id']}")

    imaging = generate_imaging(patients, appointments, 300)
    result = merge_imaging_data(imaging)
    print(f"  - 影像数据导入完成, {len(imaging)} 条, 批次ID: {result['batch_id']}")

    charges = generate_charges(patients, appointments, 400)
    result = merge_charge_data(charges)
    print(f"  - 收费数据导入完成, {len(charges)} 条, 批次ID: {result['batch_id']}")

    plans = generate_treatment_plans(patients, 150)
    result = merge_treatment_plans(plans)
    print(f"  - 治疗计划导入完成, {len(plans)} 条, 批次ID: {result['batch_id']}")

    tasks = generate_followup_tasks(patients, appointments, 200)
    result = merge_followup_tasks(tasks)
    print(f"  - 随访任务导入完成, {len(tasks)} 条, 批次ID: {result['batch_id']}")

    users = generate_system_users()
    conn = get_db_connection()
    conn.register('users_temp', users.to_pandas())
    conn.execute("INSERT OR REPLACE INTO system_users SELECT * FROM users_temp")
    conn.close()
    print(f"  - 系统用户导入完成, {len(users)} 条")

    print("\n模拟数据初始化完成!")


if __name__ == "__main__":
    initialize_sample_data()
