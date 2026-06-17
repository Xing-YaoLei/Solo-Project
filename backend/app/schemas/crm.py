from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CRMCustomerBase(BaseModel):
    customer_no: str
    name: str
    phone: Optional[str] = None
    id_card: Optional[str] = None
    wechat_id: Optional[str] = None
    first_rent_date: Optional[datetime] = None
    last_rent_date: Optional[datetime] = None
    status: str = "active"
    batch_id: Optional[int] = None


class CRMCustomerCreate(CRMCustomerBase):
    pass


class CRMCustomer(CRMCustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    property_no: str
    address: str
    district: Optional[str] = None
    area: Optional[int] = None
    room_type: Optional[str] = None
    monthly_rent: Optional[int] = None
    batch_id: Optional[int] = None


class PropertyCreate(PropertyBase):
    pass


class Property(PropertyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
