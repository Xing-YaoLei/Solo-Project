import uuid
import logging
from datetime import datetime

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import config
from db.models import SyncBatch, DriverTrack

logger = logging.getLogger(__name__)


class DriverTrackSyncer:
    def __init__(self):
        self.engine = create_engine(config.DATABASE_URL)
        self.Session = sessionmaker(bind=self.engine)
        self.batch_size = config.SYNC_BATCH_SIZE

    def _create_sync_batch(self, source_name):
        session = self.Session()
        batch_id = f"SYNC-DT-{uuid.uuid4().hex[:12]}"
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
        logger.info("Fetching driver track source data (mock)...")
        records = []
        if batch_no:
            records.append(
                {
                    "track_id": f"DT-SRC-{uuid.uuid4().hex[:10]}",
                    "batch_no": batch_no,
                    "driver_name": "测试司机",
                    "vehicle_no": "京A12345",
                    "departure_time": datetime.now(),
                    "arrival_time": datetime.now(),
                    "route_stop_seq": 1,
                    "stop_community": "阳光花园",
                    "stop_longitude": 116.407,
                    "stop_latitude": 39.904,
                    "stop_arrival_time": datetime.now(),
                    "stop_departure_time": datetime.now(),
                    "is_on_time": True,
                }
            )
        return pd.DataFrame(records)

    def sync(self, batch_date=None, batch_no=None):
        sync_batch_id = self._create_sync_batch("driver_track")
        logger.info(f"Sync batch {sync_batch_id} started for driver track.")

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
                        session.query(DriverTrack)
                        .filter_by(track_id=row["track_id"])
                        .first()
                    )
                    if not exists:
                        dt = DriverTrack(
                            track_id=row["track_id"],
                            batch_no=row["batch_no"],
                            driver_name=row.get("driver_name"),
                            vehicle_no=row.get("vehicle_no"),
                            departure_time=row.get("departure_time"),
                            arrival_time=row.get("arrival_time"),
                            route_stop_seq=row.get("route_stop_seq", 0),
                            stop_community=row.get("stop_community"),
                            stop_longitude=row.get("stop_longitude"),
                            stop_latitude=row.get("stop_latitude"),
                            stop_arrival_time=row.get("stop_arrival_time"),
                            stop_departure_time=row.get("stop_departure_time"),
                            is_on_time=row.get("is_on_time", True),
                            sync_batch_id=sync_batch_id,
                        )
                        session.add(dt)
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

    def get_batch_history(self, source="driver_track"):
        engine = create_engine(config.DATABASE_URL)
        df = pd.read_sql(
            "SELECT * FROM sync_batch WHERE source = %s ORDER BY created_at DESC",
            engine,
            params=[source],
        )
        return df
