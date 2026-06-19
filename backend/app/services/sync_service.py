from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Tuple
from datetime import datetime

from app.models.models import SyncNode, SyncLog, SyncBatch


def get_sync_nodes(db: Session) -> List[SyncNode]:
    nodes = db.query(SyncNode).order_by(SyncNode.source_type, SyncNode.seq_order).all()
    
    for node in nodes:
        stats = db.query(
            func.count(SyncLog.id),
            func.sum(func.case((SyncLog.status == "success", 1), else_=0)),
            func.sum(func.case((SyncLog.status == "failed", 1), else_=0)),
            func.avg(SyncLog.duration_ms)
        ).filter(SyncLog.node_id == node.id).first()
        
        node.record_count = int(stats[0] or 0)
        node.success_count = int(stats[1] or 0)
        node.fail_count = int(stats[2] or 0)
        node.avg_duration = float(stats[3] or 0)
        
        last_failed = db.query(SyncLog).filter(
            SyncLog.node_id == node.id,
            SyncLog.status == "failed"
        ).order_by(SyncLog.started_at.desc()).first()
        node.error_message = last_failed.error_detail if last_failed else None
    
    return nodes


def get_sync_node_logs(
    db: Session,
    node_id: str,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[SyncLog], int]:
    query = db.query(SyncLog).filter(SyncLog.node_id == node_id)
    total = query.count()
    logs = query.order_by(SyncLog.started_at.desc()).offset(skip).limit(limit).all()
    return logs, total


def create_sync_node(db: Session, name: str, source_type: str, seq_order: int):
    node = SyncNode(
        name=name,
        source_type=source_type,
        status="pending",
        seq_order=seq_order
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


def update_sync_node_status(db: Session, node_id: str, status: str):
    node = db.query(SyncNode).filter(SyncNode.id == node_id).first()
    if node:
        node.status = status
        node.last_sync_time = datetime.now()
        db.commit()
        db.refresh(node)
    return node


def create_sync_log(db: Session, node_id: str, batch_id: str, status: str, 
                    record_count: int = 0, duration: int = 0,
                    error_detail: str = None, raw_data_sample: dict = None):
    log = SyncLog(
        node_id=node_id,
        batch_id=batch_id,
        status=status,
        record_count=record_count,
        duration_ms=duration,
        error_detail=error_detail,
        raw_data_sample=raw_data_sample,
        ended_at=datetime.now() if status in ["success", "failed"] else None
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def create_sync_batch(db: Session, source_type: str):
    batch = SyncBatch(
        source_type=source_type,
        status="running"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def complete_sync_batch(db: Session, batch_id: str, total_count: int, 
                        success_count: int, fail_count: int):
    batch = db.query(SyncBatch).filter(SyncBatch.id == batch_id).first()
    if batch:
        batch.status = "success" if fail_count == 0 else "failed"
        batch.ended_at = datetime.now()
        batch.total_count = total_count
        batch.success_count = success_count
        batch.fail_count = fail_count
        db.commit()
        db.refresh(batch)
    return batch
