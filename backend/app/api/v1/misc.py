from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, Date as SqlDate
import os
import uuid

from ...database import get_db
from ...models import (
    User, Ticket, SecondarySale, AuditLog, Attachment,
    RoleEnum, RecordStatusEnum, GuideRoute, PerformanceSession,
)
from ...core.security import get_current_user, require_roles
from ...core.audit import log_create, log_update_fields, log_audit, AuditActionEnum
from ...schemas import (
    TicketCreate, TicketUpdate, TicketResponse,
    SecondarySaleCreate, SecondarySaleUpdate, SecondarySaleResponse,
    AuditLogResponse, AttachmentResponse,
    Pagination, Message, TicketStatistics, DailyConversion,
    SecondarySaleStatistics,
)
from ...config import settings


router = APIRouter(tags=["其他"])


# ========== 票务 ==========
@router.get("/tickets", response_model=Pagination[TicketResponse])
def list_tickets(
    page: int = 1, page_size: int = 50,
    route_id: Optional[int] = None,
    status: Optional[RecordStatusEnum] = None,
    ticket_type: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION)),
):
    query = db.query(Ticket)
    if route_id:
        query = query.filter(Ticket.route_id == route_id)
    if status:
        query = query.filter(Ticket.status == status)
    if ticket_type:
        query = query.filter(Ticket.ticket_type == ticket_type)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.filter(
            (Ticket.ticket_no.ilike(pattern)) |
            (Ticket.buyer_name.ilike(pattern)) |
            (Ticket.buyer_phone.ilike(pattern))
        )
    total = query.count()
    items = query.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/tickets", response_model=TicketResponse, status_code=201)
def create_ticket(
    t_in: TicketCreate,
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    if db.query(Ticket).filter(Ticket.ticket_no == t_in.ticket_no).first():
        raise HTTPException(status_code=400, detail="票务号已存在")
    ticket = Ticket(
        **t_in.model_dump(exclude_unset=True),
        sold_at=datetime.utcnow(),
        sold_by=current_user.id,
    )
    db.add(ticket)
    db.flush()
    log_create(db, current_user, "ticket", ticket.id)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/tickets/{tid}", response_model=TicketResponse)
def update_ticket(
    tid: int, t_in: TicketUpdate,
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    t = db.query(Ticket).filter(Ticket.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="票务不存在")
    old_data = {c.name: getattr(t, c.name) for c in t.__table__.columns}
    for k, v in t_in.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    log_update_fields(db, current_user, "ticket", tid, old_data, t_in.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(t)
    return t


@router.post("/tickets/{tid}/use", response_model=Message)
def use_ticket(
    tid: int,
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION, RoleEnum.PATROL)),
    db: Session = Depends(get_db),
):
    t = db.query(Ticket).filter(Ticket.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="票务不存在")
    if t.status == RecordStatusEnum.COMPLETED:
        raise HTTPException(status_code=400, detail="票已核销")
    t.status = RecordStatusEnum.COMPLETED
    t.used_at = datetime.utcnow()
    log_audit(db, current_user, AuditActionEnum.UPDATE, "ticket", tid, "status", t.status.value, "completed", "核销门票")
    db.commit()
    return Message(message="核销成功")


# ========== 二消 ==========
@router.get("/secondary-sales", response_model=Pagination[SecondarySaleResponse])
def list_secondary_sales(
    page: int = 1, page_size: int = 50,
    ticket_id: Optional[int] = None,
    ticket_no: Optional[str] = None,
    item_category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION)),
):
    query = db.query(SecondarySale)
    if ticket_id:
        query = query.filter(SecondarySale.ticket_id == ticket_id)
    if ticket_no:
        query = query.filter(SecondarySale.ticket_no.ilike(f"%{ticket_no}%"))
    if item_category:
        query = query.filter(SecondarySale.item_category == item_category)
    if start_date:
        query = query.filter(cast(SecondarySale.sold_at, SqlDate) >= start_date)
    if end_date:
        query = query.filter(cast(SecondarySale.sold_at, SqlDate) <= end_date)
    total = query.count()
    items = query.order_by(SecondarySale.sold_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.post("/secondary-sales", response_model=SecondarySaleResponse, status_code=201)
def create_secondary_sale(
    s_in: SecondarySaleCreate,
    current_user: User = Depends(require_roles(RoleEnum.TICKET_CLERK, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    data = s_in.model_dump(exclude_unset=True)
    if "total_amount" not in data or data["total_amount"] is None:
        data["total_amount"] = data.get("quantity", 1) * data.get("unit_price", 0)
    sale = SecondarySale(
        **data,
        salesperson_id=current_user.id,
    )
    db.add(sale)
    db.flush()
    log_create(db, current_user, "secondary_sale", sale.id)
    db.commit()
    db.refresh(sale)
    return sale


# ========== 统计分析 ==========
@router.get("/statistics/tickets")
def get_ticket_statistics(
    start_date: date,
    end_date: date,
    group_by: str = "day",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
):
    if group_by not in ("day", "week", "month"):
        group_by = "day"

    date_col = cast(Ticket.created_at, SqlDate)
    query = db.query(
        date_col.label("date"),
        func.count(Ticket.id).label("total_tickets"),
        func.coalesce(func.sum(Ticket.price), 0).label("total_revenue"),
        func.sum(func.case((Ticket.status == RecordStatusEnum.COMPLETED, 1), else_=0)).label("used_tickets"),
    ).filter(
        and_(date_col >= start_date, date_col <= end_date)
    ).group_by(date_col).order_by(date_col)

    rows = query.all()
    results = []
    for row in rows:
        used = row.used_tickets or 0
        total = row.total_tickets or 0
        results.append(TicketStatistics(
            date=str(row.date),
            total_tickets=total,
            total_revenue=float(row.total_revenue or 0),
            used_tickets=used,
            utilization_rate=round(used / total, 4) if total > 0 else 0,
        ))
    return results


@router.get("/statistics/conversion")
def get_conversion_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
):
    date_col = cast(Ticket.created_at, SqlDate)

    subq = db.query(
        SecondarySale.ticket_id,
        func.count(SecondarySale.id).label("sale_count"),
        func.coalesce(func.sum(SecondarySale.total_amount), 0).label("sale_amount"),
    ).filter(
        and_(
            cast(SecondarySale.sold_at, SqlDate) >= start_date,
            cast(SecondarySale.sold_at, SqlDate) <= end_date,
        )
    ).group_by(SecondarySale.ticket_id).subquery()

    query = db.query(
        date_col.label("date"),
        func.count(Ticket.id).label("ticket_count"),
        func.count(subq.c.ticket_id).label("converted_count"),
        func.coalesce(func.sum(Ticket.price), 0).label("ticket_revenue"),
        func.coalesce(func.sum(subq.c.sale_amount), 0).label("secondary_revenue"),
        func.coalesce(func.sum(subq.c.sale_count), 0).label("secondary_items_count"),
    ).outerjoin(subq, subq.c.ticket_id == Ticket.id).filter(
        and_(date_col >= start_date, date_col <= end_date)
    ).group_by(date_col).order_by(date_col)

    rows = query.all()
    results = []
    for row in rows:
        tc = row.ticket_count or 0
        cc = row.converted_count or 0
        tr = float(row.ticket_revenue or 0)
        sr = float(row.secondary_revenue or 0)
        sic = row.secondary_items_count or 0
        results.append(DailyConversion(
            date=str(row.date),
            ticket_count=tc,
            secondary_conversion_rate=round(cc / tc, 4) if tc > 0 else 0,
            secondary_per_ticket=round(sr / tc, 2) if tc > 0 else 0,
            total_revenue=round(tr + sr, 2),
        ))
    return results


@router.get("/statistics/secondary-detail")
def get_secondary_sale_detail(
    start_date: date,
    end_date: date,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
):
    ticket_date_col = cast(Ticket.created_at, SqlDate)

    items_subq = db.query(
        SecondarySale.ticket_id,
        func.json_agg(
            func.json_build_object(
                "id", SecondarySale.id,
                "item", SecondarySale.item_name,
                "category", SecondarySale.item_category,
                "qty", SecondarySale.quantity,
                "price", SecondarySale.unit_price,
                "total", SecondarySale.total_amount,
                "at", cast(SecondarySale.sold_at, SqlDate),
            )
        ).label("items"),
        func.count(SecondarySale.id).label("s_count"),
        func.coalesce(func.sum(SecondarySale.total_amount), 0).label("s_total"),
    ).filter(
        and_(
            cast(SecondarySale.sold_at, SqlDate) >= start_date,
            cast(SecondarySale.sold_at, SqlDate) <= end_date,
        )
    ).group_by(SecondarySale.ticket_id).subquery()

    base = db.query(
        Ticket, items_subq.c.items, items_subq.c.s_count, items_subq.c.s_total, GuideRoute.name.label("route_name")
    ).outerjoin(items_subq, items_subq.c.ticket_id == Ticket.id
    ).outerjoin(GuideRoute, GuideRoute.id == Ticket.route_id
    ).filter(
        and_(ticket_date_col >= start_date, ticket_date_col <= end_date)
    ).filter(items_subq.c.ticket_id.isnot(None))

    total = base.count()
    rows = base.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for ticket, items, s_count, s_total, route_name in rows:
        results.append(SecondarySaleStatistics(
            ticket_no=ticket.ticket_no,
            ticket_id=ticket.id,
            buyer_name=ticket.buyer_name,
            route_name=route_name,
            secondary_count=int(s_count or 0),
            secondary_total=float(s_total or 0),
            items=items or [],
        ))
    return Pagination(
        items=results,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


# ========== 审计日志 ==========
@router.get("/audit-logs", response_model=Pagination[AuditLogResponse])
def list_audit_logs(
    page: int = 1, page_size: int = 50,
    record_type: Optional[str] = None,
    record_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION)),
):
    query = db.query(AuditLog)
    if record_type:
        query = query.filter(AuditLog.record_type == record_type)
    if record_id:
        query = query.filter(AuditLog.record_id == record_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if start_date:
        query = query.filter(cast(AuditLog.created_at, SqlDate) >= start_date)
    if end_date:
        query = query.filter(cast(AuditLog.created_at, SqlDate) <= end_date)
    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Pagination(items=items, total=total, page=page, page_size=page_size, total_pages=(total + page_size - 1) // page_size)


@router.get("/audit-logs/trace")
def trace_record_history(
    record_type: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog).filter(
        and_(AuditLog.record_type == record_type, AuditLog.record_id == record_id)
    ).order_by(AuditLog.created_at.asc())
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.full_name if log.user else None,
            "action": log.action.value,
            "field": log.field_name,
            "old": log.old_value,
            "new": log.new_value,
            "remarks": log.remarks,
            "at": log.created_at.isoformat(),
        }
        for log in query.all()
    ]


# ========== 附件上传 ==========
@router.post("/attachments/upload", response_model=list[AttachmentResponse])
async def upload_attachments(
    record_type: str = Form(...),
    record_id: int = Form(...),
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    results = []
    for file in files:
        ext = os.path.splitext(file.filename or "")[1]
        saved_name = f"{uuid.uuid4().hex}{ext}"
        saved_path = os.path.join(settings.UPLOAD_DIR, saved_name)
        content = await file.read()
        with open(saved_path, "wb") as f:
            f.write(content)
        att = Attachment(
            record_type=record_type,
            record_id=record_id,
            file_name=saved_name,
            original_name=file.filename,
            file_path=saved_path,
            file_size=len(content),
            mime_type=file.content_type,
            uploaded_by=current_user.id,
        )
        db.add(att)
        db.flush()
        log_create(db, current_user, "attachment", att.id, f"上传附件: {file.filename}")
        db.refresh(att)
        results.append(att)
    db.commit()
    return results


@router.get("/attachments")
def list_attachments(
    record_type: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    atts = db.query(Attachment).filter(
        and_(Attachment.record_type == record_type, Attachment.record_id == record_id)
    ).order_by(Attachment.created_at.desc()).all()
    return [AttachmentResponse.model_validate(a).model_dump() for a in atts]


@router.get("/attachments/{att_id}/download")
def download_attachment(
    att_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    att = db.query(Attachment).filter(Attachment.id == att_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="附件不存在")
    if not os.path.exists(att.file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(att.file_path, filename=att.original_name or att.file_name, media_type=att.mime_type)


# ========== 导入任务 ==========
@router.post("/import/heat-points")
async def import_heat_points(
    route_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(RoleEnum.PATROL, RoleEnum.OPERATION)),
    db: Session = Depends(get_db),
):
    from ...tasks import import_heat_points_from_csv_task
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    saved_path = os.path.join(settings.UPLOAD_DIR, f"import_{uuid.uuid4().hex}{ext}")
    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)
    task = import_heat_points_from_csv_task.delay(saved_path, route_id, current_user.id)
    return Message(message=f"导入任务已提交: {task.id}")
