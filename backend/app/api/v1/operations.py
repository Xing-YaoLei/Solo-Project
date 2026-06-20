from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import User, Performance, PerformanceSession, Seat, Merchant, MerchantContract, RecordStatusEnum, RoleEnum, ExceptionTypeEnum, ExceptionRecord
from ...core.security import get_current_user, require_roles
from ...core.audit import log_create, log_update_fields, log_status_change, log_verify
from ...schemas import (
    PerformanceCreate, PerformanceUpdate, PerformanceResponse,
    PerformanceSessionCreate, PerformanceSessionUpdate, PerformanceSessionResponse,
    SeatCreate, SeatUpdate, SeatResponse, SeatBatchCreate,
    MerchantCreate, MerchantUpdate, MerchantResponse,
    MerchantContractCreate, MerchantContractUpdate, MerchantContractResponse,
    ExceptionRecordCreate, ExceptionRecordUpdate, ExceptionRecordResponse,
    Pagination, Message, BatchUpdateRequest,
)


router = APIRouter(prefix="/operations", tags=["运营管理"])


# ========== 演出 ==========
@router.get("/performances", response_model=Pagination[PerformanceResponse])
def list_performances(
    page: int = 1, page_size: int = 20,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Performance)
    if keyword:
        query = query.filter(Performance.name.ilike(f"%{keyword}%"))
    total = query.count()
    items = query.order_by(Performance.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/performances", response_model=PerformanceResponse, status_code=201)
def create_performance(
    p_in: PerformanceCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    if db.query(Performance).filter(Performance.code == p_in.code).first():
        raise HTTPException(status_code=400, detail="演出编码已存在")
    p = Performance(**p_in.model_dump(), created_by=current_user.id)
    db.add(p)
    db.flush()
    log_create(db, current_user, "performance", p.id)
    db.commit()
    db.refresh(p)
    return p


@router.put("/performances/{pid}", response_model=PerformanceResponse)
def update_performance(
    pid: int, p_in: PerformanceUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    p = db.query(Performance).filter(Performance.id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="演出不存在")
    old_data = {c.name: getattr(p, c.name) for c in p.__table__.columns}
    for k, v in p_in.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    log_update_fields(db, current_user, "performance", pid, old_data, p_in.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(p)
    return p


# ========== 演出场次 ==========
@router.get("/sessions", response_model=Pagination[PerformanceSessionResponse])
def list_sessions(
    page: int = 1, page_size: int = 20,
    performance_id: Optional[int] = None,
    status: Optional[RecordStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PerformanceSession)
    if performance_id:
        query = query.filter(PerformanceSession.performance_id == performance_id)
    if status:
        query = query.filter(PerformanceSession.status == status)
    total = query.count()
    items = query.order_by(PerformanceSession.start_time.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/sessions", response_model=PerformanceSessionResponse, status_code=201)
def create_session(
    s_in: PerformanceSessionCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    s = PerformanceSession(**s_in.model_dump(), created_by=current_user.id)
    db.add(s)
    db.flush()
    log_create(db, current_user, "performance_session", s.id)
    db.commit()
    db.refresh(s)
    return s


@router.put("/sessions/{sid}", response_model=PerformanceSessionResponse)
def update_session(
    sid: int, s_in: PerformanceSessionUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    s = db.query(PerformanceSession).filter(PerformanceSession.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="场次不存在")
    old_data = {c.name: getattr(s, c.name) for c in s.__table__.columns}
    for k, v in s_in.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    log_update_fields(db, current_user, "performance_session", sid, old_data, s_in.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(s)
    return s


# ========== 座位 ==========
@router.get("/seats", response_model=Pagination[SeatResponse])
def list_seats(
    page: int = 1, page_size: int = 100,
    session_id: Optional[int] = None,
    zone: Optional[str] = None,
    is_available: Optional[bool] = None,
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Seat)
    if session_id:
        query = query.filter(Seat.session_id == session_id)
    if zone:
        query = query.filter(Seat.zone == zone)
    if is_available is not None:
        query = query.filter(Seat.is_available == is_available)
    if is_verified is not None:
        query = query.filter(Seat.is_verified == is_verified)
    total = query.count()
    items = query.order_by(Seat.row, Seat.number).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/seats", response_model=SeatResponse, status_code=201)
def create_seat(
    seat_in: SeatCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
    db: Session = Depends(get_db),
):
    seat = Seat(**seat_in.model_dump())
    db.add(seat)
    db.flush()
    log_create(db, current_user, "seat", seat.id)
    db.commit()
    db.refresh(seat)
    return seat


@router.post("/seats/batch-create", response_model=Message)
def batch_create_seats(
    batch_in: SeatBatchCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
    db: Session = Depends(get_db),
):
    session = db.query(PerformanceSession).filter(PerformanceSession.id == batch_in.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="场次不存在")
    created_count = 0
    for row in batch_in.rows:
        for n in range(1, batch_in.numbers_per_row + 1):
            seat = Seat(
                session_id=batch_in.session_id,
                row=row,
                number=str(n),
                zone=batch_in.zone,
                price=batch_in.price,
            )
            db.add(seat)
            created_count += 1
    session.total_seats += created_count
    db.flush()
    log_create(db, current_user, "seat", 0, f"批量创建{created_count}个座位")
    db.commit()
    return Message(message=f"成功创建 {created_count} 个座位")


@router.post("/seats/{seat_id}/verify", response_model=Message)
def verify_seat(
    seat_id: int,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
    db: Session = Depends(get_db),
):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="座位不存在")
    seat.is_verified = True
    seat.verified_at = datetime.utcnow()
    seat.verified_by = current_user.id
    log_verify(db, current_user, "seat", seat_id)
    db.commit()
    return Message(message="座位复核完成")


@router.post("/seats/batch-update", response_model=Message)
def batch_update_seats(
    data: BatchUpdateRequest,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
    db: Session = Depends(get_db),
):
    from ...tasks import batch_update_seats_task
    task = batch_update_seats_task.delay(data.ids, data.updates, current_user.id, data.remarks)
    return Message(message=f"批量更新任务已提交: {task.id}")


# ========== 商户 ==========
@router.get("/merchants", response_model=Pagination[MerchantResponse])
def list_merchants(
    page: int = 1, page_size: int = 20,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Merchant)
    if category:
        query = query.filter(Merchant.category == category)
    if keyword:
        query = query.filter(Merchant.name.ilike(f"%{keyword}%"))
    total = query.count()
    items = query.order_by(Merchant.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/merchants", response_model=MerchantResponse, status_code=201)
def create_merchant(
    m_in: MerchantCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    m = Merchant(**m_in.model_dump(), created_by=current_user.id)
    db.add(m)
    db.flush()
    log_create(db, current_user, "merchant", m.id)
    db.commit()
    db.refresh(m)
    return m


@router.put("/merchants/{mid}", response_model=MerchantResponse)
def update_merchant(
    mid: int, m_in: MerchantUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    m = db.query(Merchant).filter(Merchant.id == mid).first()
    if not m:
        raise HTTPException(status_code=404, detail="商户不存在")
    old_data = {c.name: getattr(m, c.name) for c in m.__table__.columns}
    for k, v in m_in.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    log_update_fields(db, current_user, "merchant", mid, old_data, m_in.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(m)
    return m


# ========== 商户合同 ==========
@router.get("/contracts", response_model=Pagination[MerchantContractResponse])
def list_contracts(
    page: int = 1, page_size: int = 20,
    merchant_id: Optional[int] = None,
    status: Optional[RecordStatusEnum] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MerchantContract)
    if merchant_id:
        query = query.filter(MerchantContract.merchant_id == merchant_id)
    if status:
        query = query.filter(MerchantContract.status == status)
    if keyword:
        query = query.filter(
            (MerchantContract.title.ilike(f"%{keyword}%")) |
            (MerchantContract.contract_no.ilike(f"%{keyword}%"))
        )
    total = query.count()
    items = query.order_by(MerchantContract.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/contracts", response_model=MerchantContractResponse, status_code=201)
def create_contract(
    c_in: MerchantContractCreate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    if db.query(MerchantContract).filter(MerchantContract.contract_no == c_in.contract_no).first():
        raise HTTPException(status_code=400, detail="合同编号已存在")
    c = MerchantContract(**c_in.model_dump(), created_by=current_user.id)
    db.add(c)
    db.flush()
    log_create(db, current_user, "merchant_contract", c.id)
    db.commit()
    db.refresh(c)
    return c


@router.put("/contracts/{cid}", response_model=MerchantContractResponse)
def update_contract(
    cid: int, c_in: MerchantContractUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    contract = db.query(MerchantContract).filter(MerchantContract.id == cid).first()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    update_data = c_in.model_dump(exclude_unset=True)
    if "contract_no" in update_data and update_data["contract_no"] != contract.contract_no:
        if db.query(MerchantContract).filter(
            MerchantContract.contract_no == update_data["contract_no"],
            MerchantContract.id != cid,
        ).first():
            raise HTTPException(status_code=400, detail="合同编号已存在")
    old_data = {col.name: getattr(contract, col.name) for col in contract.__table__.columns}
    for k, v in update_data.items():
        setattr(contract, k, v)
    log_update_fields(db, current_user, "merchant_contract", cid, old_data, update_data)
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/contracts/{cid}/verify", response_model=Message)
def verify_contract(
    cid: int,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    c = db.query(MerchantContract).filter(MerchantContract.id == cid).first()
    if not c:
        raise HTTPException(status_code=404, detail="合同不存在")
    c.verified_at = datetime.utcnow()
    c.verified_by = current_user.id
    c.status = RecordStatusEnum.APPROVED
    log_verify(db, current_user, "merchant_contract", cid)
    db.commit()
    return Message(message="合同复核完成")


@router.post("/contracts/batch-update", response_model=Message)
def batch_update_contracts(
    data: BatchUpdateRequest,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from ...tasks import batch_update_contracts_task
    task = batch_update_contracts_task.delay(data.ids, data.updates, current_user.id, data.remarks)
    return Message(message=f"批量更新任务已提交: {task.id}")


# ========== 异常记录 ==========
@router.get("/exceptions", response_model=Pagination[ExceptionRecordResponse])
def list_exceptions(
    page: int = 1, page_size: int = 20,
    exception_type: Optional[ExceptionTypeEnum] = None,
    related_type: Optional[str] = None,
    status: Optional[RecordStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
):
    query = db.query(ExceptionRecord)
    if exception_type:
        query = query.filter(ExceptionRecord.exception_type == exception_type)
    if related_type:
        query = query.filter(ExceptionRecord.related_type == related_type)
    if status:
        query = query.filter(ExceptionRecord.status == status)
    total = query.count()
    items = query.order_by(ExceptionRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/exceptions", response_model=ExceptionRecordResponse, status_code=201)
def create_exception(
    e_in: ExceptionRecordCreate,
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
    db: Session = Depends(get_db),
):
    e_data = e_in.model_dump(exclude_unset=True)
    if e_in.exception_type == ExceptionTypeEnum.PERFORMANCE_CANCEL and e_in.related_type == "performance_session" and e_in.related_id:
        session = db.query(PerformanceSession).filter(PerformanceSession.id == e_in.related_id).first()
        if session:
            old_status = session.status.value
            session.status = RecordStatusEnum.CANCELLED
            e_data["original_record_type"] = "performance_session"
            e_data["original_record_id"] = session.id
            log_status_change(db, current_user, "performance_session", session.id, old_status, "cancelled", "cancel", "演出取消")
    e = ExceptionRecord(**e_data, created_by=current_user.id)
    db.add(e)
    db.flush()
    log_create(db, current_user, "exception_record", e.id, f"创建异常记录: {e_in.exception_type.value}")
    db.commit()
    db.refresh(e)
    return e


@router.put("/exceptions/{eid}", response_model=ExceptionRecordResponse)
def update_exception(
    eid: int, e_in: ExceptionRecordUpdate,
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    e = db.query(ExceptionRecord).filter(ExceptionRecord.id == eid).first()
    if not e:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    old_data = {c.name: getattr(e, c.name) for c in e.__table__.columns}
    update_data = e_in.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == RecordStatusEnum.COMPLETED:
        update_data["resolved_at"] = datetime.utcnow()
        update_data["handled_by"] = current_user.id
    for k, v in update_data.items():
        setattr(e, k, v)
    log_update_fields(db, current_user, "exception_record", eid, old_data, update_data)
    db.commit()
    db.refresh(e)
    return e


@router.get("/exceptions/{eid}/original")
def get_exception_original(
    eid: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION, RoleEnum.TICKET_CLERK)),
):
    from ...models import GuideRoute, HeatPoint, GuideContent, Ticket

    e = db.query(ExceptionRecord).filter(ExceptionRecord.id == eid).first()
    if not e:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    if not e.original_record_type or not e.original_record_id:
        return {"has_original": False, "data": None}
    model_map = {
        "guide_route": GuideRoute,
        "heat_point": HeatPoint,
        "guide_content": GuideContent,
        "performance": Performance,
        "performance_session": PerformanceSession,
        "seat": Seat,
        "merchant": Merchant,
        "merchant_contract": MerchantContract,
        "ticket": Ticket,
    }
    model = model_map.get(e.original_record_type)
    data = None
    if model:
        obj = db.query(model).filter(model.id == e.original_record_id).first()
        if obj:
            data = {c.name: str(getattr(obj, c.name)) if getattr(obj, c.name) is not None else None for c in obj.__table__.columns}
    return {"has_original": True, "record_type": e.original_record_type, "record_id": e.original_record_id, "data": data}
