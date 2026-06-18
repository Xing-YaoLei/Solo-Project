from sqlalchemy.orm import Session
from app.models import Supplier


def list_suppliers(db: Session, keyword: str | None = None, status: str | None = None):
    query = db.query(Supplier)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            (Supplier.name.like(like))
            | (Supplier.contact_person.like(like))
            | (Supplier.phone.like(like))
        )
    if status:
        query = query.filter(Supplier.status == status)
    return query
