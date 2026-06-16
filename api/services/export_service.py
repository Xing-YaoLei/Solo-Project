import os
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import ExportRecord, Prescription


async def create_export_record(db: AsyncSession, task_id: str, export_type: str, user_id: str) -> ExportRecord:
    record = ExportRecord(
        task_id=task_id,
        export_type=export_type,
        requested_by=user_id,
    )
    db.add(record)
    await db.flush()
    return record


async def get_export_record_by_task(db: AsyncSession, task_id: str) -> ExportRecord | None:
    result = await db.execute(select(ExportRecord).where(ExportRecord.task_id == task_id))
    return result.scalar_one_or_none()


async def update_export_record(
    db: AsyncSession,
    record: ExportRecord,
    *,
    status: str | None = None,
    file_path: str | None = None,
    error_message: str | None = None,
    row_count: int | None = None,
) -> ExportRecord:
    if status is not None:
        record.status = status
    if file_path is not None:
        record.file_path = file_path
    if error_message is not None:
        record.error_message = error_message
    if row_count is not None:
        record.row_count = row_count
    if status in ("completed", "failed"):
        record.completed_at = datetime.utcnow()
    await db.flush()
    return record


def generate_excel(prescriptions: list[dict], export_dir: str, task_id: str) -> tuple[str, int]:
    os.makedirs(export_dir, exist_ok=True)

    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "处方数据"

    headers = [
        "处方编号", "状态", "优先级", "诊断", "总金额",
        "门店ID", "会员ID", "审核人ID", "创建时间", "更新时间",
    ]
    ws.append(headers)

    row_count = 0
    for p in prescriptions:
        ws.append([
            p.get("rx_number", ""),
            p.get("status", ""),
            p.get("priority", ""),
            p.get("diagnosis", ""),
            p.get("total_amount", 0),
            p.get("store_id", ""),
            p.get("member_id", ""),
            p.get("reviewer_id", ""),
            str(p.get("created_at", "")),
            str(p.get("updated_at", "")),
        ])
        row_count += 1

    filename = f"export_{task_id[:8]}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xlsx"
    file_path = os.path.join(export_dir, filename)
    wb.save(file_path)
    return file_path, row_count
