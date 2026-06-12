from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class InventoryVersionBase(BaseModel):
    version_number: int
    batch_id: str
    snapshot_date: datetime
    store_id: int
    source_system: Optional[str] = None
    sync_delay_minutes: Optional[int] = 0
    is_active: Optional[bool] = True

class InventoryVersionCreate(InventoryVersionBase):
    pass

class InventoryVersion(InventoryVersionBase):
    id: int
    sync_timestamp: Optional[datetime] = None
    record_count: Optional[int] = 0
    total_value: Optional[float] = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

class InventoryItemBase(BaseModel):
    version_id: int
    sku_code: str
    sku_name: str
    category: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    cleaning_item_flag: Optional[bool] = False
    extra_data: Optional[Dict[str, Any]] = {}

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class InventoryVersionDiff(BaseModel):
    sku_code: str
    sku_name: Optional[str] = None
    category: Optional[str] = None
    v1_quantity: Optional[float] = None
    v2_quantity: Optional[float] = None
    qty_diff: Optional[float] = None
    qty_diff_pct: Optional[float] = None
    v1_total: Optional[float] = None
    v2_total: Optional[float] = None
    total_diff: Optional[float] = None
    change_type: str

class POSVersionBase(BaseModel):
    version_number: int
    batch_id: str
    business_date: datetime
    store_id: int
    source_system: Optional[str] = None
    sync_delay_minutes: Optional[int] = 0
    is_active: Optional[bool] = True

class POSVersionCreate(POSVersionBase):
    pass

class POSVersion(POSVersionBase):
    id: int
    sync_timestamp: Optional[datetime] = None
    transaction_count: Optional[int] = 0
    total_amount: Optional[float] = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

class POSTransactionBase(BaseModel):
    version_id: int
    txn_id: str
    txn_time: datetime
    member_id: Optional[str] = None
    total_amount: float
    pay_amount: float
    pay_method: Optional[str] = None
    is_cancelled: Optional[bool] = False

class POSTransactionCreate(POSTransactionBase):
    pass

class POSTransaction(POSTransactionBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class POSTransactionItemBase(BaseModel):
    sku_code: str
    sku_name: str
    quantity: float
    unit_price: float
    subtotal: float

class POSTransactionItemCreate(POSTransactionItemBase):
    pass

class POSVersionDiff(BaseModel):
    business_date: Optional[datetime] = None
    v1_txn_count: Optional[int] = None
    v2_txn_count: Optional[int] = None
    txn_count_diff: Optional[int] = None
    v1_total: Optional[float] = None
    v2_total: Optional[float] = None
    total_diff: Optional[float] = None
    total_diff_pct: Optional[float] = None
    change_type: str

class DataConflictBase(BaseModel):
    conflict_type: str
    business_date: datetime
    store_id: int
    ref_id_1: Optional[str] = None
    ref_id_2: Optional[str] = None
    field_name: Optional[str] = None
    source_1: Optional[str] = None
    source_2: Optional[str] = None
    value_1: Optional[Any] = None
    value_2: Optional[Any] = None
    value_diff: Optional[str] = None
    severity: Optional[str] = "medium"
    description: Optional[str] = None

class DataConflictCreate(DataConflictBase):
    pass

class DataConflict(DataConflictBase):
    id: int
    status: str
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ConflictDetail(BaseModel):
    conflict_type: str
    pos_txn_id: Optional[str] = None
    member_receipt_no: Optional[str] = None
    pos_member_id: Optional[str] = None
    member_id: Optional[str] = None
    business_date: Optional[datetime] = None
    txn_time: Optional[datetime] = None
    pos_total: Optional[float] = None
    member_total: Optional[float] = None
    amount_diff: Optional[float] = None
    description: Optional[str] = None

class ConflictDetectionResponse(BaseModel):
    summary: Dict[str, Any]
    details: List[ConflictDetail]
