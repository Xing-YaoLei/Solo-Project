"""
数据库种子数据初始化脚本
使用方法: python -m app.scripts.seed_data
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, Base, engine
from app.models import StorePoint, Device, Person, CleaningRecord, StatusLog
from app import schemas


SOURCE_CHANNEL_MAP = {
    "routine_inspection": schemas.SourceChannel.ROUTINE_INSPECTION,
    "device_alert": schemas.SourceChannel.DEVICE_ALERT,
    "manual_report": schemas.SourceChannel.MANUAL_REPORT,
    "store_request": schemas.SourceChannel.STORE_REQUEST,
}

CLEANING_STATUS_MAP = {
    "draft": schemas.CleaningStatus.DRAFT,
    "pending_review": schemas.CleaningStatus.PENDING_REVIEW,
    "supplement_info": schemas.CleaningStatus.SUPPLEMENT_INFO,
    "reviewing": schemas.CleaningStatus.REVIEWING,
    "completed": schemas.CleaningStatus.COMPLETED,
    "closed": schemas.CleaningStatus.CLOSED,
}

CLOSE_REASON_MAP = {
    "qualified": schemas.CloseReason.QUALIFIED,
    "device_replaced": schemas.CloseReason.DEVICE_REPLACED,
    "point_closed": schemas.CloseReason.POINT_CLOSED,
    "other": schemas.CloseReason.OTHER,
}


def seed():
    db = SessionLocal()
    try:
        print("🌱 开始初始化种子数据...")

        if db.query(StorePoint).count() > 0:
            print("⚠️  数据库已有数据，跳过初始化")
            return

        points = [
            StorePoint(name="南京路旗舰店", store_code="ST0001", address="南京东路100号",
                       region="黄浦区", status=schemas.PointStatus.ACTIVE,
                       contact_person="张经理", contact_phone="13800138001"),
            StorePoint(name="浦东机场店", store_code="ST0002", address="浦东机场T2航站楼",
                       region="浦东新区", status=schemas.PointStatus.ACTIVE,
                       contact_person="李主管", contact_phone="13800138002"),
            StorePoint(name="人民广场店", store_code="ST0003", address="人民大道120号",
                       region="黄浦区", status=schemas.PointStatus.ACTIVE,
                       contact_person="王店长", contact_phone="13800138003"),
            StorePoint(name="徐家汇店", store_code="ST0004", address="虹桥路1号",
                       region="徐汇区", status=schemas.PointStatus.ACTIVE,
                       contact_person="赵店长", contact_phone="13800138004"),
            StorePoint(name="静安寺店", store_code="ST0005", address="南京西路1688号",
                       region="静安区", status=schemas.PointStatus.ACTIVE,
                       contact_person="陈店长", contact_phone="13800138005"),
            StorePoint(name="陆家嘴店", store_code="ST0006", address="陆家嘴环路1000号",
                       region="浦东新区", status=schemas.PointStatus.ACTIVE,
                       contact_person="刘店长", contact_phone="13800138006"),
        ]
        db.add_all(points)
        db.flush()
        print(f"✅ 已添加 {len(points)} 个门店点位")

        point_map = {p.store_code: p.id for p in points}

        devices = [
            Device(device_code="DEV001", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0001"], status=schemas.DeviceStatus.ONLINE,
                   installation_date=datetime(2024, 1, 15),
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=5)),
            Device(device_code="DEV002", device_name="意式咖啡机B2", device_type="espresso_machine",
                   store_point_id=point_map["ST0001"], status=schemas.DeviceStatus.ONLINE,
                   installation_date=datetime(2024, 3, 20),
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=10)),
            Device(device_code="DEV003", device_name="冷萃机C1", device_type="cold_brew",
                   store_point_id=point_map["ST0001"], status=schemas.DeviceStatus.OFFLINE,
                   installation_date=datetime(2024, 2, 10),
                   last_heartbeat=datetime.utcnow() - timedelta(hours=3),
                   remarks="网络模块故障，待维修"),
            Device(device_code="DEV004", device_name="磨豆机D1", device_type="grinder",
                   store_point_id=point_map["ST0001"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=2)),

            Device(device_code="DEV005", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0002"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=8)),
            Device(device_code="DEV006", device_name="制冰机F1", device_type="ice_maker",
                   store_point_id=point_map["ST0002"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=3)),

            Device(device_code="DEV007", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0003"], status=schemas.DeviceStatus.OFFLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(hours=5),
                   remarks="门店断电中"),
            Device(device_code="DEV008", device_name="开水机E1", device_type="water_heater",
                   store_point_id=point_map["ST0003"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=1)),

            Device(device_code="DEV009", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0004"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=12)),
            Device(device_code="DEV010", device_name="意式咖啡机B2", device_type="espresso_machine",
                   store_point_id=point_map["ST0004"], status=schemas.DeviceStatus.MAINTENANCE,
                   remarks="定期保养中"),

            Device(device_code="DEV011", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0005"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=6)),

            Device(device_code="DEV012", device_name="意式咖啡机A1", device_type="espresso_machine",
                   store_point_id=point_map["ST0006"], status=schemas.DeviceStatus.ONLINE,
                   last_heartbeat=datetime.utcnow() - timedelta(minutes=4)),
        ]
        db.add_all(devices)
        db.flush()
        print(f"✅ 已添加 {len(devices)} 台设备")

        persons = [
            Person(name="陈师傅", employee_id="E001", role="清洁工程师",
                   department="运维部", phone="13900139001"),
            Person(name="刘师傅", employee_id="E002", role="清洁工程师",
                   department="运维部", phone="13900139002"),
            Person(name="王师傅", employee_id="E003", role="清洁工程师",
                   department="运维部", phone="13900139003"),
            Person(name="周主管", employee_id="E004", role="复核主管",
                   department="质检部", phone="13900139004"),
            Person(name="吴经理", employee_id="E005", role="区域经理",
                   department="运营部", phone="13900139005"),
        ]
        db.add_all(persons)
        db.flush()
        print(f"✅ 已添加 {len(persons)} 名人员")

        person_map = {p.employee_id: p for p in persons}
        device_map = {d.device_code: d for d in devices}

        default_items = [
            {"name": "冲煮头清洁", "completed": True, "remarks": ""},
            {"name": "蒸汽棒清洁", "completed": True, "remarks": ""},
            {"name": "滴水盘清洁", "completed": True, "remarks": ""},
            {"name": "豆仓清洁", "completed": True, "remarks": ""},
            {"name": "外壳擦拭", "completed": True, "remarks": ""},
            {"name": "废水桶清理", "completed": True, "remarks": ""},
        ]

        records_data = [
            {
                "record_no": "CL202506100001",
                "device_code": "DEV001",
                "source": "routine_inspection",
                "status": "closed",
                "close_reason": "qualified",
                "cleaner": "E001",
                "reviewer": "E004",
                "cleaning_remarks": "日常清洁，设备状态良好",
                "review_remarks": "清洁到位，复核合格",
                "review_result": "qualified",
                "qualified_rate": 100.0,
                "days_ago": 3,
                "is_offline": False,
            },
            {
                "record_no": "CL202506100002",
                "device_code": "DEV003",
                "source": "device_alert",
                "status": "completed",
                "cleaner": "E002",
                "reviewer": "E004",
                "cleaning_remarks": "设备离线，现场手动清洁，污渍较重",
                "review_remarks": "清洁合格，注意跟进设备网络修复",
                "review_result": "qualified",
                "qualified_rate": 83.33,
                "days_ago": 2,
                "is_offline": True,
                "offline_handled": True,
                "offline_remarks": "已通知运维部维修网络模块",
            },
            {
                "record_no": "CL202506110003",
                "device_code": "DEV005",
                "source": "routine_inspection",
                "status": "reviewing",
                "cleaner": "E001",
                "reviewer": "E004",
                "cleaning_remarks": "早班清洁完成",
                "review_remarks": "",
                "review_result": None,
                "days_ago": 1,
                "is_offline": False,
            },
            {
                "record_no": "CL202506110004",
                "device_code": "DEV007",
                "source": "manual_report",
                "status": "supplement_info",
                "cleaner": "E003",
                "reviewer": None,
                "cleaning_remarks": "门店断电，设备离线，现场手工清洁记录",
                "review_remarks": None,
                "supplement_notes": "请补充现场清洁照片和设备状态确认",
                "days_ago": 1,
                "is_offline": True,
            },
            {
                "record_no": "CL202506110005",
                "device_code": "DEV009",
                "source": "store_request",
                "status": "pending_review",
                "cleaner": "E002",
                "reviewer": None,
                "cleaning_remarks": "门店申请深度清洁，已完成",
                "review_remarks": None,
                "days_ago": 1,
                "is_offline": False,
            },
            {
                "record_no": "CL202506120006",
                "device_code": "DEV011",
                "source": "routine_inspection",
                "status": "draft",
                "cleaner": "E001",
                "reviewer": None,
                "cleaning_remarks": "",
                "review_remarks": None,
                "days_ago": 0,
                "is_offline": False,
            },
            {
                "record_no": "CL202506100007",
                "device_code": "DEV012",
                "source": "routine_inspection",
                "status": "closed",
                "close_reason": "qualified",
                "cleaner": "E003",
                "reviewer": "E004",
                "cleaning_remarks": "常规清洁",
                "review_remarks": "合格",
                "review_result": "qualified",
                "qualified_rate": 100.0,
                "days_ago": 3,
                "is_offline": False,
            },
            {
                "record_no": "CL202506090008",
                "device_code": "DEV007",
                "source": "device_alert",
                "status": "closed",
                "close_reason": "device_replaced",
                "cleaner": "E002",
                "reviewer": "E004",
                "cleaning_remarks": "更换前最后一次清洁",
                "review_remarks": "设备已更换新机，旧机送修",
                "review_result": "qualified",
                "qualified_rate": 66.67,
                "days_ago": 4,
                "is_offline": True,
                "offline_handled": True,
            },
        ]

        for rd in records_data:
            device = device_map[rd["device_code"]]
            created_at = datetime.utcnow() - timedelta(days=rd["days_ago"])

            record = CleaningRecord(
                record_no=rd["record_no"],
                store_point_id=device.store_point_id,
                device_id=device.id,
                source_channel=SOURCE_CHANNEL_MAP[rd["source"]],
                status=CLEANING_STATUS_MAP[rd["status"]],
                cleaning_date=created_at,
                cleaning_person_id=person_map[rd["cleaner"]].id if rd["cleaner"] else None,
                cleaning_items=default_items,
                cleaning_remarks=rd["cleaning_remarks"],
                reviewer_id=person_map[rd["reviewer"]].id if rd["reviewer"] else None,
                review_date=created_at + timedelta(hours=2) if rd["review_result"] else None,
                review_result=rd["review_result"],
                review_remarks=rd["review_remarks"],
                review_photos=[],
                inspection_result=rd["review_result"],
                qualified_rate=rd.get("qualified_rate"),
                close_reason=CLOSE_REASON_MAP.get(rd.get("close_reason")),
                close_remarks=rd.get("review_remarks") if rd["status"] == "closed" else None,
                closed_at=created_at + timedelta(hours=3) if rd["status"] == "closed" else None,
                closed_by_id=person_map["E004"].id if rd["status"] == "closed" else None,
                is_device_offline=rd["is_offline"],
                offline_handled=rd.get("offline_handled", False),
                offline_remarks=rd.get("offline_remarks"),
                supplement_notes=rd.get("supplement_notes"),
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(record)
            db.flush()

            status_flow = get_status_flow(rd["status"])
            for i, (from_s, to_s) in enumerate(status_flow):
                log_time = created_at + timedelta(minutes=30 * i)
                log = StatusLog(
                    cleaning_record_id=record.id,
                    from_status=from_s,
                    to_status=to_s,
                    operator_id=person_map[rd["cleaner"]].id if i == 0 else (
                        person_map[rd["reviewer"]].id if rd["reviewer"] else None
                    ),
                    remarks=get_status_remark(to_s, rd),
                    created_at=log_time,
                )
                db.add(log)

        db.commit()
        print(f"✅ 已添加 {len(records_data)} 条清洁单据及状态流转日志")
        print("\n🎉 种子数据初始化完成！")
        print("\n📊 数据概览:")
        print(f"  - 门店点位: {len(points)}")
        print(f"  - 设备: {len(devices)}")
        print(f"  - 人员: {len(persons)}")
        print(f"  - 清洁单据: {len(records_data)} (覆盖所有状态)")

    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {e}")
        raise
    finally:
        db.close()


def get_status_flow(target_status: str):
    S = CLEANING_STATUS_MAP
    flows = {
        "draft": [(None, S["draft"])],
        "pending_review": [(None, S["draft"]), (S["draft"], S["pending_review"])],
        "supplement_info": [(None, S["draft"]), (S["draft"], S["pending_review"]),
                            (S["pending_review"], S["reviewing"]), (S["reviewing"], S["supplement_info"])],
        "reviewing": [(None, S["draft"]), (S["draft"], S["pending_review"]), (S["pending_review"], S["reviewing"])],
        "completed": [(None, S["draft"]), (S["draft"], S["pending_review"]),
                      (S["pending_review"], S["reviewing"]), (S["reviewing"], S["completed"])],
        "closed": [(None, S["draft"]), (S["draft"], S["pending_review"]),
                   (S["pending_review"], S["reviewing"]), (S["reviewing"], S["completed"]),
                   (S["completed"], S["closed"])],
    }
    return flows.get(target_status, [(None, S["draft"])])


def get_status_remark(status, rd: dict):
    status_val = status.value if hasattr(status, 'value') else status
    remarks = {
        "draft": "创建清洁单据",
        "pending_review": "提交复核申请",
        "reviewing": "开始复核",
        "supplement_info": rd.get("supplement_notes", "需要补充资料"),
        "completed": "复核完成，单据归档",
        "closed": f"关闭原因: {rd.get('close_reason', 'qualified')}",
    }
    return remarks.get(status_val, "")


if __name__ == "__main__":
    seed()
