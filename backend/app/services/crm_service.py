from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.crm import CRMCustomer, Property
from app.schemas.crm import CRMCustomerCreate, PropertyCreate


class CRMService:
    def __init__(self, db: Session):
        self.db = db

    def create_customer(self, customer_in: CRMCustomerCreate) -> CRMCustomer:
        db_customer = CRMCustomer(**customer_in.model_dump())
        self.db.add(db_customer)
        self.db.commit()
        self.db.refresh(db_customer)
        return db_customer

    def get_customer(self, customer_id: int) -> Optional[CRMCustomer]:
        return self.db.query(CRMCustomer).filter(CRMCustomer.id == customer_id).first()

    def get_customer_by_no(self, customer_no: str) -> Optional[CRMCustomer]:
        return self.db.query(CRMCustomer).filter(CRMCustomer.customer_no == customer_no).first()

    def list_customers(self, skip: int = 0, limit: int = 100) -> List[CRMCustomer]:
        return self.db.query(CRMCustomer).offset(skip).limit(limit).all()

    def create_property(self, property_in: PropertyCreate) -> Property:
        db_property = Property(**property_in.model_dump())
        self.db.add(db_property)
        self.db.commit()
        self.db.refresh(db_property)
        return db_property

    def get_property(self, property_id: int) -> Optional[Property]:
        return self.db.query(Property).filter(Property.id == property_id).first()

    def get_property_by_no(self, property_no: str) -> Optional[Property]:
        return self.db.query(Property).filter(Property.property_no == property_no).first()

    def list_properties(self, skip: int = 0, limit: int = 100) -> List[Property]:
        return self.db.query(Property).offset(skip).limit(limit).all()

    def bulk_create_customers(self, customers: List[CRMCustomerCreate]) -> List[CRMCustomer]:
        db_customers = [CRMCustomer(**c.model_dump()) for c in customers]
        self.db.bulk_save_objects(db_customers)
        self.db.commit()
        return db_customers

    def bulk_create_properties(self, properties: List[PropertyCreate]) -> List[Property]:
        db_properties = [Property(**p.model_dump()) for p in properties]
        self.db.bulk_save_objects(db_properties)
        self.db.commit()
        return db_properties
