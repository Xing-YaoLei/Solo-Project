from sqlalchemy.orm import Session
from app.models import InventoryRecord, SafetyStockConfig


def get_records_by_batch(db: Session, batch_id: str):
    return (
        db.query(InventoryRecord)
        .filter(InventoryRecord.batch_id == batch_id)
        .order_by(InventoryRecord.created_at.desc())
        .all()
    )


def list_safety_stocks(db: Session, region: str | None = None):
    query = db.query(SafetyStockConfig)
    if region:
        query = query.filter(SafetyStockConfig.region == region)
    return query.order_by(SafetyStockConfig.material_name).all()
