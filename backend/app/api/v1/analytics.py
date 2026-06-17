from datetime import datetime, timedelta, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.core.database import get_db
from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.models.inventory_record import InventoryRecord, InventoryRecordType
from app.models.shortage_order import ShortageOrder, ShortageOrderStatus
from app.models.safety_stock import SafetyStockConfig
from app.models.supplier import Supplier
from app.schemas.analytics import (
    DashboardStats,
    TrendData,
    TrendDataPoint,
    TurnoverAnalysis,
    TurnoverAnalysisItem,
    RegionDistribution,
    RegionDistributionItem,
    CategoryDistribution,
    CategoryDistributionItem,
    SupplierPerformance,
    SupplierPerformanceItem,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["数据分析"])


@router.get("/dashboard", response_model=DashboardStats, summary="仪表盘统计")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    total_materials = db.query(func.count(MaterialBatch.id)).scalar() or 0
    total_quantity = db.query(func.sum(MaterialBatch.quantity)).scalar() or 0
    total_value = db.query(func.sum(MaterialBatch.quantity * 10)).scalar() or 0

    in_stock_count = db.query(func.count(MaterialBatch.id)).filter(
        MaterialBatch.status == MaterialBatchStatus.IN_STOCK
    ).scalar() or 0

    in_use_count = db.query(func.count(MaterialBatch.id)).filter(
        MaterialBatch.status == MaterialBatchStatus.IN_USE
    ).scalar() or 0

    shortage_count = db.query(func.count(MaterialBatch.id)).filter(
        MaterialBatch.status == MaterialBatchStatus.SHORTAGE
    ).scalar() or 0

    pending_shortage_orders = db.query(func.count(ShortageOrder.id)).filter(
        ShortageOrder.status == ShortageOrderStatus.PENDING
    ).scalar() or 0

    today_in_count = db.query(func.count(InventoryRecord.id)).filter(
        InventoryRecord.type == InventoryRecordType.IN,
        InventoryRecord.created_at >= today_start
    ).scalar() or 0

    today_out_count = db.query(func.count(InventoryRecord.id)).filter(
        InventoryRecord.type == InventoryRecordType.OUT,
        InventoryRecord.created_at >= today_start
    ).scalar() or 0

    low_stock_alerts = db.query(func.count(SafetyStockConfig.id)).filter(
        SafetyStockConfig.current_stock <= SafetyStockConfig.min_stock
    ).scalar() or 0

    overstock_alerts = db.query(func.count(SafetyStockConfig.id)).filter(
        SafetyStockConfig.current_stock >= SafetyStockConfig.max_stock
    ).scalar() or 0

    return DashboardStats(
        total_materials=total_materials,
        total_quantity=total_quantity,
        total_value=total_value,
        in_stock_count=in_stock_count,
        in_use_count=in_use_count,
        shortage_count=shortage_count,
        pending_shortage_orders=pending_shortage_orders,
        today_in_count=today_in_count,
        today_out_count=today_out_count,
        low_stock_alerts=low_stock_alerts,
        overstock_alerts=overstock_alerts,
    )


@router.get("/trend", response_model=TrendData, summary="库存趋势数据")
def get_trend_data(
    period: str = Query("7d", description="统计周期: 7d, 30d, 90d"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if period == "7d":
        days = 7
    elif period == "30d":
        days = 30
    elif period == "90d":
        days = 90
    else:
        days = 7

    data_points = []
    end_date = date.today()

    for i in range(days - 1, -1, -1):
        current_date = end_date - timedelta(days=i)
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = datetime.combine(current_date, datetime.max.time())

        in_quantity = db.query(func.sum(InventoryRecord.quantity)).filter(
            InventoryRecord.type == InventoryRecordType.IN,
            InventoryRecord.created_at >= day_start,
            InventoryRecord.created_at <= day_end
        ).scalar() or 0.0

        out_quantity = db.query(func.sum(InventoryRecord.quantity)).filter(
            InventoryRecord.type == InventoryRecordType.OUT,
            InventoryRecord.created_at >= day_start,
            InventoryRecord.created_at <= day_end
        ).scalar() or 0.0

        balance = in_quantity - out_quantity

        data_points.append(TrendDataPoint(
            date=current_date,
            in_quantity=in_quantity,
            out_quantity=out_quantity,
            balance=balance,
        ))

    return TrendData(
        period=period,
        data_points=data_points,
    )


@router.get("/turnover", response_model=TurnoverAnalysis, summary="周转分析")
def get_turnover_analysis(
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    categories = db.query(MaterialBatch.category).distinct().all()
    categories = [c[0] for c in categories if c[0]]

    items = []
    total_in = 0.0
    total_out = 0.0
    total_avg_stock = 0.0

    for category in categories:
        cat_in = db.query(func.sum(InventoryRecord.quantity)).filter(
            InventoryRecord.type == InventoryRecordType.IN,
            InventoryRecord.created_at >= start_datetime,
            InventoryRecord.created_at <= end_datetime,
            InventoryRecord.batch.has(MaterialBatch.category == category)
        ).scalar() or 0.0

        cat_out = db.query(func.sum(InventoryRecord.quantity)).filter(
            InventoryRecord.type == InventoryRecordType.OUT,
            InventoryRecord.created_at >= start_datetime,
            InventoryRecord.created_at <= end_datetime,
            InventoryRecord.batch.has(MaterialBatch.category == category)
        ).scalar() or 0.0

        avg_stock = db.query(func.avg(MaterialBatch.quantity)).filter(
            MaterialBatch.category == category
        ).scalar() or 0.0

        if avg_stock > 0:
            turnover_rate = cat_out / avg_stock if avg_stock > 0 else 0.0
            turnover_days = 30 / turnover_rate if turnover_rate > 0 else 0.0
        else:
            turnover_rate = 0.0
            turnover_days = 0.0

        total_in += cat_in
        total_out += cat_out
        total_avg_stock += avg_stock

        items.append(TurnoverAnalysisItem(
            category=category,
            total_in=cat_in,
            total_out=cat_out,
            average_stock=avg_stock,
            turnover_rate=round(turnover_rate, 4),
            turnover_days=round(turnover_days, 2),
        ))

    overall_turnover_rate = total_out / total_avg_stock if total_avg_stock > 0 else 0.0
    overall_turnover_days = 30 / overall_turnover_rate if overall_turnover_rate > 0 else 0.0

    return TurnoverAnalysis(
        items=items,
        overall_turnover_rate=round(overall_turnover_rate, 4),
        overall_turnover_days=round(overall_turnover_days, 2),
    )


@router.get("/region-distribution", response_model=RegionDistribution, summary="区域分布")
def get_region_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = db.query(
        MaterialBatch.region,
        func.count(MaterialBatch.id),
        func.sum(MaterialBatch.quantity)
    ).filter(
        MaterialBatch.region.isnot(None)
    ).group_by(MaterialBatch.region).all()

    total_quantity = sum(r[2] or 0 for r in results)

    items = []
    for region, count, quantity in results:
        percentage = (quantity or 0) / total_quantity * 100 if total_quantity > 0 else 0
        items.append(RegionDistributionItem(
            region=region,
            batch_count=count,
            total_quantity=quantity or 0,
            percentage=round(percentage, 2),
        ))

    return RegionDistribution(items=items)


@router.get("/category-distribution", response_model=CategoryDistribution, summary="分类分布")
def get_category_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = db.query(
        MaterialBatch.category,
        func.count(MaterialBatch.id),
        func.sum(MaterialBatch.quantity)
    ).filter(
        MaterialBatch.category.isnot(None)
    ).group_by(MaterialBatch.category).all()

    total_quantity = sum(r[2] or 0 for r in results)

    items = []
    for category, count, quantity in results:
        percentage = (quantity or 0) / total_quantity * 100 if total_quantity > 0 else 0
        items.append(CategoryDistributionItem(
            category=category,
            batch_count=count,
            total_quantity=quantity or 0,
            percentage=round(percentage, 2),
        ))

    return CategoryDistribution(items=items)


@router.get("/supplier-performance", response_model=SupplierPerformance, summary="供应商绩效")
def get_supplier_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    suppliers = db.query(Supplier).all()

    items = []
    for supplier in suppliers:
        delivery_count = db.query(func.count(MaterialBatch.id)).filter(
            MaterialBatch.supplier_id == supplier.id
        ).scalar() or 0

        on_time_count = delivery_count

        items.append(SupplierPerformanceItem(
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            delivery_count=delivery_count,
            on_time_count=on_time_count,
            on_time_rate=supplier.on_time_rate,
            quality_score=supplier.quality_score,
            credit_rating=supplier.credit_rating,
        ))

    return SupplierPerformance(items=items)
