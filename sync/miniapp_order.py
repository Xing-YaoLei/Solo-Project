import uuid
import logging
from datetime import datetime

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import config
from db.models import SyncBatch, MiniappOrder

logger = logging.getLogger(__name__)


class MiniappOrderSyncer:
    def __init__(self):
        self.engine = create_engine(config.DATABASE_URL)
        self.Session = sessionmaker(bind=self.engine)
        self.batch_size = config.SYNC_BATCH_SIZE

    def _create_sync_batch(self, source_name):
        session = self.Session()
        batch_id = f"SYNC-MO-{uuid.uuid4().hex[:12]}"
        sb = SyncBatch(
            batch_id=batch_id,
            source=source_name,
            status="running",
            started_at=datetime.now(),
        )
        session.add(sb)
        session.commit()
        session.close()
        return batch_id

    def _finish_sync_batch(self, batch_id, record_count, status="completed"):
        session = self.Session()
        sb = session.query(SyncBatch).filter_by(batch_id=batch_id).first()
        if sb:
            sb.status = status
            sb.record_count = record_count
            sb.finished_at = datetime.now()
        session.commit()
        session.close()

    def fetch_source_data(self, batch_date=None, batch_no=None):
        logger.info("Fetching miniapp order source data (mock)...")
        records = []
        if batch_no:
            records.append(
                {
                    "order_no": f"MO-SRC-{uuid.uuid4().hex[:10]}",
                    "batch_no": batch_no,
                    "user_id": "U99999",
                    "sku_code": "SKU001",
                    "sku_name": "有机蔬菜礼盒",
                    "qty": 2,
                    "unit_price": 58.0,
                    "total_amount": 116.0,
                    "order_time": datetime.now(),
                    "pay_time": datetime.now(),
                    "order_status": "paid",
                    "region_code": "110000",
                }
            )
        return pd.DataFrame(records)

    def sync(self, batch_date=None, batch_no=None):
        sync_batch_id = self._create_sync_batch("miniapp_order")
        logger.info(f"Sync batch {sync_batch_id} started for miniapp order.")

        try:
            df = self.fetch_source_data(batch_date=batch_date, batch_no=batch_no)
            if df.empty:
                self._finish_sync_batch(sync_batch_id, 0, "completed")
                return sync_batch_id, 0

            session = self.Session()
            inserted = 0
            for start in range(0, len(df), self.batch_size):
                chunk = df.iloc[start : start + self.batch_size]
                for _, row in chunk.iterrows():
                    exists = (
                        session.query(MiniappOrder)
                        .filter_by(order_no=row["order_no"])
                        .first()
                    )
                    if not exists:
                        mo = MiniappOrder(
                            order_no=row["order_no"],
                            batch_no=row["batch_no"],
                            user_id=row["user_id"],
                            sku_code=row["sku_code"],
                            sku_name=row["sku_name"],
                            qty=row.get("qty", 1),
                            unit_price=row.get("unit_price"),
                            total_amount=row.get("total_amount"),
                            order_time=row.get("order_time"),
                            pay_time=row.get("pay_time"),
                            order_status=row.get("order_status"),
                            region_code=row.get("region_code"),
                            sync_batch_id=sync_batch_id,
                        )
                        session.add(mo)
                        inserted += 1
                session.commit()

            session.close()
            self._finish_sync_batch(sync_batch_id, inserted, "completed")
            logger.info(f"Sync batch {sync_batch_id} completed: {inserted} records.")
            return sync_batch_id, inserted

        except Exception as e:
            self._finish_sync_batch(sync_batch_id, 0, "failed")
            logger.error(f"Sync batch {sync_batch_id} failed: {e}")
            raise

    def get_batch_history(self, source="miniapp_order"):
        engine = create_engine(config.DATABASE_URL)
        df = pd.read_sql(
            "SELECT * FROM sync_batch WHERE source = %s ORDER BY created_at DESC",
            engine,
            params=[source],
        )
        return df
