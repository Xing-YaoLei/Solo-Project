from celery import shared_task
import logging
import os
import json
from datetime import date, datetime
import pandas as pd

from ..core.database import SessionLocal
from ..models import ExportTask
from ..services import generate_export_task_no
from ..api.export import (
    EXPORT_DIR, DATA_CALIBER, EXPORT_FUNCS
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, name="app.tasks.export.run_export_async",
             max_retries=2, default_retry_delay=30)
def run_export_async(self, export_type: str, criteria: dict = None,
                     requested_by: str = None):
    db = SessionLocal()
    task_id = None
    try:
        if export_type not in EXPORT_FUNCS:
            raise ValueError(f"不支持的导出类型: {export_type}")

        task = ExportTask(
            task_no=generate_export_task_no(),
            export_type=export_type,
            status="processing",
            criteria=criteria,
            data_caliber=DATA_CALIBER.get(export_type),
            requested_by=requested_by,
            celery_task_id=self.request.id
        )
        db.add(task)
        db.flush()
        task_id = task.id

        func = EXPORT_FUNCS[export_type]
        rows = func(db, criteria)
        caliber = DATA_CALIBER[export_type]
        df = pd.DataFrame(rows)

        caliber_df = pd.DataFrame([
            {"字段": k, "说明": v} for k, v in caliber["fields"].items()
        ])
        extra_info = []
        if "formula" in caliber:
            extra_info.append({"项目": "指标公式", "内容": json.dumps(caliber["formula"], ensure_ascii=False)})
        if "status_mapping" in caliber:
            extra_info.append({"项目": "状态映射", "内容": json.dumps(caliber["status_mapping"], ensure_ascii=False)})
        if "filter_rules" in caliber:
            extra_info.append({"项目": "筛选说明", "内容": caliber["filter_rules"]})
        if "anomaly_type_mapping" in caliber:
            extra_info.append({"项目": "异常类型映射", "内容": json.dumps(caliber["anomaly_type_mapping"], ensure_ascii=False)})
        if "responsibility_mapping" in caliber:
            extra_info.append({"项目": "责任归属映射", "内容": json.dumps(caliber["responsibility_mapping"], ensure_ascii=False)})
        extra_df = pd.DataFrame(extra_info) if extra_info else None
        filename = f"{export_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = os.path.join(EXPORT_DIR, filename)

        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='数据明细', index=False)
            caliber_df.to_excel(writer, sheet_name='数据口径说明', index=False)
            if extra_df is not None:
                extra_df.to_excel(writer, sheet_name='口径补充', index=False)

        task.status = "completed"
        task.file_url = f"/api/exports/download/{filename}"
        task.file_size = os.path.getsize(filepath)
        task.total_rows = len(rows)
        task.completed_at = datetime.utcnow()
        db.commit()
        logger.info(f"[run_export_async] 导出完成 task={task.task_no} rows={len(rows)}")
        return {"task_id": task.id, "task_no": task.task_no, "status": "completed", "file_url": task.file_url}

    except Exception as exc:
        logger.error(f"[run_export_async] 导出失败: {exc}")
        if task_id:
            t = db.query(ExportTask).filter(ExportTask.id == task_id).first()
            if t:
                t.status = "failed"
                t.error_message = str(exc)[:2000]
                db.commit()
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
