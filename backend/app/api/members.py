from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services import repository as repo

router = APIRouter(prefix="/api/members", tags=["会员管理"])


@router.get("")
def list_members(
    keyword: Optional[str] = Query(None, description="搜索关键词（姓名/手机号/会员编号）"),
    status: Optional[str] = Query(None, description="会员状态"),
    level: Optional[str] = Query(None, description="会员等级"),
    coach_id: Optional[int] = Query(None, description="教练ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return repo.list_members(keyword, status, level, coach_id, page, page_size)


@router.get("/{member_id}")
def get_member_detail(member_id: int):
    member = repo.get_member(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")
    memberships = repo.get_member_memberships(member_id)
    return {"member": member, "memberships": memberships}


@router.get("/{member_id}/courses")
def get_member_courses(
    member_id: int,
    status: Optional[str] = Query(None, description="课程状态"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not repo.get_member(member_id):
        raise HTTPException(status_code=404, detail="会员不存在")
    return repo.get_member_courses(member_id, status, page, page_size)


@router.get("/{member_id}/transactions")
def get_member_transactions(
    member_id: int,
    type: Optional[str] = Query(None, description="交易类型: purchase/renewal/refund"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not repo.get_member(member_id):
        raise HTTPException(status_code=404, detail="会员不存在")
    return repo.get_member_transactions(member_id, type, page, page_size)


@router.get("/{member_id}/refunds")
def get_member_refunds(
    member_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not repo.get_member(member_id):
        raise HTTPException(status_code=404, detail="会员不存在")
    return repo.get_member_refunds(member_id, page, page_size)


@router.get("/{member_id}/access-records")
def get_member_access_records(
    member_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not repo.get_member(member_id):
        raise HTTPException(status_code=404, detail="会员不存在")
    return repo.get_member_access_records(member_id, start_date, end_date, page, page_size)


@router.get("/{member_id}/renewal-notes")
def get_member_renewal_notes(
    member_id: int,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not repo.get_member(member_id):
        raise HTTPException(status_code=404, detail="会员不存在")
    return repo.list_notes(member_id, status, None, None, page, page_size)
