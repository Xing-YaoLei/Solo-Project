import uuid
from datetime import date, datetime
from typing import List, Dict, Any
import logging

from src.pipeline.step1_orders import MiniProgramOrdersStep
from src.pipeline.step2_cameras import CameraStatisticsStep
from src.pipeline.step3_merchants import MerchantTransactionsStep
from src.data.duckdb_manager import DuckDBManager
from src.config import Config

logger = logging.getLogger(__name__)


class PipelineManager:
    def __init__(self):
        self.steps = [
            MiniProgramOrdersStep(),
            CameraStatisticsStep(),
            MerchantTransactionsStep(),
        ]
        self.db = DuckDBManager()

    def run_pipeline(self, start_date: date, end_date: date) -> Dict[str, Any]:
        run_id = f"RUN{uuid.uuid4().hex[:10].upper()}"
        results = {
            "run_id": run_id,
            "start_time": datetime.now(),
            "steps": [],
            "status": "running"
        }

        for step in self.steps:
            result = step.execute(run_id, start_date, end_date)
            results["steps"].append(result)

            if result["status"] == "failed":
                results["status"] = "failed"
                break

        if results["status"] == "running":
            results["status"] = "success"

        results["end_time"] = datetime.now()
        results["total_duration"] = (results["end_time"] - results["start_time"]).total_seconds()

        return results

    def run_single_step(self, step_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        run_id = f"RUN{uuid.uuid4().hex[:10].upper()}"

        for step in self.steps:
            if step.step_id == step_id:
                result = step.execute(run_id, start_date, end_date)
                return result

        raise ValueError(f"Step not found: {step_id}")

    def get_step_status(self, run_id: str) -> List[Dict[str, Any]]:
        df = self.db.execute_query("""
            SELECT step_id, step_name, status, start_time, end_time,
                   records_count, error_message, duration_seconds
            FROM pipeline_runs
            WHERE run_id = ?
            ORDER BY start_time
        """, [run_id])

        return df.to_dicts()

    def get_recent_runs(self, limit: int = 20) -> List[Dict[str, Any]]:
        df = self.db.execute_query("""
            SELECT run_id,
                   COUNT(*) as total_steps,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_steps,
                   SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_steps,
                   MIN(start_time) as start_time,
                   MAX(end_time) as end_time,
                   SUM(duration_seconds) as total_duration
            FROM pipeline_runs
            GROUP BY run_id
            ORDER BY start_time DESC
            LIMIT ?
        """, [limit])

        return df.to_dicts()

    def get_step_info(self) -> List[Dict[str, str]]:
        return Config.PIPELINE_STEPS
