import random
from datetime import datetime, timedelta, date
from app.utils.database import SessionLocal
from app.models.schema import (
    ElderProfile, AdmissionAssessment, AccessRecord,
    CareTerminalRecord, BillingRecord, FallIncident,
    Medication, ReviewNote, DataSyncStatus
)

CARE_LEVELS = ["自理", "半自理", "全护理", "特护"]
SURNAMES = ["张", "王", "李", "赵", "陈", "刘", "杨", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"]
NAMES = ["桂芳", "秀英", "玉兰", "秀珍", "凤英", "建国", "国华", "志强", "德明", "福荣", "永康", "和平"]
CARE_ITEMS = ["晨间护理", "午间护理", "晚间护理", "用药记录", "生命体征", "康复训练", "饮食照料", "清洁护理"]
BILLING_TYPES = ["护理费", "床位费", "餐费", "药费", "其他"]


def generate_sample_data():
    db = SessionLocal()
    try:
        if db.query(ElderProfile).count() > 0:
            print("数据库已有数据，跳过生成示例数据")
            return

        elders = []
        for i in range(50):
            surname = random.choice(SURNAMES)
            name = random.choice(NAMES)
            birth_year = random.randint(1935, 1955)
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)
            admission_offset = random.randint(30, 1095)

            elder = ElderProfile(
                elder_code=f"EL{2024001 + i}",
                name=f"{surname}{name}",
                gender=random.choice(["男", "女"]),
                birth_date=date(birth_year, birth_month, birth_day),
                id_card=f"330102{birth_year}{birth_month:02d}{birth_day:02d}{random.randint(1000, 9999)}",
                phone=f"138{random.randint(10000000, 99999999)}",
                emergency_contact=f"{random.choice(SURNAMES)}{random.choice(['先生', '女士'])}",
                emergency_phone=f"139{random.randint(10000000, 99999999)}",
                admission_date=date.today() - timedelta(days=admission_offset),
                room_number=f"{random.randint(1, 5)}0{random.randint(1, 9)}",
                current_status="在住",
            )
            elders.append(elder)
            db.add(elder)
        db.flush()
        print(f"生成 {len(elders)} 条老人档案")

        for elder in elders:
            assessment_count = random.randint(3, 12)
            base_score = random.randint(30, 95)
            for j in range(assessment_count):
                days_offset = random.randint(0, admission_offset)
                score = max(0, min(100, base_score + random.randint(-15, 10)))
                if score >= 90:
                    level = "自理"
                elif score >= 60:
                    level = "半自理"
                elif score >= 30:
                    level = "全护理"
                else:
                    level = "特护"

                assessment = AdmissionAssessment(
                    elder_id=elder.id,
                    assessment_date=elder.admission_date + timedelta(days=days_offset),
                    care_level=level,
                    care_score=score,
                    physical_condition=random.choice(["良好", "一般", "较差"]),
                    cognitive_status=random.choice(["清晰", "轻度障碍", "中度障碍", "重度障碍"]),
                    mobility_level=random.choice(["自主", "辅助", "轮椅", "卧床"]),
                    self_care_ability=random.choice(["完全自理", "部分自理", "需协助", "完全依赖"]),
                    nutritional_status=random.choice(["良好", "一般", "营养不良"]),
                    assessor=f"评估师{random.choice(['A', 'B', 'C'])}",
                    assessment_source="入住评估系统",
                )
                db.add(assessment)
        db.flush()
        print("生成入住评估记录")

        for elder in elders:
            for _ in range(random.randint(2, 10)):
                offset_days = random.randint(0, 60)
                record_time = datetime.now() - timedelta(days=offset_days, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                created_time = record_time + timedelta(seconds=random.randint(-300, 7200))

                access = AccessRecord(
                    elder_code=elder.elder_code,
                    access_time=record_time,
                    access_type=random.choice(["进入", "外出"]),
                    device_id=f"DEV{random.randint(1, 10)}",
                    location=random.choice(["大门", "活动区", "餐厅", "楼层门禁"]),
                    sync_delay_seconds=max(0, int((created_time - record_time).total_seconds())),
                    is_delayed=(created_time - record_time).total_seconds() > 3600,
                    created_at=created_time,
                )
                db.add(access)
        db.flush()
        print("生成门禁记录")

        expected_items = ["晨间护理", "午间护理", "晚间护理", "用药记录", "生命体征"]
        for elder in elders:
            for offset_days in range(14):
                check_date = date.today() - timedelta(days=offset_days)
                items_today = random.sample(expected_items, random.randint(3, 5))
                for item in items_today:
                    missing = random.random() < 0.08
                    care = CareTerminalRecord(
                        elder_code=elder.elder_code,
                        record_date=check_date,
                        terminal_id=f"TERM{random.randint(1, 20)}",
                        care_item=item,
                        care_time=datetime.now() - timedelta(days=offset_days, hours=random.randint(6, 20)),
                        caregiver=f"护工{random.choice(['甲', '乙', '丙', '丁'])}",
                        care_status="缺失" if missing else "已完成",
                        is_missing=missing,
                        missing_reason=f"护理终端缺失记录: {item}" if missing else None,
                    )
                    db.add(care)
        db.flush()
        print("生成护理终端记录")

        for elder in elders:
            for offset_days in range(0, 90, 30):
                billing_date = date.today().replace(day=1) - timedelta(days=offset_days)
                caliber = "v1.0" if offset_days > 30 else "v1.1"
                last_assessment = db.query(AdmissionAssessment).filter(
                    AdmissionAssessment.elder_id == elder.id
                ).order_by(AdmissionAssessment.assessment_date.desc()).first()

                billing = BillingRecord(
                    elder_code=elder.elder_code,
                    billing_date=billing_date,
                    billing_type=random.choice(BILLING_TYPES),
                    care_level_billed=last_assessment.care_level if last_assessment else random.choice(CARE_LEVELS),
                    amount=random.randint(800, 8000),
                    billing_caliber_version=caliber,
                    caliber_changed=(offset_days == 30),
                    change_note="口径从v1.0变更为v1.1" if offset_days == 30 else None,
                )
                db.add(billing)
        db.flush()
        print("生成收费记录")

        for elder in random.sample(elders, k=random.randint(3, 8)):
            offset_days = random.randint(1, 60)
            injury = random.choice(["无损伤", "轻伤", "中度", "重伤"])
            fall_time = datetime.now() - timedelta(days=offset_days, hours=random.randint(6, 22))
            impact_days = {"无损伤": 3, "轻伤": 7, "中度": 14, "重伤": 30}[injury]

            fall = FallIncident(
                elder_id=elder.id,
                fall_time=fall_time,
                fall_location=random.choice(["房间", "走廊", "卫生间", "餐厅", "活动区"]),
                fall_cause=random.choice(["地面湿滑", "起身不稳", "被障碍物绊倒", "眩晕"]),
                injury_level=injury,
                injury_description="描述略",
                handled_by=f"护士{random.choice(['甲', '乙', '丙'])}",
                handle_measures="已妥善处理",
                impact_scope_start=fall_time - timedelta(days=1),
                impact_scope_end=fall_time + timedelta(days=impact_days),
            )
            db.add(fall)
        db.flush()
        print("生成跌倒事件记录")

        for elder in elders:
            for _ in range(random.randint(1, 5)):
                med = Medication(
                    elder_id=elder.id,
                    medication_name=random.choice([
                        "硝苯地平缓释片", "阿司匹林肠溶片", "二甲双胍片", "美托洛尔片",
                        "阿托伐他汀钙片", "氯吡格雷片", "奥美拉唑胶囊", "缬沙坦胶囊"
                    ]),
                    dosage=random.choice(["5mg", "10mg", "25mg", "50mg", "100mg"]),
                    frequency=random.choice(["每日一次", "每日两次", "每日三次", "按需服用"]),
                    administration_route=random.choice(["口服", "外用", "注射"]),
                    start_date=date.today() - timedelta(days=random.randint(30, 365)),
                    prescribing_doctor=f"医生{random.choice(['A', 'B', 'C', 'D'])}",
                    is_active=True,
                )
                db.add(med)
        db.flush()
        print("生成用药清单")

        for elder in random.sample(elders, k=random.randint(10, 30)):
            for _ in range(random.randint(1, 3)):
                note = ReviewNote(
                    elder_id=elder.id,
                    note_date=date.today() - timedelta(days=random.randint(1, 90)),
                    note_type=random.choice(["常规评估", "跌倒事件", "护理调整", "其他"]),
                    content=random.choice([
                        "老人状态稳定，维持当前护理方案。",
                        "近期精神状态良好，饮食正常。",
                        "活动能力略有下降，建议加强康复训练。",
                        "调整用药剂量，观察后续反应。",
                    ]),
                    note_author=f"护士长{random.choice(['甲', '乙', '丙'])}",
                )
                db.add(note)
        db.flush()
        print("生成复盘备注")

        for sys_name in ["门禁系统", "护理终端", "收费系统"]:
            sync = DataSyncStatus(
                system_name=sys_name,
                last_sync_time=datetime.now() - timedelta(minutes=random.randint(0, 120)),
                sync_status="已同步",
                sync_count=random.randint(100, 5000),
                delay_threshold_seconds=3600,
                current_delay_seconds=random.randint(0, 50),
            )
            db.add(sync)
        db.flush()

        db.commit()
        print("示例数据生成完成！")
    except Exception as e:
        db.rollback()
        print(f"生成失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_sample_data()
