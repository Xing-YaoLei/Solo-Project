import uuid
import logging
from datetime import datetime

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import config
from db.models import Base, SyncBatch, WarehouseOutbound

logger = logging.getLogger(__name__)


class WarehouseSyncer:
    def __init__(self):
        self.engine = create_engine(config.DATABASE_URL)
        self.Session = sessionmaker(bind=self.engine)
        self.batch_size = config.SYNC_BATCH_SIZE

    def _create_sync_batch(self, source_name):
        session = self.Session()
        batch_id = f"SYNC-WH-{uuid.uuid4().hex[:12]}"
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
        logger.info("Fetching warehouse outbound source data (mock)...")
        records = []
        if batch_no:
            records.append(
                {
                    "outbound_no": f"WO-SRC-{uuid.uuid4().hex[:10]}",
                    "batch_no": batch_no,
                    "sku_code": "SKU001",
                    "sku_name": "有机蔬菜礼盒",
                    "qty_planned": 100,
                    "qty_actual": 95,
                    "warehouse_code": "WH-110000",
                    "warehouse_name": "北京仓",
                    "outbound_time": datetime.now(),
                    "status": "completed",
                }
            )
        return pd.DataFrame(records)

    def sync(self, batch_date=None, batch_no=None):
        sync_batch_id = self._create_sync_batch("warehouse_outbound")
        logger.info(f"Sync batch {sync_batch_id} started for warehouse outbound.")

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
                        session.query(WarehouseOutbound)
                        .filter_by(outbound_no=row["outbound_no"])
                        .first()
                    )
                    if not exists:
                        wo = WarehouseOutbound(
                            outbound_no=row["outbound_no"],
                            batch_no=row["batch_no"],
                            sku_code=row["sku_code"],
                            sku_name=row["sku_name"],
                            qty_planned=row.get("qty_planned", 0),
                            qty_actual=row.get("qty_actual", 0),
                            warehouse_code=row.get("warehouse_code"),
                            warehouse_name=row.get("warehouse_name"),
                            outbound_time=row.get("outbound_time"),
                            status=row.get("status", "pending"),
                            sync_batch_id=sync_batch_id,
                        )
                        session.add(wo)
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

    def get_batch_history(self, source="warehouse_outbound"):
        engine = create_engine(config.DATABASE_URL)
        df = pd.read_sql(
            "SELECT * FROM sync_batch WHERE source = %s ORDER BY created_at DESC",
            engine,
            params=[source],
        )
        return df
