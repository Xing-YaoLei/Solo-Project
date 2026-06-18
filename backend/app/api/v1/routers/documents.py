from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from app.api.v1.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/documents", tags=["过户材料"])


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    vehicle_id: str | None = None,
    status: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    all_docs = []
    for v in mock._vehicles:
        for d in v.get("documents", []):
            doc = dict(d)
            doc["vehicleId"] = v["id"]
            doc["vehicle_id"] = v["id"]
            doc["vin"] = v["vin"]
            all_docs.append(doc)
    if vehicle_id:
        all_docs = [d for d in all_docs if d["vehicleId"] == vehicle_id]
    if status:
        all_docs = [d for d in all_docs if d["status"] == status]
    total = len(all_docs)
    start = (page - 1) * page_size
    end = start + page_size
    items = all_docs[start:end]
    return ApiResponse.ok(
        data=PaginatedData(items=items, total=total, page=page, page_size=page_size)
    )


@router.get("/missing/distribution", response_model=ApiResponse[List[dict]])
async def get_missing_distribution(
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.get_document_missing_distribution()
    return ApiResponse.ok(data=data)


@router.get("/{document_id}", response_model=ApiResponse[dict])
async def get_document(
    document_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    for v in mock._vehicles:
        for d in v.get("documents", []):
            if d["id"] == document_id:
                doc = dict(d)
                doc["vehicleId"] = v["id"]
                doc["vehicle_id"] = v["id"]
                doc["vin"] = v["vin"]
                return ApiResponse.ok(data=doc)
    return ApiResponse.ok(data=None)


@router.post("/{document_id}/verify", response_model=ApiResponse[bool])
async def verify_document(
    document_id: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    for v in mock._vehicles:
        for d in v.get("documents", []):
            if d["id"] == document_id:
                d["verified"] = True
                d["verified_at"] = __import__("datetime").datetime.now().isoformat()
                d["verified_by"] = "admin"
                return ApiResponse.ok(data=True, message="材料验证成功")
    return ApiResponse.ok(data=False, message="材料不存在")


@router.post("/scan", response_model=ApiResponse[dict])
async def scan_missing_documents(
    store_id: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    vehicles = mock._vehicles
    if store_id:
        vehicles = [v for v in vehicles if v["storeId"] == store_id]
    missing_count = 0
    missing_details = []
    for v in vehicles:
        for d in v.get("documents", []):
            if d["status"] == "missing":
                missing_count += 1
                missing_details.append({
                    "vin": v["vin"],
                    "docType": d["doc_type"],
                    "docName": d["display_name"],
                })
    return ApiResponse.ok(
        data={
            "scannedCount": len(vehicles),
            "scanned_count": len(vehicles),
            "missingCount": missing_count,
            "missing_count": missing_count,
            "missingDetails": missing_details[:50],
            "missing_details": missing_details[:50],
        },
        message=f"扫描完成，发现 {missing_count} 项缺失"
    )
