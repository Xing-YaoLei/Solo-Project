from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.usage_rule import UsageRule
from app.models.inventory_threshold import InventoryThreshold
from app.schemas.usage_rule import (
    UsageRuleCreate,
    UsageRuleUpdate,
    UsageRuleResponse,
)
from app.schemas.inventory_threshold import (
    InventoryThresholdCreate,
    InventoryThresholdUpdate,
    InventoryThresholdResponse,
)
from app.schemas.common import (
    PaginatedResponse,
    SuccessResponse,
)
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter(prefix="/rules", tags=["规则配置"])


@router.get("/usage", response_model=PaginatedResponse[UsageRuleResponse], summary="获取领用规则列表")
def get_usage_rules(
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    requires_approval: Optional[bool] = Query(None, description="是否需要审批"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(UsageRule)

    if keyword:
        query = query.filter(UsageRule.material_category.contains(keyword))
    if requires_approval is not None:
        query = query.filter(UsageRule.requires_approval == requires_approval)

    query = query.order_by(UsageRule.id.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[UsageRuleResponse](
        items=[UsageRuleResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/usage/{rule_id}", response_model=UsageRuleResponse, summary="获取领用规则详情")
def get_usage_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rule = db.query(UsageRule).filter(UsageRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="领用规则不存在",
        )
    return UsageRuleResponse.model_validate(rule)


@router.post("/usage", response_model=UsageRuleResponse, summary="创建领用规则")
def create_usage_rule(
    request: UsageRuleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    existing = db.query(UsageRule).filter(
        UsageRule.material_category == request.material_category
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该物料分类已有领用规则",
        )

    db_rule = UsageRule(**request.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return UsageRuleResponse.model_validate(db_rule)


@router.put("/usage/{rule_id}", response_model=UsageRuleResponse, summary="更新领用规则")
def update_usage_rule(
    rule_id: int,
    request: UsageRuleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    rule = db.query(UsageRule).filter(UsageRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="领用规则不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return UsageRuleResponse.model_validate(rule)


@router.delete("/usage/{rule_id}", response_model=SuccessResponse, summary="删除领用规则")
def delete_usage_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    rule = db.query(UsageRule).filter(UsageRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="领用规则不存在",
        )

    db.delete(rule)
    db.commit()
    return SuccessResponse(message="删除成功")


@router.get("/threshold", response_model=PaginatedResponse[InventoryThresholdResponse], summary="获取盘点阈值列表")
def get_inventory_thresholds(
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(InventoryThreshold)

    if keyword:
        query = query.filter(InventoryThreshold.material_category.contains(keyword))

    query = query.order_by(InventoryThreshold.id.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[InventoryThresholdResponse](
        items=[InventoryThresholdResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/threshold/{threshold_id}", response_model=InventoryThresholdResponse, summary="获取盘点阈值详情")
def get_inventory_threshold(
    threshold_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    threshold = db.query(InventoryThreshold).filter(InventoryThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="盘点阈值不存在",
        )
    return InventoryThresholdResponse.model_validate(threshold)


@router.post("/threshold", response_model=InventoryThresholdResponse, summary="创建盘点阈值")
def create_inventory_threshold(
    request: InventoryThresholdCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    existing = db.query(InventoryThreshold).filter(
        InventoryThreshold.material_category == request.material_category
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该物料分类已有盘点阈值",
        )

    db_threshold = InventoryThreshold(**request.model_dump())
    db.add(db_threshold)
    db.commit()
    db.refresh(db_threshold)
    return InventoryThresholdResponse.model_validate(db_threshold)


@router.put("/threshold/{threshold_id}", response_model=InventoryThresholdResponse, summary="更新盘点阈值")
def update_inventory_threshold(
    threshold_id: int,
    request: InventoryThresholdUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    threshold = db.query(InventoryThreshold).filter(InventoryThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="盘点阈值不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(threshold, key, value)

    db.commit()
    db.refresh(threshold)
    return InventoryThresholdResponse.model_validate(threshold)


@router.delete("/threshold/{threshold_id}", response_model=SuccessResponse, summary="删除盘点阈值")
def delete_inventory_threshold(
    threshold_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    threshold = db.query(InventoryThreshold).filter(InventoryThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="盘点阈值不存在",
        )

    db.delete(threshold)
    db.commit()
    return SuccessResponse(message="删除成功")
