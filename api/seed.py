import asyncio
import random
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import select
from api.database import engine, Base, async_session, get_duckdb_conn, init_duckdb
from api.models import (
    Bed, Nurse, Elder, Schedule, RiskAnnotation, ReviewNote,
    MedicationRecord, VisitRecord, ActivityRecord, FallEvent,
    BillingCaliberChange,
)

FLOORS = 3
ROOMS_PER_FLOOR = 6
BEDS_PER_ROOM = 2
TOTAL_BEDS = FLOORS * ROOMS_PER_FLOOR * BEDS_PER_ROOM

NURSE_NAMES = [
    "王秀兰", "李桂芳", "张美玲", "刘翠花", "陈淑芬",
    "赵玉梅", "周凤英", "吴丽华", "孙惠芬", "朱雪琴",
    "何玉兰", "林秀珍", "黄月娥", "马春花", "高桂珍",
]

NURSE_ROLES = ["主管护师", "护师", "护士", "实习护士", "护理员"]

ELDER_NAMES = [
    "张福生", "李桂兰", "王德明", "赵秀英", "刘文斌",
    "陈美华", "杨建国", "周淑贞", "吴志强", "孙玉珍",
    "朱光明", "何凤英", "林正义", "黄翠兰", "马洪福",
    "高秀珍", "郑国华", "谢美琴", "韩德贵", "唐玉华",
    "曹福祥", "邓桂芳", "冯志明", "董秀兰", "程建国",
    "蔡美玲", "潘德安", "袁淑芬", "于正华", "蒋桂英",
]

MEDICATIONS = [
    "降压药(氨氯地平)", "降糖药(二甲双胍)", "心脏病药(硝酸甘油)",
    "安眠药(佐匹克隆)", "钙片(碳酸钙D3)", "降脂药(阿托伐他汀)",
    "抗凝药(华法林)", "胃药(奥美拉唑)", "消炎药(阿莫西林)",
    "维生素D3",
]

ACTIVITIES = [
    "晨间操", "手工艺活动", "书法练习", "棋牌娱乐",
    "音乐疗法", "康复训练", "花园散步", "阅读时间",
    "合唱团", "养生太极拳",
]

VISITOR_NAMES = [
    "张明", "李华", "王芳", "赵强", "刘丽",
    "陈军", "杨洁", "周伟", "吴敏", "孙磊",
]

SHIFT_TYPES = ["白班", "夜班", "中班"]

ANNOTATION_DESCRIPTIONS = {
    "terminal_delay": [
        "终端响应延迟超过阈值，白班响应时间达到8分钟",
        "护理终端签到延迟，夜班响应超时12分钟",
        "系统终端卡顿，导致护理记录未及时上传",
        "移动终端信号弱，数据同步延迟15分钟",
    ],
    "access_missing": [
        "探访人员未在门禁系统登记即进入楼层",
        "探访记录缺失门禁刷卡信息",
        "外部人员进入未记录访问轨迹",
        "家属探访未按规定登记身份信息",
    ],
    "billing_caliber_change": [
        "床位费计算口径由建筑面积调整为使用面积",
        "护理等级收费标准调整，未及时通知家属",
        "医疗耗材计费方式由按次改为按量",
    ],
    "fall_event": [
        "老人在卫生间跌倒，左髋部着地",
        "老人夜间起床时跌倒，额头擦伤",
        "老人在走廊行走时滑倒，右手腕扭伤",
        "老人在活动室跌倒，臀部着地",
    ],
}

SEVERITIES = ["low", "medium", "high", "critical"]

FALL_DESCRIPTIONS = [
    "老人在卫生间跌倒，左髋部着地，需协助起身",
    "老人夜间起床时跌倒，额头轻微擦伤",
    "老人在走廊行走时滑倒，右手腕扭伤",
    "老人在活动室跌倒，臀部着地，暂无外伤",
    "老人在楼梯口踉跄，护理人员及时搀扶",
]

FALL_SEVERITIES = ["轻微", "一般", "严重", "危急"]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    init_duckdb()

    async with async_session() as session:
        beds = []
        for floor in range(1, FLOORS + 1):
            for room in range(1, ROOMS_PER_FLOOR + 1):
                for bed in range(1, BEDS_PER_ROOM + 1):
                    b = Bed(
                        floor=floor,
                        room_number=f"{floor}{room:02d}",
                        bed_number=f"{floor}{room:02d}-{bed}",
                    )
                    session.add(b)
                    beds.append(b)
        await session.flush()

        nurses = []
        for i, name in enumerate(NURSE_NAMES):
            n = Nurse(
                name=name,
                role=NURSE_ROLES[i % len(NURSE_ROLES)],
            )
            session.add(n)
            nurses.append(n)
        await session.flush()

        random.shuffle(beds)
        selected_beds = beds[:30]
        elders = []
        for i, name in enumerate(ELDER_NAMES):
            e = Elder(
                name=name,
                bed_id=selected_beds[i].id,
                admission_date=date.today() - timedelta(days=random.randint(30, 365)),
            )
            session.add(e)
            elders.append(e)
        await session.flush()

        today = date.today()
        for day_offset in range(30):
            shift_date = today - timedelta(days=29 - day_offset)
            for b in beds:
                nurse = random.choice(nurses)
                shift_type = random.choice(SHIFT_TYPES)
                s = Schedule(
                    bed_id=b.id,
                    nurse_id=nurse.id,
                    shift_date=shift_date,
                    shift_type=shift_type,
                )
                session.add(s)
        await session.flush()

        annotations = []
        for day_offset in range(30):
            day = today - timedelta(days=29 - day_offset)
            count = random.randint(0, 3)
            for _ in range(count):
                ann_type = random.choice(list(ANNOTATION_DESCRIPTIONS.keys()))
                desc = random.choice(ANNOTATION_DESCRIPTIONS[ann_type])
                severity = random.choice(SEVERITIES)
                bed = random.choice(beds)
                hour = random.randint(6, 22)
                minute = random.randint(0, 59)
                ts = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
                metadata_ = None
                if ann_type == "terminal_delay":
                    delay_mins = random.randint(3, 20)
                    metadata_ = {"delay_minutes": delay_mins, "shift_type": random.choice(SHIFT_TYPES)}
                elif ann_type == "access_missing":
                    missing_start = ts - timedelta(minutes=random.randint(15, 45))
                    duration = random.randint(40, 120)
                    missing_end = missing_start + timedelta(minutes=duration)
                    metadata_ = {
                        "visitor_count": random.randint(1, 3),
                        "floor": bed.floor,
                        "missing_start": missing_start.isoformat(),
                        "missing_end": missing_end.isoformat(),
                    }
                elif ann_type == "fall_event":
                    metadata_ = {"response_time_minutes": random.randint(1, 5)}
                ann = RiskAnnotation(
                    type=ann_type,
                    timestamp=ts,
                    description=desc,
                    severity=severity,
                    bed_id=bed.id,
                    metadata_=metadata_,
                )
                session.add(ann)
                annotations.append(ann)
        await session.flush()

        for ann in random.sample(annotations, min(len(annotations), 15)):
            note = ReviewNote(
                annotation_id=ann.id,
                author=random.choice(NURSE_NAMES),
                content=random.choice([
                    "已核实情况，需加强巡视频次",
                    "已通知主管，等待进一步指示",
                    "已与家属沟通，确认处理方案",
                    "已调整排班，确保护理响应时间达标",
                    "已补充门禁记录，完善探访档案",
                    "已更换终端设备，恢复正常响应",
                ]),
            )
            session.add(note)
        await session.flush()

        for elder in elders:
            for day_offset in range(30):
                day = today - timedelta(days=29 - day_offset)
                med_count = random.randint(1, 3)
                for _ in range(med_count):
                    med_name = random.choice(MEDICATIONS)
                    hour = random.choice([7, 8, 12, 18, 21])
                    scheduled = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
                    status = random.choices(["按时", "延迟", "未执行"], weights=[85, 10, 5])[0]
                    actual = None
                    if status == "按时":
                        actual = scheduled + timedelta(minutes=random.randint(0, 3))
                    elif status == "延迟":
                        actual = scheduled + timedelta(minutes=random.randint(5, 30))
                    m = MedicationRecord(
                        elder_id=elder.id,
                        medication_name=med_name,
                        scheduled_time=scheduled,
                        actual_time=actual,
                        status=status,
                    )
                    session.add(m)

            for day_offset in range(30):
                day = today - timedelta(days=29 - day_offset)
                if random.random() < 0.3:
                    visitor = random.choice(VISITOR_NAMES)
                    hour = random.randint(9, 17)
                    scheduled = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
                    has_access = random.random() < 0.85
                    actual = scheduled + timedelta(minutes=random.randint(-10, 30)) if has_access else None
                    v = VisitRecord(
                        elder_id=elder.id,
                        visitor_name=visitor,
                        scheduled_time=scheduled,
                        actual_time=actual,
                        access_record_exists=has_access,
                    )
                    session.add(v)

            for day_offset in range(30):
                day = today - timedelta(days=29 - day_offset)
                if random.random() < 0.5:
                    activity_name = random.choice(ACTIVITIES)
                    hour = random.choice([9, 10, 14, 15])
                    scheduled = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
                    checked_in = random.random() < 0.88
                    check_in = None
                    if checked_in:
                        check_in = scheduled + timedelta(minutes=random.randint(-5, 15))
                    a = ActivityRecord(
                        elder_id=elder.id,
                        activity_name=activity_name,
                        scheduled_time=scheduled,
                        checked_in=checked_in,
                        check_in_time=check_in,
                    )
                    session.add(a)

            if random.random() < 0.15:
                day = today - timedelta(days=random.randint(0, 29))
                hour = random.randint(6, 22)
                ts = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
                f = FallEvent(
                    elder_id=elder.id,
                    timestamp=ts,
                    description=random.choice(FALL_DESCRIPTIONS),
                    severity=random.choice(FALL_SEVERITIES),
                )
                session.add(f)

        await session.flush()

        billing_changes = [
            BillingCaliberChange(
                change_date=today - timedelta(days=25),
                description="床位费由按月计费调整为按日计费",
                old_caliber="月费制(3000元/月)",
                new_caliber="日费制(120元/天)",
            ),
            BillingCaliberChange(
                change_date=today - timedelta(days=18),
                description="护理等级附加费标准调整",
                old_caliber="一级护理100元/天, 二级护理60元/天",
                new_caliber="一级护理130元/天, 二级护理80元/天",
            ),
            BillingCaliberChange(
                change_date=today - timedelta(days=7),
                description="医疗耗材计费方式变更",
                old_caliber="按项目计费",
                new_caliber="按用量打包计费",
            ),
        ]
        for bc in billing_changes:
            session.add(bc)

        await session.commit()

    conn = get_duckdb_conn()
    conn.execute("DELETE FROM daily_risk_scores")
    conn.execute("DELETE FROM terminal_delay_events")

    for day_offset in range(30):
        day = today - timedelta(days=29 - day_offset)
        for b in beds:
            risk_score = round(random.uniform(0, 100), 2)
            occupancy_rate = round(random.uniform(0.5, 1.0), 4)
            conn.execute(
                "INSERT INTO daily_risk_scores VALUES (?, ?, ?, ?)",
                [day.isoformat(), str(b.id), risk_score, occupancy_rate],
            )
        if random.random() < 0.3:
            random_bed = random.choice(beds)
            delay_mins = random.randint(3, 20)
            hour = random.randint(6, 22)
            ts = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
            conn.execute(
                "INSERT INTO terminal_delay_events VALUES (?, ?, ?, ?)",
                [day.isoformat(), str(random_bed.id), delay_mins, ts.isoformat()],
            )

    conn.close()
    print("✅ 种子数据创建完成!")
    print(f"  床位: {TOTAL_BEDS}")
    print(f"  护工: {len(NURSE_NAMES)}")
    print(f"  老人: {len(ELDER_NAMES)}")
    print(f"  排班: 30天 × {TOTAL_BEDS}床位")
    print(f"  风险标注、用药记录、探访记录、活动记录、跌倒事件等已生成")
    print(f"  DuckDB 分析数据已生成")


if __name__ == "__main__":
    asyncio.run(seed())
