from fastapi import APIRouter, Depends, Query, HTTPException, Body
from typing import List, Optional
from pydantic import BaseModel

from app.api.v1.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/rules", tags=["预警规则"])


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    dsl_expression: Optional[str] = None
    expression: Optional[str] = None
    default_level: Optional[str] = None
    level: Optional[str] = None
    enabled: Optional[bool] = True
    params: Optional[dict] = None


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dsl_expression: Optional[str] = None
    expression: Optional[str] = None
    default_level: Optional[str] = None
    level: Optional[str] = None
    enabled: Optional[bool] = None
    params: Optional[dict] = None


class ThresholdCreate(BaseModel):
    id: Optional[str] = None
    documentType: Optional[str] = None
    docType: Optional[str] = None
    name: Optional[str] = None
    warningDays: Optional[int] = None
    warning_days: Optional[int] = None
    criticalDays: Optional[int] = None
    critical_days: Optional[int] = None
    escalationInterval: Optional[int] = 24
    escalation_interval: Optional[int] = 24
    enabled: Optional[bool] = True
    stageRequired: Optional[str] = None
    stage_required: Optional[str] = None


class ThresholdUpdate(BaseModel):
    documentType: Optional[str] = None
    docType: Optional[str] = None
    name: Optional[str] = None
    warningDays: Optional[int] = None
    warning_days: Optional[int] = None
    criticalDays: Optional[int] = None
    critical_days: Optional[int] = None
    escalationInterval: Optional[int] = None
    escalation_interval: Optional[int] = None
    enabled: Optional[bool] = None
    stageRequired: Optional[str] = None
    stage_required: Optional[str] = None


class ThresholdToggle(BaseModel):
    enabled: Optional[bool] = None


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    enabled: bool | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    rules = mock.get_rules()
    if enabled is not None:
        rules = [r for r in rules if r["enabled"] == enabled]
    total = len(rules)
    start = (page - 1) * page_size
    end = start + page_size
    items = rules[start:end]
    return ApiResponse.ok(
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/thresholds", response_model=ApiResponse[List[dict]])
async def get_warning_thresholds(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    thresholds = [
        {"ruleName": "行驶证缺失超7天", "docType": "driving_license", "threshold": 7, "unit": "天", "level": "high"},
        {"ruleName": "登记证书缺失", "docType": "registration_cert", "threshold": 0, "unit": "天", "level": "medium"},
        {"ruleName": "库龄超60天未过户", "threshold": 60, "unit": "天", "level": "critical"},
        {"ruleName": "材料完整度低于50%", "threshold": 50, "unit": "%", "level": "high"},
        {"ruleName": "保单30天内到期", "docType": "insurance_policy", "threshold": 30, "unit": "天", "level": "low"},
    ]
    return ApiResponse.ok(data=thresholds)


@router.get("/thresholds/full", response_model=ApiResponse[List[dict]])
async def get_warning_thresholds_full(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.get_warning_thresholds_full()
    return ApiResponse.ok(data=data)


@router.put("/thresholds/{threshold_id}", response_model=ApiResponse[dict])
async def update_threshold(
    threshold_id: str,
    data: ThresholdUpdate,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    update_dict = data.model_dump(exclude_unset=True)
    update_dict["id"] = threshold_id
    updated = mock.upsert_warning_threshold(update_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="阈值不存在")
    return ApiResponse.ok(data=updated, message="阈值更新成功")


@router.post("/thresholds", response_model=ApiResponse[dict])
async def create_threshold(
    data: ThresholdCreate,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    create_dict = data.model_dump(exclude_unset=True)
    new_threshold = mock.upsert_warning_threshold(create_dict)
    return ApiResponse.ok(data=new_threshold, message="阈值创建成功")


@router.patch("/thresholds/{threshold_id}/toggle", response_model=ApiResponse[dict])
async def toggle_threshold(
    threshold_id: str,
    body: ThresholdToggle = Body(default_factory=ThresholdToggle),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    toggled = mock.toggle_warning_threshold(threshold_id, body.enabled)
    if not toggled:
        raise HTTPException(status_code=404, detail="阈值不存在")
    return ApiResponse.ok(data=toggled, message=f"阈值已{'启用' if toggled['enabled'] else '禁用'}")


@router.get("/{rule_id}", response_model=ApiResponse[dict])
async def get_rule(
    rule_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    rule = mock.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return ApiResponse.ok(data=rule)


@router.post("", response_model=ApiResponse[dict])
async def create_rule(
    data: RuleCreate,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    new_rule = mock.create_rule(data.model_dump())
    return ApiResponse.ok(data=new_rule, message="规则创建成功")


@router.put("/{rule_id}", response_model=ApiResponse[dict])
async def update_rule(
    rule_id: str,
    data: RuleUpdate,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    update_dict = data.model_dump(exclude_unset=True)
    updated = mock.update_rule(rule_id, update_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="规则不存在")
    return ApiResponse.ok(data=updated, message="规则更新成功")


@router.post("/{rule_id}/dry-run", response_model=ApiResponse[dict])
async def dry_run_rule(
    rule_id: str,
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    rule = mock.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    result = mock.dry_run_rule(rule_id)
    return ApiResponse.ok(data=result)


@router.patch("/{rule_id}/toggle", response_model=ApiResponse[dict])
async def toggle_rule(
    rule_id: str,
    body: dict = Body(default_factory=dict),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    rule = mock.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    enabled = body.get("enabled", not rule["enabled"])
    updated = mock.toggle_rule(rule_id, enabled)
    return ApiResponse.ok(data=updated, message=f"规则已{'启用' if enabled else '禁用'}")
