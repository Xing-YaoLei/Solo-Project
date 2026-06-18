from fastapi import APIRouter, Query, Depends

from app.api.v1.schemas.common import ApiResponse
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/analytics", tags=["图表分析"])


@router.get("/dashboard-summary", response_model=ApiResponse[dict])
async def get_dashboard_summary(
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    summary = mock.get_dashboard_summary()
    sync_delay_info = mock.generate_sync_delay_info()
    return ApiResponse.ok(
        data={
            "summary": summary,
            "syncDelayInfo": sync_delay_info,
            "sync_delay_info": sync_delay_info,
        }
    )


@router.get("/preparation-trend", response_model=ApiResponse[list])
async def get_preparation_trend(
    days: int = Query(30, ge=7, le=180),
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_preparation_trend(days=days)
    return ApiResponse.ok(data=data)


@router.get("/testdrive-distribution", response_model=ApiResponse[list])
async def get_testdrive_distribution(
    weeks: int = Query(12, ge=4, le=52),
    days: int | None = Query(None, ge=7, le=365),
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    actual_weeks = (days // 7) if days else weeks
    actual_weeks = max(4, min(52, actual_weeks))
    data = mock.generate_test_drive_distribution(weeks=actual_weeks)
    return ApiResponse.ok(data=data)


@router.get("/test-drive-distribution", response_model=ApiResponse[list])
async def get_test_drive_distribution_alias(
    weeks: int = Query(12, ge=4, le=52),
    days: int | None = Query(None, ge=7, le=365),
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    actual_weeks = (days // 7) if days else weeks
    actual_weeks = max(4, min(52, actual_weeks))
    data = mock.generate_test_drive_distribution(weeks=actual_weeks)
    return ApiResponse.ok(data=data)


@router.get("/risk-matrix", response_model=ApiResponse[list])
async def get_risk_matrix(
    store_id: str | None = None,
    region: str | None = None,
    days: int | None = Query(None, ge=1, le=365),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_risk_matrix_bubbles(store_id=store_id, region=region, days=days)
    return ApiResponse.ok(data=data)


@router.get("/quote-candles", response_model=ApiResponse[list])
async def get_quote_candles(
    days: int = Query(30, ge=7, le=180),
    store_id: str | None = None,
    vehicle_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_quote_candles(days=days)
    return ApiResponse.ok(data=data)


@router.get("/sync-delay", response_model=ApiResponse[list])
async def get_sync_delay_info(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_sync_delay_info()
    return ApiResponse.ok(data=data)
