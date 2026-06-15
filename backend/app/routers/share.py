from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from ..services.share_service import create_share_token, get_shared_data
from ..schemas.analytics import ShareTokenCreate, ShareTokenResponse

router = APIRouter(prefix="/share", tags=["分享功能"])


@router.post("/create", response_model=ShareTokenResponse)
async def create_share(share_data: ShareTokenCreate):
    """创建分享链接，带权限控制"""
    result = create_share_token(
        chart_type=share_data.chart_type,
        permissions=share_data.permissions,
        expire_hours=share_data.expire_hours
    )
    return result


@router.get("/{token}")
async def get_share_content(token: str):
    """获取分享内容，带权限校验"""
    result = get_shared_data(token)
    if not result:
        raise HTTPException(status_code=404, detail="分享链接不存在或已过期")
    return result


@router.get("/{token}/info")
async def get_share_info(token: str):
    """获取分享基本信息（不含数据）"""
    from ..services.share_service import verify_share_token
    token_data = verify_share_token(token)
    if not token_data:
        raise HTTPException(status_code=404, detail="分享链接不存在或已过期")
    return {
        "chart_type": token_data["chart_type"],
        "permissions": token_data["permissions"],
        "expires_at": token_data["expires_at"],
        "created_at": token_data["created_at"]
    }
