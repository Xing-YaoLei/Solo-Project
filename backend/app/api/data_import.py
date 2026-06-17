from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.schemas import (
    ChargingImportItem, AccessImportItem, HealthImportItem,
    ImportBatchResponse, ETLPipelineResult, DataSourceStats, DBInfo
)
from app.data_pipeline.etl_pipeline import etl_pipeline
from app.db.database import (
    get_pg_session, get_duckdb, is_pg_available, PG_HOST, PG_DB, DUCKDB_PATH
)
from app.db import models
from sqlalchemy import func

router = APIRouter(prefix="/data", tags=["数据导入与ETL"])


@router.post("/import/charging", response_model=Dict[str, Any])
def import_charging(records: List[ChargingImportItem]):
    try:
        result = etl_pipeline.import_charging_batch([r.model_dump() for r in records])
        return {"code": 0, "message": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/access", response_model=Dict[str, Any])
def import_access(records: List[AccessImportItem]):
    try:
        result = etl_pipeline.import_access_batch([r.model_dump() for r in records])
        return {"code": 0, "message": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/health", response_model=Dict[str, Any])
def import_health(records: List[HealthImportItem]):
    try:
        result = etl_pipeline.import_health_batch([r.model_dump() for r in records])
        return {"code": 0, "message": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/etl/run", response_model=Dict[str, Any])
def run_etl_pipeline():
    try:
        result = etl_pipeline.run_full_pipeline()
        return {"code": 0, "message": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/sources", response_model=Dict[str, Any])
def get_data_source_stats():
    try:
        pg = get_pg_session()
        duck = get_duckdb()
        stats = []
        source_map = [
            ("charging", models.ChargingRecord, "charging_records_clean"),
            ("access", models.AccessLog, "access_logs_clean"),
            ("health", models.HealthMetric, "health_metrics_clean"),
        ]
        for source_type, model_cls, duck_table in source_map:
            raw_count = pg.query(func.count(model_cls.id)).scalar() or 0
            try:
                cleaned_count = duck.execute(f"SELECT COUNT(*) FROM {duck_table}").fetchone()[0]
            except Exception:
                cleaned_count = 0
            last_cleaned = None
            try:
                row = duck.execute(f"SELECT MAX(cleaned_at) FROM {duck_table}").fetchone()
                if row and row[0]:
                    last_cleaned = str(row[0])
            except Exception:
                pass
            stats.append({
                "sourceType": source_type,
                "rawCount": raw_count,
                "cleanedCount": cleaned_count,
                "lastCleanedAt": last_cleaned,
            })
        pg.close()
        return {"code": 0, "message": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/db/info", response_model=Dict[str, Any])
def get_db_info():
    try:
        duck = get_duckdb()
        tables = duck.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
        ).fetchall()
        table_list = [t[0] for t in tables]
        pg = get_pg_session()
        pg.close()
        info = {
            "pgAvailable": is_pg_available(),
            "pgHost": PG_HOST,
            "pgDatabase": PG_DB,
            "duckdbPath": str(DUCKDB_PATH),
            "duckdbTables": table_list,
        }
        return {"code": 0, "message": "success", "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
