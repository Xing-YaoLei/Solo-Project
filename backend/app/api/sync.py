from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.sync import SyncNode, SyncLog, SyncLogListResponse
from app.services.sync_service import get_sync_nodes, get_sync_node_logs

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/nodes", response_model=list[SyncNode])
def read_sync_nodes(db: Session = Depends(get_db)):
    return get_sync_nodes(db)


@router.get("/nodes/{node_id}/logs", response_model=SyncLogListResponse)
def read_sync_node_logs(
    node_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    logs, total = get_sync_node_logs(db, node_id, skip=skip, limit=pageSize)
    return {"list": logs, "total": total}
