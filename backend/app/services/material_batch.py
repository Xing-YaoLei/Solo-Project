from sqlalchemy.orm import Session
from app.models import MaterialBatch


def list_batches(db: Session):
    return db.query(MaterialBatch)
