import logging
import uuid
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from pathlib import Path

import polars as pl

from ..config import AppConfig
from ..minio_client import MinioStorageClient
from ..duckdb_manager import DuckDBManager
from ..data_processor import DataProcessor, ProcessResult

logger = logging.getLogger(__name__)


class ETLPipeline:
    def __init__(self, config: AppConfig):
        self.config = config
        self.storage = MinioStorageClient(config.minio)
        self.db = DuckDBManager(config.duckdb)
        self.processor = DataProcessor(config.target_attendance_rate)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()

    def generate_batch_id(self, data_type: str) -> str:
        timestamp = datetime.now().strftime("%Y%m%d")
        short_uuid = uuid.uuid4().hex[:8]
        return f"{data_type}_{timestamp}_{short_uuid}"

    def process_file(self, file_path: Path, data_type: str,
                     source_name: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"Processing {data_type} file: {file_path}")

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        df = pl.read_csv(file_path)
        return self.process_dataframe(df, data_type, source_name or file_path.name)

    def process_dataframe(self, df: pl.DataFrame, data_type: str,
                          source_name: str) -> Dict[str, Any]:
        batch_id = self.generate_batch_id(data_type)
        logger.info(f"Generated batch ID: {batch_id}")

        process_func = {
            "inventory": self.processor.process_inventory,
            "reviews": self.processor.process_reviews,
            "appointments": self.processor.process_appointments,
            "recharge": self.processor.process_recharge,
            "service_cards": self.processor.process_service_cards,
            "schedules": self.processor.process_schedules,
        }.get(data_type)

        if not process_func:
            raise ValueError(f"Unknown data type: {data_type}")

        result: ProcessResult = process_func(df)

        self.db.register_batch(
            batch_id=batch_id,
            data_type=data_type,
            source_file=source_name,
            row_count=result.row_count,
            metadata={
                "stats": result.stats,
                "anomaly_count": len(result.anomalies),
                "processed_at": datetime.now().isoformat(),
            }
        )

        insert_func = {
            "inventory": self.db.insert_inventory,
            "reviews": self.db.insert_reviews,
            "appointments": self.db.insert_appointments,
            "recharge": self.db.insert_recharge,
            "service_cards": self.db.insert_service_cards,
            "schedules": self.db.insert_schedules,
        }[data_type]

        inserted = insert_func(result.df, batch_id)
        logger.info(f"Inserted {inserted} rows into {data_type} table")

        storage_obj = self.storage.save_batch(
            batch_id=batch_id,
            data_type=data_type,
            df=result.df,
            metadata={
                "stats": result.stats,
                "source": source_name,
                "anomalies": result.anomalies,
            }
        )
        logger.info(f"Saved batch to storage: {storage_obj}")

        self.db.mark_batch_processed(batch_id, data_type)

        if data_type == "appointments":
            metrics_df = self.processor.calculate_attendance_metrics(result.df, batch_id)
            if not metrics_df.is_empty():
                self.db.insert_attendance_metrics(metrics_df, batch_id)
                logger.info(f"Inserted {len(metrics_df)} attendance metrics")

        return {
            "batch_id": batch_id,
            "data_type": data_type,
            "row_count": result.row_count,
            "stats": result.stats,
            "anomalies": result.anomalies,
            "storage_object": storage_obj,
        }

    def run_full_pipeline(self, inventory_df: Optional[pl.DataFrame] = None,
                          reviews_df: Optional[pl.DataFrame] = None,
                          appointments_df: Optional[pl.DataFrame] = None,
                          recharge_df: Optional[pl.DataFrame] = None,
                          service_cards_df: Optional[pl.DataFrame] = None,
                          schedules_df: Optional[pl.DataFrame] = None) -> Dict[str, Any]:
        logger.info("Starting full ETL pipeline")
        results = {}

        if inventory_df is not None:
            results["inventory"] = self.process_dataframe(inventory_df, "inventory", "inventory_upload")

        if reviews_df is not None:
            results["reviews"] = self.process_dataframe(reviews_df, "reviews", "reviews_upload")

        if appointments_df is not None:
            results["appointments"] = self.process_dataframe(appointments_df, "appointments", "appointments_upload")

        if recharge_df is not None:
            results["recharge"] = self.process_dataframe(recharge_df, "recharge", "recharge_upload")

        if service_cards_df is not None:
            results["service_cards"] = self.process_dataframe(service_cards_df, "service_cards", "cards_upload")

        if schedules_df is not None:
            results["schedules"] = self.process_dataframe(schedules_df, "schedules", "schedules_upload")

        logger.info(f"Pipeline completed. Processed {len(results)} data types")
        return results

    def get_batch_history(self, data_type: Optional[str] = None) -> pl.DataFrame:
        return self.db.list_batches(data_type)

    def get_batch_data(self, batch_id: str, data_type: str) -> Optional[pl.DataFrame]:
        storage_df = self.storage.get_batch(batch_id, data_type)
        if storage_df is not None:
            return storage_df
        return self.db.get_batch_data(batch_id, data_type)

    def list_all_batches(self, data_type: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.storage.list_batches(data_type)

    def get_summary(self) -> Dict[str, Any]:
        db_stats = self.db.get_summary_stats()
        storage_batches = self.list_all_batches()

        return {
            "database_records": db_stats,
            "total_batches": len(storage_batches),
            "recent_batches": storage_batches[:5],
        }

    def get_attendance_rate_summary(self, technician: Optional[str] = None,
                                    store: Optional[str] = None) -> Dict[str, Any]:
        metrics = self.db.get_attendance_metrics(technician=technician, store=store)
        if metrics.is_empty():
            return {}

        latest = metrics.head(1).to_dicts()[0]
        return {
            "current_rate": latest["attendance_rate"],
            "target_rate": latest["target_rate"],
            "yoy_rate": latest["yoy_rate"],
            "mom_rate": latest["mom_rate"],
            "vs_target": latest["attendance_rate"] - latest["target_rate"],
            "vs_yoy": latest["attendance_rate"] - latest["yoy_rate"] if latest["yoy_rate"] else None,
            "vs_mom": latest["attendance_rate"] - latest["mom_rate"] if latest["mom_rate"] else None,
        }
