from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import ApprovalNode, ApprovalRecord, Bill
from ..schemas import (
    ApprovalNodeCreate,
    ApprovalNodeUpdate,
    ApprovalNodeResponse,
    ApprovalRecordCreate,
    ApprovalRecordUpdate,
    ApprovalRecordResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..utils.timeline import create_timeline

router = APIRouter(prefix="/api/approval", tags=["审批管理"])


@router.post("/nodes", response_model=ApprovalNodeResponse, status_code=status.HTTP_201_CREATED)
def create_approval_node(node: ApprovalNodeCreate, db: Session = Depends(get_db)):
    existing = db.query(ApprovalNode).filter(ApprovalNode.node_code == node.node_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"节点编码 {node.node_code} 已存在")

    db_node = ApprovalNode(**node.model_dump())
    db.add(db_node)
    db.commit()
    db.refresh(db_node)

    return db_node


@router.get("/nodes", response_model=PaginatedResponse[ApprovalNodeResponse])
def get_approval_nodes(
    pagination: PaginationParams = Depends(),
    is_active: Optional[int] = None,
    approver_role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ApprovalNode)

    if pagination.keyword:
        query = query.filter(
            or_(
                ApprovalNode.node_name.contains(pagination.keyword),
                ApprovalNode.node_code.contains(pagination.keyword),
            )
        )
    if is_active is not None:
        query = query.filter(ApprovalNode.is_active == is_active)
    if approver_role:
        query = query.filter(ApprovalNode.approver_role == approver_role)

    total = query.count()
    items = (
        query.order_by(ApprovalNode.sort_order.asc(), ApprovalNode.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/nodes/{node_id}", response_model=ApprovalNodeResponse)
def get_approval_node(node_id: int, db: Session = Depends(get_db)):
    node = db.query(ApprovalNode).filter(ApprovalNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="审批节点不存在")
    return node


@router.put("/nodes/{node_id}", response_model=ApprovalNodeResponse)
def update_approval_node(
    node_id: int,
    node_update: ApprovalNodeUpdate,
    db: Session = Depends(get_db),
):
    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="审批节点不存在")

    update_data = node_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_node, key, value)

    db.commit()
    db.refresh(db_node)

    return db_node


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_approval_node(node_id: int, db: Session = Depends(get_db)):
    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="审批节点不存在")

    records = db.query(ApprovalRecord).filter(ApprovalRecord.node_id == node_id).first()
    if records:
        raise HTTPException(status_code=400, detail="该节点已有审批记录，无法删除")

    db.delete(db_node)
    db.commit()

    return None


@router.post("/records", response_model=ApprovalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_approval_record(record: ApprovalRecordCreate, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == record.bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail=f"单据ID {record.bill_id} 不存在")

    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == record.node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail=f"审批节点ID {record.node_id} 不存在")

    db_record = ApprovalRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    create_timeline(
        db=db,
        operation_type="submit_approval",
        status=db_bill.status,
        bill_id=db_bill.id,
        contract_id=db_bill.contract_id,
        remark=f"提交审批到节点: {db_node.node_name}",
    )

    return db_record


@router.get("/records", response_model=PaginatedResponse[ApprovalRecordResponse])
def get_approval_records(
    pagination: PaginationParams = Depends(),
    bill_id: Optional[int] = None,
    node_id: Optional[int] = None,
    approver_id: Optional[int] = None,
    approval_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ApprovalRecord)

    if pagination.keyword:
        query = query.filter(ApprovalRecord.approval_opinion.contains(pagination.keyword))
    if bill_id:
        query = query.filter(ApprovalRecord.bill_id == bill_id)
    if node_id:
        query = query.filter(ApprovalRecord.node_id == node_id)
    if approver_id:
        query = query.filter(ApprovalRecord.approver_id == approver_id)
    if approval_status:
        query = query.filter(ApprovalRecord.approval_status == approval_status)
    if pagination.start_date:
        query = query.filter(ApprovalRecord.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(ApprovalRecord.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(ApprovalRecord.sort_order.asc(), ApprovalRecord.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/records/{record_id}", response_model=ApprovalRecordResponse)
def get_approval_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ApprovalRecord).filter(ApprovalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="审批记录不存在")
    return record


@router.put("/records/{record_id}", response_model=ApprovalRecordResponse)
def update_approval_record(
    record_id: int,
    record_update: ApprovalRecordUpdate,
    db: Session = Depends(get_db),
):
    db_record = db.query(ApprovalRecord).filter(ApprovalRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="审批记录不存在")

    if db_record.approval_status in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="该审批记录已处理，无法修改")

    update_data = record_update.model_dump(exclude_unset=True)

    if "approval_status" in update_data and update_data["approval_status"] in ["approved", "rejected"]:
        update_data["approved_at"] = datetime.now()

    for key, value in update_data.items():
        setattr(db_record, key, value)

    db.commit()
    db.refresh(db_record)

    db_bill = db.query(Bill).filter(Bill.id == db_record.bill_id).first()
    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == db_record.node_id).first()

    if "approval_status" in update_data:
        create_timeline(
            db=db,
            operation_type="approval",
            status=db_bill.status,
            bill_id=db_bill.id,
            contract_id=db_bill.contract_id,
            remark=f"审批节点 {db_node.node_name}: {update_data['approval_status']}",
        )

    return db_record


@router.post("/records/{record_id}/approve", response_model=ApprovalRecordResponse)
def approve_record(
    record_id: int,
    approval_opinion: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    db_record = db.query(ApprovalRecord).filter(ApprovalRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="审批记录不存在")

    if db_record.approval_status in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="该审批记录已处理，无法重复审批")

    db_record.approval_status = "approved"
    db_record.approval_opinion = approval_opinion or "同意"
    db_record.approved_at = datetime.now()

    db.commit()
    db.refresh(db_record)

    db_bill = db.query(Bill).filter(Bill.id == db_record.bill_id).first()
    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == db_record.node_id).first()

    create_timeline(
        db=db,
        operation_type="approve",
        status=db_bill.status,
        bill_id=db_bill.id,
        contract_id=db_bill.contract_id,
        remark=f"审批通过: {db_node.node_name}",
    )

    return db_record


@router.post("/records/{record_id}/reject", response_model=ApprovalRecordResponse)
def reject_record(
    record_id: int,
    approval_opinion: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    db_record = db.query(ApprovalRecord).filter(ApprovalRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="审批记录不存在")

    if db_record.approval_status in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="该审批记录已处理，无法重复审批")

    db_record.approval_status = "rejected"
    db_record.approval_opinion = approval_opinion or "驳回"
    db_record.approved_at = datetime.now()

    db.commit()
    db.refresh(db_record)

    db_bill = db.query(Bill).filter(Bill.id == db_record.bill_id).first()
    db_node = db.query(ApprovalNode).filter(ApprovalNode.id == db_record.node_id).first()

    create_timeline(
        db=db,
        operation_type="reject",
        status=db_bill.status,
        bill_id=db_bill.id,
        contract_id=db_bill.contract_id,
        remark=f"审批驳回: {db_node.node_name}",
    )

    return db_record


@router.get("/bill/{bill_id}/records", response_model=List[ApprovalRecordResponse])
def get_bill_approval_records(
    bill_id: int,
    approval_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    query = db.query(ApprovalRecord).filter(ApprovalRecord.bill_id == bill_id)
    if approval_status:
        query = query.filter(ApprovalRecord.approval_status == approval_status)

    return query.order_by(ApprovalRecord.sort_order.asc(), ApprovalRecord.created_at.desc()).all()
