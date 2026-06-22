import uuid
import json
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from contextlib import contextmanager
from src.data.database import get_connection
from models.schemas import SyncNode, SyncNodeType, SyncStatus

logger = logging.getLogger(__name__)


class SyncOrchestrator:
    def __init__(self):
        self.conn = get_connection()

    def create_sync_node(self, node_type: SyncNodeType, node_name: str,
                        source_system: str, target_system: str,
                        operator: str, batch_no: str) -> str:
        sync_id = f"sync_{uuid.uuid4().hex[:12]}"
        sync_node = SyncNode(
            sync_id=sync_id,
            node_type=node_type,
            node_name=node_name,
            source_system=source_system,
            target_system=target_system,
            status=SyncStatus.PENDING,
            operator=operator,
            batch_no=batch_no,
            started_at=datetime.now()
        )

        self.conn.execute("""
            INSERT INTO sync_nodes (
                sync_id, node_type, node_name, source_system, target_system,
                status, record_count, error_message, started_at, operator, batch_no
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sync_node.sync_id, sync_node.node_type.value, sync_node.node_name,
            sync_node.source_system, sync_node.target_system,
            sync_node.status.value, 0, None,
            sync_node.started_at, sync_node.operator, sync_node.batch_no
        ))
        self.conn.commit()
        return sync_id

    @contextmanager
    def sync_context(self, sync_id: str):
        try:
            self._update_status(sync_id, SyncStatus.RUNNING)
            yield self
            self._update_status(sync_id, SyncStatus.COMPLETED)
        except Exception as e:
            logger.error(f"Sync node {sync_id} failed: {str(e)}")
            self._update_status(sync_id, SyncStatus.FAILED, error_message=str(e))
            raise

    def _update_status(self, sync_id: str, status: SyncStatus,
                      error_message: Optional[str] = None,
                      record_count: Optional[int] = None) -> None:
        updates = ["status = ?"]
        params = [status.value]

        if status == SyncStatus.COMPLETED:
            updates.append("completed_at = ?")
            params.append(datetime.now())

        if error_message is not None:
            updates.append("error_message = ?")
            params.append(error_message)

        if record_count is not None:
            updates.append("record_count = ?")
            params.append(record_count)

        params.append(sync_id)

        self.conn.execute(f"""
            UPDATE sync_nodes
            SET {', '.join(updates)}
            WHERE sync_id = ?
        """, params)
        self.conn.commit()

    def update_record_count(self, sync_id: str, record_count: int) -> None:
        self.conn.execute("""
            UPDATE sync_nodes SET record_count = ? WHERE sync_id = ?
        """, (record_count, sync_id))
        self.conn.commit()

    def mark_completed(self, sync_id: str, record_count: int = None) -> None:
        self._update_status(sync_id, SyncStatus.COMPLETED, record_count=record_count)

    def mark_failed(self, sync_id: str, error_message: str) -> None:
        self._update_status(sync_id, SyncStatus.FAILED, error_message=error_message)

    def mark_skipped(self, sync_id: str) -> None:
        self._update_status(sync_id, SyncStatus.SKIPPED)

    def get_sync_node(self, sync_id: str) -> Optional[Dict[str, Any]]:
        result = self.conn.execute("""
            SELECT * FROM sync_nodes WHERE sync_id = ?
        """, (sync_id,)).fetchone()
        if result:
            return dict(zip([d[0] for d in self.conn.description], result))
        return None

    def get_sync_nodes_by_batch(self, batch_no: str) -> list:
        result = self.conn.execute("""
            SELECT * FROM sync_nodes WHERE batch_no = ? ORDER BY started_at
        """, (batch_no,)).fetchall()
        return [dict(zip([d[0] for d in self.conn.description], row)) for row in result]

    def get_sync_chain(self, sync_id: str) -> list:
        node = self.get_sync_node(sync_id)
        if not node:
            return []

        batch_no = node["batch_no"]
        return self.get_sync_nodes_by_batch(batch_no)

    def validate_sync_chain(self, batch_no: str) -> Dict[str, Any]:
        nodes = self.get_sync_nodes_by_batch(batch_no)

        all_completed = all(n["status"] == SyncStatus.COMPLETED.value for n in nodes)
        has_failures = any(n["status"] == SyncStatus.FAILED.value for n in nodes)

        record_counts = {}
        for n in nodes:
            record_counts[n["node_type"]] = n["record_count"]

        return {
            "batch_no": batch_no,
            "total_nodes": len(nodes),
            "all_completed": all_completed,
            "has_failures": has_failures,
            "nodes": nodes,
            "record_counts": record_counts,
            "validation_passed": all_completed and not has_failures
        }

    def get_audit_trail(self, sync_id: str) -> list:
        chain = self.get_sync_chain(sync_id)
        trail = []
        for node in chain:
            trail.append({
                "sync_id": node["sync_id"],
                "node_type": node["node_type"],
                "node_name": node["node_name"],
                "status": node["status"],
                "operator": node["operator"],
                "started_at": node["started_at"],
                "completed_at": node["completed_at"],
                "record_count": node["record_count"],
                "duration_seconds": (
                    (node["completed_at"] - node["started_at"]).total_seconds()
                    if node["completed_at"] else None
                )
            })
        return trail

    def close(self):
        self.conn.close()


class DataSyncPipeline:
    def __init__(self, operator: str, batch_no: str = None):
        self.operator = operator
        self.batch_no = batch_no or f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.orchestrator = SyncOrchestrator()
        self.sync_ids: Dict[str, str] = {}

    def create_node(self, node_type: SyncNodeType, node_name: str,
                  source_system: str, target_system: str) -> str:
        sync_id = self.orchestrator.create_sync_node(
            node_type=node_type,
            node_name=node_name,
            source_system=source_system,
            target_system=target_system,
            operator=self.operator,
            batch_no=self.batch_no
        )
        self.sync_ids[node_type.value] = sync_id
        return sync_id

    def execute_with_audit(self, sync_id: str, func: Callable, *args, **kwargs) -> Any:
        with self.orchestrator.sync_context(sync_id):
            result = func(*args, **kwargs)
            if hasattr(result, '__len__'):
                self.orchestrator.update_record_count(sync_id, len(result))
            return result

    def validate(self) -> Dict[str, Any]:
        return self.orchestrator.validate_sync_chain(self.batch_no)

    def get_audit_trail(self) -> list:
        first_sync_id = list(self.sync_ids.values())[0] if self.sync_ids else None
        if not first_sync_id:
            return self.orchestrator.get_audit_trail(first_sync_id)
        return []

    def close(self):
        self.orchestrator.close()
