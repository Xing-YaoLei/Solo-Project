import pandas as pd
from sqlalchemy.orm import Session

from app.models import Equipment, Store, CleaningRecord, InspectionRecord
from app.services.duckdb_service import DuckDBService

duckdb_service = DuckDBService()


def sync_to_duckdb(db: Session):
    equipments = db.query(Equipment).all()
    stores = db.query(Store).all()
    cleaning_records = db.query(CleaningRecord).all()
    inspection_records = db.query(InspectionRecord).all()

    equip_df = pd.DataFrame([{
        "id": e.id, "equipment_code": e.equipment_code, "equipment_name": e.equipment_name,
        "equipment_type": e.equipment_type, "store_id": e.store_id, "status": e.status,
        "last_cleaning_date": e.last_cleaning_date, "next_cleaning_date": e.next_cleaning_date,
        "cleaning_cycle_days": e.cleaning_cycle_days
    } for e in equipments]) if equipments else pd.DataFrame()

    store_df = pd.DataFrame([{
        "id": s.id, "store_code": s.store_code, "store_name": s.store_name,
        "city": s.city, "district": s.district, "status": s.status
    } for s in stores]) if stores else pd.DataFrame()

    cleaning_df = pd.DataFrame([{
        "id": r.id, "record_code": r.record_code, "equipment_id": r.equipment_id,
        "store_id": r.store_id, "cleaning_date": r.cleaning_date,
        "cleaning_type": r.cleaning_type, "operator": r.operator,
        "cleaning_result": r.cleaning_result, "source": r.source
    } for r in cleaning_records]) if cleaning_records else pd.DataFrame()

    inspection_df = pd.DataFrame([{
        "id": r.id, "record_code": r.record_code, "equipment_id": r.equipment_id,
        "store_id": r.store_id, "inspection_date": r.inspection_date,
        "inspector": r.inspector, "inspection_type": r.inspection_type,
        "passed": r.passed, "score": r.score,
        "issues_found": r.issues_found, "improvement_suggestions": r.improvement_suggestions
    } for r in inspection_records]) if inspection_records else pd.DataFrame()

    duckdb_service.sync_from_db(cleaning_df, inspection_df, equip_df, store_df)
