from app.schemas.user import LoginRequest, TokenResponse, UserResponse
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.material_batch import (
    MaterialBatchCreate,
    MaterialBatchUpdate,
    MaterialBatchResponse,
    MaterialBatchQueryParams,
    PaginatedResponse,
)
from app.schemas.inventory_record import InventoryRecordCreate, InventoryRecordResponse
from app.schemas.usage_rule import UsageRuleCreate, UsageRuleUpdate, UsageRuleResponse
from app.schemas.inventory_threshold import (
    InventoryThresholdCreate,
    InventoryThresholdUpdate,
    InventoryThresholdResponse,
)
from app.schemas.safety_stock import SafetyStockCreate, SafetyStockUpdate, SafetyStockResponse
from app.schemas.shortage_order import (
    ShortageOrderCreate,
    ShortageOrderUpdate,
    ShortageOrderResponse,
    ShortageHandleRequest,
    ShortageActionLogResponse,
)
from app.schemas.analytics import (
    DashboardStatsResponse,
    TrendPoint,
    TurnoverAnalysisRow,
    RegionDistribution,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "SupplierCreate",
    "SupplierUpdate",
    "SupplierResponse",
    "MaterialBatchCreate",
    "MaterialBatchUpdate",
    "MaterialBatchResponse",
    "MaterialBatchQueryParams",
    "PaginatedResponse",
    "InventoryRecordCreate",
    "InventoryRecordResponse",
    "UsageRuleCreate",
    "UsageRuleUpdate",
    "UsageRuleResponse",
    "InventoryThresholdCreate",
    "InventoryThresholdUpdate",
    "InventoryThresholdResponse",
    "SafetyStockCreate",
    "SafetyStockUpdate",
    "SafetyStockResponse",
    "ShortageOrderCreate",
    "ShortageOrderUpdate",
    "ShortageOrderResponse",
    "ShortageHandleRequest",
    "ShortageActionLogResponse",
    "DashboardStatsResponse",
    "TrendPoint",
    "TurnoverAnalysisRow",
    "RegionDistribution",
]
