from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import User, GuideRoute, HeatPoint, GuideContent, RecordStatusEnum, RoleEnum
from ...core.security import get_current_user, require_roles
from ...core.audit import log_create, log_update_fields, log_status_change, log_verify
from ...schemas import (
    GuideRouteCreate,
    GuideRouteUpdate,
    GuideRouteResponse,
    HeatPointCreate,
    HeatPointUpdate,
    HeatPointResponse,
    GuideContentCreate,
    GuideContentUpdate,
    GuideContentResponse,
    Pagination,
    Message,
    BatchUpdateRequest,
)


router = APIRouter(prefix="/guide", tags=["导览管理"])


# ========== 导览路线 ==========
@router.get("/routes", response_model=Pagination[GuideRouteResponse])
def list_routes(
    page: int = 1,
    page_size: int = 20,
    status: Optional[RecordStatusEnum] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(GuideRoute)
    if status:
        query = query.filter(GuideRoute.status == status)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.filter(
            (GuideRoute.name.ilike(pattern)) |
            (GuideRoute.code.ilike(pattern))
        )
    total = query.count()
    items = query.order_by(GuideRoute.sort_order, GuideRoute.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/routes", response_model=GuideRouteResponse, status_code=201)
def create_route(
    route_in: GuideRouteCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    if db.query(GuideRoute).filter(GuideRoute.code == route_in.code).first():
        raise HTTPException(status_code=400, detail="路线编码已存在")
    route = GuideRoute(**route_in.model_dump(), created_by=current_user.id)
    db.add(route)
    db.flush()
    log_create(db, current_user, "guide_route", route.id)
    db.commit()
    db.refresh(route)
    return route


@router.get("/routes/{route_id}", response_model=GuideRouteResponse)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    route = db.query(GuideRoute).filter(GuideRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="导览路线不存在")
    return route


@router.put("/routes/{route_id}", response_model=GuideRouteResponse)
def update_route(
    route_id: int,
    route_in: GuideRouteUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    route = db.query(GuideRoute).filter(GuideRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="导览路线不存在")
    old_data = {c.name: getattr(route, c.name) for c in route.__table__.columns}
    update_data = route_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(route, key, value)
    log_update_fields(db, current_user, "guide_route", route_id, old_data, update_data)
    db.commit()
    db.refresh(route)
    return route


@router.post("/routes/{route_id}/approve", response_model=Message)
def approve_route(
    route_id: int,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    route = db.query(GuideRoute).filter(GuideRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="导览路线不存在")
    old_status = route.status.value
    route.status = RecordStatusEnum.APPROVED
    log_status_change(db, current_user, "guide_route", route_id, old_status, "approved", "approve")
    db.commit()
    return Message(message="审核通过")


# ========== 热力点位 ==========
@router.get("/heat-points", response_model=Pagination[HeatPointResponse])
def list_heat_points(
    page: int = 1,
    page_size: int = 50,
    route_id: Optional[int] = None,
    status: Optional[RecordStatusEnum] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HeatPoint)
    if route_id:
        query = query.filter(HeatPoint.route_id == route_id)
    if status:
        query = query.filter(HeatPoint.status == status)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.filter(
            (HeatPoint.name.ilike(pattern)) |
            (HeatPoint.code.ilike(pattern))
        )
    total = query.count()
    items = query.order_by(HeatPoint.sort_order, HeatPoint.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/heat-points", response_model=HeatPointResponse, status_code=201)
def create_heat_point(
    hp_in: HeatPointCreate,
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    hp = HeatPoint(**hp_in.model_dump(), created_by=current_user.id)
    db.add(hp)
    db.flush()
    log_create(db, current_user, "heat_point", hp.id)
    db.commit()
    db.refresh(hp)
    return hp


@router.put("/heat-points/{hp_id}", response_model=HeatPointResponse)
def update_heat_point(
    hp_id: int,
    hp_in: HeatPointUpdate,
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    hp = db.query(HeatPoint).filter(HeatPoint.id == hp_id).first()
    if not hp:
        raise HTTPException(status_code=404, detail="热力点位不存在")
    old_data = {c.name: getattr(hp, c.name) for c in hp.__table__.columns}
    update_data = hp_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(hp, key, value)
    log_update_fields(db, current_user, "heat_point", hp_id, old_data, update_data)
    db.commit()
    db.refresh(hp)
    return hp


@router.post("/heat-points/{hp_id}/verify", response_model=Message)
def verify_heat_point(
    hp_id: int,
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    hp = db.query(HeatPoint).filter(HeatPoint.id == hp_id).first()
    if not hp:
        raise HTTPException(status_code=404, detail="热力点位不存在")
    hp.verified_at = datetime.utcnow()
    hp.verified_by = current_user.id
    hp.status = RecordStatusEnum.APPROVED
    log_verify(db, current_user, "heat_point", hp_id)
    db.commit()
    return Message(message="点位复核完成")


@router.post("/heat-points/batch-update", response_model=Message)
def batch_update_heat_points(
    data: BatchUpdateRequest,
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from ...tasks import batch_update_heat_points_task
    task = batch_update_heat_points_task.delay(data.ids, data.updates, current_user.id, data.remarks)
    return Message(message=f"批量更新任务已提交: {task.id}")


# ========== 导览内容 ==========
@router.get("/contents", response_model=Pagination[GuideContentResponse])
def list_contents(
    page: int = 1,
    page_size: int = 20,
    route_id: Optional[int] = None,
    content_type: Optional[str] = None,
    status: Optional[RecordStatusEnum] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(GuideContent)
    if route_id:
        query = query.filter(GuideContent.route_id == route_id)
    if content_type:
        query = query.filter(GuideContent.content_type == content_type)
    if status:
        query = query.filter(GuideContent.status == status)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.filter(GuideContent.title.ilike(pattern))
    total = query.count()
    items = query.order_by(GuideContent.sort_order, GuideContent.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/contents", response_model=GuideContentResponse, status_code=201)
def create_content(
    content_in: GuideContentCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    content = GuideContent(**content_in.model_dump(), created_by=current_user.id)
    db.add(content)
    db.flush()
    log_create(db, current_user, "guide_content", content.id)
    db.commit()
    db.refresh(content)
    return content


@router.put("/contents/{content_id}", response_model=GuideContentResponse)
def update_content(
    content_id: int,
    content_in: GuideContentUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    content = db.query(GuideContent).filter(GuideContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="导览内容不存在")
    old_data = {c.name: getattr(content, c.name) for c in content.__table__.columns}
    update_data = content_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(content, key, value)
    log_update_fields(db, current_user, "guide_content", content_id, old_data, update_data)
    db.commit()
    db.refresh(content)
    return content


@router.post("/contents/{content_id}/verify", response_model=Message)
def verify_content(
    content_id: int,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    content = db.query(GuideContent).filter(GuideContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="导览内容不存在")
    content.verified_at = datetime.utcnow()
    content.verified_by = current_user.id
    content.status = RecordStatusEnum.APPROVED
    log_verify(db, current_user, "guide_content", content_id)
    db.commit()
    return Message(message="内容复核完成")


@router.post("/contents/batch-update", response_model=Message)
def batch_update_content(
    data: BatchUpdateRequest,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from ...tasks import batch_update_content_task
    task = batch_update_content_task.delay(data.ids, data.updates, current_user.id, data.remarks)
    return Message(message=f"批量更新任务已提交: {task.id}")
