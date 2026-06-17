from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EContractBase(BaseModel):
    contract_no: str
    customer_id: int
    property_id: int
    start_date: datetime
    end_date: datetime
    monthly_rent: int
    deposit_amount: Optional[int] = None
    contract_status: str = "active"
    sign_date: Optional[datetime] = None
    batch_id: Optional[int] = None


class EContractCreate(EContractBase):
    pass


class EContract(EContractBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
