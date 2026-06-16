import sys
import random
from datetime import datetime, timedelta, date
from decimal import Decimal

from database import SessionLocal
from database.models import (
    Patient,
    Appointment,
    PaymentDetail,
    ImageAttachment,
    AppointmentStatus,
    AnomalyMarker,
    AnomalyType,
    Remark,
)

FIRST_NAMES = ["张", "李", "王", "刘", "陈", "杨", "黄", "赵", "周", "吴", "徐", "孙", "马", "朱", "胡"]
LAST_NAMES = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]

CLEANING_ITEMS = [
    ("洁牙", "基础洁治", 280),
    ("洁牙", "超声波洁牙", 380),
    ("洁牙", "喷砂洁牙", 480),
    ("洁牙", "牙周护理", 580),
    ("洁牙", "儿童洁牙", 200),
]

PAYMENT_METHODS = ["微信", "支付宝", "银行卡", "现金", "医保"]

IMAGE_TYPES = [
    ("X光片", "根尖片"),
    ("X光片", "全景片"),
    ("CT", "口腔CT"),
    ("照片", "口内照"),
    ("照片", "面颌照"),
]

SOURCES = ["线上预约", "电话预约", "到院预约", "转诊", "老患者"]
CHANNELS = ["微信公众号", "美团", "大众点评", "抖音", "官网", "朋友推荐"]
DEPARTMENTS = ["牙周科", "预防保健科", "儿童口腔科", "综合科"]
DOCTORS = ["王医生", "李医生", "张医生", "刘医生", "陈医生"]


def generate_patients(count=80):
    patients = []
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first}{last}"
        birth_year = random.randint(1960, 2015)
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        birth_date = date(birth_year, birth_month, birth_day)
        age = datetime.now().year - birth_year

        patient = Patient(
            patient_id=f"P{10000 + i}",
            name=name,
            gender=random.choice(["男", "女"]),
            birth_date=birth_date,
            age=age,
            phone=f"1{random.randint(3, 9)}{''.join([str(random.randint(0, 9)) for _ in range(9)])}",
            id_card=f"110{random.randint(100, 999)}{birth_year:04d}{birth_month:02d}{birth_day:02d}{random.randint(1000, 9999)}",
            address=f"北京市朝阳区{random.choice(['建国路', '朝外大街', '国贸路', '三里屯路', '望京街'])}号",
            first_visit_date=date.today() - timedelta(days=random.randint(30, 730)),
            last_visit_date=date.today() - timedelta(days=random.randint(0, 90)),
            total_visits=random.randint(1, 15),
            is_active=True,
        )
        patients.append(patient)
    return patients


def generate_appointments(patients, start_days_ago=180, end_days_ago=0, cleaning_ratio=0.7):
    appointments = []
    patient_ids = [p.patient_id for p in patients]

    status_distribution = [
        (AppointmentStatus.COMPLETED, 0.65),
        (AppointmentStatus.BOOKED, 0.08),
        (AppointmentStatus.CONFIRMED, 0.07),
        (AppointmentStatus.ARRIVED, 0.05),
        (AppointmentStatus.NO_SHOW, 0.10),
        (AppointmentStatus.CANCELLED, 0.05),
    ]

    for i in range(300):
        patient_id = random.choice(patient_ids)
        days_ago = random.randint(start_days_ago, end_days_ago)
        appt_date = date.today() - timedelta(days=days_ago)
        appt_time = f"{random.randint(8, 17):02d}:{random.choice(['00', '30'])}"

        is_cleaning = random.random() < cleaning_ratio
        if is_cleaning:
            treatment_type = "洁牙"
            item_name, service_item, base_price = random.choice(CLEANING_ITEMS)
        else:
            treatment_type = random.choice(["补牙", "拔牙", "根管治疗", "正畸", "种植", "修复"])
            service_item = f"{treatment_type}常规治疗"
            base_price = random.randint(500, 5000)

        status = random.choices(
            [s[0] for s in status_distribution],
            weights=[s[1] for s in status_distribution],
            k=1
        )[0]

        amount = Decimal(base_price) + Decimal(random.randint(-50, 100))
        paid_amount = amount if status in [AppointmentStatus.COMPLETED, AppointmentStatus.ARRIVED] else Decimal(0)

        arrival_time = None
        completion_time = None
        cancel_time = None

        if status == AppointmentStatus.ARRIVED:
            arrival_time = datetime.combine(appt_date, datetime.strptime(appt_time, "%H:%M").time()) + timedelta(minutes=random.randint(-10, 30))
        elif status == AppointmentStatus.COMPLETED:
            arrival_time = datetime.combine(appt_date, datetime.strptime(appt_time, "%H:%M").time()) + timedelta(minutes=random.randint(-10, 30))
            completion_time = arrival_time + timedelta(minutes=random.randint(30, 90))
        elif status == AppointmentStatus.CANCELLED:
            cancel_time = datetime.combine(appt_date, datetime.strptime(appt_time, "%H:%M").time()) - timedelta(hours=random.randint(1, 72))

        his_sync_delay = random.choice([0, 0, 0, 0, 1, 2, 5, 10, 24, 48])
        his_sync_time = datetime.now() - timedelta(hours=his_sync_delay) if days_ago < 7 else datetime.combine(appt_date, datetime.strptime(appt_time, "%H:%M").time()) + timedelta(hours=2)

        appt = Appointment(
            appointment_no=f"A{20240000 + i}",
            patient_id=patient_id,
            appointment_date=appt_date,
            appointment_time=appt_time,
            department=random.choice(DEPARTMENTS),
            doctor=random.choice(DOCTORS),
            treatment_type=treatment_type,
            service_item=service_item,
            status=status,
            source=random.choice(SOURCES),
            channel=random.choice(CHANNELS),
            is_cleaning=is_cleaning,
            amount=amount,
            paid_amount=paid_amount,
            arrival_time=arrival_time,
            completion_time=completion_time,
            cancel_time=cancel_time,
            cancel_reason=random.choice(["时间冲突", "身体不适", ""]) if status == AppointmentStatus.CANCELLED else None,
            no_show_reason=random.choice(["忘记预约", "临时有事", "联系不上", ""]) if status == AppointmentStatus.NO_SHOW else None,
            remark="",
            his_sync_time=his_sync_time,
        )
        appointments.append(appt)
    return appointments


def generate_payments(appointments):
    payments = []
    payment_idx = 0

    for appt in appointments:
        if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.ARRIVED] and appt.paid_amount > 0:
            has_missing_payment = random.random() < 0.05
            if has_missing_payment:
                continue

            payment_count = random.choice([1, 1, 1, 2])
            remaining = appt.paid_amount

            for j in range(payment_count):
                if j == payment_count - 1:
                    pay_amount = remaining
                else:
                    pay_amount = remaining * Decimal(random.uniform(0.3, 0.7))
                    pay_amount = Decimal(round(pay_amount, 2))
                    remaining -= pay_amount

                discount = Decimal(0)
                if random.random() < 0.3:
                    discount = appt.amount * Decimal(random.uniform(0.05, 0.3))
                    discount = Decimal(round(discount, 2))

                abnormal_amount = random.random() < 0.03
                if abnormal_amount:
                    pay_amount = pay_amount * Decimal(random.choice([0.1, 0.5, 2.0, 3.0]))
                    pay_amount = Decimal(round(pay_amount, 2))

                payment = PaymentDetail(
                    payment_no=f"PAY{20240000 + payment_idx}",
                    appointment_no=appt.appointment_no,
                    patient_id=appt.patient_id,
                    payment_date=appt.appointment_date,
                    payment_time=appt.completion_time or (datetime.combine(appt.appointment_date, datetime.strptime(appt.appointment_time, "%H:%M").time()) + timedelta(hours=1)),
                    item_code=f"ITEM{1000 + payment_idx}",
                    item_name=appt.service_item,
                    item_type=appt.treatment_type,
                    quantity=Decimal(1),
                    unit_price=appt.amount,
                    total_amount=appt.amount,
                    discount_amount=discount,
                    actual_amount=pay_amount,
                    payment_method=random.choice(PAYMENT_METHODS),
                    invoice_no=f"INV{20240000 + payment_idx}" if random.random() > 0.2 else None,
                    operator=random.choice(["张收费", "李收费", "王收费"]),
                    is_cleaning_related=appt.is_cleaning,
                    remark="折扣优惠" if discount > 0 else "",
                    his_sync_time=appt.his_sync_time,
                )
                payments.append(payment)
                payment_idx += 1
    return payments


def generate_images(patients, appointments):
    images = []
    cleaning_appts = [a for a in appointments if a.is_cleaning]

    for i, appt in enumerate(random.sample(cleaning_appts, min(100, len(cleaning_appts)))):
        img_type, img_category = random.choice(IMAGE_TYPES)
        image = ImageAttachment(
            image_no=f"IMG{20240000 + i}",
            patient_id=appt.patient_id,
            appointment_no=appt.appointment_no,
            image_type=img_type,
            image_category=img_category,
            file_path=f"/data/images/{appt.patient_id}/IMG{20240000 + i}.dcm",
            file_name=f"IMG{20240000 + i}.dcm",
            file_size=random.randint(102400, 5242880),
            upload_date=datetime.combine(appt.appointment_date, datetime.strptime(appt.appointment_time, "%H:%M").time()) + timedelta(hours=random.randint(0, 48)),
            description=f"{appt.service_item}术前{img_category}",
            is_cleaning_related=True,
        )
        images.append(image)
    return images


def seed_database():
    print("开始填充演示数据...")
    db = SessionLocal()
    try:
        print("生成患者数据...")
        patients = generate_patients(80)
        db.add_all(patients)
        db.flush()
        print(f"  生成 {len(patients)} 条患者记录")

        print("生成预约数据...")
        appointments = generate_appointments(patients)
        db.add_all(appointments)
        db.flush()
        print(f"  生成 {len(appointments)} 条预约记录")
        print(f"  其中洁牙预约: {sum(1 for a in appointments if a.is_cleaning)}")
        print(f"  状态分布:")
        for status in AppointmentStatus:
            count = sum(1 for a in appointments if a.status == status)
            print(f"    {status.value}: {count}")

        print("生成收费数据...")
        payments = generate_payments(appointments)
        db.add_all(payments)
        db.flush()
        print(f"  生成 {len(payments)} 条收费记录")

        print("生成影像数据...")
        images = generate_images(patients, appointments)
        db.add_all(images)
        db.flush()
        print(f"  生成 {len(images)} 条影像记录")

        print("生成示例异常标记...")
        delayed_appts = [a for a in appointments if a.his_sync_time and (datetime.now() - a.his_sync_time).total_seconds() > 3600 * 24]
        for appt in random.sample(delayed_appts, min(5, len(delayed_appts))):
            anomaly = AnomalyMarker(
                appointment_no=appt.appointment_no,
                anomaly_type=AnomalyType.APPOINTMENT_DELAY,
                severity="high",
                description=f"HIS同步延迟超过24小时，预约号: {appt.appointment_no}",
                data_snapshot={"appointment_no": appt.appointment_no, "his_sync_time": appt.his_sync_time.isoformat()},
                is_resolved=False,
                detected_at=datetime.now(),
            )
            db.add(anomaly)

        completed_without_payment = [a for a in appointments if a.status == AppointmentStatus.COMPLETED and not any(p.appointment_no == a.appointment_no for p in payments)]
        for appt in random.sample(completed_without_payment, min(3, len(completed_without_payment))):
            anomaly = AnomalyMarker(
                appointment_no=appt.appointment_no,
                anomaly_type=AnomalyType.MISSING_PAYMENT,
                severity="medium",
                description=f"已完成预约无对应收费记录，预约号: {appt.appointment_no}",
                data_snapshot={"appointment_no": appt.appointment_no, "amount": float(appt.amount)},
                is_resolved=False,
                detected_at=datetime.now(),
            )
            db.add(anomaly)

        db.commit()
        print("演示数据填充成功！")
        return True
    except Exception as e:
        db.rollback()
        print(f"数据填充失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = seed_database()
    sys.exit(0 if success else 1)
