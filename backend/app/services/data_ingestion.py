import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.models import Order, CheckinRecord, CameraStatistic, DataRefreshLog
from ..core.config import settings
from decimal import Decimal


class DataIngestionService:
    @staticmethod
    async def fetch_miniapp_orders(db: Session, start_date: str = None, end_date: str = None) -> int:
        log = DataRefreshLog(
            data_type="miniapp_orders",
            source="miniapp_api",
            status="processing",
            started_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        try:
            async with httpx.AsyncClient() as client:
                params = {}
                if start_date:
                    params["start_date"] = start_date
                if end_date:
                    params["end_date"] = end_date
                response = await client.get(f"{settings.MINIAPP_API_URL}/orders", params=params, timeout=30.0)
                response.raise_for_status()
                orders_data = response.json()

            count = 0
            for item in orders_data:
                existing = db.query(Order).filter(Order.order_no == item.get("order_no")).first()
                if not existing:
                    order = Order(
                        schedule_id=item.get("schedule_id"),
                        order_no=item["order_no"],
                        source="miniapp",
                        user_id=item.get("user_id"),
                        user_name=item.get("user_name"),
                        user_phone=item.get("user_phone"),
                        total_amount=Decimal(str(item.get("total_amount", 0))),
                        ticket_count=item.get("ticket_count", 0),
                        status=item.get("status", "pending"),
                        paid_at=datetime.fromisoformat(item["paid_at"]) if item.get("paid_at") else None,
                    )
                    db.add(order)
                    count += 1

            db.commit()
            log.status = "success"
            log.records_processed = count
            log.completed_at = datetime.utcnow()
            db.commit()
            return count
        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            db.commit()
            raise

    @staticmethod
    async def fetch_merchant_transactions(db: Session, start_date: str = None, end_date: str = None) -> int:
        log = DataRefreshLog(
            data_type="merchant_transactions",
            source="merchant_api",
            status="processing",
            started_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        try:
            async with httpx.AsyncClient() as client:
                params = {}
                if start_date:
                    params["start_date"] = start_date
                if end_date:
                    params["end_date"] = end_date
                response = await client.get(f"{settings.MERCHANT_API_URL}/transactions", params=params, timeout=30.0)
                response.raise_for_status()
                txns = response.json()

            count = 0
            for item in txns:
                existing = db.query(Order).filter(Order.order_no == item.get("order_no")).first()
                if not existing:
                    order = Order(
                        schedule_id=item.get("schedule_id"),
                        order_no=item["order_no"],
                        source="merchant",
                        user_id=item.get("user_id"),
                        user_name=item.get("user_name"),
                        total_amount=Decimal(str(item.get("amount", 0))),
                        ticket_count=item.get("quantity", 0),
                        status=item.get("status", "paid"),
                        paid_at=datetime.fromisoformat(item["transaction_time"]) if item.get("transaction_time") else None,
                        merchant_id=item.get("merchant_id"),
                        merchant_name=item.get("merchant_name"),
                    )
                    db.add(order)
                    count += 1

            db.commit()
            log.status = "success"
            log.records_processed = count
            log.completed_at = datetime.utcnow()
            db.commit()
            return count
        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            db.commit()
            raise

    @staticmethod
    async def fetch_camera_statistics(db: Session, schedule_id: int = None) -> int:
        log = DataRefreshLog(
            data_type="camera_statistics",
            source="camera_api",
            status="processing",
            started_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        try:
            async with httpx.AsyncClient() as client:
                params = {}
                if schedule_id:
                    params["schedule_id"] = schedule_id
                response = await client.get(f"{settings.CAMERA_API_URL}/statistics", params=params, timeout=30.0)
                response.raise_for_status()
                stats = response.json()

            count = 0
            for item in stats:
                stat = CameraStatistic(
                    schedule_id=item.get("schedule_id"),
                    camera_id=item.get("camera_id"),
                    camera_location=item.get("location"),
                    timestamp=datetime.fromisoformat(item["timestamp"]) if item.get("timestamp") else datetime.utcnow(),
                    people_count=item.get("people_count", 0),
                    in_count=item.get("in_count", 0),
                    out_count=item.get("out_count", 0),
                    snapshot_url=item.get("snapshot_url"),
                    raw_data=item,
                )
                db.add(stat)
                count += 1

            db.commit()
            log.status = "success"
            log.records_processed = count
            log.completed_at = datetime.utcnow()
            db.commit()
            return count
        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            db.commit()
            raise
