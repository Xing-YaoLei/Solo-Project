from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_role
from app.config import settings

router = APIRouter()


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)
    
    store_filter = True
    if current_user.role == models.UserRole.STAFF and current_user.store_id:
        store_filter = models.LossReport.store_id == current_user.store_id
    
    today_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
        and_(
            models.LossReport.loss_date >= today_start,
            models.LossReport.status != models.LossStatus.REJECTED,
            store_filter
        )
    ).scalar() or 0
    
    today_count = db.query(models.LossReport).filter(
        and_(
            models.LossReport.loss_date >= today_start,
            store_filter
        )
    ).count()
    
    pending_review = db.query(models.LossReport).filter(
        and_(
            models.LossReport.status == models.LossStatus.PENDING_REVIEW,
            store_filter
        )
    ).count()
    
    pending_approval = db.query(models.LossReport).filter(
        and_(
            models.LossReport.status == models.LossStatus.PENDING_APPROVAL,
            store_filter
        )
    ).count()
    
    abnormal_count = db.query(models.LossReport).filter(
        and_(
            models.LossReport.is_abnormal == True,
            models.LossReport.status.notin_([models.LossStatus.CLOSED, models.LossStatus.REJECTED]),
            store_filter
        )
    ).count()
    
    month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
        and_(
            models.LossReport.loss_date >= month_start,
            models.LossReport.status != models.LossStatus.REJECTED,
            store_filter
        )
    ).scalar() or 0
    
    total_sales_target = 0
    if current_user.role == models.UserRole.STAFF and current_user.store:
        total_sales_target = current_user.store.monthly_sales_target
    else:
        total_sales_target = db.query(func.sum(models.Store.monthly_sales_target)).filter(
            models.Store.is_active == True
        ).scalar() or 0
    
    month_loss_rate = round(month_loss / total_sales_target * 100, 2) if total_sales_target > 0 else 0
    
    loss_trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        
        day_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            and_(
                models.LossReport.loss_date >= day_start,
                models.LossReport.loss_date < day_end,
                models.LossReport.status != models.LossStatus.REJECTED,
                store_filter
            )
        ).scalar() or 0
        
        day_sales = 0
        if current_user.role == models.UserRole.STAFF and current_user.store:
            day_sales = current_user.store.monthly_sales_target / 30
        else:
            day_sales = total_sales_target / 30
        
        day_rate = round(day_loss / day_sales * 100, 2) if day_sales > 0 else 0
        day_count = db.query(models.LossReport).filter(
            and_(
                models.LossReport.loss_date >= day_start,
                models.LossReport.loss_date < day_end,
                store_filter
            )
        ).count()
        
        loss_trend.append(schemas.LossTrendItem(
            date=day.strftime("%Y-%m-%d"),
            loss_amount=float(day_loss),
            loss_rate=day_rate,
            report_count=day_count
        ))
    
    store_ranking = []
    if current_user.role == models.UserRole.MANAGER:
        stores = db.query(models.Store).filter(models.Store.is_active == True).all()
        store_stats = []
        for store in stores:
            store_month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
                and_(
                    models.LossReport.store_id == store.id,
                    models.LossReport.loss_date >= month_start,
                    models.LossReport.status != models.LossStatus.REJECTED
                )
            ).scalar() or 0
            
            rate = round(store_month_loss / store.monthly_sales_target * 100, 2) if store.monthly_sales_target > 0 else 0
            store_stats.append({
                "store_id": store.id,
                "store_name": store.name,
                "loss_amount": float(store_month_loss),
                "loss_rate": rate
            })
        
        store_stats.sort(key=lambda x: x["loss_rate"], reverse=True)
        for idx, stat in enumerate(store_stats, 1):
            store_ranking.append(schemas.StoreLossRank(
                store_id=stat["store_id"],
                store_name=stat["store_name"],
                loss_amount=stat["loss_amount"],
                loss_rate=stat["loss_rate"],
                rank=idx
            ))
    
    return schemas.DashboardStats(
        today_loss_amount=float(today_loss),
        today_report_count=today_count,
        pending_review_count=pending_review,
        pending_approval_count=pending_approval,
        abnormal_count=abnormal_count,
        month_loss_rate=month_loss_rate,
        month_loss_amount=float(month_loss),
        loss_trend=loss_trend,
        store_ranking=store_ranking
    )


@router.get("/loss-trend", response_model=List[schemas.LossTrendItem])
def get_loss_trend(
    period: str = "month",
    store_id: int = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    store_filter = True
    if current_user.role == models.UserRole.STAFF and current_user.store_id:
        store_filter = models.LossReport.store_id == current_user.store_id
    elif store_id:
        store_filter = models.LossReport.store_id == store_id
    
    days = 30 if period == "month" else 90
    loss_trend = []
    
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        
        day_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            and_(
                models.LossReport.loss_date >= day_start,
                models.LossReport.loss_date < day_end,
                models.LossReport.status != models.LossStatus.REJECTED,
                store_filter
            )
        ).scalar() or 0
        
        store = None
        if current_user.role == models.UserRole.STAFF and current_user.store:
            store = current_user.store
        elif store_id:
            store = db.query(models.Store).filter(models.Store.id == store_id).first()
        
        day_sales = (store.monthly_sales_target / 30) if store else 0
        day_rate = round(day_loss / day_sales * 100, 2) if day_sales > 0 else 0
        day_count = db.query(models.LossReport).filter(
            and_(
                models.LossReport.loss_date >= day_start,
                models.LossReport.loss_date < day_end,
                store_filter
            )
        ).count()
        
        loss_trend.append(schemas.LossTrendItem(
            date=day.strftime("%Y-%m-%d"),
            loss_amount=float(day_loss),
            loss_rate=day_rate,
            report_count=day_count
        ))
    
    return loss_trend


@router.get("/store-ranking", response_model=List[schemas.StoreLossRank])
def get_store_ranking(
    period: str = "month",
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    if period == "month":
        start_date = datetime(now.year, now.month, 1)
    elif period == "quarter":
        quarter = (now.month - 1) // 3
        start_date = datetime(now.year, quarter * 3 + 1, 1)
    else:
        start_date = datetime(now.year, 1, 1)
    
    stores = db.query(models.Store).filter(models.Store.is_active == True).all()
    store_stats = []
    
    for store in stores:
        store_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            and_(
                models.LossReport.store_id == store.id,
                models.LossReport.loss_date >= start_date,
                models.LossReport.status != models.LossStatus.REJECTED
            )
        ).scalar() or 0
        
        days_in_period = (now - start_date).days + 1
        period_sales = store.monthly_sales_target / 30 * days_in_period
        rate = round(store_loss / period_sales * 100, 2) if period_sales > 0 else 0
        
        store_stats.append({
            "store_id": store.id,
            "store_name": store.name,
            "loss_amount": float(store_loss),
            "loss_rate": rate
        })
    
    store_stats.sort(key=lambda x: x["loss_rate"], reverse=True)
    result = []
    for idx, stat in enumerate(store_stats, 1):
        result.append(schemas.StoreLossRank(
            store_id=stat["store_id"],
            store_name=stat["store_name"],
            loss_amount=stat["loss_amount"],
            loss_rate=stat["loss_rate"],
            rank=idx
        ))
    
    return result


@router.get("/threshold")
def get_loss_threshold(
    current_user: models.User = Depends(get_current_user)
):
    return {"threshold": settings.LOSS_RATE_THRESHOLD}
