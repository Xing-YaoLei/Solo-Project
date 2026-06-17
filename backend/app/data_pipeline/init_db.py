import os
import sys
import random
import uuid
import logging
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.db.database import get_pg_engine, get_pg_session, Base, get_duckdb, DUCKDB_PATH, is_pg_available
from app.db import models
from app.data_pipeline.etl_pipeline import etl_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RESIDENT_NAMES = [
    "张桂芳", "李建国", "王秀兰", "刘德海", "陈秀英",
    "杨振华", "赵淑琴", "黄志明", "周美华", "吴天福",
    "徐丽娟", "孙长兴", "马春花", "朱伟民", "胡金凤",
    "郭树林", "何玉珍", "高志远", "林雅琴", "罗明辉"
]

CARE_LEVELS = ["自理", "半自理", "全护理", "特护"]
DISEASES = ["高血压", "糖尿病", "冠心病", "阿尔茨海默症", "骨质疏松", "脑梗塞后遗症", "慢性支气管炎"]
AREAS = ["A区一楼", "A区二楼", "B区一楼", "B区二楼", "C区三楼"]
ACTIVITY_TYPES = ["晨练", "手工活动", "书法绘画", "音乐欣赏", "康复训练", "棋牌娱乐", "观影活动"]
RISK_TYPES = [
    ("fall", "跌倒", "high"),
    ("pressure_ulcer", "压疮", "medium"),
    ("wandering", "走失", "high"),
    ("medication_error", "用药失误", "medium"),
    ("other", "其他", "low")
]
CARE_TYPES = ["晨间护理", "午间护理", "晚间护理", "翻身拍背", "康复训练", "用药护理", "生命体征测量"]
CAREGIVERS = ["王护士", "李护理员", "张护理员", "陈护工", "刘护理员", "赵护士"]

CHARGE_ITEMS = [
    ("床位费", "accommodation", 120.0),
    ("护理费-半自理", "care_semi", 80.0),
    ("护理费-全护理", "care_full", 150.0),
    ("护理费-特护", "care_special", 260.0),
    ("伙食费", "meal", 60.0),
    ("康复治疗费", "rehab", 100.0),
    ("体检费", "checkup", 300.0),
    ("药品费", "medicine", 50.0),
]

HEALTH_METRICS = [
    ("血压_收缩压", "bp_systolic", "mmHg", 90, 160),
    ("血压_舒张压", "bp_diastolic", "mmHg", 60, 100),
    ("心率", "heart_rate", "bpm", 60, 100),
    ("血氧", "spo2", "%", 92, 99),
    ("体温", "temperature", "°C", 36.0, 37.4),
    ("血糖", "blood_glucose", "mmol/L", 4.0, 10.0),
]


def init_pg_database():
    engine = get_pg_engine()
    Base.metadata.create_all(bind=engine)
    logger.info(f"PostgreSQL/SQLite 业务表创建完成，使用 {'PostgreSQL' if is_pg_available() else 'SQLite(降级)'}")


def seed_beds(pg):
    if pg.query(models.Bed).count() > 0:
        logger.info("床位数据已存在，跳过")
        return
    beds = []
    for area in AREAS:
        floor = area[-2:]
        for i in range(1, 9):
            bed_no = f"{area[0]}{floor.replace('楼','')}{i:02d}"
            beds.append(models.Bed(
                id=str(uuid.uuid4()),
                bed_no=bed_no,
                area=area,
                floor=floor,
                status="occupied" if i <= 6 else "available"
            ))
    pg.add_all(beds)
    pg.commit()
    logger.info(f"已插入 {len(beds)} 条床位数据")


def seed_residents(pg):
    if pg.query(models.Resident).count() > 0:
        logger.info("老人数据已存在，跳过")
        return
    beds = pg.query(models.Bed).filter(models.Bed.status == "occupied").all()
    residents = []
    for i, name in enumerate(RESIDENT_NAMES):
        age = random.randint(65, 92)
        gender = random.choice(["男", "女"])
        care_level = random.choices(CARE_LEVELS, weights=[0.3, 0.35, 0.25, 0.1])[0]
        disease = random.choice(DISEASES)
        days_ago = random.randint(10, 300)
        admission_date = (datetime.now() - timedelta(days=days_ago)).date()
        bed = beds[i % len(beds)]
        residents.append(models.Resident(
            id=str(uuid.uuid4()),
            name=name,
            age=age,
            gender=gender,
            care_level=care_level,
            admission_date=admission_date,
            primary_disease=disease,
            bed_id=bed.id
        ))
    pg.add_all(residents)
    pg.commit()
    logger.info(f"已插入 {len(residents)} 条老人数据")


def seed_care_records(pg):
    if pg.query(models.CareRecord).count() > 0:
        logger.info("护理记录已存在，跳过")
        return
    residents = pg.query(models.Resident).all()
    today = datetime.now()
    care_records = []
    for day in range(60):
        record_date = today - timedelta(days=day)
        for resident in residents:
            num_cares = random.randint(3, 5)
            care_types_today = random.sample(CARE_TYPES, num_cares)
            for j, care_type in enumerate(care_types_today):
                hour = 6 + j * 4
                if hour > 22:
                    hour = 20
                care_time = record_date.replace(hour=hour, minute=random.randint(0, 30))
                is_completed = random.random() > 0.1
                caregiver = random.choice(CAREGIVERS)
                care_records.append(models.CareRecord(
                    id=str(uuid.uuid4()),
                    resident_id=resident.id,
                    care_time=care_time,
                    care_type=care_type,
                    is_completed=is_completed,
                    caregiver=caregiver
                ))
    pg.add_all(care_records)
    pg.commit()
    logger.info(f"已插入 {len(care_records)} 条护理记录")


def seed_activities(pg):
    if pg.query(models.Activity).count() > 0:
        logger.info("活动数据已存在，跳过")
        return
    today = datetime.now()
    activities = []
    for day in range(60):
        record_date = today - timedelta(days=day)
        num_activities = random.randint(2, 4)
        types_today = random.sample(ACTIVITY_TYPES, num_activities)
        for i, activity_type in enumerate(types_today):
            start_hour = 8 + i * 3
            if start_hour > 20:
                start_hour = 15
            start_time = record_date.replace(hour=start_hour, minute=0)
            end_time = start_time + timedelta(hours=1)
            locations = ["活动室", "康复室", "多功能厅", "户外花园"]
            location = random.choice(locations)
            activities.append(models.Activity(
                id=str(uuid.uuid4()),
                name=f"{activity_type}活动",
                type=activity_type,
                start_time=start_time,
                end_time=end_time,
                location=location
            ))
    pg.add_all(activities)
    pg.commit()
    logger.info(f"已插入 {len(activities)} 条活动数据")
    return activities


def seed_activity_signins(pg):
    if pg.query(models.ActivitySignin).count() > 0:
        logger.info("签到数据已存在，跳过")
        return
    activities = pg.query(models.Activity).all()
    residents = pg.query(models.Resident).all()
    signins = []
    for activity in activities:
        participant_rate = random.uniform(0.5, 0.9)
        num_participants = int(len(residents) * participant_rate)
        participants = random.sample(residents, num_participants)
        for resident in participants:
            start_time = activity.start_time
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time)
            signin_time = start_time + timedelta(minutes=random.randint(-10, 30))
            signin_types = ["manual", "face", "card"]
            signin_type = random.choice(signin_types)
            signins.append(models.ActivitySignin(
                id=str(uuid.uuid4()),
                activity_id=activity.id,
                resident_id=resident.id,
                signin_time=signin_time,
                signin_type=signin_type
            ))
    pg.add_all(signins)
    pg.commit()
    logger.info(f"已插入 {len(signins)} 条活动签到数据")


def seed_risk_events(pg):
    if pg.query(models.RiskEvent).count() > 0:
        logger.info("风险事件数据已存在，跳过")
        return
    residents = pg.query(models.Resident).all()
    today = datetime.now()
    risk_events = []
    remarks = []
    for day in range(60):
        record_date = today - timedelta(days=day)
        if random.random() > 0.3:
            continue
        num_events = random.randint(1, 3)
        for _ in range(num_events):
            risk_type_info = random.choice(RISK_TYPES)
            risk_type, type_name, level = risk_type_info
            resident = random.choice(residents)
            hour = random.randint(6, 22)
            occur_time = record_date.replace(hour=hour, minute=random.randint(0, 59))
            descriptions = {
                "fall": "老人在卫生间滑倒，左侧手臂擦伤，已及时处理",
                "pressure_ulcer": "骶尾部出现一期压疮，已加强翻身护理",
                "wandering": "老人试图走出院区大门，被门卫及时拦回",
                "medication_error": "降压药漏服一次，已补服并监测血压",
                "other": "情绪波动较大，与其他老人发生口角"
            }
            description = descriptions.get(risk_type, "一般风险事件")
            event_id = str(uuid.uuid4())
            risk_events.append(models.RiskEvent(
                id=event_id,
                type=risk_type,
                level=level,
                resident_id=resident.id,
                occur_time=occur_time,
                description=description
            ))
            if random.random() > 0.4:
                remark_contents = [
                    "当时判断为环境因素导致，已调整卫生间防滑垫",
                    "护理排班较紧，建议增加夜班人员",
                    "家属已通知，表示理解",
                    "已加强该老人的巡视频率",
                    "后续将重点关注此类风险"
                ]
                remark_content = random.choice(remark_contents)
                remark_time = occur_time + timedelta(hours=random.randint(1, 24))
                remarks.append(models.RiskRemark(
                    id=str(uuid.uuid4()),
                    risk_event_id=event_id,
                    content=remark_content,
                    user_name=random.choice(["张主管", "李护士长", "王主任"]),
                    remark_type=random.choice(["initial", "review", "improvement"]),
                    created_at=remark_time
                ))
    pg.add_all(risk_events)
    pg.add_all(remarks)
    pg.commit()
    logger.info(f"已插入 {len(risk_events)} 条风险事件，{len(remarks)} 条备注")


def seed_thresholds(pg):
    if pg.query(models.ThresholdConfig).count() > 0:
        logger.info("阈值配置已存在，跳过")
        return
    thresholds = [
        models.ThresholdConfig(
            id=str(uuid.uuid4()),
            metric_key="care_compliance_rate",
            metric_name="护理达标率",
            warning_threshold=90,
            critical_threshold=80,
            unit="%",
            updated_by="系统初始化"
        ),
        models.ThresholdConfig(
            id=str(uuid.uuid4()),
            metric_key="activity_participation_rate",
            metric_name="活动参与率",
            warning_threshold=60,
            critical_threshold=40,
            unit="%",
            updated_by="系统初始化"
        ),
        models.ThresholdConfig(
            id=str(uuid.uuid4()),
            metric_key="bed_occupancy_rate",
            metric_name="床位利用率",
            warning_threshold=70,
            critical_threshold=50,
            unit="%",
            updated_by="系统初始化"
        ),
        models.ThresholdConfig(
            id=str(uuid.uuid4()),
            metric_key="risk_event_count",
            metric_name="周风险事件数",
            warning_threshold=10,
            critical_threshold=20,
            unit="起",
            updated_by="系统初始化"
        ),
        models.ThresholdConfig(
            id=str(uuid.uuid4()),
            metric_key="fall_event_count",
            metric_name="月跌倒事件数",
            warning_threshold=3,
            critical_threshold=6,
            unit="起",
            updated_by="系统初始化"
        )
    ]
    pg.add_all(thresholds)
    pg.commit()
    logger.info(f"已插入 {len(thresholds)} 条阈值配置")


def seed_charging_records(pg):
    if pg.query(models.ChargingRecord).count() > 0:
        logger.info("收费记录已存在，跳过")
        return
    residents = pg.query(models.Resident).all()
    today = datetime.now()
    records = []
    for day in range(60):
        charge_date = (today - timedelta(days=day)).date()
        for resident in residents:
            num_items = random.randint(2, 4)
            items = random.sample(CHARGE_ITEMS, num_items)
            for item_name, item_type, base_price in items:
                amount = round(base_price * random.uniform(0.9, 1.1), 2)
                records.append(models.ChargingRecord(
                    id=str(uuid.uuid4()),
                    resident_id=resident.id,
                    resident_name=resident.name,
                    charge_date=charge_date,
                    item_type=item_type,
                    item_name=item_name,
                    amount=amount,
                    payment_method=random.choice(["微信", "支付宝", "银行转账", "现金"]),
                    payment_status="paid",
                    source_system="charging_system",
                    raw_data=f'{{"resident_id":"{resident.id}","item":"{item_name}"}}',
                    is_cleaned=False
                ))
    pg.add_all(records)
    pg.commit()
    logger.info(f"已插入 {len(records)} 条收费系统原始数据")


def seed_access_logs(pg):
    if pg.query(models.AccessLog).count() > 0:
        logger.info("门禁记录已存在，跳过")
        return
    residents = pg.query(models.Resident).all()
    today = datetime.now()
    records = []
    for day in range(60):
        base_date = today - timedelta(days=day)
        minute_offset = 0
        for resident in residents:
            if random.random() > 0.4:
                continue
            num_events = random.randint(1, 2)
            for i in range(num_events):
                hour_out = random.randint(7, 10)
                minute_offset += 1
                access_time_out = base_date.replace(hour=hour_out, minute=minute_offset % 60, second=minute_offset % 60)
                records.append(models.AccessLog(
                    id=str(uuid.uuid4()),
                    resident_id=resident.id,
                    resident_name=resident.name,
                    access_time=access_time_out,
                    direction="out",
                    device_id=f"DEV{random.randint(1,5):02d}",
                    device_location=random.choice(["大门", "侧门"]),
                    card_no=f"CARD{resident.id[-6:]}" if resident.id else None,
                    source_system="access_control",
                    raw_data=f'{{"resident_id":"{resident.id}","direction":"out"}}',
                    is_cleaned=False
                ))
                hour_in = random.randint(15, 20)
                minute_offset += 1
                access_time_in = base_date.replace(hour=hour_in, minute=minute_offset % 60, second=minute_offset % 60)
                records.append(models.AccessLog(
                    id=str(uuid.uuid4()),
                    resident_id=resident.id,
                    resident_name=resident.name,
                    access_time=access_time_in,
                    direction="in",
                    device_id=f"DEV{random.randint(1,5):02d}",
                    device_location=random.choice(["大门", "侧门"]),
                    card_no=f"CARD{resident.id[-6:]}" if resident.id else None,
                    source_system="access_control",
                    raw_data=f'{{"resident_id":"{resident.id}","direction":"in"}}',
                    is_cleaned=False
                ))
    pg.add_all(records)
    pg.commit()
    logger.info(f"已插入 {len(records)} 条门禁记录原始数据")


def seed_health_metrics(pg):
    if pg.query(models.HealthMetric).count() > 0:
        logger.info("健康设备数据已存在，跳过")
        return
    residents = pg.query(models.Resident).all()
    today = datetime.now()
    records = []
    for day in range(60):
        measure_date = today - timedelta(days=day)
        ts_offset = 0
        for resident in residents:
            num_measures = random.randint(2, 4)
            metrics = random.sample(HEALTH_METRICS, num_measures)
            for metric_name, metric_type, metric_unit, vmin, vmax in metrics:
                if isinstance(vmin, int):
                    metric_value = round(random.uniform(vmin, vmax), 1)
                else:
                    metric_value = round(random.uniform(vmin, vmax), 2)
                ts_offset += 1
                hour = (6 + ts_offset % 16)
                measure_time = measure_date.replace(hour=hour, minute=ts_offset % 60, second=ts_offset % 60)
                records.append(models.HealthMetric(
                    id=str(uuid.uuid4()),
                    resident_id=resident.id,
                    resident_name=resident.name,
                    measure_time=measure_time,
                    metric_type=metric_type,
                    metric_value=metric_value,
                    metric_unit=metric_unit,
                    device_id=f"HEALTH{random.randint(1,10):02d}",
                    device_type=random.choice(["血压计", "血氧仪", "体温计", "血糖仪"]),
                    source_system="health_device",
                    raw_data=f'{{"resident_id":"{resident.id}","metric":"{metric_type}","value":{metric_value}}}',
                    is_cleaned=False
                ))
    pg.add_all(records)
    pg.commit()
    logger.info(f"已插入 {len(records)} 条健康设备原始数据")


def seed_all():
    if os.path.exists(DUCKDB_PATH):
        os.remove(DUCKDB_PATH)
        logger.info(f"已清理旧 DuckDB 文件: {DUCKDB_PATH}")

    init_pg_database()
    pg = get_pg_session()

    try:
        seed_beds(pg)
        seed_residents(pg)
        seed_care_records(pg)
        seed_activities(pg)
        seed_activity_signins(pg)
        seed_risk_events(pg)
        seed_thresholds(pg)

        seed_charging_records(pg)
        seed_access_logs(pg)
        seed_health_metrics(pg)

        logger.info("=== 开始运行 ETL 管道（清洗→去重→口径匹配→写入 DuckDB）===")
        result = etl_pipeline.run_full_pipeline()
        logger.info(f"ETL 结果: {result}")
    finally:
        pg.close()

    logger.info("所有数据初始化完成！")


if __name__ == "__main__":
    seed_all()
