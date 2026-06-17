from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.contract import EContract
from app.schemas.contract import EContractCreate


class ContractService:
    def __init__(self, db: Session):
        self.db = db

    def create_contract(self, contract_in: EContractCreate) -> EContract:
        db_contract = EContract(**contract_in.model_dump())
        self.db.add(db_contract)
        self.db.commit()
        self.db.refresh(db_contract)
        return db_contract

    def get_contract(self, contract_id: int) -> Optional[EContract]:
        return self.db.query(EContract).filter(EContract.id == contract_id).first()

    def get_contract_by_no(self, contract_no: str) -> Optional[EContract]:
        return self.db.query(EContract).filter(EContract.contract_no == contract_no).first()

    def list_contracts(
        self,
        customer_id: Optional[int] = None,
        property_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[EContract]:
        query = self.db.query(EContract)
        if customer_id:
            query = query.filter(EContract.customer_id == customer_id)
        if property_id:
            query = query.filter(EContract.property_id == property_id)
        if status:
            query = query.filter(EContract.contract_status == status)
        return query.offset(skip).limit(limit).all()

    def bulk_create_contracts(self, contracts: List[EContractCreate]) -> List[EContract]:
        db_contracts = [EContract(**c.model_dump()) for c in contracts]
        self.db.bulk_save_objects(db_contracts)
        self.db.commit()
        return db_contracts
