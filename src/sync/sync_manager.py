from typing import Dict, List, Any
from datetime import datetime
import polars as pl
from src.sync.base_sync import BaseSyncPipeline
from src.sync.employment_sync import EmploymentSyncPipeline
from src.sync.live_platform_sync import LivePlatformSyncPipeline
from src.sync.question_bank_sync import QuestionBankSyncPipeline
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient

class SyncManager:
    def __init__(self, db_client: DuckDBClient, minio_client: MinIOClient):
        self.db_client = db_client
        self.minio_client = minio_client
        self.pipelines: Dict[str, BaseSyncPipeline] = {
            "employment": EmploymentSyncPipeline(db_client, minio_client),
            "live_platform": LivePlatformSyncPipeline(db_client, minio_client),
            "question_bank": QuestionBankSyncPipeline(db_client, minio_client)
        }

    def run_all_syncs(self) -> Dict[str, Any]:
        results = {}
        for source, pipeline in self.pipelines.items():
            try:
                success = pipeline.run()
                results[source] = {
                    "success": success,
                    "summary": pipeline.get_audit_summary()
                }
            except Exception as e:
                results[source] = {
                    "success": False,
                    "error": str(e),
                    "summary": pipeline.get_audit_summary()
                }
        return results

    def run_sync(self, source_system: str) -> Dict[str, Any]:
        if source_system not in self.pipelines:
            raise ValueError(f"Unknown source system: {source_system}")
        
        pipeline = self.pipelines[source_system]
        try:
            success = pipeline.run()
            return {
                "success": success,
                "summary": pipeline.get_audit_summary()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "summary": pipeline.get_audit_summary()
            }

    def get_sync_history(self, source_system: str = None, limit: int = 100) -> pl.DataFrame:
        query = """
            SELECT 
                sync_id,
                source_system,
                sync_node,
                status,
                records_processed,
                start_time,
                end_time,
                error_message,
                metadata
            FROM sync_audit_log
        """
        if source_system:
            query += f" WHERE source_system = '{source_system}'"
        query += " ORDER BY start_time DESC LIMIT ?"
        
        return self.db_client.query_to_polars(query, (limit,))

    def get_sync_summary(self, sync_id: str) -> Dict[str, Any]:
        query = """
            SELECT 
                source_system,
                sync_node,
                status,
                records_processed,
                start_time,
                end_time,
                error_message,
                source_hash,
                target_hash,
                metadata
            FROM sync_audit_log
            WHERE sync_id = ?
            ORDER BY start_time
        """
        df = self.db_client.query_to_polars(query, (sync_id,))
        
        if len(df) == 0:
            return {}
        
        source_system = df["source_system"][0]
        nodes = []
        overall_status = "completed"
        
        for row in df.iter_rows(named=True):
            if row["status"] == "failed":
                overall_status = "failed"
            elif row["status"] == "running" and overall_status != "failed":
                overall_status = "running"
            
            nodes.append({
                "name": row["sync_node"],
                "status": row["status"],
                "records_processed": row["records_processed"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "error": row["error_message"],
                "source_hash": row["source_hash"],
                "target_hash": row["target_hash"]
            })
        
        return {
            "sync_id": sync_id,
            "source_system": source_system,
            "overall_status": overall_status,
            "nodes": nodes
        }

    def get_failed_syncs(self, last_hours: int = 24) -> pl.DataFrame:
        query = f"""
            SELECT DISTINCT
                sync_id,
                source_system,
                MAX(CASE WHEN status = 'failed' THEN error_message END) as error_message,
                MAX(end_time) as last_attempt_time
            FROM sync_audit_log
            WHERE status = 'failed'
            AND start_time >= CURRENT_TIMESTAMP - INTERVAL '{last_hours} hours'
            GROUP BY sync_id, source_system
            ORDER BY last_attempt_time DESC
        """
        return self.db_client.query_to_polars(query)
