from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from ..core.database import get_db
from ..services.review_service import get_review_service, ReviewService

router = APIRouter(prefix="/api/reviews", tags=["复盘材料"])


@router.get("")
def get_review_materials(
    type: Optional[str] = Query(None, description="复盘类型"),
    status: Optional[str] = Query(None, description="状态"),
    course_id: Optional[int] = Query(None, description="课程ID"),
    db: Session = Depends(get_db)
):
    """获取复盘材料列表"""
    service = get_review_service(db)
    reviews = service.get_review_materials(type, status, course_id)
    return [
        {
            "id": r.id,
            "material_no": r.material_no,
            "title": r.title,
            "type": r.type,
            "period_start": r.period_start.isoformat() if r.period_start else None,
            "period_end": r.period_end.isoformat() if r.period_end else None,
            "completion_rate": r.completion_rate,
            "alert_count": r.alert_count,
            "status": r.status,
            "summary": r.summary,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reviews
    ]


@router.post("/generate")
def generate_review(
    type: str = Query("weekly", description="复盘类型"),
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    created_by: str = Query("system", description="创建人"),
    db: Session = Depends(get_db)
):
    """生成复盘材料 - 围绕完成率形成复盘报告"""
    service = get_review_service(db)
    review = service.generate_review_material(type, course_id, region_id, created_by)
    return {
        "id": review.id,
        "material_no": review.material_no,
        "title": review.title,
        "completion_rate": review.completion_rate,
        "alert_count": review.alert_count
    }


@router.get("/{review_id}")
def get_review_detail(
    review_id: int,
    db: Session = Depends(get_db)
):
    """获取复盘材料详情"""
    service = get_review_service(db)
    review = service.get_review_detail(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="复盘材料不存在")
    return {
        "id": review.id,
        "material_no": review.material_no,
        "title": review.title,
        "type": review.type,
        "period_start": review.period_start.isoformat() if review.period_start else None,
        "period_end": review.period_end.isoformat() if review.period_end else None,
        "completion_rate": review.completion_rate,
        "alert_count": review.alert_count,
        "summary": review.summary,
        "key_issues": review.key_issues,
        "improvements": review.improvements,
        "charts_data": review.charts_data,
        "status": review.status,
        "created_at": review.created_at.isoformat() if review.created_at else None
    }


@router.put("/{review_id}/status")
def update_review_status(
    review_id: int,
    status: str = Query(..., description="状态"),
    db: Session = Depends(get_db)
):
    """更新复盘材料状态"""
    service = get_review_service(db)
    review = service.update_review_status(review_id, status)
    if not review:
        raise HTTPException(status_code=404, detail="复盘材料不存在")
    return {"message": "更新成功", "status": review.status}
