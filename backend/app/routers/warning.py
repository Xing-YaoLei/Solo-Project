from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db, get_duckdb_conn
from ..warning_service import WarningService
from .. import schemas, models
import duckdb

router = APIRouter(prefix="/api/warnings", tags=["warnings"])


@router.get("/thresholds", response_model=List[schemas.WarningThreshold])
def list_thresholds(
    category: Optional[str] = Query(None),
    enabled_only: bool = Query(True),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    return service.get_all_thresholds(category=category, enabled_only=enabled_only)


@router.post("/thresholds", response_model=schemas.WarningThreshold)
def create_threshold(
    threshold_data: schemas.WarningThresholdCreate,
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    return service.create_threshold(threshold_data)


@router.put("/thresholds/{threshold_id}", response_model=schemas.WarningThreshold)
def update_threshold(
    threshold_id: int,
    update_data: schemas.WarningThresholdUpdate,
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    result = service.update_threshold(threshold_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Threshold not found")
    return result


@router.delete("/thresholds/{threshold_id}")
def delete_threshold(
    threshold_id: int,
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    if not service.delete_threshold(threshold_id):
        raise HTTPException(status_code=404, detail="Threshold not found")
    return {"success": True}


@router.get("/alerts", response_model=List[schemas.WarningAlert])
def check_alerts(
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    return service.check_all_warnings()


@router.get("/no-show-analysis")
def get_no_show_analysis(
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    return {
        "alerts": service.check_all_warnings(),
        "no_show_analysis": service.analytics.get_no_show_follow_up_analysis(),
    }


@router.post("/no-show-review/{patient_id}")
def create_no_show_review(
    patient_id: str,
    appointment_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    review = service.create_no_show_review(patient_id, appointment_id)
    if not review:
        raise HTTPException(status_code=404, detail="Patient not found or no no-show records")
    return {
        "review_id": review.review_id,
        "patient_id": review.patient_id,
        "review_materials": review.review_materials,
        "review_status": review.review_status,
    }


@router.get("/no-show-reviews")
def list_no_show_reviews(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    if status:
        reviews = db.query(models.NoShowReview).filter(
            models.NoShowReview.review_status == status
        ).order_by(models.NoShowReview.created_at.desc()).all()
    else:
        reviews = service.get_pending_reviews()
    return [
        {
            "id": r.id,
            "review_id": r.review_id,
            "patient_id": r.patient_id,
            "appointment_id": r.appointment_id,
            "no_show_date": r.no_show_date.isoformat() if r.no_show_date else None,
            "follow_up_rate": r.follow_up_rate,
            "historical_no_show_count": r.historical_no_show_count,
            "review_materials": r.review_materials,
            "review_status": r.review_status,
            "reviewer": r.reviewer,
            "review_notes": r.review_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


@router.put("/no-show-reviews/{review_id}")
def update_no_show_review(
    review_id: int,
    status: str = Query(...),
    reviewer: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    result = service.update_review_status(review_id, status, reviewer, notes)
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "review_id": result.review_id,
        "review_status": result.review_status,
        "reviewer": result.reviewer,
    }


@router.get("/no-show-review-materials/{patient_id}")
def get_no_show_review_materials(
    patient_id: str,
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn),
):
    service = WarningService(db, duck_conn)
    materials = service.generate_no_show_review_materials(patient_id)
    if not materials:
        raise HTTPException(status_code=404, detail="Patient not found")
    return materials
