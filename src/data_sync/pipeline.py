import time
import uuid
import logging
from typing import Callable, Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime

import polars as pl

from ..config import SyncNodeStatus, DataSourceConfig
from .duckdb_store import DuckDBStore
from .minio_client import MinIOClient

logger = logging.getLogger(__name__)


@dataclass
class SyncNode:
    name: str
    description: str
    source_type: str
    target_table: str
    extract_fn: Callable[..., pl.DataFrame]
    transform_fn: Optional[Callable[[pl.DataFrame], pl.DataFrame]] = None
    dependencies: List[str] = field(default_factory=list)
    node_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    status: str = SyncNodeStatus.PENDING
    source_count: int = 0
    target_count: int = 0
    error_message: Optional[str] = None
    duration_ms: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    executed_at: Optional[datetime] = None


class SyncPipeline:
    def __init__(self, db: Optional[DuckDBStore] = None, minio: Optional[MinIOClient] = None):
        self.db = db or DuckDBStore()
        self.minio = minio or MinIOClient()
        self.nodes: Dict[str, SyncNode] = {}
        self.execution_order: List[str] = []

    def register_node(self, node: SyncNode) -> None:
        self.nodes[node.node_id] = node
        self.nodes[node.name] = node
        self.execution_order.append(node.name)

    def _execute_node(self, node: SyncNode) -> bool:
        node.status = SyncNodeStatus.RUNNING
        node.executed_at = datetime.now()
        start_time = time.time()

        try:
            for dep_name in node.dependencies:
                dep = self.nodes.get(dep_name)
                if dep and dep.status != SyncNodeStatus.SUCCESS:
                    node.status = SyncNodeStatus.SKIPPED
                    node.error_message = f"Dependency '{dep_name}' not satisfied"
                    self._audit_log(node)
                    return False

            raw_df = node.extract_fn()
            node.source_count = len(raw_df)

            if node.transform_fn:
                transformed_df = node.transform_fn(raw_df)
            else:
                transformed_df = raw_df

            node.target_count = self.db.write_polars(node.target_table, transformed_df)
            node.status = SyncNodeStatus.SUCCESS
            return True

        except Exception as e:
            node.status = SyncNodeStatus.FAILED
            node.error_message = str(e)
            logger.error(f"Node {node.name} failed: {e}")
            return False
        finally:
            node.duration_ms = int((time.time() - start_time) * 1000)
            self._audit_log(node)

    def _audit_log(self, node: SyncNode) -> None:
        self.db.log_sync_node(
            node_id=node.node_id,
            node_name=node.name,
            status=node.status,
            source_count=node.source_count,
            target_count=node.target_count,
            error_message=node.error_message,
            duration_ms=node.duration_ms,
            metadata=node.metadata,
        )
        self.minio.write_audit_log(
            node_id=node.node_id,
            node_name=node.name,
            status=node.status,
            details={
                "source_count": node.source_count,
                "target_count": node.target_count,
                "error_message": node.error_message,
                "duration_ms": node.duration_ms,
                "metadata": node.metadata,
            },
        )

    def run(self, node_names: Optional[List[str]] = None) -> Dict[str, Any]:
        targets = node_names or self.execution_order
        results = {"success": [], "failed": [], "skipped": [], "total_duration_ms": 0}
        pipeline_start = time.time()

        for name in targets:
            node = self.nodes.get(name)
            if not node:
                logger.warning(f"Unknown node: {name}")
                continue

            if self._execute_node(node):
                results["success"].append(name)
            elif node.status == SyncNodeStatus.SKIPPED:
                results["skipped"].append(name)
            else:
                results["failed"].append(name)

        results["total_duration_ms"] = int((time.time() - pipeline_start) * 1000)
        return results

    def get_node_status(self) -> pl.DataFrame:
        rows = []
        for name in self.execution_order:
            node = self.nodes[name]
            rows.append(
                {
                    "node_id": node.node_id,
                    "node_name": node.name,
                    "description": node.description,
                    "status": node.status,
                    "source_count": node.source_count,
                    "target_count": node.target_count,
                    "duration_ms": node.duration_ms,
                    "error": node.error_message,
                    "executed_at": node.executed_at,
                }
            )
        return pl.DataFrame(rows)

    def get_audit_history(self, limit: int = 200) -> pl.DataFrame:
        return self.db.get_sync_audit(limit)
