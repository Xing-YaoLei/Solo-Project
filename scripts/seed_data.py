"""
示例数据生成器 - 生成门店、会员、处方等测试数据
用法: python scripts/seed_data.py [处方条数，默认200]
"""
import sys
import os
import random
from datetime import date, timedelta, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import (
    get_session, Pharmacy, Member, Prescription, PrescriptionItem,
    PrescriptionPhoto, PharmacistReview, FollowUp, User,
    PrescriptionStatus, PharmacistOpinion, FollowUpStatus, UserRole,
)

PHARMACY_DATA = [
    {"code": "PH001", "name": "仁康大药房总店", "city": "上海", "address": "南京东路100号"},
    {"code": "PH002", "name": "仁康大药房浦东分店", "city": "上海", "address": "浦东陆家嘴环路50号"},
    {"code": "PH003", "name": "仁康大药房徐汇分店", "city": "上海", "address": "徐家汇衡山路200号"},
    {"code": "PH004", "name": "仁康大药房静安分店", "city": "上海", "address": "静安区南京西路800号"},
    {"code": "PH005", "name": "仁康大药房闵行分店", "city": "上海", "address": "闵行区沪闵路1500号"},
]

DRUG_DATA = [
    {"name": "阿莫西林胶囊", "generic": "Amoxicillin", "spec": "0.25g*24粒", "dosage": "每日3次，每次1粒"},
    {"name": "布洛芬缓释胶囊", "generic": "Ibuprofen", "spec": "0.3g*20粒", "dosage": "每日2次，每次1粒"},
    {"name": "硝苯地平控释片", "generic": "Nifedipine", "spec": "30mg*7片", "dosage": "每日1次，每次1片"},
    {"name": "二甲双胍片", "generic": "Metformin", "spec": "0.5g*60片", "dosage": "每日2次，每次1片"},
    {"name": "奥美拉唑肠溶胶囊", "generic": "Omeprazole", "spec": "20mg*14粒", "dosage": "每日1次，每次1粒"},
    {"name": "辛伐他汀片", "generic": "Simvastatin", "spec": "20mg*10片", "dosage": "每晚1次，每次1片"},
    {"name": "氯雷他定片", "generic": "Loratadine", "spec": "10mg*6片", "dosage": "每日1次，每次1片"},
    {"name": "头孢克肟胶囊", "generic": "Cefixime", "spec": "0.1g*6粒", "dosage": "每日2次，每次1粒"},
    {"name": "孟鲁司特钠片", "generic": "Montelukast", "spec": "10mg*7片", "dosage": "每晚1次，每次1片"},
    {"name": "缬沙坦胶囊", "generic": "Valsartan", "spec": "80mg*7粒", "dosage": "每日1次，每次1粒"},
]

SURNAMES = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"]
GIVEN_NAMES = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平"]
HOSPITALS = ["上海第一人民医院", "复旦大学附属中山医院", "上海交通大学附属瑞金医院", "上海市第六人民医院", "同济大学附属同济医院"]


def _random_date(start_days: int = 90, end_days: int = 0) -> date:
    today = date.today()
    start = today - timedelta(days=start_days)
    delta = random.randint(0, start_days - end_days)
    return start + timedelta(days=delta)


def _random_phone() -> str:
    return "1" + str(random.choice([3, 5, 7, 8, 9])) + "".join([str(random.randint(0, 9)) for _ in range(9)])


def _random_id_card() -> str:
    return "31010" + str(random.randint(0, 9)) + "".join([str(random.randint(0, 9)) for _ in range(12)])


def seed_pharmacies(session) -> list:
    result = []
    for data in PHARMACY_DATA:
        existing = session.query(Pharmacy).filter(Pharmacy.code == data["code"]).first()
        if not existing:
            ph = Pharmacy(**data, phone=_random_phone())
            session.add(ph)
            session.flush()
            result.append(ph)
        else:
            result.append(existing)
    session.commit()
    print(f"门店: {len(result)} 家")
    return result


def seed_members(session, pharmacies: list, count: int = 100) -> list:
    members = []
    for i in range(count):
        surname = random.choice(SURNAMES)
        given = random.choice(GIVEN_NAMES)
        name = surname + given
        gender = random.choice(["男", "女"])
        birth = _random_date(365 * 60, 365 * 18)
        member_no = f"M{202400000 + i}"

        existing = session.query(Member).filter(Member.member_no == member_no).first()
        if existing:
            members.append(existing)
            continue

        member = Member(
            member_no=member_no,
            name=name,
            gender=gender,
            birth_date=birth,
            phone=_random_phone(),
            id_card=_random_id_card(),
            pharmacy_id=random.choice(pharmacies).id,
            insurance_no=f"YB{random.randint(10000000, 99999999)}",
            insurance_type=random.choice(["职工医保", "居民医保", "新农合"]),
            created_at=datetime.combine(_random_date(365), datetime.min.time()),
            updated_at=datetime.combine(_random_date(30), datetime.min.time()),
        )
        session.add(member)
        members.append(member)
    session.commit()
    print(f"会员: {len(members)} 人")
    return members


def seed_prescriptions(session, pharmacies: list, members: list, count: int = 200) -> list:
    pharmacists = session.query(User).filter(User.role == UserRole.PHARMACIST).all()
    workers = session.query(User).filter(User.role == UserRole.EXECUTOR).all()
    prescriptions = []

    for i in range(count):
        rx_no = f"RX{date.today().strftime('%Y%m%d')}{i + 1000:04d}"
        existing = session.query(Prescription).filter(Prescription.prescription_no == rx_no).first()
        if existing:
            prescriptions.append(existing)
            continue

        pharmacy = random.choice(pharmacies)
        member = random.choice(members) if random.random() > 0.3 else None
        rx_date = _random_date(60)
        status = random.choice([
            PrescriptionStatus.RECEIVED, PrescriptionStatus.UNDER_REVIEW,
            PrescriptionStatus.APPROVED, PrescriptionStatus.REJECTED,
            PrescriptionStatus.NEEDS_CLARIFICATION, PrescriptionStatus.FOLLOW_UP,
        ])

        photo_count = random.choices([1, 2, 3, 4, 5, 6], weights=[20, 35, 25, 12, 5, 3])[0]
        has_unclear = random.random() < 0.15

        total_amount = round(random.uniform(30, 500), 2)
        insurance_ratio = random.choice([0, 0.3, 0.5, 0.65, 0.8])
        insurance_amount = round(total_amount * insurance_ratio, 2)

        rx = Prescription(
            prescription_no=rx_no,
            pharmacy_id=pharmacy.id,
            member_id=member.id if member else None,
            pos_order_no=f"POS{random.randint(100000, 999999)}",
            patient_name=member.name if member else random.choice(SURNAMES) + random.choice(GIVEN_NAMES),
            doctor_name=random.choice(SURNAMES) + random.choice(["医生", "主任", "医师"]),
            hospital=random.choice(HOSPITALS),
            prescription_date=rx_date,
            review_date=datetime.combine(rx_date + timedelta(days=random.randint(0, 2)), datetime.min.time()) if status != PrescriptionStatus.RECEIVED else None,
            status=status,
            total_amount=total_amount,
            insurance_amount=insurance_amount,
            self_pay_amount=round(total_amount - insurance_amount, 2),
            photo_count=photo_count,
            has_unclear_photo=has_unclear,
            created_at=datetime.combine(rx_date, datetime.min.time()),
        )
        session.add(rx)
        session.flush()

        drug_count = random.randint(1, 4)
        selected_drugs = random.sample(DRUG_DATA, drug_count)
        for drug in selected_drugs:
            qty = random.randint(1, 5)
            unit_price = round(random.uniform(5, 80), 2)
            batch_date = _random_date(600, 0)
            expiry = batch_date + timedelta(days=random.randint(180, 730))

            item = PrescriptionItem(
                prescription_id=rx.id,
                drug_code=f"D{random.randint(1000, 9999)}",
                drug_name=drug["name"],
                generic_name=drug["generic"],
                specification=drug["spec"],
                batch_no=f"B{batch_date.strftime('%Y%m')}{random.randint(10, 99)}",
                expiry_date=expiry,
                quantity=qty,
                unit="盒",
                unit_price=unit_price,
                total_price=round(qty * unit_price, 2),
                dosage=drug["dosage"],
                frequency=random.choice(["每日1次", "每日2次", "每日3次"]),
                days_supply=random.randint(3, 14),
            )
            session.add(item)

        for p in range(photo_count):
            is_clear = not (p == 0 and has_unclear)
            photo = PrescriptionPhoto(
                prescription_id=rx.id,
                photo_url=f"/photos/{rx_no}_{p + 1}.jpg",
                photo_type="prescription",
                quality_score=round(random.uniform(0.5, 1.0), 2) if is_clear else round(random.uniform(0.1, 0.4), 2),
                is_clear=is_clear,
                page_no=p + 1,
            )
            session.add(photo)

        if status == PrescriptionStatus.APPROVED and pharmacists:
            # 通过的处方：审核意见都是 PASSED
            review = PharmacistReview(
                prescription_id=rx.id,
                pharmacist_id=random.choice(pharmacists).id,
                opinion=PharmacistOpinion.PASSED,
                comment="审核通过，用药合理",
            )
            session.add(review)
        elif status == PrescriptionStatus.REJECTED and pharmacists:
            # 驳回的处方：从异常意见里随机选
            reject_opinions = [
                PharmacistOpinion.DOSE_ISSUE,
                PharmacistOpinion.INTERACTION_WARNING,
                PharmacistOpinion.DUPLICATE_THERAPY,
                PharmacistOpinion.CONTRAINDICATION,
            ]
            opinion = random.choice(reject_opinions)
            review = PharmacistReview(
                prescription_id=rx.id,
                pharmacist_id=random.choice(pharmacists).id,
                opinion=opinion,
                comment="存在用药问题，需调整",
            )
            session.add(review)
        elif status == PrescriptionStatus.NEEDS_CLARIFICATION and pharmacists:
            # 需澄清的处方：从澄清类意见里随机
            clarify_opinions = [PharmacistOpinion.PHOTO_UNCLEAR, PharmacistOpinion.INCOMPLETE_INFO]
            opinion = random.choice(clarify_opinions)
            review = PharmacistReview(
                prescription_id=rx.id,
                pharmacist_id=random.choice(pharmacists).id,
                opinion=opinion,
                comment="处方信息不清晰，需进一步确认",
            )
            session.add(review)

        if status in [PrescriptionStatus.NEEDS_CLARIFICATION, PrescriptionStatus.FOLLOW_UP] and workers:
            fu_status = random.choice([FollowUpStatus.PENDING, FollowUpStatus.IN_PROGRESS, FollowUpStatus.COMPLETED])
            fu = FollowUp(
                prescription_id=rx.id,
                assigned_to=random.choice(workers).id if fu_status != FollowUpStatus.PENDING else None,
                status=fu_status,
                priority=random.randint(0, 2),
                follow_up_type=random.choice(["clarification", "photo_unclear", "review"]),
                content="处方信息需进一步确认" if has_unclear else "需回访患者用药情况",
                due_date=rx_date + timedelta(days=random.randint(1, 7)),
                completed_at=datetime.utcnow() if fu_status == FollowUpStatus.COMPLETED else None,
            )
            session.add(fu)

        prescriptions.append(rx)
        if (i + 1) % 50 == 0:
            session.commit()
            print(f"  已生成 {i + 1}/{count} 条处方")

    session.commit()
    print(f"处方: {len(prescriptions)} 条")
    return prescriptions


def run_seed(prescription_count: int = 200):
    session = get_session()
    try:
        print("开始生成示例数据...")
        pharmacies = seed_pharmacies(session)
        members = seed_members(session, pharmacies, count=max(50, prescription_count // 2))
        prescriptions = seed_prescriptions(session, pharmacies, members, count=prescription_count)
        print(f"\n示例数据生成完成: 门店{len(pharmacies)}家, 会员{len(members)}人, 处方{len(prescriptions)}条")
    finally:
        session.close()


if __name__ == "__main__":
    count = 200
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    run_seed(count)
