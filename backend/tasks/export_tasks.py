from celery_app import celery
from database import SessionLocal
from services.report_service import ReportService
from datetime import date
import pandas as pd
import io
import logging
import os

logger = logging.getLogger(__name__)

EXPORT_DIR = os.environ.get("EXPORT_DIR", "/tmp/groupbuy_exports")
os.makedirs(EXPORT_DIR, exist_ok=True)


@celery.task(bind=True, name="generate_performance_report")
def generate_performance_report(
    self,
    start_date_str: str = None,
    end_date_str: str = None,
):
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(start_date_str) if start_date_str else None
        end_date = date.fromisoformat(end_date_str) if end_date_str else None

        data = ReportService.export_excel_data(db, start_date, end_date)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            pd.DataFrame([data["summary"]]).T.to_excel(writer, sheet_name="履约概览", header=["数值"])

            pd.DataFrame(data["trend"]).to_excel(writer, sheet_name="趋势数据", index=False)

            pd.DataFrame(data["batch_data"]).to_excel(writer, sheet_name="团单明细", index=False)

            caliber_df = pd.DataFrame({"口径说明": [data["caliber"]]})
            caliber_df.to_excel(writer, sheet_name="统计口径", index=False)

        output.seek(0)
        filename = f"performance_report_{self.request.id}.xlsx"
        file_path = os.path.join(EXPORT_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(output.getvalue())

        download_url = f"/api/reports/export/download/{filename}"

        logger.info(f"报表生成成功: {file_path}")
        return {
            "status": "success",
            "file_path": file_path,
            "download_url": download_url,
            "filename": filename,
        }
    except Exception as e:
        logger.error(f"生成报表失败: {e}")
        self.retry(exc=e, countdown=60, max_retries=2)
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
