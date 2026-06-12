from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from schemas import ApiResponse
from services import ReportService
from tasks import generate_performance_report
from tasks.export_tasks import EXPORT_DIR
from datetime import date
from typing import Optional
import os

router = APIRouter(prefix="/reports", tags=["报表"])


@router.get("/delivery-performance", response_model=ApiResponse[dict])
def get_delivery_performance(
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
):
    data = ReportService.calculate_delivery_performance(db, start_date, end_date)
    return ApiResponse.success(data)


@router.get("/delivery-trend", response_model=ApiResponse[list])
def get_delivery_trend(
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
):
    data = ReportService.get_trend_data(db, start_date, end_date)
    return ApiResponse.success(data)


@router.post("/export/excel", response_model=ApiResponse[dict])
def export_excel(
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
):
    task = generate_performance_report.delay(
        start_date_str=start_date.isoformat() if start_date else None,
        end_date_str=end_date.isoformat() if end_date else None,
    )
    return ApiResponse.success({"task_id": task.id}, "导出任务已提交，请稍后查看")


@router.get("/export/status/{task_id}", response_model=ApiResponse[dict])
def get_export_status(task_id: str):
    task = generate_performance_report.AsyncResult(task_id)
    if task.state == "PENDING":
        return ApiResponse.success({"state": task.state, "status": "任务排队中"})
    elif task.state == "STARTED":
        return ApiResponse.success({"state": task.state, "status": "正在生成报表"})
    elif task.state == "SUCCESS":
        return ApiResponse.success({"state": task.state, "status": "生成完成", "result": task.result})
    else:
        return ApiResponse.error(message=f"任务失败: {str(task.info)}")


@router.get("/export/download/{filename}")
def download_report(filename: str):
    """
    下载生成的Excel报表文件
    """
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(EXPORT_DIR, safe_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="报表文件不存在或已过期")

    return FileResponse(
        path=file_path,
        filename=safe_filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
