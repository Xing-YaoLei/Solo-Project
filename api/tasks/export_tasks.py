import asyncio
import logging

from api.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="export_prescriptions")
def export_prescriptions(
    self,
    filters: dict | None = None,
    include_caliber: bool = True,
    dimensions: list[str] | None = None,
    date_range: dict | None = None,
    format: str = "xlsx",
) -> dict:
    task_id = self.request.id

    async def _run():
        from api.database import async_session_factory
        from api.models import Prescription, ExportRecord, CaliberNote, Store, MemberProfile, User
        from api.services.export_service import generate_excel, update_export_record_async
        from api.config import settings
        from sqlalchemy import select as sa_select
        from sqlalchemy.orm import selectinload

        async with async_session_factory() as db:
            result = await db.execute(sa_select(ExportRecord).where(ExportRecord.task_id == task_id))
            record = result.scalar_one_or_none()
            if record:
                record.status = "processing"
                await db.commit()

        try:
            caliber_notes_data = []
            if include_caliber:
                async with async_session_factory() as db:
                    result = await db.execute(sa_select(CaliberNote).order_by(CaliberNote.created_at.asc()))
                    caliber_notes = result.scalars().all()
                    for note in caliber_notes:
                        caliber_notes_data.append({
                            "metric": note.metric,
                            "definition": note.definition,
                            "exclusions": note.exclusions,
                            "remarks": note.remarks,
                        })

            async with async_session_factory() as db:
                query = (
                    sa_select(Prescription)
                    .options(
                        selectinload(Prescription.store),
                        selectinload(Prescription.member),
                        selectinload(Prescription.reviewer),
                        selectinload(Prescription.batch_items),
                        selectinload(Prescription.insurance_records),
                        selectinload(Prescription.replenishments),
                    )
                    .order_by(Prescription.created_at.desc())
                )
                if filters:
                    if filters.get("status"):
                        query = query.where(Prescription.status == filters["status"])
                    if filters.get("store_id"):
                        query = query.where(Prescription.store_id == filters["store_id"])
                    if filters.get("region_id"):
                        query = query.join(Store).where(Store.region_id == filters["region_id"])

                result = await db.execute(query)
                prescriptions = result.scalars().all()

                data = []
                for p in prescriptions:
                    store_name = p.store.name if p.store else ""
                    patient_name = p.member.name if p.member else ""
                    reviewer_name = p.reviewer.display_name if p.reviewer else ""

                    batch_items = []
                    for item in p.batch_items:
                        batch_items.append({
                            "drug_name": item.drug_name,
                            "drug_code": item.drug_code,
                            "specification": item.specification,
                            "quantity": item.quantity,
                            "unit": item.unit,
                            "dosage": item.dosage,
                            "frequency": item.frequency,
                            "duration_days": item.duration_days,
                            "unit_price": item.unit_price,
                            "subtotal": item.subtotal,
                        })

                    insurance_records = []
                    for ins in p.insurance_records:
                        insurance_records.append({
                            "insurance_type": ins.insurance_type,
                            "verified": ins.verified,
                            "covered_amount": ins.covered_amount,
                            "self_pay_amount": ins.self_pay_amount,
                        })

                    replenishments = []
                    for rep in p.replenishments:
                        replenishments.append({
                            "drug_name": rep.drug_name,
                            "status": rep.status,
                            "quantity": rep.quantity,
                        })

                    data.append({
                        "rx_number": p.rx_number,
                        "status": p.status,
                        "priority": p.priority,
                        "store_name": store_name,
                        "patient_name": patient_name,
                        "diagnosis": p.diagnosis,
                        "total_amount": p.total_amount,
                        "created_at": str(p.created_at),
                        "reviewed_at": str(p.reviewed_at) if p.reviewed_at else "",
                        "reviewer_name": reviewer_name,
                        "batch_items": batch_items,
                        "insurance_records": insurance_records,
                        "replenishments": replenishments,
                    })

            file_path, row_count = generate_excel(data, caliber_notes_data, settings.EXPORT_DIR, task_id)

            async with async_session_factory() as db:
                await update_export_record_async(
                    db,
                    task_id,
                    status="completed",
                    file_path=file_path,
                    row_count=row_count,
                )
                await db.commit()

            return {"status": "completed", "file_path": file_path, "row_count": row_count}

        except Exception as e:
            logger.exception("Export task failed")
            async with async_session_factory() as db:
                await update_export_record_async(
                    db,
                    task_id,
                    status="failed",
                    error_message=str(e),
                )
                await db.commit()
            raise

    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_run())
    finally:
        loop.close()
