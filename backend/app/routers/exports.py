from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from io import BytesIO

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.elder import Elder
from app.models.medication import Medication
from app.models.visit import VisitRecord
from app.models.activity import Activity, ActivitySignIn
from app.models.risk import RiskEvent
from app.models.incident import IncidentOrder
from app.utils.export import ExportManager
from app.utils.audit import AuditLogger

router = APIRouter(prefix="/api/exports", tags=["导出"])

EXPORT_TYPES = ["elders", "medications", "visit_records", "activities", "risk_events", "incident_orders"]


def get_export_data(export_type: str, db: Session) -> list:
    if export_type == "elders":
        elders = db.query(Elder).order_by(Elder.created_at.desc()).all()
        return [{
            "name": e.name,
            "gender": e.gender,
            "birth_date": str(e.birth_date) if e.birth_date else "",
            "id_card": e.id_card,
            "phone": e.phone or "",
            "emergency_contact": e.emergency_contact or "",
            "emergency_phone": e.emergency_phone or "",
            "health_status": e.health_status,
            "care_level": e.care_level,
            "room_number": e.room_number or "",
            "bed_number": e.bed_number or "",
            "admission_date": str(e.admission_date) if e.admission_date else "",
            "status": e.status,
        } for e in elders]

    elif export_type == "medications":
        medications = db.query(Medication).order_by(Medication.created_at.desc()).all()
        return [{
            "elder_name": med.elder.name if med.elder else "",
            "drug_name": med.drug_name,
            "generic_name": med.generic_name or "",
            "dosage": med.dosage,
            "frequency": med.frequency,
            "route": med.route,
            "start_date": str(med.start_date) if med.start_date else "",
            "end_date": str(med.end_date) if med.end_date else "",
            "prescribing_doctor": med.prescribing_doctor or "",
            "purpose": med.purpose or "",
            "status": med.status,
        } for med in medications]

    elif export_type == "visit_records":
        visits = db.query(VisitRecord).order_by(VisitRecord.visit_date.desc(), VisitRecord.visit_time.desc()).all()
        return [{
            "elder_name": v.elder.name if v.elder else "",
            "visit_date": str(v.visit_date),
            "visit_time": str(v.visit_time),
            "visit_duration": v.visit_duration or 0,
            "visit_type": v.visit_type,
            "visitor_name": v.visitor_name or "",
            "visitor_relation": v.visitor_relation or "",
            "physical_condition": v.physical_condition or "",
            "mental_condition": v.mental_condition or "",
            "elder_mood": v.elder_mood or "",
            "status": v.status,
        } for v in visits]

    elif export_type == "activities":
        sign_ins = db.query(ActivitySignIn).order_by(ActivitySignIn.created_at.desc()).all()
        return [{
            "activity_name": si.activity.name if si.activity else "",
            "activity_type": si.activity.activity_type if si.activity else "",
            "activity_date": str(si.activity.activity_date) if si.activity and si.activity.activity_date else "",
            "start_time": str(si.activity.start_time) if si.activity and si.activity.start_time else "",
            "end_time": str(si.activity.end_time) if si.activity and si.activity.end_time else "",
            "location": si.activity.location if si.activity and si.activity.location else "",
            "elder_name": si.elder.name if si.elder else "",
            "sign_in_time": str(si.sign_in_time) if si.sign_in_time else "",
            "sign_out_time": str(si.sign_out_time) if si.sign_out_time else "",
            "participation_status": si.participation_status,
            "performance_rating": si.performance_rating or "",
        } for si in sign_ins]

    elif export_type == "risk_events":
        events = db.query(RiskEvent).order_by(RiskEvent.event_date.desc(), RiskEvent.event_time.desc()).all()
        return [{
            "elder_name": e.elder.name if e.elder else "",
            "event_type": e.event_type,
            "event_level": e.event_level,
            "event_date": str(e.event_date),
            "event_time": str(e.event_time),
            "location": e.location or "",
            "description": e.description,
            "injuries": e.injuries or "",
            "immediate_measures": e.immediate_measures or "",
            "status": e.status,
            "handling_result": e.handling_result or "",
        } for e in events]

    elif export_type == "incident_orders":
        orders = db.query(IncidentOrder).order_by(IncidentOrder.created_at.desc()).all()
        return [{
            "order_no": o.order_no,
            "elder_name": o.elder.name if o.elder else "",
            "incident_type": o.incident_type,
            "severity": o.severity,
            "incident_date": str(o.incident_date),
            "incident_time": str(o.incident_time),
            "location": o.location or "",
            "impact_scope": o.impact_scope,
            "responsibility": o.responsibility,
            "responsible_person": o.responsible_person or "",
            "handling_result": o.handling_result,
            "preventive_measures": o.preventive_measures or "",
            "status": o.status,
        } for o in orders]

    else:
        raise ValueError(f"不支持的导出类型: {export_type}")


@router.get("/{export_type}")
async def get_export_caliber(
    export_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if export_type not in EXPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"不支持的导出类型: {export_type}")

    try:
        caliber = ExportManager.get_export_caliber(export_type)
        definition = ExportManager.EXPORT_DEFINITIONS[export_type]
        return {
            "export_type": export_type,
            "title": definition["title"],
            "caliber": caliber,
            "columns": [col[0] for col in definition["columns"]]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{export_type}")
async def export_excel(
    export_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if export_type not in EXPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"不支持的导出类型: {export_type}")

    try:
        data = get_export_data(export_type, db)
        output = ExportManager.export_to_excel(export_type, data)

        audit_logger = AuditLogger(db, user_id=current_user.id)
        audit_logger.log_create("export", 0, {
            "export_type": export_type,
            "record_count": len(data),
            "export_time": datetime.now().isoformat()
        }, remark=f"导出{export_type}数据，共{len(data)}条记录")

        definition = ExportManager.EXPORT_DEFINITIONS[export_type]
        filename = f"{definition['title']}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{filename.encode('utf-8').decode('latin-1')}"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
