import asyncio
import logging

from api.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="export_prescriptions")
def export_prescriptions(self, task_id: str, filters: dict | None = None) -> dict:
    async def _run():
        from api.database import async_session_factory
        from api.models import Prescription
        from api.services.export_service import generate_excel, update_export_record_async
        from api.config import settings

        from sqlalchemy import select

        async with async_session_factory() as db:
            from api.models import ExportRecord
            from sqlalchemy import select as sa_select

            result = await db.execute(sa_select(ExportRecord).where(ExportRecord.task_id == task_id))
            record = result.scalar_one_or_none()
            if record:
                record.status = "processing"
                await db.commit()

        try:
            async with async_session_factory() as db:
                query = sa_select(Prescription).order_by(Prescription.created_at.desc())
                if filters:
                    if filters.get("status"):
                        query = query.where(Prescription.status == filters["status"])
                    if filters.get("store_id"):
                        query = query.where(Prescription.store_id == filters["store_id"])

                result = await db.execute(query)
                prescriptions = result.scalars().all()

                data = []
                for p in prescriptions:
                    data.append({
                        "rx_number": p.rx_number,
                        "status": p.status,
                        "priority": p.priority,
                        "diagnosis": p.diagnosis,
                        "total_amount": p.total_amount,
                        "store_id": p.store_id,
                        "member_id": p.member_id,
                        "reviewer_id": p.reviewer_id,
                        "created_at": str(p.created_at),
                        "updated_at": str(p.updated_at),
                    })

            file_path, row_count = generate_excel(data, settings.EXPORT_DIR, task_id)

            async with async_session_factory() as db:
                result = await db.execute(sa_select(ExportRecord).where(ExportRecord.task_id == task_id))
                record = result.scalar_one_or_none()
                if record:
                    record.status = "completed"
                    record.file_path = file_path
                    record.row_count = row_count
                    from datetime import datetime
                    record.completed_at = datetime.utcnow()
                    await db.commit()

            return {"status": "completed", "file_path": file_path, "row_count": row_count}

        except Exception as e:
            logger.exception("Export task failed")
            async with async_session_factory() as db:
                result = await db.execute(sa_select(ExportRecord).where(ExportRecord.task_id == task_id))
                record = result.scalar_one_or_none()
                if record:
                    record.status = "failed"
                    record.error_message = str(e)
                    from datetime import datetime
                    record.completed_at = datetime.utcnow()
                    await db.commit()
            raise

    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_run())
    finally:
        loop.close()
