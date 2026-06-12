from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import tempfile
import os

from app.database import get_db
from app.models import Equipment, Store, CleaningRecord, InspectionRecord
from app.etl import MemberReceiptETL, PosFlowETL, InventoryETL, DataCalibration
from app.services.duckdb_service import DuckDBService

router = APIRouter(prefix="/api/etl", tags=["etl"])

duckdb_service = DuckDBService()


def _sync_to_duckdb(db: Session):
    equipments = db.query(Equipment).all()
    stores = db.query(Store).all()
    cleaning_records = db.query(CleaningRecord).all()
    inspection_records = db.query(InspectionRecord).all()

    equip_df = pd.DataFrame([{
        "id": e.id, "equipment_code": e.equipment_code, "equipment_name": e.equipment_name,
        "equipment_type": e.equipment_type, "store_id": e.store_id, "status": e.status,
        "last_cleaning_date": e.last_cleaning_date, "next_cleaning_date": e.next_cleaning_date,
        "cleaning_cycle_days": e.cleaning_cycle_days
    } for e in equipments])

    store_df = pd.DataFrame([{
        "id": s.id, "store_code": s.store_code, "store_name": s.store_name,
        "city": s.city, "district": s.district, "status": s.status
    } for s in stores])

    cleaning_df = pd.DataFrame([{
        "id": r.id, "record_code": r.record_code, "equipment_id": r.equipment_id,
        "store_id": r.store_id, "cleaning_date": r.cleaning_date,
        "cleaning_type": r.cleaning_type, "operator": r.operator,
        "cleaning_result": r.cleaning_result, "source": r.source
    } for r in cleaning_records])

    inspection_df = pd.DataFrame([{
        "id": r.id, "record_code": r.record_code, "equipment_id": r.equipment_id,
        "store_id": r.store_id, "inspection_date": r.inspection_date,
        "inspection_type": r.inspection_type, "passed": r.passed, "score": r.score
    } for r in inspection_records])

    duckdb_service.sync_from_db(cleaning_df, inspection_df, equip_df, store_df)


@router.post("/member-receipt")
async def import_member_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        etl = MemberReceiptETL()
        df = etl.extract(tmp_path)
        df = etl.transform(df)
        records = etl.load_to_records(df)

        os.unlink(tmp_path)

        inserted = 0
        for rec in records:
            equipment = db.query(Equipment).filter(
                Equipment.equipment_code == rec["equipment_code"]
            ).first()
            store = db.query(Store).filter(Store.store_code == rec["store_code"]).first()

            if equipment and store:
                existing = db.query(CleaningRecord).filter(
                    CleaningRecord.record_code == rec["record_code"]
                ).first()
                if not existing:
                    db_record = CleaningRecord(
                        record_code=rec["record_code"],
                        equipment_id=equipment.id,
                        store_id=store.id,
                        cleaning_date=rec["cleaning_date"],
                        cleaning_type=DataCalibration.calibrate_cleaning_type(rec["cleaning_type"]),
                        operator=rec.get("operator", ""),
                        cleaning_items=rec.get("cleaning_items", ""),
                        cleaning_result=rec.get("cleaning_result", "passed"),
                        remark=rec.get("remark", ""),
                        source=rec.get("source", "member_receipt"),
                    )
                    db.add(db_record)
                    inserted += 1

        db.commit()
        _sync_to_duckdb(db)

        return {"code": 0, "message": "success", "data": {"inserted": inserted, "total": len(records)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pos-flow")
async def import_pos_flow(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        etl = PosFlowETL()
        df = etl.extract(tmp_path)
        df = etl.transform(df)
        records = etl.load_to_records(df)

        os.unlink(tmp_path)

        inserted = 0
        for rec in records:
            equipment = db.query(Equipment).filter(
                Equipment.equipment_code == rec["equipment_code"]
            ).first()
            store = db.query(Store).filter(Store.store_code == rec["store_code"]).first()

            if equipment and store:
                existing = db.query(CleaningRecord).filter(
                    CleaningRecord.record_code == rec["record_code"]
                ).first()
                if not existing:
                    db_record = CleaningRecord(
                        record_code=rec["record_code"],
                        equipment_id=equipment.id,
                        store_id=store.id,
                        cleaning_date=rec["cleaning_date"],
                        cleaning_type=DataCalibration.calibrate_cleaning_type(rec["cleaning_type"]),
                        operator=rec.get("operator", ""),
                        cleaning_result=rec.get("cleaning_result", "passed"),
                        remark=rec.get("remark", ""),
                        source=rec.get("source", "pos_flow"),
                    )
                    db.add(db_record)
                    inserted += 1

        db.commit()
        _sync_to_duckdb(db)

        return {"code": 0, "message": "success", "data": {"inserted": inserted, "total": len(records)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inventory")
async def import_inventory(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        etl = InventoryETL()
        df = etl.extract(tmp_path)
        df = etl.transform(df)
        equipment_updates = etl.load_to_equipment_updates(df)

        os.unlink(tmp_path)

        updated = 0
        created = 0
        for eq_data in equipment_updates:
            store = db.query(Store).filter(Store.store_code == eq_data["store_code"]).first()
            if not store:
                continue

            equipment = db.query(Equipment).filter(
                Equipment.equipment_code == eq_data["equipment_code"]
            ).first()

            if equipment:
                equipment.equipment_name = eq_data.get("equipment_name", equipment.equipment_name)
                equipment.equipment_type = DataCalibration.calibrate_equipment_type(
                    eq_data.get("equipment_type", equipment.equipment_type)
                )
                equipment.brand = eq_data.get("brand", equipment.brand)
                equipment.model = eq_data.get("model", equipment.model)
                equipment.status = DataCalibration.calibrate_status(eq_data.get("status", equipment.status))
                if eq_data.get("install_date"):
                    equipment.install_date = eq_data["install_date"]
                if eq_data.get("last_cleaning_date"):
                    equipment.last_cleaning_date = eq_data["last_cleaning_date"]
                if eq_data.get("next_cleaning_date"):
                    equipment.next_cleaning_date = eq_data["next_cleaning_date"]
                if eq_data.get("cleaning_cycle_days"):
                    equipment.cleaning_cycle_days = int(eq_data["cleaning_cycle_days"])
                updated += 1
            else:
                new_equipment = Equipment(
                    equipment_code=eq_data["equipment_code"],
                    equipment_name=eq_data.get("equipment_name", ""),
                    equipment_type=DataCalibration.calibrate_equipment_type(eq_data.get("equipment_type", "")),
                    store_id=store.id,
                    brand=eq_data.get("brand", ""),
                    model=eq_data.get("model", ""),
                    install_date=eq_data.get("install_date"),
                    status=DataCalibration.calibrate_status(eq_data.get("status", "normal")),
                    last_cleaning_date=eq_data.get("last_cleaning_date"),
                    next_cleaning_date=eq_data.get("next_cleaning_date"),
                    cleaning_cycle_days=int(eq_data.get("cleaning_cycle_days", 7)),
                )
                db.add(new_equipment)
                created += 1

        db.commit()
        _sync_to_duckdb(db)

        return {"code": 0, "message": "success", "data": {"created": created, "updated": updated, "total": len(equipment_updates)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync-duckdb")
def sync_duckdb(db: Session = Depends(get_db)):
    try:
        _sync_to_duckdb(db)
        return {"code": 0, "message": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
