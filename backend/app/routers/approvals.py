from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user, require_roles
from ..models.approval import ApprovalNode, ApprovalStatus
from ..models.quote import Quote, QuoteStatus
from ..models.user import User, UserRole
from ..schemas.approval import (
    ApprovalAction,
    ApprovalFlowCreate,
    ApprovalNodeCreate,
    ApprovalNodeResponse,
    ApprovalNodeUpdate,
    BatchApprovalAction,
)
from ..schemas.base import PaginatedResponse, SuccessResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ApprovalNodeResponse])
async def list_approvals(
    quote_id: Optional[str] = None,
    approver_id: Optional[str] = None,
    status: Optional[ApprovalStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApprovalNode)

    if current_user.role == UserRole.LAWYER:
        stmt = stmt.where(ApprovalNode.approver_id == current_user.id)

    if quote_id:
        stmt = stmt.where(ApprovalNode.quote_id == quote_id)
    if approver_id:
        stmt = stmt.where(ApprovalNode.approver_id == approver_id)
    if status:
        stmt = stmt.where(ApprovalNode.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(ApprovalNode.node_order, ApprovalNode.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    nodes = result.scalars().all()

    enriched = []
    for node in nodes:
        approver = await db.get(User, node.approver_id)
        resp = ApprovalNodeResponse.model_validate(node)
        resp.approver_name = approver.full_name if approver else None
        enriched.append(resp)

    return PaginatedResponse(
        items=enriched,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/flow", response_model=SuccessResponse)
async def create_approval_flow(
    req: ApprovalFlowCreate,
    current_user: User = Depends(require_roles(UserRole.PARTNER, UserRole.ASSISTANT)),
    db: AsyncSession = Depends(get_db),
):
    quote = await db.get(Quote, req.quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    for node_data in req.nodes:
        node = ApprovalNode(
            quote_id=node_data.quote_id,
            approver_id=node_data.approver_id,
            node_order=node_data.node_order,
            node_name=node_data.node_name,
            required_role=node_data.required_role,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(node)

    quote.status = QuoteStatus.APPROVING
    quote.updated_by = current_user.id
    quote.updated_at = datetime.utcnow()

    await db.commit()
    return SuccessResponse(message="审批流程创建成功")


@router.post("", response_model=ApprovalNodeResponse)
async def create_approval_node(
    req: ApprovalNodeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    node = ApprovalNode(
        quote_id=req.quote_id,
        approver_id=req.approver_id,
        node_order=req.node_order,
        node_name=req.node_name,
        required_role=req.required_role,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)
    approver = await db.get(User, node.approver_id)
    resp = ApprovalNodeResponse.model_validate(node)
    resp.approver_name = approver.full_name if approver else None
    return resp


@router.post("/{node_id}/action", response_model=ApprovalNodeResponse)
async def approve_or_reject(
    node_id: str,
    req: ApprovalAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    node = await db.get(ApprovalNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="审批节点不存在")

    if node.approver_id != current_user.id and current_user.role not in (UserRole.PARTNER,):
        raise HTTPException(status_code=403, detail="无权审批此节点")

    node.status = req.status
    node.comment = req.comment
    node.updated_by = current_user.id
    node.updated_at = datetime.utcnow()

    if req.status == ApprovalStatus.APPROVED:
        node.approved_at = datetime.utcnow()

        result = await db.execute(
            select(ApprovalNode)
            .where(ApprovalNode.quote_id == node.quote_id, ApprovalNode.is_active == True)
            .order_by(ApprovalNode.node_order)
        )
        all_nodes = result.scalars().all()
        all_approved = all(n.status == ApprovalStatus.APPROVED for n in all_nodes)

        if all_approved:
            quote = await db.get(Quote, node.quote_id)
            if quote:
                quote.status = QuoteStatus.APPROVED
                quote.updated_by = current_user.id
                quote.updated_at = datetime.utcnow()

    elif req.status == ApprovalStatus.REJECTED:
        quote = await db.get(Quote, node.quote_id)
        if quote:
            quote.status = QuoteStatus.REJECTED
            quote.updated_by = current_user.id
            quote.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(node)
    approver = await db.get(User, node.approver_id)
    resp = ApprovalNodeResponse.model_validate(node)
    resp.approver_name = approver.full_name if approver else None
    return resp


@router.post("/batch/action", response_model=SuccessResponse)
async def batch_approval_action(
    req: BatchApprovalAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApprovalNode).where(
            ApprovalNode.id.in_(req.node_ids),
            ApprovalNode.approver_id == current_user.id,
        )
    )
    nodes = result.scalars().all()

    for node in nodes:
        node.status = req.status
        node.comment = req.comment
        node.updated_by = current_user.id
        node.updated_at = datetime.utcnow()
        if req.status == ApprovalStatus.APPROVED:
            node.approved_at = datetime.utcnow()

    await db.commit()
    return SuccessResponse(message=f"批量审批成功，共 {len(nodes)} 条")


@router.put("/{node_id}", response_model=ApprovalNodeResponse)
async def update_approval_node(
    node_id: str,
    req: ApprovalNodeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    node = await db.get(ApprovalNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="审批节点不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(node, field, value)
    node.updated_by = current_user.id
    node.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(node)

    approver = await db.get(User, node.approver_id)
    resp = ApprovalNodeResponse.model_validate(node)
    resp.approver_name = approver.full_name if approver else None
    return resp


@router.delete("/{node_id}", response_model=SuccessResponse)
async def delete_approval_node(
    node_id: str,
    current_user: User = Depends(require_roles(UserRole.PARTNER, UserRole.ASSISTANT)),
    db: AsyncSession = Depends(get_db),
):
    node = await db.get(ApprovalNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="审批节点不存在")
    await db.delete(node)
    await db.commit()
    return SuccessResponse(message="删除成功")
