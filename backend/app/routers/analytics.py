from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import duckdb
from typing import Optional

from ..database import get_db, get_duckdb_conn
from ..analytics_service import AnalyticsService
from .. import schemas

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/image-archive-trend")
def get_image_archive_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    period: str = Query("monthly", pattern="^(daily|weekly|monthly|quarterly|yearly)$"),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return {
        "period": period,
        "data": service.get_image_archive_trend(start_date, end_date, period)
    }


@router.get("/image-type-distribution")
def get_image_type_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return service.get_image_type_distribution(start_date, end_date)


@router.get("/patient-archive-stats", response_model=schemas.PatientStatsResponse)
def get_patient_archive_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    archive_stats = service.get_patient_archive_stats(start_date, end_date)
    demo_stats = service.get_patient_gender_age_distribution()

    total_patients = archive_stats['total_patients']
    active_patients = archive_stats['patients_with_archive']

    from sqlalchemy import func
    from datetime import datetime, timedelta
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    from .. import models
    new_patients = db.query(models.Patient).filter(
        models.Patient.first_visit_date >= three_months_ago.date()
    ).count()

    visit_counts = db.query(
        models.Appointment.patient_id,
        func.count(models.Appointment.id).label('count')
    ).filter(
        models.Appointment.status == 'completed'
    ).group_by(models.Appointment.patient_id).all()

    avg_visits = sum(v.count for v in visit_counts) / len(visit_counts) if visit_counts else 0.0

    return schemas.PatientStatsResponse(
        total_patients=total_patients,
        new_patients=new_patients,
        active_patients=active_patients,
        avg_visits_per_patient=round(avg_visits, 2),
        gender_distribution=demo_stats['gender_distribution'],
        age_distribution=demo_stats['age_distribution']
    )


@router.get("/medical-record-stats", response_model=schemas.MedicalRecordStatsResponse)
def get_medical_record_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    stats = service.get_medical_record_stats(start_date, end_date)
    return schemas.MedicalRecordStatsResponse(
        total_records=stats['total_records'],
        records_with_images=stats['records_with_images'],
        avg_treatment_items=0.0,
        top_diagnoses=stats['top_diagnoses'],
        department_distribution=stats['department_distribution']
    )


@router.get("/treatment-plan-stats", response_model=schemas.TreatmentPlanStatsResponse)
def get_treatment_plan_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    stats = service.get_treatment_plan_stats(start_date, end_date)
    return schemas.TreatmentPlanStatsResponse(
        total_plans=stats['total_plans'],
        completed_plans=stats['completed_plans'],
        pending_plans=stats['pending_plans'],
        avg_estimated_cost=stats['avg_estimated_cost'],
        priority_distribution=stats['priority_distribution'],
        completion_rate=stats['completion_rate']
    )


@router.get("/department-archive-trend")
def get_department_archive_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return service.get_department_archive_trend(start_date, end_date)


@router.get("/no-show-follow-up-analysis")
def get_no_show_follow_up_analysis(
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return service.get_no_show_follow_up_analysis()


@router.get("/daily-archive-volume")
def get_daily_archive_volume(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return service.get_daily_archive_volume(days)


@router.post("/refresh")
def refresh_analytics(
    db: Session = Depends(get_db),
    duck_conn: duckdb.DuckDBPyConnection = Depends(get_duckdb_conn)
):
    service = AnalyticsService(duck_conn, db)
    return service.refresh_analytics()
