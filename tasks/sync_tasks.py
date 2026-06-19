from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import logging
from celery import group
from .celery_app import celery_app
from utils.database import get_db_session
from utils.data_cleaner import DataCleaner, save_anomalies_to_db
from utils.config import settings
from data.models import (
    OTAOrder, PaymentTransaction, DoorLockRecord,
    SyncLog, RoomStatus, Property
)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="sync_ota_orders", max_retries=3, default_retry_delay=60)
def sync_ota_orders(self, records: Optional[List[Dict[str, Any]]] = None, sync_from: Optional[str] = None):
    started_at = datetime.utcnow()
    sync_log_id = None

    try:
        with get_db_session() as db:
            sync_log = SyncLog(
                sync_type="ota_orders",
                status="running",
                started_at=started_at
            )
            db.add(sync_log)
            db.flush()
            sync_log_id = sync_log.id

        if records is None:
            records = _fetch_ota_orders_from_source(sync_from)

        if not records:
            with get_db_session() as db:
                if sync_log_id:
                    sync_log = db.get(SyncLog, sync_log_id)
                    if sync_log:
                        sync_log.status = "completed"
                        sync_log.records_processed = 0
                        sync_log.records_anomaly = 0
                        sync_log.finished_at = datetime.utcnow()
            return {"status": "completed", "records_processed": 0, "anomaly_count": 0}

        clean_result = DataCleaner.clean_ota_orders(records)

        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            OTAOrder,
            "order_no",
            ["property_id"]
        )
        records_anomaly = clean_result.anomaly_count

        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass

        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "completed"
                    sync_log.records_processed = records_processed
                    sync_log.records_anomaly = records_anomaly
                    sync_log.finished_at = datetime.utcnow()

        _update_room_status_from_orders.apply_async(
            link=_auto_generate_cleaning_tasks.s()
        )

        return {
            "status": "completed",
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": records_anomaly
        }

    except Exception as e:
        logger.error(f"同步OTA订单失败: {str(e)}")
        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "failed"
                    sync_log.error_message = str(e)
                    sync_log.finished_at = datetime.utcnow()
        self.retry(exc=e)


@celery_app.task(bind=True, name="sync_payment_transactions", max_retries=3, default_retry_delay=60)
def sync_payment_transactions(self, records: Optional[List[Dict[str, Any]]] = None, sync_from: Optional[str] = None):
    started_at = datetime.utcnow()
    sync_log_id = None

    try:
        with get_db_session() as db:
            sync_log = SyncLog(
                sync_type="payment_transactions",
                status="running",
                started_at=started_at
            )
            db.add(sync_log)
            db.flush()
            sync_log_id = sync_log.id

        if records is None:
            records = _fetch_payments_from_source(sync_from)

        if not records:
            with get_db_session() as db:
                if sync_log_id:
                    sync_log = db.get(SyncLog, sync_log_id)
                    if sync_log:
                        sync_log.status = "completed"
                        sync_log.records_processed = 0
                        sync_log.records_anomaly = 0
                        sync_log.finished_at = datetime.utcnow()
            return {"status": "completed", "records_processed": 0, "anomaly_count": 0}

        clean_result = DataCleaner.clean_payment_transactions(records)

        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            PaymentTransaction,
            "transaction_no",
            ["property_id", "order_id"]
        )
        records_anomaly = clean_result.anomaly_count

        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass

        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "completed"
                    sync_log.records_processed = records_processed
                    sync_log.records_anomaly = records_anomaly
                    sync_log.finished_at = datetime.utcnow()

        return {
            "status": "completed",
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": records_anomaly
        }

    except Exception as e:
        logger.error(f"同步收款流水失败: {str(e)}")
        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "failed"
                    sync_log.error_message = str(e)
                    sync_log.finished_at = datetime.utcnow()
        self.retry(exc=e)


@celery_app.task(bind=True, name="sync_door_lock_records", max_retries=3, default_retry_delay=60)
def sync_door_lock_records(self, records: Optional[List[Dict[str, Any]]] = None, sync_from: Optional[str] = None):
    started_at = datetime.utcnow()
    sync_log_id = None

    try:
        with get_db_session() as db:
            sync_log = SyncLog(
                sync_type="door_lock_records",
                status="running",
                started_at=started_at
            )
            db.add(sync_log)
            db.flush()
            sync_log_id = sync_log.id

        if records is None:
            records = _fetch_door_locks_from_source(sync_from)

        if not records:
            with get_db_session() as db:
                if sync_log_id:
                    sync_log = db.get(SyncLog, sync_log_id)
                    if sync_log:
                        sync_log.status = "completed"
                        sync_log.records_processed = 0
                        sync_log.records_anomaly = 0
                        sync_log.finished_at = datetime.utcnow()
            return {"status": "completed", "records_processed": 0, "anomaly_count": 0}

        clean_result = DataCleaner.clean_door_lock_records(records)

        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            DoorLockRecord,
            "record_no",
            ["property_id"]
        )
        records_anomaly = clean_result.anomaly_count

        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass

        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "completed"
                    sync_log.records_processed = records_processed
                    sync_log.records_anomaly = records_anomaly
                    sync_log.finished_at = datetime.utcnow()

        return {
            "status": "completed",
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": records_anomaly
        }

    except Exception as e:
        logger.error(f"同步门锁记录失败: {str(e)}")
        with get_db_session() as db:
            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "failed"
                    sync_log.error_message = str(e)
                    sync_log.finished_at = datetime.utcnow()
        self.retry(exc=e)


@celery_app.task(name="run_full_sync")
def run_full_sync(sync_from: Optional[str] = None):
    workflow = group(
        sync_ota_orders.s(sync_from=sync_from),
        sync_payment_transactions.s(sync_from=sync_from),
        sync_door_lock_records.s(sync_from=sync_from)
    )
    result = workflow.apply_async()
    return {"task_ids": [task.id for task in result.results]}


@celery_app.task(name="update_room_status_from_orders")
def _update_room_status_from_orders():
    from datetime import date, timedelta
    from sqlalchemy import and_

    with get_db_session() as db:
        properties = db.query(Property).filter(Property.status == "active").all()

        start_date = date.today() - timedelta(days=30)
        end_date = date.today() + timedelta(days=90)

        all_status_records = []

        for prop in properties:
            orders = db.query(OTAOrder).filter(
                and_(
                    OTAOrder.property_id == prop.id,
                    OTAOrder.order_status.in_(["已确认", "已入住", "已完成"]),
                    OTAOrder.check_out_date >= start_date,
                    OTAOrder.check_in_date <= end_date
                )
            ).all()

            current_date = start_date
            while current_date <= end_date:
                for order in orders:
                    if order.check_in_date <= current_date < order.check_out_date:
                        room_type = order.room_type or "default"
                        all_status_records.append({
                            "property_id": str(prop.id),
                            "status_date": current_date,
                            "room_type": room_type,
                            "status": order.order_status,
                            "occupancy_status": "occupied",
                            "source": order.channel,
                            "order_no": order.order_no
                        })
                current_date += timedelta(days=1)

        all_status_records, conflict_anomalies = DataCleaner.detect_room_status_conflicts(all_status_records)

        import uuid as uuid_lib
        for record in all_status_records:
            prop_uuid = uuid_lib.UUID(record["property_id"])
            existing = db.query(RoomStatus).filter(
                and_(
                    RoomStatus.property_id == prop_uuid,
                    RoomStatus.status_date == record["status_date"],
                    RoomStatus.room_type == record["room_type"]
                )
            ).first()

            if existing:
                existing.status = record["status"]
                existing.occupancy_status = record["occupancy_status"]
                existing.source = record.get("source")
                existing.has_conflict = record.get("has_conflict", False)
                existing.conflict_detail = record.get("conflict_detail")
            else:
                status = RoomStatus(
                    property_id=prop_uuid,
                    status_date=record["status_date"],
                    room_type=record["room_type"],
                    status=record["status"],
                    occupancy_status=record["occupancy_status"],
                    source=record.get("source"),
                    has_conflict=record.get("has_conflict", False),
                    conflict_detail=record.get("conflict_detail")
                )
                db.add(status)

        if conflict_anomalies:
            save_anomalies_to_db(conflict_anomalies)

    return {"status": "completed"}


def _fetch_ota_orders_from_source(sync_from: Optional[str] = None) -> List[Dict[str, Any]]:
    logger.info("从OTA渠道拉取订单数据...")
    from datetime import date, timedelta
    import random

    CHANNELS = ["携程", "美团", "飞猪", "去哪儿", "Airbnb", "直接预订", "线下"]
    ORDER_STATUSES = ["待确认", "已确认", "已入住", "已退房", "已取消", "已完成", "no_show"]
    ROOM_TYPES = ["大床房", "双床房", "套房", "家庭房", "海景房"]

    with get_db_session() as db:
        from data.models import Property
        props = db.query(Property).filter(Property.status == "active").all()
        properties = [
            {"id": str(p.id), "property_code": p.property_code,
             "property_name": p.property_name, "room_count": p.room_count}
            for p in props
        ]

    if not properties:
        logger.warning("无活跃房源，跳过OTA订单拉取")
        return []

    end_date = date.today() + timedelta(days=60)
    start_date = date.today() - timedelta(days=30)
    if sync_from:
        try:
            start_date = datetime.strptime(sync_from, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pass
    date_range = (end_date - start_date).days

    records = []
    for i in range(120):
        prop = random.choice(properties)
        check_in = start_date + timedelta(days=random.randint(0, max(date_range - 3, 0)))
        nights = random.randint(1, 5)
        check_out = check_in + timedelta(days=nights)
        channel = random.choice(CHANNELS)
        status = random.choices(
            ORDER_STATUSES, weights=[5, 25, 15, 30, 10, 10, 5]
        )[0]
        room_count = random.randint(1, 2)
        nightly_rate = random.randint(280, 1280)
        total_amount = nightly_rate * nights * room_count
        paid_ratio = 1.0 if status in ["已入住", "已退房", "已完成"] else random.uniform(0.3, 1.0)

        records.append({
            "order_no": f"OTA{datetime.now().strftime('%Y%m%d%H%M%S%f')}{random.randint(100000, 999999)}",
            "property_id": prop["id"],
            "channel": channel,
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "guest_name": f"客人{random.randint(1000, 9999)}",
            "guest_phone": f"1{random.choice(['3','5','7','8','9'])}{random.randint(100000000, 999999999)}",
            "room_count": room_count,
            "room_type": random.choice(ROOM_TYPES),
            "total_amount": round(total_amount, 2),
            "paid_amount": round(total_amount * paid_ratio, 2),
            "order_status": status,
            "raw_data": {
                "source": "ota_sync",
                "fetched_at": datetime.now().isoformat(timespec="seconds"),
                "channel_order_id": f"{channel}-{random.randint(100000, 999999)}",
                "promotion_code": f"PROMO{random.randint(100, 999)}" if random.random() < 0.3 else None,
                "guest_comment": random.choice(["", "希望高楼层", "无烟房", "靠近电梯", "安静房间"])
            }
        })

    for i in range(3):
        prop = random.choice(properties)
        records.append({
            "order_no": f"ANOM{datetime.now().strftime('%Y%m%d%H%M%S%f')}{i:03d}",
            "property_id": prop["id"],
            "channel": random.choice(CHANNELS),
            "check_in_date": (date.today() + timedelta(days=5)).isoformat(),
            "check_out_date": (date.today() + timedelta(days=3)).isoformat(),
            "guest_name": "异常订单客人",
            "room_count": 0,
            "room_type": random.choice(ROOM_TYPES),
            "total_amount": -50.00,
            "paid_amount": 0,
            "order_status": "未知状态",
            "raw_data": {
                "source": "ota_sync",
                "note": "此条为故意植入的异常数据，用于验证清洗逻辑"
            }
        })

    logger.info(f"拉取到 {len(records)} 条OTA订单记录")
    return records


def _fetch_payments_from_source(sync_from: Optional[str] = None) -> List[Dict[str, Any]]:
    logger.info("从支付渠道拉取流水数据...")
    from datetime import date, timedelta
    import random

    PAYMENT_METHODS = ["微信", "支付宝", "银行卡", "现金", "OTA代收"]
    PAYMENT_STATUSES = ["待支付", "已支付", "支付失败", "已退款", "部分退款"]

    with get_db_session() as db:
        from data.models import Property, OTAOrder
        props = db.query(Property).filter(Property.status == "active").all()
        properties = [
            {"id": str(p.id), "property_code": p.property_code,
             "property_name": p.property_name, "room_count": p.room_count}
            for p in props
        ]
        order_objs = db.query(OTAOrder).filter(
            OTAOrder.order_status.in_(["已确认", "已入住", "已退房", "已完成"])
        ).all()
        orders = [
            {"id": str(o.id), "property_id": str(o.property_id),
             "channel": o.channel, "check_in_date": o.check_in_date,
             "paid_amount": float(o.paid_amount),
             "total_amount": float(o.total_amount),
             "guest_name": o.guest_name}
            for o in order_objs
        ]

    if not properties:
        logger.warning("无活跃房源，跳过收款流水拉取")
        return []

    end_date = date.today() + timedelta(days=30)
    start_date = date.today() - timedelta(days=30)
    if sync_from:
        try:
            start_date = datetime.strptime(sync_from, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pass
    date_range = (end_date - start_date).days

    records = []
    for order in orders:
        if random.random() < 0.75:
            pay_time = datetime.combine(
                max(order["check_in_date"] - timedelta(days=random.randint(0, 2)), start_date),
                datetime.min.time()
            ) + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59))

            records.append({
                "transaction_no": f"PAY{datetime.now().strftime('%Y%m%d%H%M%S%f')}{random.randint(100000, 999999)}",
                "order_id": order["id"],
                "property_id": order["property_id"],
                "channel": order["channel"],
                "payment_method": random.choice(PAYMENT_METHODS),
                "amount": order["paid_amount"] if order["paid_amount"] > 0 else order["total_amount"],
                "transaction_time": pay_time.isoformat(),
                "transaction_status": "已支付",
                "payer": order["guest_name"] or "在线客人",
                "raw_data": {
                    "source": "payment_sync",
                    "fetched_at": datetime.now().isoformat(timespec="seconds"),
                    "payment_gateway": random.choice(["官方API", "第三方聚合", "线下录入"]),
                    "fee_rate": round(random.uniform(0.003, 0.01), 4),
                    "settlement_batch": f"BATCH{random.randint(1000, 9999)}"
                }
            })

    for _ in range(60):
        prop = random.choice(properties)
        pay_time = datetime.combine(
            start_date + timedelta(days=random.randint(0, date_range)),
            datetime.min.time()
        ) + timedelta(hours=random.randint(6, 23), minutes=random.randint(0, 59))

        records.append({
            "transaction_no": f"PAY{datetime.now().strftime('%Y%m%d%H%M%S%f')}{random.randint(100000, 999999)}",
            "property_id": prop["id"],
            "channel": "线下",
            "payment_method": random.choice(PAYMENT_METHODS),
            "amount": round(random.uniform(100, 5000), 2),
            "transaction_time": pay_time.isoformat(),
            "transaction_status": random.choice(PAYMENT_STATUSES),
            "payer": f"散客{random.randint(100, 999)}",
            "raw_data": {
                "source": "payment_sync",
                "fetched_at": datetime.now().isoformat(timespec="seconds"),
                "note": "线下散客收款，无关联OTA订单"
            }
        })

    logger.info(f"拉取到 {len(records)} 条收款流水记录")
    return records


def _fetch_door_locks_from_source(sync_from: Optional[str] = None) -> List[Dict[str, Any]]:
    logger.info("从门锁系统拉取记录数据...")
    from datetime import date, timedelta
    import random

    LOCK_ACTIONS = ["开门", "关门", "反锁", "解锁失败", "密码错误", "临时密码创建", "临时密码删除"]
    OPERATORS = ["客人", "保洁", "管理员", "维修", "前台"]
    OPERATOR_TYPES = ["guest", "staff", "admin"]

    with get_db_session() as db:
        from data.models import Property
        props = db.query(Property).filter(Property.status == "active").all()
        properties = [
            {"id": str(p.id), "property_code": p.property_code,
             "property_name": p.property_name, "room_count": p.room_count}
            for p in props
        ]

    if not properties:
        logger.warning("无活跃房源，跳过门锁记录拉取")
        return []

    end_date = date.today() + timedelta(days=1)
    start_date = date.today() - timedelta(days=30)
    if sync_from:
        try:
            start_date = datetime.strptime(sync_from, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pass
    date_range = (end_date - start_date).days

    records = []
    for prop in properties:
        daily_records = random.randint(5, 20)
        for _ in range(daily_records * max(date_range, 1)):
            action_time = datetime.combine(
                start_date + timedelta(days=random.randint(0, date_range)),
                datetime.min.time()
            ) + timedelta(hours=random.randint(6, 23), minutes=random.randint(0, 59), seconds=random.randint(0, 59))

            records.append({
                "record_no": f"LOCK{datetime.now().strftime('%Y%m%d%H%M%S%f')}{random.randint(100000, 999999)}",
                "property_id": prop["id"],
                "lock_device_id": f"DEV-{prop['property_code']}-{random.randint(1, max(prop['room_count'], 1))}",
                "action_type": random.choice(LOCK_ACTIONS),
                "action_time": action_time.isoformat(),
                "operator": random.choice(OPERATORS),
                "operator_type": random.choice(OPERATOR_TYPES),
                "room_no": f"{random.randint(101, 599)}",
                "raw_data": {
                    "source": "lock_sync",
                    "fetched_at": datetime.now().isoformat(timespec="seconds"),
                    "battery_level": round(random.uniform(20, 100), 1),
                    "signal_strength": f"-{random.randint(40, 90)}dBm",
                    "ip_address": f"192.168.{random.randint(0, 255)}.{random.randint(1, 254)}"
                }
            })

    logger.info(f"拉取到 {len(records)} 条门锁记录")
    return records


@celery_app.task(name="auto_generate_cleaning_tasks")
def _auto_generate_cleaning_tasks():
    logger.info("根据已同步订单自动生成保洁任务...")
    from datetime import timedelta
    import random

    CLEANING_TYPES = ["日常保洁", "退房保洁", "深度清洁", "布草更换"]
    CLEANING_STATUSES = ["待执行", "进行中", "已完成", "已取消"]
    STAFF = ["张阿姨", "李阿姨", "王师傅", "陈保洁", "刘阿姨", "赵阿姨"]

    with get_db_session() as db:
        from data.models import CleaningTask, OTAOrder

        orders_for_cleaning = db.query(OTAOrder).filter(
            OTAOrder.order_status.in_(["已退房", "已完成"])
        ).all()

        generated = 0
        for order in orders_for_cleaning:
            existing = db.query(CleaningTask).filter(
                CleaningTask.order_id == order.id
            ).first()
            if existing:
                continue

            task_status = random.choices(
                CLEANING_STATUSES, weights=[20, 10, 60, 10]
            )[0]
            completed_at = None
            if task_status == "已完成":
                completed_at = datetime.combine(order.check_out_date, datetime.min.time()) \
                    + timedelta(hours=random.randint(12, 18))

            task = CleaningTask(
                task_no=f"CLEAN{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}",
                property_id=order.property_id,
                order_id=order.id,
                room_type=order.room_type,
                scheduled_date=order.check_out_date,
                task_type="退房保洁",
                task_status=task_status,
                assigned_to=random.choice(STAFF),
                completed_at=completed_at,
                remark=random.choice(["", "客人特别要求换床单", "需要补充洗护用品", "空调滤网已检查"])
            )
            db.add(task)
            generated += 1

        from datetime import date as date_cls
        today = date_cls.today()
        regular_count = random.randint(30, 80)
        for _ in range(regular_count):
            from data.models import Property as Prop
            props = db.query(Prop).filter(Prop.status == "active").all()
            if not props:
                break
            prop = random.choice(props)
            sched_date = today - timedelta(days=random.randint(0, 30))

            task_status = random.choices(
                CLEANING_STATUSES, weights=[15, 10, 70, 5]
            )[0]
            completed_at = None
            if task_status == "已完成":
                completed_at = datetime.combine(sched_date, datetime.min.time()) \
                    + timedelta(hours=random.randint(9, 17))

            task = CleaningTask(
                task_no=f"CLEAN{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}",
                property_id=prop.id,
                room_type=random.choice(["大床房", "双床房", "套房", "家庭房"]),
                scheduled_date=sched_date,
                task_type=random.choice(CLEANING_TYPES),
                task_status=task_status,
                assigned_to=random.choice(STAFF),
                completed_at=completed_at,
                remark=random.choice(["", "定期维护", "补充布草", "客人反馈后跟进"])
            )
            db.add(task)
            generated += 1

    logger.info(f"自动生成 {generated} 条保洁任务")
    return {"status": "completed", "generated": generated}


def ensure_demo_properties():
    from datetime import date, timedelta
    import random

    CITIES = ["杭州", "成都", "厦门", "丽江", "三亚", "大理", "西安", "苏州"]

    with get_db_session() as db:
        from data.models import Property
        count = db.query(Property).count()
        if count > 0:
            logger.info(f"已存在 {count} 个房源，跳过初始化")
            return False

        properties = []
        for i in range(1, 11):
            city = random.choice(CITIES)
            prop = Property(
                property_code=f"HS{i:04d}",
                property_name=f"{city}·精品民宿{i}号院",
                room_count=random.randint(3, 12),
                city=city,
                district=f"{city}景区",
                address=f"{city}某区某街道{i}号",
                status="active"
            )
            properties.append(prop)
        db.add_all(properties)
        logger.info(f"初始化 {len(properties)} 个演示房源")
        return True


def _sync_records_to_db(records: List[Dict[str, Any]],
                        Model,
                        unique_field: str,
                        uuid_fields: List[str]) -> Tuple[int, int]:
    import uuid as uuid_lib
    records_processed = 0
    records_failed = 0

    with get_db_session() as db:
        for cleaned in records:
            try:
                unique_value = cleaned.get(unique_field)
                if not unique_value:
                    records_failed += 1
                    continue

                existing = db.query(Model).filter(
                    getattr(Model, unique_field) == unique_value
                ).first()

                if existing:
                    for key, value in cleaned.items():
                        if key in uuid_fields and value:
                            try:
                                setattr(existing, key, uuid_lib.UUID(value))
                                continue
                            except Exception:
                                pass
                        if hasattr(existing, key) and key not in ["id", "created_at"]:
                            setattr(existing, key, value)
                    existing.synced_at = datetime.utcnow()
                else:
                    data = {}
                    for k, v in cleaned.items():
                        if not hasattr(Model, k) or k == "id":
                            continue
                        if k in uuid_fields and v:
                            try:
                                data[k] = uuid_lib.UUID(v)
                                continue
                            except Exception:
                                pass
                        data[k] = v
                    if "property_id" not in data or not data["property_id"]:
                        records_failed += 1
                        continue
                    obj = Model(**data)
                    obj.synced_at = datetime.utcnow()
                    db.add(obj)

                db.flush()
                records_processed += 1
            except Exception as e:
                db.rollback()
                records_failed += 1
                logger.error(f"处理 {Model.__name__} {cleaned.get(unique_field)} 失败: {str(e)}")
                continue

    return records_processed, records_failed


def run_local_full_sync(sync_from: Optional[str] = None) -> Dict[str, Any]:
    logger.info("执行本地全量同步（不依赖Celery）...")
    import traceback

    results = {}

    try:
        ensure_demo_properties()
    except Exception as e:
        logger.error(f"初始化房源失败: {str(e)}")
        results["properties"] = {"error": str(e)}

    try:
        ota_records = _fetch_ota_orders_from_source(sync_from)
        clean_result = DataCleaner.clean_ota_orders(ota_records)
        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            OTAOrder,
            "order_no",
            ["property_id"]
        )
        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass
        results["ota_orders"] = {
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": clean_result.anomaly_count
        }
        logger.info(f"OTA订单同步完成: {records_processed} 条, 失败 {records_failed} 条, 异常 {clean_result.anomaly_count} 个")
    except Exception as e:
        logger.error(f"OTA订单同步失败: {str(e)}\n{traceback.format_exc()}")
        results["ota_orders"] = {"error": str(e)}

    try:
        pay_records = _fetch_payments_from_source(sync_from)
        clean_result = DataCleaner.clean_payment_transactions(pay_records)
        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            PaymentTransaction,
            "transaction_no",
            ["property_id", "order_id"]
        )
        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass
        results["payment_transactions"] = {
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": clean_result.anomaly_count
        }
        logger.info(f"收款流水同步完成: {records_processed} 条, 失败 {records_failed} 条, 异常 {clean_result.anomaly_count} 个")
    except Exception as e:
        logger.error(f"收款流水同步失败: {str(e)}\n{traceback.format_exc()}")
        results["payment_transactions"] = {"error": str(e)}

    try:
        lock_records = _fetch_door_locks_from_source(sync_from)
        clean_result = DataCleaner.clean_door_lock_records(lock_records)
        records_processed, records_failed = _sync_records_to_db(
            clean_result.cleaned_data,
            DoorLockRecord,
            "record_no",
            ["property_id"]
        )
        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass
        results["door_lock_records"] = {
            "records_processed": records_processed,
            "records_failed": records_failed,
            "anomaly_count": clean_result.anomaly_count
        }
        logger.info(f"门锁记录同步完成: {records_processed} 条, 失败 {records_failed} 条, 异常 {clean_result.anomaly_count} 个")
    except Exception as e:
        logger.error(f"门锁记录同步失败: {str(e)}\n{traceback.format_exc()}")
        results["door_lock_records"] = {"error": str(e)}

    try:
        _update_room_status_from_orders()
        results["room_status"] = "completed"
        logger.info("房态计算完成")
    except Exception as e:
        logger.error(f"房态计算失败: {str(e)}\n{traceback.format_exc()}")
        results["room_status"] = {"error": str(e)}

    try:
        _auto_generate_cleaning_tasks()
        results["cleaning_tasks"] = "completed"
        logger.info("保洁任务生成完成")
    except Exception as e:
        logger.error(f"保洁任务生成失败: {str(e)}\n{traceback.format_exc()}")
        results["cleaning_tasks"] = {"error": str(e)}

    logger.info(f"本地全量同步完成: {results}")
    return results
