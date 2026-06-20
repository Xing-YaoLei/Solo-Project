from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..db.session import get_db
from ..models.models import User, RoleEnum, ShareToken
from ..schemas.schemas import ShareViewRequest, ShareViewResponse
from ..core.deps import get_current_user, require_roles, verify_share_token_role
from ..core.config import settings
import secrets

router = APIRouter(prefix="/share", tags=["分享视图"])


@router.post("/create", response_model=ShareViewResponse)
def create_share_view(
    request: ShareViewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.ADMIN))
):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours)

    share = ShareToken(
        token=token,
        view_name=request.view_name,
        created_by=current_user.id,
        allowed_role=request.allowed_role,
        expires_at=expires_at,
        filters=request.filters,
        is_active=True,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    base_url = settings.__dict__.get("BASE_URL", "http://localhost:8000")
    share_url = f"{base_url}/share/view?token={token}"

    return ShareViewResponse(
        token=token,
        view_name=request.view_name,
        allowed_role=request.allowed_role,
        expires_at=expires_at,
        share_url=share_url
    )


@router.get("/view/{token}")
def access_shared_view(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="需要身份验证")

    from ..core.security import decode_token
    user_token = auth_header.replace("Bearer ", "")
    payload = decode_token(user_token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的访问令牌")

    user_role = payload.get("role")
    if not user_role:
        raise HTTPException(status_code=403, detail="无法确定用户角色")

    role_enum = RoleEnum(user_role)
    if not verify_share_token_role(token, role_enum, db):
        raise HTTPException(status_code=403, detail="您的角色权限不足，无法访问此分享视图")

    share = db.query(ShareToken).filter(ShareToken.token == token).first()
    if not share:
        raise HTTPException(status_code=404, detail="分享链接不存在或已失效")

    return {
        "view_name": share.view_name,
        "filters": share.filters,
        "allowed_role": share.allowed_role.value,
        "expires_at": share.expires_at,
        "created_at": share.created_at,
    }


@router.post("/revoke/{token}")
def revoke_share_view(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ADMIN))
):
    share = db.query(ShareToken).filter(ShareToken.token == token).first()
    if not share:
        raise HTTPException(status_code=404, detail="分享链接不存在")

    share.is_active = False
    db.commit()
    return {"status": "success", "message": "分享链接已撤销"}
