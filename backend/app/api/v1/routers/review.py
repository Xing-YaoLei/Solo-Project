from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional

from app.api.v1.schemas.common import ApiResponse
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/review", tags=["复盘材料"])


@router.get("/{vin}", response_model=ApiResponse[dict])
async def get_review_package(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=data)


@router.get("/{vin}/timeline", response_model=ApiResponse[List[dict]])
async def get_review_timeline(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=data["timeline"])


@router.get("/{vin}/preparation", response_model=ApiResponse[List[dict]])
async def get_review_preparation(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=data["preparation_records"])


@router.get("/{vin}/test-drives", response_model=ApiResponse[List[dict]])
async def get_review_test_drives(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=data["test_drive_records"])


@router.get("/{vin}/quotes", response_model=ApiResponse[List[dict]])
async def get_review_quotes(
    vin: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_review_data(vin)
    return ApiResponse.ok(data=data["quote_records"])


@router.get("/{vin}/export", response_model=ApiResponse[dict])
async def export_review(
    vin: str,
    format: str = Query("pdf", pattern="^(pdf|excel)$"),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    import uuid
    download_url = f"/tmp/report-{vin}-{uuid.uuid4().hex[:8]}.{format}"
    return ApiResponse.ok(
        data={
            "downloadUrl": download_url,
            "download_url": download_url,
            "filename": f"复盘报告-{vin}.{format}",
            "format": format,
            "fileSize": f"{(len(vin) * 15000 + 500000) // 1024} KB",
            "file_size": f"{(len(vin) * 15000 + 500000) // 1024} KB",
            "generatedAt": __import__("datetime").datetime.now().isoformat(),
            "generated_at": __import__("datetime").datetime.now().isoformat(),
        },
        message="报告生成成功",
    )
