import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.complaint import Complaint
from app.models.handler import Handler
from app.models.handling_record import HandlingRecord
from app.models.tag import ComplaintTag
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintListResponse,
    ComplaintResponse,
    ComplaintStatusUpdate,
    ComplaintUpdate,
    HandlingRecordCreate,
    TagCreate,
)

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


async def _build_response(complaint: Complaint, db: AsyncSession) -> ComplaintResponse:
    handler_name = None
    if complaint.handler_id:
        handler_result = await db.execute(select(Handler).where(Handler.id == complaint.handler_id))
        handler = handler_result.scalar_one_or_none()
        if handler:
            handler_name = handler.name
    return ComplaintResponse(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        source_channel=complaint.source_channel,
        status=complaint.status,
        priority=complaint.priority,
        complainant_name=complaint.complainant_name,
        complainant_contact=complaint.complainant_contact,
        homestay_name=complaint.homestay_name,
        room_number=complaint.room_number,
        check_in_date=complaint.check_in_date,
        check_out_date=complaint.check_out_date,
        handler_id=complaint.handler_id,
        handler_name=handler_name,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        closed_at=complaint.closed_at,
        tags=[t.tag for t in complaint.tags],
        visit_results=complaint.visit_results,
        responsibilities=complaint.responsibilities,
        handling_records=complaint.handling_records,
        reviews=complaint.reviews,
    )


@router.get("/", response_model=list[ComplaintListResponse])
async def list_complaints(
    status: Optional[str] = None,
    source_channel: Optional[str] = None,
    handler_id: Optional[uuid.UUID] = None,
    priority: Optional[str] = None,
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(Complaint).options(selectinload(Complaint.tags))

    if status:
        query = query.where(Complaint.status == status)
    if source_channel:
        query = query.where(Complaint.source_channel == source_channel)
    if handler_id:
        query = query.where(Complaint.handler_id == handler_id)
    if priority:
        query = query.where(Complaint.priority == priority)

    query = query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    complaints = result.scalars().all()

    response = []
    for c in complaints:
        handler_name = None
        if c.handler_id:
            handler_result = await db.execute(select(Handler).where(Handler.id == c.handler_id))
            handler = handler_result.scalar_one_or_none()
            if handler:
                handler_name = handler.name
        tags = [t.tag for t in c.tags]
        response.append(
            ComplaintListResponse(
                id=c.id,
                title=c.title,
                status=c.status,
                priority=c.priority,
                source_channel=c.source_channel,
                homestay_name=c.homestay_name,
                handler_name=handler_name,
                created_at=c.created_at,
                closed_at=c.closed_at,
                tags=tags,
            )
        )
    return response


@router.post("/", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    data: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
):
    complaint = Complaint(
        title=data.title,
        description=data.description,
        source_channel=data.source_channel,
        status="pending",
        priority=data.priority,
        complainant_name=data.complainant_name,
        complainant_contact=data.complainant_contact,
        homestay_name=data.homestay_name,
        room_number=data.room_number,
        check_in_date=data.check_in_date,
        check_out_date=data.check_out_date,
        handler_id=data.handler_id,
    )
    db.add(complaint)
    await db.flush()

    for tag_name in data.tags:
        tag = ComplaintTag(complaint_id=complaint.id, tag=tag_name)
        db.add(tag)

    await db.commit()
    await db.refresh(complaint)

    result = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.tags),
            selectinload(Complaint.visit_results),
            selectinload(Complaint.responsibilities),
            selectinload(Complaint.handling_records),
            selectinload(Complaint.reviews),
        )
        .where(Complaint.id == complaint.id)
    )
    complaint = result.scalar_one()

    return await _build_response(complaint, db)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.tags),
            selectinload(Complaint.visit_results),
            selectinload(Complaint.responsibilities),
            selectinload(Complaint.handling_records),
            selectinload(Complaint.reviews),
        )
        .where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return await _build_response(complaint, db)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: uuid.UUID,
    data: ComplaintUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if data.status is not None:
        complaint.status = data.status
    if data.handler_id is not None:
        complaint.handler_id = data.handler_id
    if data.priority is not None:
        complaint.priority = data.priority

    await db.commit()
    await db.refresh(complaint)

    result = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.tags),
            selectinload(Complaint.visit_results),
            selectinload(Complaint.responsibilities),
            selectinload(Complaint.handling_records),
            selectinload(Complaint.reviews),
        )
        .where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one()

    return await _build_response(complaint, db)


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: uuid.UUID,
    data: ComplaintStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = data.status
    if data.status == "closed":
        complaint.closed_at = datetime.now()

    await db.commit()
    await db.refresh(complaint)

    result = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.tags),
            selectinload(Complaint.visit_results),
            selectinload(Complaint.responsibilities),
            selectinload(Complaint.handling_records),
            selectinload(Complaint.reviews),
        )
        .where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one()

    return await _build_response(complaint, db)


@router.post("/{complaint_id}/handling-records", status_code=201)
async def add_handling_record(
    complaint_id: uuid.UUID,
    data: HandlingRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    handler_id = None
    if data.handler_id is not None:
        handler_id = data.handler_id
    elif data.handler_name:
        result = await db.execute(
            select(Handler).where(Handler.name == data.handler_name).limit(1)
        )
        handler = result.scalar_one_or_none()
        if handler:
            handler_id = handler.id
        else:
            new_handler = Handler(name=data.handler_name, role="临时处理人")
            db.add(new_handler)
            await db.flush()
            handler_id = new_handler.id
    else:
        handler_id = complaint.handler_id

    record = HandlingRecord(
        complaint_id=complaint_id,
        handler_id=handler_id,
        action=data.action,
        description=data.description,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"id": str(record.id), "action": record.action}


@router.post("/{complaint_id}/tags", status_code=201)
async def add_tag(
    complaint_id: uuid.UUID,
    data: TagCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_tag = ComplaintTag(complaint_id=complaint_id, tag=data.tag)
    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)
    return {"id": str(new_tag.id), "tag": new_tag.tag}


@router.delete("/{complaint_id}/tags/{tag_name}", status_code=204)
async def delete_tag(
    complaint_id: uuid.UUID,
    tag_name: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ComplaintTag).where(
            ComplaintTag.complaint_id == complaint_id,
            ComplaintTag.tag == tag_name,
        )
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
