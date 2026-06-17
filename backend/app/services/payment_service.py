from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.payment import PaymentTransaction
from app.schemas.payment import PaymentTransactionCreate


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def create_transaction(self, transaction_in: PaymentTransactionCreate) -> PaymentTransaction:
        db_transaction = PaymentTransaction(**transaction_in.model_dump())
        self.db.add(db_transaction)
        self.db.commit()
        self.db.refresh(db_transaction)
        return db_transaction

    def get_transaction(self, transaction_id: int) -> Optional[PaymentTransaction]:
        return self.db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()

    def get_transaction_by_no(self, transaction_no: str) -> Optional[PaymentTransaction]:
        return self.db.query(PaymentTransaction).filter(PaymentTransaction.transaction_no == transaction_no).first()

    def list_transactions(
        self, 
        customer_id: Optional[int] = None,
        property_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[PaymentTransaction]:
        query = self.db.query(PaymentTransaction)
        if customer_id:
            query = query.filter(PaymentTransaction.customer_id == customer_id)
        if property_id:
            query = query.filter(PaymentTransaction.property_id == property_id)
        return query.offset(skip).limit(limit).all()

    def bulk_create_transactions(self, transactions: List[PaymentTransactionCreate]) -> List[PaymentTransaction]:
        db_transactions = [PaymentTransaction(**t.model_dump()) for t in transactions]
        self.db.bulk_save_objects(db_transactions)
        self.db.commit()
        return db_transactions

    def get_overdue_transactions(self, min_overdue_days: int = 1) -> List[PaymentTransaction]:
        return self.db.query(PaymentTransaction).filter(
            PaymentTransaction.overdue_days >= min_overdue_days
        ).all()
