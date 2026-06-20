import uuid
from datetime import datetime, date
from typing import Callable, Optional, Dict, Any
import polars as pl
import logging

from src.data.duckdb_manager import DuckDBManager
from src.data.minio_client import MinIOClient
from src.config import Config

logger = logging.getLogger(__name__)


class PipelineStep:
    def __init__(self, step_id: str, step_name: str, description: str):
        self.step_id = step_id
        self.step_name = step_name
        self.description = description
        self.db = DuckDBManager()
        self.minio = MinIOClient()
        self.run_id = None

    def execute(self, run_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        self.run_id = run_id
        start_time = datetime.now()
        self.db.log_pipeline_run(
            run_id=run_id,
            step_id=self.step_id,
            step_name=self.step_name,
            status="running",
            start_time=start_time
        )

        try:
            df = self._fetch_data(start_date, end_date)
            records_count = len(df)

            self._save_to_duckdb(df)
            self._save_to_minio(df, start_date, end_date)

            end_time = datetime.now()
            self.db.log_pipeline_run(
                run_id=run_id,
                step_id=self.step_id,
                step_name=self.step_name,
                status="success",
                start_time=start_time,
                end_time=end_time,
                records_count=records_count
            )

            return {
                "step_id": self.step_id,
                "step_name": self.step_name,
                "status": "success",
                "records_count": records_count,
                "duration": (end_time - start_time).total_seconds()
            }

        except Exception as e:
            logger.error(f"Pipeline step {self.step_id} failed: {e}")
            end_time = datetime.now()
            self.db.log_pipeline_run(
                run_id=run_id,
                step_id=self.step_id,
                step_name=self.step_name,
                status="failed",
                start_time=start_time,
                end_time=end_time,
                error_message=str(e)
            )
            return {
                "step_id": self.step_id,
                "step_name": self.step_name,
                "status": "failed",
                "error": str(e),
                "duration": (end_time - start_time).total_seconds()
            }

    def _fetch_data(self, start_date: date, end_date: date) -> pl.DataFrame:
        raise NotImplementedError

    def _save_to_duckdb(self, df: pl.DataFrame):
        raise NotImplementedError

    def _save_to_minio(self, df: pl.DataFrame, start_date: date, end_date: date):
        object_name = f"pipeline/{self.step_id}/{start_date}_{end_date}.parquet"
        self.minio.upload_dataframe(object_name, df, format="parquet")

    def get_history(self, limit: int = 10) -> pl.DataFrame:
        return self.db.execute_query("""
            SELECT * FROM pipeline_runs
            WHERE step_id = ?
            ORDER BY start_time DESC
            LIMIT ?
        """, [self.step_id, limit])
