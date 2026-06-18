from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional

from app.api.v1.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/vehicles", tags=["车辆"])


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    store_id: str | None = None,
    risk_level: str | None = None,
    stage: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    result = mock.get_vehicles(page=page, page_size=page_size, store_id=store_id, risk_level=risk_level)
    if stage:
        filtered_items = [v for v in result["items"] if v["stage"] == stage]
        result["items"] = filtered_items
        result["total"] = len([v for v in mock._vehicles if (not store_id or v["storeId"] == store_id) and (not risk_level or v["riskLevel"] == risk_level) and (not stage or v["stage"] == stage)])
    return ApiResponse.ok(
        data=PaginatedData(
            items=result["items"],
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"],
        )
    )


@router.get("/risk-matrix", response_model=ApiResponse[List[dict]])
async def get_risk_matrix_bubbles(
    store_id: str | None = None,
    region: str | None = None,
    days: int | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    bubbles = mock.generate_risk_matrix_bubbles(store_id=store_id, region=region, days=days)
    return ApiResponse.ok(data=bubbles)


@router.get("/document-missing-distribution", response_model=ApiResponse[List[dict]])
async def get_document_missing_distribution(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.get_document_missing_distribution()
    return ApiResponse.ok(data=data)


@router.get("/{vin}", response_model=ApiResponse[dict])
async def get_vehicle(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    vehicle = mock.get_vehicle_by_vin(vin)
    if not vehicle:
        vehicle = mock._vehicles[0] if mock._vehicles else None
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")
    store = next((s for s in mock._stores if s["id"] == vehicle["storeId"]), None)
    alerts = [a for a in mock._alerts if a["vin"] == vehicle["vin"]]
    detail = dict(vehicle)
    detail["storeName"] = store["name"] if store else ""
    detail["store_name"] = store["name"] if store else ""
    detail["store"] = store
    detail["alerts"] = alerts
    detail["documentList"] = vehicle.get("documents", [])
    detail["documents"] = vehicle.get("documents", [])
    return ApiResponse.ok(data=detail)


@router.get("/{vin}/documents", response_model=ApiResponse[List[dict]])
async def get_vehicle_documents(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    vehicle = mock.get_vehicle_by_vin(vin)
    if not vehicle:
        vehicle = mock._vehicles[0] if mock._vehicles else None
    docs = vehicle.get("documents", []) if vehicle else []
    return ApiResponse.ok(data=docs)


@router.get("/{vin}/timeline", response_model=ApiResponse[List[dict]])
async def get_vehicle_timeline(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    review_data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=review_data["timeline"])
