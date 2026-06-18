from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional

from app.api.v1.schemas.common import ApiResponse, PaginationParams, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/stores", tags=["门店"])


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_stores(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    region: str | None = Query(None),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stores = mock.get_stores()
    if region:
        stores = [s for s in stores if s["region"] == region]
    total = len(stores)
    start = (page - 1) * page_size
    end = start + page_size
    items = stores[start:end]
    return ApiResponse.ok(
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/geo/map-data", response_model=ApiResponse[List[dict]])
async def get_store_geo_map_data(
    region: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stores = mock.get_stores()
    if region:
        stores = [s for s in stores if s["region"] == region]
    result = []
    for s in stores:
        result.append({
            "id": s["id"],
            "name": s["name"],
            "code": s["code"],
            "region": s["region"],
            "address": s["address"],
            "lng": s["lng"],
            "lat": s["lat"],
            "risk": s["riskScore"],
            "riskScore": s["riskScore"],
            "inStock": s["inStockCount"],
            "inStockCount": s["inStockCount"],
            "alertCount": s["alertCount"],
            "value": s["inStockCount"],
        })
    return ApiResponse.ok(data=result)


@router.get("/{store_id}", response_model=ApiResponse[dict])
async def get_store(
    store_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    store = mock.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    vehicles_in_store = [v for v in mock.get_vehicles(1, 1000)["items"] if v["storeId"] == store_id]
    alerts_in_store = [a for a in mock.get_alerts(1, 1000)["items"] if a["storeId"] == store_id]
    detail = dict(store)
    detail["vehicles"] = vehicles_in_store
    detail["alerts"] = alerts_in_store
    detail["metrics"] = {
        "inStockCount": len(vehicles_in_store),
        "in_stock_count": len(vehicles_in_store),
        "alertCount": len(alerts_in_store),
        "alert_count": len(alerts_in_store),
        "documentCompletionAvg": round(sum(v["documentCompletion"] for v in vehicles_in_store) / len(vehicles_in_store), 1) if vehicles_in_store else 0,
        "document_completion_avg": round(sum(v["documentCompletion"] for v in vehicles_in_store) / len(vehicles_in_store), 1) if vehicles_in_store else 0,
        "riskScore": store["riskScore"],
        "risk_score": store["riskScore"],
        "highRiskCount": len([v for v in vehicles_in_store if v["riskLevel"] in ("high", "critical")]),
        "high_risk_count": len([v for v in vehicles_in_store if v["riskLevel"] in ("high", "critical")]),
    }
    return ApiResponse.ok(data=detail)


@router.get("/{store_id}/metrics", response_model=ApiResponse[dict])
async def get_store_metrics(
    store_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    store = mock.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    vehicles_in_store = [v for v in mock.get_vehicles(1, 1000)["items"] if v["storeId"] == store_id]
    alerts_in_store = [a for a in mock.get_alerts(1, 1000)["items"] if a["storeId"] == store_id]
    return ApiResponse.ok(
        data={
            "inStockCount": len(vehicles_in_store),
            "in_stock_count": len(vehicles_in_store),
            "alertCount": len(alerts_in_store),
            "alert_count": len(alerts_in_store),
            "documentCompletionAvg": round(sum(v["documentCompletion"] for v in vehicles_in_store) / len(vehicles_in_store), 1) if vehicles_in_store else 0,
            "document_completion_avg": round(sum(v["documentCompletion"] for v in vehicles_in_store) / len(vehicles_in_store), 1) if vehicles_in_store else 0,
            "riskScore": store["riskScore"],
            "risk_score": store["riskScore"],
        }
    )
