import hashlib
import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
import polars as pl
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient

class SyncNode:
    def __init__(self, name: str, description: str, node_order: int):
        self.name = name
        self.description = description
        self.node_order = node_order
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.status: str = "pending"
        self.records_processed: int = 0
        self.error_message: Optional[str] = None
        self.source_hash: Optional[str] = None
        self.target_hash: Optional[str] = None
        self.metadata: Dict[str, Any] = {}

    def start(self):
        self.start_time = datetime.now()
        self.status = "running"

    def complete(self, records: int = 0):
        self.end_time = datetime.now()
        self.status = "completed"
        self.records_processed = records

    def fail(self, error: str):
        self.end_time = datetime.now()
        self.status = "failed"
        self.error_message = error

    def calculate_hash(self, data: str) -> str:
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "node_order": self.node_order,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "records_processed": self.records_processed,
            "error_message": self.error_message,
            "source_hash": self.source_hash,
            "target_hash": self.target_hash,
            "duration_seconds": (self.end_time - self.start_time).total_seconds() 
                if self.start_time and self.end_time else None
        }

class BaseSyncPipeline(ABC):
    def __init__(self, source_system: str, db_client: DuckDBClient, minio_client: MinIOClient):
        self.sync_id = str(uuid.uuid4())
        self.source_system = source_system
        self.db_client = db_client
        self.minio_client = minio_client
        self.nodes: List[SyncNode] = []
        self.sync_start_time: Optional[datetime] = None
        self.sync_end_time: Optional[datetime] = None
        self.overall_status: str = "pending"

    @abstractmethod
    def define_nodes(self) -> List[SyncNode]:
        pass

    @abstractmethod
    def execute_node(self, node: SyncNode) -> Optional[pl.DataFrame]:
        pass

    def _log_audit(self, node: SyncNode):
        audit_data = {
            "sync_id": self.sync_id,
            "source_system": self.source_system,
            "sync_node": node.name,
            "status": node.status,
            "records_processed": node.records_processed,
            "start_time": node.start_time,
            "end_time": node.end_time,
            "error_message": node.error_message,
            "source_hash": node.source_hash,
            "target_hash": node.target_hash,
            "metadata": json.dumps(node.metadata, ensure_ascii=False)
        }
        
        df = pl.DataFrame([audit_data])
        self.db_client.insert_dataframe("sync_audit_log", df)

    def _save_to_minio(self, df: pl.DataFrame, node: SyncNode) -> str:
        date_str = datetime.now().strftime("%Y/%m/%d")
        object_path = f"{self.source_system}/{date_str}/{self.sync_id}/{node.name}.csv"
        success = self.minio_client.put_dataframe(
            df, 
            object_path, 
            metadata={"sync_id": self.sync_id, "node": node.name, "source_system": self.source_system}
        )
        if success:
            node.metadata["minio_path"] = object_path
        return object_path

    def run(self) -> bool:
        self.sync_start_time = datetime.now()
        self.overall_status = "running"
        self.nodes = self.define_nodes()
        
        try:
            for node in self.nodes:
                node.start()
                try:
                    result_df = self.execute_node(node)
                    if result_df is not None and len(result_df) > 0:
                        node.source_hash = node.calculate_hash(result_df.write_csv())
                        minio_path = self._save_to_minio(result_df, node)
                        node.target_hash = node.calculate_hash(result_df.write_csv())
                        node.complete(records=len(result_df))
                    else:
                        node.complete(records=0)
                except Exception as e:
                    node.fail(str(e))
                    self._log_audit(node)
                    self.overall_status = "failed"
                    raise
                finally:
                    self._log_audit(node)
            
            self.sync_end_time = datetime.now()
            self.overall_status = "completed"
            return True
            
        except Exception as e:
            self.sync_end_time = datetime.now()
            self.overall_status = "failed"
            return False

    def get_audit_summary(self) -> Dict[str, Any]:
        return {
            "sync_id": self.sync_id,
            "source_system": self.source_system,
            "overall_status": self.overall_status,
            "start_time": self.sync_start_time.isoformat() if self.sync_start_time else None,
            "end_time": self.sync_end_time.isoformat() if self.sync_end_time else None,
            "total_duration_seconds": (self.sync_end_time - self.sync_start_time).total_seconds()
                if self.sync_start_time and self.sync_end_time else None,
            "nodes": [node.to_dict() for node in self.nodes]
        }
