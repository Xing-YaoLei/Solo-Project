from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.db.session import engine, Base, get_db
from app.api import funnel, records, config, download
from app import models

app = FastAPI(
    title=settings.APP_NAME,
    description="药店连锁促销陈列漏斗报表系统 - 基于 React + ECharts + FastAPI + PostgreSQL + DuckDB",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funnel.router, prefix=settings.API_V1_PREFIX)
app.include_router(records.router, prefix=settings.API_V1_PREFIX)
app.include_router(config.router, prefix=settings.API_V1_PREFIX)
app.include_router(download.router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post(f"{settings.API_V1_PREFIX}/refresh")
def refresh_all_data(
    triggered_by: str = "system",
    db: Session = Depends(get_db),
):
    from app.services.duckdb_service import duckdb_service

    refresh_log = models.RefreshLog(
        refresh_type="manual",
        triggered_by=triggered_by,
        status="running",
    )
    db.add(refresh_log)
    db.commit()
    db.refresh(refresh_log)

    try:
        processed = duckdb_service.refresh_data(settings.DATABASE_URL)

        query = db.query(models.SalesRecord)
        delay_threshold = 30
        missing_threshold = 5
        delay_count = query.filter(
            models.SalesRecord.cashier_delay_minutes >= delay_threshold
        ).count()
        missing_count = query.filter(
            models.SalesRecord.member_record_missing_count >= missing_threshold
        ).count()
        caliber_count = query.filter(
            models.SalesRecord.medical_insurance_caliber_changed == True
        ).count()

        refresh_log.status = "completed"
        refresh_log.completed_at = datetime.now()
        refresh_log.records_processed = processed
        refresh_log.exceptions_found = {
            "收银系统延迟": delay_count,
            "会员记录缺失": missing_count,
            "医保接口口径变化": caliber_count,
        }
        refresh_log.remark = f"DuckDB 数据刷新完成，共处理 {processed} 条促销记录"
        db.commit()

        return {
            "status": "success",
            "records_processed": processed,
            "exceptions_found": refresh_log.exceptions_found,
            "message": "数据刷新完成，异常点已标注",
        }
    except Exception as e:
        refresh_log.status = "failed"
        refresh_log.completed_at = datetime.now()
        refresh_log.remark = f"刷新失败: {str(e)}"
        db.commit()
        return {"status": "failed", "error": str(e)}
