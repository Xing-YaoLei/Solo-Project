from typing import List, Optional, Tuple
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.supplier import Supplier, SupplierStatus
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierQueryParams


class SupplierService:
    def get_by_id(self, db: Session, supplier_id: int) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def get_list(
        self, db: Session, params: SupplierQueryParams
    ) -> Tuple[List[Supplier], int]:
        query = db.query(Supplier)

        if params.keyword:
            query = query.filter(
                or_(
                    Supplier.name.ilike(f"%{params.keyword}%"),
                    Supplier.contact_person.ilike(f"%{params.keyword}%"),
                    Supplier.phone.ilike(f"%{params.keyword}%"),
                )
            )

        if params.status:
            query = query.filter(Supplier.status == params.status)

        if params.credit_rating:
            query = query.filter(Supplier.credit_rating == params.credit_rating)

        total = query.count()
        suppliers = query.order_by(Supplier.id.desc()).all()

        return suppliers, total

    def create(self, db: Session, obj_in: SupplierCreate) -> Supplier:
        db_obj = Supplier(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, db_obj: Supplier, obj_in: SupplierUpdate
    ) -> Supplier:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, supplier_id: int) -> bool:
        db_obj = self.get_by_id(db, supplier_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    def toggle_status(self, db: Session, supplier_id: int) -> Optional[Supplier]:
        db_obj = self.get_by_id(db, supplier_id)
        if not db_obj:
            return None
        if db_obj.status == SupplierStatus.ACTIVE:
            db_obj.status = SupplierStatus.INACTIVE
        else:
            db_obj.status = SupplierStatus.ACTIVE
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


supplier_service = SupplierService()
