from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import Exception, Prescription
from api.schemas import ExceptionCreate, ExceptionListParams, ExceptionUpdate


async def create_exception(db: AsyncSession, data: ExceptionCreate, user_id: str) -> Exception:
    exc = Exception(
        prescription_id=data.prescription_id,
        exception_type=data.exception_type,
        severity=data.severity,
        impact_scope=data.impact_scope,
        description=data.description,
        assignee_id=data.assignee_id,
    )
    db.add(exc)
    await db.flush()
    return exc


async def get_exception(db: AsyncSession, exc_id: str) -> Exception | None:
    result = await db.execute(select(Exception).where(Exception.id == exc_id))
    return result.scalar_one_or_none()


async def list_exceptions(db: AsyncSession, params: ExceptionListParams) -> tuple[list[Exception], int]:
    query = select(Exception)
    count_query = select(func.count()).select_from(Exception)

    if params.status:
        query = query.where(Exception.status == params.status)
        count_query = count_query.where(Exception.status == params.status)
    if params.severity:
        query = query.where(Exception.severity == params.severity)
        count_query = count_query.where(Exception.severity == params.severity)
    if params.assignee_id:
        query = query.where(Exception.assignee_id == params.assignee_id)
        count_query = count_query.where(Exception.assignee_id == params.assignee_id)
    if params.prescription_id:
        query = query.where(Exception.prescription_id == params.prescription_id)
        count_query = count_query.where(Exception.prescription_id == params.prescription_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (params.page - 1) * params.page_size
    query = query.order_by(Exception.created_at.desc()).offset(offset).limit(params.page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_exception(db: AsyncSession, exc: Exception, data: ExceptionUpdate) -> Exception:
    if data.severity is not None:
        exc.severity = data.severity
    if data.impact_scope is not None:
        exc.impact_scope = data.impact_scope
    if data.description is not None:
        exc.description = data.description
    if data.assignee_id is not None:
        exc.assignee_id = data.assignee_id
    if data.resolution is not None:
        exc.resolution = data.resolution
    if data.status is not None:
        exc.status = data.status
    exc.updated_at = datetime.utcnow()
    await db.flush()
    return exc


async def get_prescription_by_id(db: AsyncSession, prescription_id: str) -> Prescription | None:
    result = await db.execute(select(Prescription).where(Prescription.id == prescription_id))
    return result.scalar_one_or_none()
