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

        records_processed = 0
        records_anomaly = clean_result.anomaly_count

        with get_db_session() as db:
            for cleaned in clean_result.cleaned_data:
                try:
                    existing = db.query(OTAOrder).filter(
                        OTAOrder.order_no == cleaned["order_no"]
                    ).first()

                    if existing:
                        for key, value in cleaned.items():
                            if hasattr(existing, key) and key not in ["id", "created_at"]:
                                setattr(existing, key, value)
                        existing.synced_at = datetime.utcnow()
                    else:
                        order = OTAOrder(**{
                            k: v for k, v in cleaned.items()
                            if hasattr(OTAOrder, k) and k != "id"
                        })
                        order.synced_at = datetime.utcnow()
                        db.add(order)

                    records_processed += 1

                    if records_processed % settings.SYNC_BATCH_SIZE == 0:
                        db.flush()

                except Exception as e:
                    logger.error(f"处理OTA订单 {cleaned.get('order_no')} 失败: {str(e)}")
                    continue

            if clean_result.anomalies:
                save_anomalies_to_db(clean_result.anomalies)

            if sync_log_id:
                sync_log = db.get(SyncLog, sync_log_id)
                if sync_log:
                    sync_log.status = "completed"
                    sync_log.records_processed = records_processed
                    sync_log.records_anomaly = records_anomaly
                    sync_log.finished_at = datetime.utcnow()

        _update_room_status_from_orders.delay()

        return {
            "status": "completed",
            "records_processed": records_processed,
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

        records_processed = 0
        records_anomaly = clean_result.anomaly_count

        with get_db_session() as db:
            for cleaned in clean_result.cleaned_data:
                try:
                    existing = db.query(PaymentTransaction).filter(
                        PaymentTransaction.transaction_no == cleaned["transaction_no"]
                    ).first()

                    if existing:
                        for key, value in cleaned.items():
                            if hasattr(existing, key) and key not in ["id", "created_at"]:
                                setattr(existing, key, value)
                        existing.synced_at = datetime.utcnow()
                    else:
                        payment = PaymentTransaction(**{
                            k: v for k, v in cleaned.items()
                            if hasattr(PaymentTransaction, k) and k != "id"
                        })
                        payment.synced_at = datetime.utcnow()
                        db.add(payment)

                    records_processed += 1
                    if records_processed % settings.SYNC_BATCH_SIZE == 0:
                        db.flush()

                except Exception as e:
                    logger.error(f"处理收款流水 {cleaned.get('transaction_no')} 失败: {str(e)}")
                    continue

            if clean_result.anomalies:
                save_anomalies_to_db(clean_result.anomalies)

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

        records_processed = 0
        records_anomaly = clean_result.anomaly_count

        with get_db_session() as db:
            for cleaned in clean_result.cleaned_data:
                try:
                    existing = db.query(DoorLockRecord).filter(
                        DoorLockRecord.record_no == cleaned["record_no"]
                    ).first()

                    if existing:
                        for key, value in cleaned.items():
                            if hasattr(existing, key) and key not in ["id", "created_at"]:
                                setattr(existing, key, value)
                        existing.synced_at = datetime.utcnow()
                    else:
                        lock = DoorLockRecord(**{
                            k: v for k, v in cleaned.items()
                            if hasattr(DoorLockRecord, k) and k != "id"
                        })
                        lock.synced_at = datetime.utcnow()
                        db.add(lock)

                    records_processed += 1
                    if records_processed % settings.SYNC_BATCH_SIZE == 0:
                        db.flush()

                except Exception as e:
                    logger.error(f"处理门锁记录 {cleaned.get('record_no')} 失败: {str(e)}")
                    continue

            if clean_result.anomalies:
                save_anomalies_to_db(clean_result.anomalies)

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

        start_date = date.today() - timedelta(days=7)
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

        for record in all_status_records:
            existing = db.query(RoomStatus).filter(
                and_(
                    RoomStatus.property_id == record["property_id"],
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
                    property_id=record["property_id"],
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
    return []


def _fetch_payments_from_source(sync_from: Optional[str] = None) -> List[Dict[str, Any]]:
    logger.info("从支付渠道拉取流水数据...")
    return []


def _fetch_door_locks_from_source(sync_from: Optional[str] = None) -> List[Dict[str, Any]]:
    logger.info("从门锁系统拉取记录数据...")
    return []
