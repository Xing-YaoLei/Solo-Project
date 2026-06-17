from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class ContractAttachmentBase(BaseModel):
    contract_id: int
    file_name: str
    file_type: Optional[str] = None
    category: Optional[str] = None
    is_contract: bool = False


class ContractAttachmentCreate(ContractAttachmentBase):
    file_path: str
    file_size: Optional[int] = None


class ContractAttachmentUpdate(BaseModel):
    file_name: Optional[str] = None
    category: Optional[str] = None
    is_contract: Optional[bool] = None


class ContractAttachmentResponse(ContractAttachmentBase):
    id: int
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractBase(BaseModel):
    contract_no: str = Field(..., max_length=50)
    project_name: str = Field(..., max_length=200)
    client_name: str = Field(..., max_length=100)
    client_phone: Optional[str] = None
    address: Optional[str] = None
    house_type: Optional[str] = None
    area: Optional[Decimal] = None
    contract_amount: Decimal
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = "draft"
    manager_id: Optional[int] = None
    sales_id: Optional[int] = None
    designer_id: Optional[int] = None
    remark: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    address: Optional[str] = None
    house_type: Optional[str] = None
    area: Optional[Decimal] = None
    contract_amount: Optional[Decimal] = None
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None
    sales_id: Optional[int] = None
    designer_id: Optional[int] = None
    remark: Optional[str] = None


class ContractResponse(ContractBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attachments: Optional[List[ContractAttachmentResponse]] = None

    class Config:
        from_attributes = True
