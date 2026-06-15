from fastapi import APIRouter, Query
from typing import List
from ..services.analytics_service import get_refresh_info
from ..schemas.analytics import RefreshInfoResponse

router = APIRouter(prefix="/meta", tags=["元信息"])


@router.get("/refresh-info")
async def refresh_info(data_source: str = Query("all")):
    """获取数据最近刷新时间"""
    result = get_refresh_info(data_source)
    return result
