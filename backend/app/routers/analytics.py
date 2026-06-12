# -*- coding: utf-8 -*-
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.services.duckdb_service import get_analytics
from app.services.mock_data import generate_mock_data

router = APIRouter()


@router.get("/clean-risk/timeseries")
async def get_clean_risk_timeseries(
    start_date: str = Query(..., description="开始日期，格式YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期，格式YYYY-MM-DD"),
    store_id: Optional[int] = Query(None, description="门店ID"),
    equipment_id: Optional[int] = Query(None, description="设备ID"),
) -> Dict[str, Any]:
    try:
        analytics = get_analytics()
        result = analytics.get_clean_risk_timeseries(start_date, end_date, store_id, equipment_id)
        return {
            "code": 0,
            "message": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clean-risk/distribution")
async def get_clean_risk_distribution() -> Dict[str, Any]:
    try:
        analytics = get_analytics()
        sql = """
            SELECT
                COUNT(DISTINCT CASE WHEN clean_risk_score >= 70 THEN equipment_id END) as high_risk_count,
                COUNT(DISTINCT CASE WHEN clean_risk_score >= 50 AND clean_risk_score < 70 THEN equipment_id END) as medium_risk_count,
                COUNT(DISTINCT CASE WHEN clean_risk_score < 50 THEN equipment_id END) as low_risk_count,
                COUNT(DISTINCT equipment_id) as total_count
            FROM equipment_clean_metrics
            WHERE record_date = (SELECT MAX(record_date) FROM equipment_clean_metrics)
        """
        latest = analytics.con.execute(sql).fetchdf().to_dict("records")
        dist = latest[0] if latest else {}

        total = dist.get("total_count", 0) or 0
        high = dist.get("high_risk_count", 0) or 0
        medium = dist.get("medium_risk_count", 0) or 0
        low = dist.get("low_risk_count", 0) or 0

        detail_sql = """
            WITH latest_per_eq AS (
                SELECT
                    equipment_id,
                    equipment_code,
                    store_id,
                    clean_risk_score,
                    status,
                    ROW_NUMBER() OVER (PARTITION BY equipment_id ORDER BY record_date DESC) as rn
                FROM equipment_clean_metrics
            )
            SELECT
                equipment_id,
                equipment_code,
                store_id,
                clean_risk_score,
                status,
                CASE
                    WHEN clean_risk_score >= 70 THEN 'high'
                    WHEN clean_risk_score >= 50 THEN 'medium'
                    ELSE 'low'
                END as risk_level
            FROM latest_per_eq
            WHERE rn = 1
            ORDER BY clean_risk_score DESC
        """
        detail = analytics.con.execute(detail_sql).fetchdf().to_dict("records")

        return {
            "code": 0,
            "message": "success",
            "data": {
                "total_count": total,
                "high_risk": {
                    "count": high,
                    "percentage": round(high / total * 100, 2) if total > 0 else 0,
                },
                "medium_risk": {
                    "count": medium,
                    "percentage": round(medium / total * 100, 2) if total > 0 else 0,
                },
                "low_risk": {
                    "count": low,
                    "percentage": round(low / total * 100, 2) if total > 0 else 0,
                },
                "detail": detail,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/offline-gap/samples")
async def get_offline_gap_samples(
    equipment_id: int = Query(..., description="设备ID"),
    gap_start: str = Query(..., description="缺口开始时间，格式YYYY-MM-DD HH:MM:SS"),
    gap_end: str = Query(..., description="缺口结束时间，格式YYYY-MM-DD HH:MM:SS"),
) -> Dict[str, Any]:
    try:
        analytics = get_analytics()
        result = analytics.get_offline_gap_samples(equipment_id, gap_start, gap_end)
        return {
            "code": 0,
            "message": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overview/dashboard")
async def get_dashboard_overview() -> Dict[str, Any]:
    try:
        analytics = get_analytics()

        sql_total = "SELECT COUNT(DISTINCT equipment_id) as total FROM equipment_clean_metrics"
        total_count = analytics.con.execute(sql_total).fetchone()[0] or 0

        sql_latest = """
            SELECT COUNT(DISTINCT equipment_id) as online_count
            FROM equipment_clean_metrics
            WHERE record_date = (SELECT MAX(record_date) FROM equipment_clean_metrics)
              AND status = 'online'
        """
        online_count = analytics.con.execute(sql_latest).fetchone()[0] or 0

        sql_avg_risk = """
            SELECT AVG(clean_risk_score) as avg_score
            FROM equipment_clean_metrics
            WHERE record_date = (SELECT MAX(record_date) FROM equipment_clean_metrics)
        """
        avg_risk_score = analytics.con.execute(sql_avg_risk).fetchone()[0] or 0
        avg_risk_score = round(float(avg_risk_score), 2) if avg_risk_score else 0

        sql_high_risk = """
            SELECT COUNT(DISTINCT equipment_id) as high_count
            FROM equipment_clean_metrics
            WHERE record_date = (SELECT MAX(record_date) FROM equipment_clean_metrics)
              AND clean_risk_score >= 70
        """
        high_risk_count = analytics.con.execute(sql_high_risk).fetchone()[0] or 0

        fault_pending_count = 0
        task_overdue_count = 0
        pass_rate = 0.0
        change = {}

        try:
            from app.core.database import SessionLocal
            from app.models.faults import FaultRecord
            from app.models.tasks import RectificationTask

            db = SessionLocal()
            try:
                fault_pending_count = db.query(FaultRecord).filter(
                    FaultRecord.status.in_(["pending", "processing"])
                ).count()

                task_overdue_count = db.query(RectificationTask).filter(
                    RectificationTask.status.in_(["pending", "in_progress"]),
                    RectificationTask.deadline < datetime.now()
                ).count()
            finally:
                db.close()
        except Exception:
            pass

        try:
            insp_sql = """
                SELECT pass_rate, prev_pass_rate, improvement_rate
                FROM inspection_comparison
                ORDER BY period_end DESC
                LIMIT 1
            """
            insp_result = analytics.con.execute(insp_sql).fetchdf().to_dict("records")
            if insp_result:
                pass_rate = float(insp_result[0].get("pass_rate", 0) or 0)
                change = {
                    "prev_pass_rate": float(insp_result[0].get("prev_pass_rate", 0) or 0),
                    "improvement_rate": float(insp_result[0].get("improvement_rate", 0) or 0),
                }
        except Exception:
            pass

        return {
            "code": 0,
            "message": "success",
            "data": {
                "total_equipment": total_count,
                "online_rate": round(online_count / total_count * 100, 2) if total_count > 0 else 0,
                "avg_risk_score": avg_risk_score,
                "high_risk_count": high_risk_count,
                "fault_pending_count": fault_pending_count,
                "task_overdue_count": task_overdue_count,
                "inspection_pass_rate": pass_rate,
                "change": change,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-risks")
async def get_top_risks(
    limit: int = Query(10, description="返回数量，默认10"),
) -> Dict[str, Any]:
    try:
        analytics = get_analytics()
        sql = """
            WITH latest_per_eq AS (
                SELECT
                    ecm.equipment_id,
                    ecm.equipment_code,
                    ecm.store_id,
                    ecm.clean_risk_score,
                    ecm.status,
                    ecm.anomaly_type,
                    ecm.anomaly_reason,
                    ecm.offline_minutes,
                    ecm.inspection_score,
                    ecm.record_date,
                    ROW_NUMBER() OVER (PARTITION BY ecm.equipment_id ORDER BY ecm.record_date DESC) as rn
                FROM equipment_clean_metrics ecm
            )
            SELECT
                equipment_id,
                equipment_code,
                store_id,
                clean_risk_score,
                status,
                anomaly_type,
                anomaly_reason,
                offline_minutes,
                inspection_score,
                record_date,
                CASE
                    WHEN clean_risk_score >= 80 THEN 'critical'
                    WHEN clean_risk_score >= 70 THEN 'high'
                    WHEN clean_risk_score >= 50 THEN 'medium'
                    ELSE 'low'
                END as risk_level
            FROM latest_per_eq
            WHERE rn = 1
            ORDER BY clean_risk_score DESC
            LIMIT ?
        """
        result = analytics.con.execute(sql, [limit]).fetchdf().to_dict("records")
        return {
            "code": 0,
            "message": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/init-data")
async def init_mock_data() -> Dict[str, Any]:
    try:
        result = generate_mock_data()
        return {
            "code": 0,
            "message": "Mock数据初始化成功",
            "data": {
                "store_count": len(result.get("stores", [])),
                "equipment_count": len(result.get("equipments", [])),
                "clean_metrics_count": result.get("clean_metrics_count", 0),
                "fault_count": len(result.get("fault_records", [])),
                "task_count": len(result.get("rectification_tasks", [])),
                "inspection_count": len(result.get("inspection_records", [])),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data-status")
async def get_data_status() -> Dict[str, Any]:
    try:
        analytics = get_analytics()

        table_counts = {}
        tables = [
            "inventory_snapshot",
            "pos_snapshot",
            "member_receipt_snapshot",
            "equipment_clean_metrics",
            "inspection_comparison",
        ]
        for table in tables:
            try:
                count = analytics.con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                table_counts[table] = count or 0
            except Exception:
                table_counts[table] = 0

        is_initialized = any(v > 0 for v in table_counts.values())

        return {
            "code": 0,
            "message": "success",
            "data": {
                "is_initialized": is_initialized,
                "table_counts": table_counts,
                "db_path": analytics.db_path,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
