from fastapi import APIRouter, Depends, Query, HTTPException, Body
from typing import List, Optional

from app.api.v1.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/alerts", tags=["预警"])


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    store_id: str | None = None,
    level: str | None = None,
    resolved: bool | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    result = mock.get_alerts(page=page, page_size=page_size, level=level, resolved=resolved, store_id=store_id)
    return ApiResponse.ok(
        data=PaginatedData(
            items=result["items"],
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"],
        )
    )


@router.get("/stats", response_model=ApiResponse[dict])
async def get_alert_stats(
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_alert_stats()
    return ApiResponse.ok(data=stats)


@router.get("/realtime", response_model=ApiResponse[List[dict]])
async def get_realtime_alerts(
    limit: int = Query(50, ge=1, le=200),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    result = mock.get_alerts(page=1, page_size=limit)
    return ApiResponse.ok(data=result["items"])


@router.get("/{alert_id}", response_model=ApiResponse[dict])
async def get_alert(
    alert_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    for a in mock._alerts:
        if a["id"] == alert_id:
            return ApiResponse.ok(data=a)
    raise HTTPException(status_code=404, detail="预警不存在")


@router.post("/{alert_id}/acknowledge", response_model=ApiResponse[dict])
async def acknowledge_alert(
    alert_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    success = mock.update_alert_acknowledge(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="预警不存在")
    for a in mock._alerts:
        if a["id"] == alert_id:
            return ApiResponse.ok(data=a, message="预警已确认")
    raise HTTPException(status_code=404, detail="预警不存在")


@router.post("/{alert_id}/resolve", response_model=ApiResponse[dict])
async def resolve_alert(
    alert_id: str,
    notes: str | None = Body(default=None),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    success = mock.update_alert_resolve(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="预警不存在")
    for a in mock._alerts:
        if a["id"] == alert_id:
            if notes:
                a["resolutionNotes"] = notes
                a["resolution_notes"] = notes
            return ApiResponse.ok(data=a, message="预警已处理")
    raise HTTPException(status_code=404, detail="预警不存在")
