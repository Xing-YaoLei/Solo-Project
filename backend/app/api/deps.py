from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, get_current_active_admin, get_current_active_worker
from app.models.user import User
from app.services.crm_service import CRMService
from app.services.payment_service import PaymentService
from app.services.contract_service import ContractService
from app.services.import_service import ImportService
from app.services.repair_service import RepairService


def get_crm_service(db: Session = Depends(get_db)) -> CRMService:
    return CRMService(db)


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


def get_contract_service(db: Session = Depends(get_db)) -> ContractService:
    return ContractService(db)


def get_import_service(db: Session = Depends(get_db)) -> ImportService:
    return ImportService(db)


def get_repair_service(db: Session = Depends(get_db)) -> RepairService:
    return RepairService(db)
