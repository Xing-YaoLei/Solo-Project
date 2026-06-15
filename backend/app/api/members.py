from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    MemberProfile,
    MemberBenefitMapping,
    AccountTransaction,
    CommunityTicket,
)
from ..schemas.schemas import (
    MemberProfileCreate,
    MemberProfileUpdate,
    MemberProfileResponse,
    MemberProfileListResponse,
    MemberBenefitMappingResponse,
    AccountTransactionResponse,
    CommunityTicketResponse,
)
from ..enums import MemberLevel, TicketSource

router = APIRouter(prefix="/api", tags=["members"])


def get_member_or_404(member_id: int, db: Session) -> MemberProfile:
    member = db.query(MemberProfile).filter(MemberProfile.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"会员 ID {member_id} 不存在",
        )
    return member


@router.get(
    "/members/",
    response_model=MemberProfileListResponse,
    status_code=status.HTTP_200_OK,
)
def list_members(
    name: Optional[str] = Query(None, description="按姓名模糊搜索"),
    phone: Optional[str] = Query(None, description="按手机号搜索"),
    level: Optional[MemberLevel] = Query(None, description="按会员等级过滤"),
    source_channel: Optional[TicketSource] = Query(None, description="按来源渠道过滤"),
    exam_pass_status: Optional[bool] = Query(None, description="按考试通过状态过滤"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    query = db.query(MemberProfile)

    if name:
        query = query.filter(MemberProfile.name.ilike(f"%{name}%"))
    if phone:
        query = query.filter(MemberProfile.phone == phone)
    if level:
        query = query.filter(MemberProfile.level == level)
    if source_channel:
        query = query.filter(MemberProfile.source_channel == source_channel)
    if exam_pass_status is not None:
        query = query.filter(MemberProfile.exam_pass_status == exam_pass_status)

    total = query.count()
    items = query.order_by(MemberProfile.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return MemberProfileListResponse(total=total, items=items)


@router.post(
    "/members/",
    response_model=MemberProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_member(member_data: MemberProfileCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(MemberProfile)
        .filter(MemberProfile.member_no == member_data.member_no)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"会员编号 {member_data.member_no} 已存在",
        )

    new_member = MemberProfile(**member_data.model_dump())
    db.add(new_member)
    try:
        db.commit()
        db.refresh(new_member)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建会员失败: {str(e)}",
        )
    return new_member


@router.get(
    "/members/{member_id}",
    response_model=MemberProfileResponse,
    status_code=status.HTTP_200_OK,
)
def get_member(member_id: int, db: Session = Depends(get_db)):
    return get_member_or_404(member_id, db)


@router.put(
    "/members/{member_id}",
    response_model=MemberProfileResponse,
    status_code=status.HTTP_200_OK,
)
def update_member(
    member_id: int,
    member_data: MemberProfileUpdate,
    db: Session = Depends(get_db),
):
    member = get_member_or_404(member_id, db)
    update_data = member_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(member, field, value)

    try:
        db.commit()
        db.refresh(member)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新会员失败: {str(e)}",
        )
    return member


@router.delete(
    "/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = get_member_or_404(member_id, db)
    try:
        db.delete(member)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除会员失败: {str(e)}",
        )
    return None


@router.get(
    "/members/{member_id}/benefits",
    response_model=List[MemberBenefitMappingResponse],
    status_code=status.HTTP_200_OK,
)
def get_member_benefits(member_id: int, db: Session = Depends(get_db)):
    get_member_or_404(member_id, db)
    benefits = (
        db.query(MemberBenefitMapping)
        .filter(MemberBenefitMapping.member_id == member_id)
        .all()
    )
    return benefits


@router.get(
    "/members/{member_id}/transactions",
    response_model=List[AccountTransactionResponse],
    status_code=status.HTTP_200_OK,
)
def get_member_transactions(member_id: int, db: Session = Depends(get_db)):
    get_member_or_404(member_id, db)
    transactions = (
        db.query(AccountTransaction)
        .filter(AccountTransaction.member_id == member_id)
        .order_by(AccountTransaction.transaction_date.desc())
        .all()
    )
    return transactions


@router.get(
    "/members/{member_id}/tickets",
    response_model=List[CommunityTicketResponse],
    status_code=status.HTTP_200_OK,
)
def get_member_tickets(member_id: int, db: Session = Depends(get_db)):
    get_member_or_404(member_id, db)
    tickets = (
        db.query(CommunityTicket)
        .filter(CommunityTicket.member_id == member_id)
        .order_by(CommunityTicket.created_at.desc())
        .all()
    )
    return tickets
