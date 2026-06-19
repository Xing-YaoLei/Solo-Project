from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
import random

from app.models.models import SyncNode, SyncLog, SyncBatch
from app.schemas.sync import (
    SyncFlow, SyncStats, SyncBatch as SyncBatchSchema
)


SOURCE_TYPE_LABELS = {
    "door_lock": "门锁记录",
    "payment": "收款流水",
    "ota": "OTA订单"
}

NODE_NAMES = {
    "door_lock": ["采集", "格式校验", "去重处理", "数据转换", "业务规则校验", "入库", "DuckDB同步"],
    "payment": ["采集", "格式校验", "去重处理", "数据转换", "业务规则校验", "入库", "DuckDB同步"],
    "ota": ["采集", "格式校验", "去重处理", "数据转换", "业务规则校验", "入库", "DuckDB同步"]
}


def get_sync_flow(db: Session, source_type: Optional[str] = None) -> List[SyncFlow]:
    source_types = [source_type] if source_type else ["door_lock", "payment", "ota"]

    flows = []
    for st in source_types:
        nodes = db.query(SyncNode).filter(SyncNode.source_type == st).order_by(SyncNode.seq_order).all()
        if not nodes:
            nodes = []
            for i, name in enumerate(NODE_NAMES[st]):
                node = SyncNode(
                    name=name,
                    source_type=st,
                    status=random.choice(["success", "success", "success", "running", "failed"]),
                    seq_order=i + 1,
                    last_sync_time=datetime.now() - timedelta(hours=random.randint(0, 24)),
                    success_count=random.randint(50, 200),
                    fail_count=random.randint(0, 5)
                )
                db.add(node)
                nodes.append(node)
            db.commit()

        node_list = []
        for idx, n in enumerate(nodes):
            node_list.append({
                "id": n.id,
                "name": n.name,
                "source_type": n.source_type,
                "status": n.status,
                "seq_order": n.seq_order,
                "last_sync_time": n.last_sync_time,
                "success_count": n.success_count or 0,
                "fail_count": n.fail_count or 0,
                "avg_duration": float(random.randint(50, 500)),
                "isLast": idx == len(nodes) - 1
            })

        flows.append(SyncFlow(
            sourceType=st,
            sourceTypeLabel=SOURCE_TYPE_LABELS.get(st, st),
            nodes=node_list
        ))

    return flows


def get_sync_stats(db: Session) -> List[SyncStats]:
    source_types = ["door_lock", "payment", "ota"]
    stats = []

    for st in source_types:
        nodes = db.query(SyncNode).filter(SyncNode.source_type == st).all()
        total_success = sum(n.success_count or 0 for n in nodes)
        total_fail = sum(n.fail_count or 0 for n in nodes)
        total = total_success + total_fail
        success_rate = round(total_success / total * 100, 1) if total > 0 else 100.0

        stats.append(SyncStats(
            sourceType=st,
            sourceTypeLabel=SOURCE_TYPE_LABELS.get(st, st),
            total_records=total,
            successRate=success_rate
        ))

    return stats


def get_sync_nodes(db: Session, source_type: Optional[str] = None) -> List[SyncNode]:
    query = db.query(SyncNode)
    if source_type:
        query = query.filter(SyncNode.source_type == source_type)
    return query.order_by(SyncNode.source_type, SyncNode.seq_order).all()


def get_sync_node_logs(
    db: Session,
    node_id: str,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[SyncLog], int]:
    node = db.query(SyncNode).filter(SyncNode.id == node_id).first()
    node_name = node.name if node else ""

    query = db.query(SyncLog).filter(SyncLog.node_id == node_id)
    total = query.count()
    logs = query.order_by(SyncLog.started_at.desc()).offset(skip).limit(limit).all()

    for log in logs:
        log.node_name = node_name

    return logs, total


def get_sync_batches(
    db: Session,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[SyncBatch], int]:
    query = db.query(SyncBatch)
    if source_type:
        query = query.filter(SyncBatch.source_type == source_type)
    if status:
        query = query.filter(SyncBatch.status == status)

    total = query.count()
    batches = query.order_by(SyncBatch.started_at.desc()).offset(skip).limit(limit).all()

    if not batches:
        source_types = [source_type] if source_type else ["door_lock", "payment", "ota"]
        for st in source_types:
            for i in range(10):
                batch = SyncBatch(
                    source_type=st,
                    started_at=datetime.now() - timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59)),
                    status=random.choice(["success", "success", "success", "running", "failed"]),
                    total_count=random.randint(20, 200),
                    success_count=random.randint(15, 200),
                    fail_count=random.randint(0, 5)
                )
                batch.ended_at = batch.started_at + timedelta(minutes=random.randint(1, 10)) if batch.status != "running" else None
                db.add(batch)
        db.commit()
        query = db.query(SyncBatch)
        if source_type:
            query = query.filter(SyncBatch.source_type == source_type)
        if status:
            query = query.filter(SyncBatch.status == status)
        total = query.count()
        batches = query.order_by(SyncBatch.started_at.desc()).offset(skip).limit(limit).all()

    return batches, total


def get_batch_nodes(db: Session, batch_id: str) -> List[dict]:
    batch = db.query(SyncBatch).filter(SyncBatch.id == batch_id).first()
    if not batch:
        return []

    logs = db.query(SyncLog).filter(SyncLog.batch_id == batch_id).all()
    nodes = db.query(SyncNode).filter(SyncNode.source_type == batch.source_type).order_by(SyncNode.seq_order).all()
    node_map = {n.id: n for n in nodes}

    result = []
    for log in logs:
        node = node_map.get(log.node_id)
        result.append({
            "log_id": log.id,
            "node_id": log.node_id,
            "node_name": node.name if node else "未知节点",
            "status": log.status,
            "record_count": log.record_count,
            "duration_ms": log.duration_ms,
            "error_detail": log.error_detail,
            "started_at": log.started_at,
            "ended_at": log.ended_at,
            "seq_order": node.seq_order if node else 99
        })

    result.sort(key=lambda x: x["seq_order"])
    return result
