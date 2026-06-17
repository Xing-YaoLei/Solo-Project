from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.material_batch import MaterialBatch
from app.models.inventory_record import InventoryRecord
from app.models.safety_stock import SafetyStockConfig
from app.schemas.material_batch import (
    MaterialBatchCreate,
    MaterialBatchUpdate,
    MaterialBatchQueryParams,
    MaterialBatchResponse,
)
from app.schemas.inventory_record import (
    InventoryRecordCreate,
    InventoryRecordQueryParams,
    InventoryRecordResponse,
)
from app.schemas.safety_stock import (
    SafetyStockConfigCreate,
    SafetyStockConfigUpdate,
    SafetyStockConfigResponse,
)
from app.schemas.common import (
    PaginatedResponse,
    SuccessResponse,
)
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter(prefix="/inventory", tags=["库存管理"])

@router.get("/batches", response_model=PaginatedResponse[MaterialBatchResponse], summary="获取物料批次列表")
def get_material_batches(
    params: MaterialBatchQueryParams = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(MaterialBatch)

    if params.status:
        query = query.filter(MaterialBatch.status == params.status)
    if params.region:
        query = query.filter(MaterialBatch.region == params.region)
    if params.responsible_person:
        query = query.filter(MaterialBatch.responsible_person == params.responsible_person)
    if params.category:
        query = query.filter(MaterialBatch.category == params.category)
    if params.start_date:
        query = query.filter(MaterialBatch.in_date >= params.start_date)
    if params.end_date:
        query = query.filter(MaterialBatch.in_date <= params.end_date)
    if params.keyword:
        query = query.filter(
            MaterialBatch.material_name.contains(params.keyword) |
            MaterialBatch.batch_no.contains(params.keyword) |
            MaterialBatch.supplier_name.contains(params.keyword)
        )

    if params.sort_by:
        sort_column = getattr(MaterialBatch, params.sort_by, None)
        if sort_column is not None:
            if params.sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(MaterialBatch.id.desc())
    else:
        query = query.order_by(MaterialBatch.id.desc())

    total = query.count()
    items = query.offset(params.offset).limit(params.limit).all()

    total_pages = (total + params.page_size - 1) // params.page_size

    return PaginatedResponse[MaterialBatchResponse](
        items=[MaterialBatchResponse.model_validate(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
    )


@router.get("/batches/{batch_id}", response_model=MaterialBatchResponse, summary="获取物料批次详情")
def get_material_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="物料批次不存在",
        )
    return MaterialBatchResponse.model_validate(batch)


@router.post("/batches", response_model=MaterialBatchResponse, summary="创建物料批次")
def create_material_batch(
    request: MaterialBatchCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    db_batch = MaterialBatch(**request.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return MaterialBatchResponse.model_validate(db_batch)


@router.put("/batches/{batch_id}", response_model=MaterialBatchResponse, summary="更新物料批次")
def update_material_batch(
    batch_id: int,
    request: MaterialBatchUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="物料批次不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)

    db.commit()
    db.refresh(batch)
    return MaterialBatchResponse.model_validate(batch)


@router.delete("/batches/{batch_id}", response_model=SuccessResponse, summary="删除物料批次")
def delete_material_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="物料批次不存在",
        )

    db.delete(batch)
    db.commit()
    return SuccessResponse(message="删除成功")


@router.get("/records", response_model=PaginatedResponse[InventoryRecordResponse], summary="获取库存记录列表")
def get_inventory_records(
    params: InventoryRecordQueryParams = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(InventoryRecord)

    if params.batch_id:
        query = query.filter(InventoryRecord.batch_id == params.batch_id)
    if params.type:
        query = query.filter(InventoryRecord.type == params.type)
    if params.region:
        query = query.filter(InventoryRecord.region == params.region)
    if params.start_date:
        query = query.filter(InventoryRecord.created_at >= params.start_date)
    if params.end_date:
        query = query.filter(InventoryRecord.created_at <= params.end_date)
    if params.keyword:
        query = query.filter(
            InventoryRecord.operator.contains(params.keyword) |
            InventoryRecord.remark.contains(params.keyword)
        )

    query = query.order_by(InventoryRecord.created_at.desc())

    total = query.count()
    items = query.offset(params.offset).limit(params.limit).all()

    total_pages = (total + params.page_size - 1) // params.page_size

    return PaginatedResponse[InventoryRecordResponse](
        items=[InventoryRecordResponse.model_validate(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
    )


@router.post("/records", response_model=InventoryRecordResponse, summary="创建库存记录")
def create_inventory_record(
    request: InventoryRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == request.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="物料批次不存在",
        )

    record_data = request.model_dump()
    if not record_data.get("operator"):
        record_data["operator"] = current_user.full_name or current_user.username
    if not record_data.get("operator_id"):
        record_data["operator_id"] = current_user.id

    db_record = InventoryRecord(**record_data)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return InventoryRecordResponse.model_validate(db_record)


@router.get("/safety-stock", response_model=PaginatedResponse[SafetyStockConfigResponse], summary="获取安全库存配置列表")
def get_safety_stock_configs(
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    category: Optional[str] = Query(None, description="分类筛选"),
    region: Optional[str] = Query(None, description="区域筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(SafetyStockConfig)

    if keyword:
        query = query.filter(SafetyStockConfig.material_name.contains(keyword))
    if category:
        query = query.filter(SafetyStockConfig.category == category)
    if region:
        query = query.filter(SafetyStockConfig.region == region)

    query = query.order_by(SafetyStockConfig.id.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[SafetyStockConfigResponse](
        items=[SafetyStockConfigResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/safety-stock/{config_id}", response_model=SafetyStockConfigResponse, summary="获取安全库存配置详情")
def get_safety_stock_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    config = db.query(SafetyStockConfig).filter(SafetyStockConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="安全库存配置不存在",
        )
    return SafetyStockConfigResponse.model_validate(config)


@router.post("/safety-stock", response_model=SafetyStockConfigResponse, summary="创建安全库存配置")
def create_safety_stock_config(
    request: SafetyStockConfigCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    existing = db.query(SafetyStockConfig).filter(
        SafetyStockConfig.material_name == request.material_name,
        SafetyStockConfig.region == request.region
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该物料在该区域已有安全库存配置",
        )

    db_config = SafetyStockConfig(**request.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return SafetyStockConfigResponse.model_validate(db_config)


@router.put("/safety-stock/{config_id}", response_model=SafetyStockConfigResponse, summary="更新安全库存配置")
def update_safety_stock_config(
    config_id: int,
    request: SafetyStockConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    config = db.query(SafetyStockConfig).filter(SafetyStockConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="安全库存配置不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return SafetyStockConfigResponse.model_validate(config)


@router.delete("/safety-stock/{config_id}", response_model=SuccessResponse, summary="删除安全库存配置")
def delete_safety_stock_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    config = db.query(SafetyStockConfig).filter(SafetyStockConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="安全库存配置不存在",
        )

    db.delete(config)
    db.commit()
    return SuccessResponse(message="删除成功")
