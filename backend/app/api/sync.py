from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.schemas.sync import (
    SyncFlow, SyncStats, SyncNode, SyncLogListResponse,
    SyncBatchListResponse
)
from app.services.sync_service import (
    get_sync_flow, get_sync_stats, get_sync_nodes,
    get_sync_node_logs, get_sync_batches, get_batch_nodes
)

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/audit/flow", response_model=list[SyncFlow])
def read_sync_flow(
    sourceType: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_sync_flow(db, sourceType)


@router.get("/stats/recent", response_model=list[SyncStats])
def read_sync_stats(db: Session = Depends(get_db)):
    return get_sync_stats(db)


@router.get("/nodes", response_model=list[SyncNode])
def read_sync_nodes(
    sourceType: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_sync_nodes(db, sourceType)


@router.get("/nodes/{node_id}/logs", response_model=SyncLogListResponse)
def read_sync_node_logs(
    node_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    logs, total = get_sync_node_logs(db, node_id, skip=skip, limit=pageSize)
    return SyncLogListResponse(data=logs, total=total)


@router.get("/batches", response_model=SyncBatchListResponse)
def read_sync_batches(
    sourceType: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    batches, total = get_sync_batches(
        db, source_type=sourceType,
        status=status, skip=skip, limit=pageSize
    )
    return SyncBatchListResponse(data=batches, total=total)


@router.get("/batches/{batch_id}/nodes")
def read_batch_nodes(batch_id: str, db: Session = Depends(get_db)):
    return get_batch_nodes(db, batch_id)
