from typing import List, Dict, Any, Optional, Tuple
from datetime import date, datetime, timedelta
from sqlalchemy import and_, func, case
from sqlalchemy.orm import Session

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


class AnalyticsService:
    def get_dashboard_stats(self, db: Session) -> DashboardStats:
        today = date.today()

        total_materials = db.query(MaterialBatch).count()
        total_quantity = db.query(func.sum(MaterialBatch.quantity)).scalar() or 0

        in_stock_count = (
            db.query(MaterialBatch)
            .filter(MaterialBatch.status == MaterialBatchStatus.IN_STOCK)
            .count()
        )
        in_use_count = (
            db.query(MaterialBatch)
            .filter(MaterialBatch.status == MaterialBatchStatus.IN_USE)
            .count()
        )
        shortage_count = (
            db.query(MaterialBatch)
            .filter(MaterialBatch.status == MaterialBatchStatus.SHORTAGE)
            .count()
        )

        pending_shortage_orders = (
            db.query(ShortageOrder)
            .filter(
                ShortageOrder.status.in_(
                    [
                        ShortageOrderStatus.PENDING,
                        ShortageOrderStatus.PROCESSING,
                        ShortageOrderStatus.RETRIED,
                    ]
                )
            )
            .count()
        )

        today_in_count = (
            db.query(InventoryRecord)
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.IN,
                    func.date(InventoryRecord.created_at) == today,
                )
            )
            .count()
        )
        today_out_count = (
            db.query(InventoryRecord)
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.OUT,
                    func.date(InventoryRecord.created_at) == today,
                )
            )
            .count()
        )

        low_stock_alerts = (
            db.query(SafetyStockConfig)
            .filter(SafetyStockConfig.current_stock <= SafetyStockConfig.min_stock)
            .count()
        )
        overstock_alerts = (
            db.query(SafetyStockConfig)
            .filter(SafetyStockConfig.current_stock >= SafetyStockConfig.max_stock)
            .count()
        )

        return DashboardStats(
            total_materials=total_materials,
            total_quantity=total_quantity,
            total_value=total_quantity,
            in_stock_count=in_stock_count,
            in_use_count=in_use_count,
            shortage_count=shortage_count,
            pending_shortage_orders=pending_shortage_orders,
            today_in_count=today_in_count,
            today_out_count=today_out_count,
            low_stock_alerts=low_stock_alerts,
            overstock_alerts=overstock_alerts,
        )

    def _generate_date_range(
        self, period: str, end_date: Optional[date] = None
    ) -> List[date]:
        if not end_date:
            end_date = date.today()

        dates = []
        if period == "7d":
            for i in range(6, -1, -1):
                dates.append(end_date - timedelta(days=i))
        elif period == "30d":
            for i in range(29, -1, -1):
                dates.append(end_date - timedelta(days=i))
        elif period == "90d":
            for i in range(89, -1, -1):
                dates.append(end_date - timedelta(days=i))
        elif period == "1y":
            for i in range(364, -1, -1):
                dates.append(end_date - timedelta(days=i))
        else:
            for i in range(29, -1, -1):
                dates.append(end_date - timedelta(days=i))

        return dates

    def get_trend_data(
        self, db: Session, period: str = "30d", material_name: Optional[str] = None
    ) -> TrendData:
        dates = self._generate_date_range(period)
        data_points = []

        running_balance = 0.0

        for d in dates:
            query_in = db.query(func.sum(InventoryRecord.quantity)).filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.IN,
                    func.date(InventoryRecord.created_at) == d,
                )
            )

            query_out = db.query(func.sum(InventoryRecord.quantity)).filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.OUT,
                    func.date(InventoryRecord.created_at) == d,
                )
            )

            if material_name:
                batch_subquery = (
                    db.query(MaterialBatch.id)
                    .filter(MaterialBatch.material_name == material_name)
                    .subquery()
                )
                query_in = query_in.filter(
                    InventoryRecord.batch_id.in_(batch_subquery)
                )
                query_out = query_out.filter(
                    InventoryRecord.batch_id.in_(batch_subquery)
                )

            in_quantity = query_in.scalar() or 0.0
            out_quantity = query_out.scalar() or 0.0

            running_balance = running_balance + in_quantity - out_quantity

            data_points.append(
                TrendDataPoint(
                    date=d,
                    in_quantity=in_quantity,
                    out_quantity=out_quantity,
                    balance=running_balance,
                )
            )

        return TrendData(period=period, data_points=data_points)

    def calculate_turnover_days(
        self, db: Session, days: int = 30
    ) -> TurnoverAnalysis:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        results = (
            db.query(
                MaterialBatch.category,
                func.sum(
                    case(
                        (InventoryRecord.type == InventoryRecordType.IN, InventoryRecord.quantity),
                        else_=0.0,
                    )
                ).label("total_in"),
                func.sum(
                    case(
                        (InventoryRecord.type == InventoryRecordType.OUT, InventoryRecord.quantity),
                        else_=0.0,
                    )
                ).label("total_out"),
            )
            .outerjoin(InventoryRecord, MaterialBatch.id == InventoryRecord.batch_id)
            .filter(
                and_(
                    InventoryRecord.created_at >= start_date,
                    InventoryRecord.created_at <= end_date,
                )
            )
            .group_by(MaterialBatch.category)
            .all()
        )

        items = []
        total_in_all = 0.0
        total_out_all = 0.0
        total_avg_stock = 0.0

        for category, total_in, total_out in results:
            total_in = total_in or 0.0
            total_out = total_out or 0.0

            avg_stock = (total_in + total_out) / 2 if total_in + total_out > 0 else 0.0
            turnover_rate = total_out / avg_stock if avg_stock > 0 else 0.0
            turnover_days = days / turnover_rate if turnover_rate > 0 else 0.0

            total_in_all += total_in
            total_out_all += total_out
            total_avg_stock += avg_stock

            items.append(
                TurnoverAnalysisItem(
                    category=category or "未分类",
                    total_in=total_in,
                    total_out=total_out,
                    average_stock=avg_stock,
                    turnover_rate=round(turnover_rate, 4),
                    turnover_days=round(turnover_days, 2),
                )
            )

        overall_turnover_rate = (
            total_out_all / total_avg_stock if total_avg_stock > 0 else 0.0
        )
        overall_turnover_days = (
            days / overall_turnover_rate if overall_turnover_rate > 0 else 0.0
        )

        return TurnoverAnalysis(
            items=items,
            overall_turnover_rate=round(overall_turnover_rate, 4),
            overall_turnover_days=round(overall_turnover_days, 2),
        )

    def get_region_distribution(self, db: Session) -> RegionDistribution:
        results = (
            db.query(
                MaterialBatch.region,
                func.count(MaterialBatch.id).label("batch_count"),
                func.sum(MaterialBatch.quantity).label("total_quantity"),
            )
            .group_by(MaterialBatch.region)
            .all()
        )

        total_quantity = sum(r[2] or 0 for r in results)

        items = []
        for region, batch_count, quantity in results:
            percentage = (
                round((quantity or 0) / total_quantity * 100, 2)
                if total_quantity > 0
                else 0.0
            )
            items.append(
                RegionDistributionItem(
                    region=region or "未分配",
                    batch_count=batch_count or 0,
                    total_quantity=quantity or 0.0,
                    percentage=percentage,
                )
            )

        items.sort(key=lambda x: x.total_quantity, reverse=True)
        return RegionDistribution(items=items)

    def get_category_distribution(self, db: Session) -> CategoryDistribution:
        results = (
            db.query(
                MaterialBatch.category,
                func.count(MaterialBatch.id).label("batch_count"),
                func.sum(MaterialBatch.quantity).label("total_quantity"),
            )
            .group_by(MaterialBatch.category)
            .all()
        )

        total_quantity = sum(r[2] or 0 for r in results)

        items = []
        for category, batch_count, quantity in results:
            percentage = (
                round((quantity or 0) / total_quantity * 100, 2)
                if total_quantity > 0
                else 0.0
            )
            items.append(
                CategoryDistributionItem(
                    category=category or "未分类",
                    batch_count=batch_count or 0,
                    total_quantity=quantity or 0.0,
                    percentage=percentage,
                )
            )

        items.sort(key=lambda x: x.total_quantity, reverse=True)
        return CategoryDistribution(items=items)

    def get_supplier_performance(
        self, db: Session, days: int = 30
    ) -> SupplierPerformance:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        results = (
            db.query(
                Supplier.id,
                Supplier.name,
                Supplier.on_time_rate,
                Supplier.quality_score,
                Supplier.credit_rating,
                func.count(MaterialBatch.id).label("delivery_count"),
            )
            .outerjoin(MaterialBatch, Supplier.id == MaterialBatch.supplier_id)
            .filter(
                and_(
                    MaterialBatch.in_date >= start_date,
                    MaterialBatch.in_date <= end_date,
                )
            )
            .group_by(Supplier.id)
            .all()
        )

        items = []
        for (
            supplier_id,
            supplier_name,
            on_time_rate,
            quality_score,
            credit_rating,
            delivery_count,
        ) in results:
            on_time_count = int(delivery_count * (on_time_rate or 0))
            items.append(
                SupplierPerformanceItem(
                    supplier_id=supplier_id,
                    supplier_name=supplier_name,
                    delivery_count=delivery_count or 0,
                    on_time_count=on_time_count,
                    on_time_rate=on_time_rate or 0.0,
                    quality_score=quality_score or 0.0,
                    credit_rating=credit_rating.value if credit_rating else "B",
                )
            )

        items.sort(key=lambda x: x.on_time_rate, reverse=True)
        return SupplierPerformance(items=items)

    def get_daily_report(self, db: Session, report_date: date) -> Dict[str, Any]:
        start_date = report_date
        end_date = report_date + timedelta(days=1)

        in_records = (
            db.query(InventoryRecord)
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.IN,
                    InventoryRecord.created_at >= start_date,
                    InventoryRecord.created_at < end_date,
                )
            )
            .all()
        )

        out_records = (
            db.query(InventoryRecord)
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.OUT,
                    InventoryRecord.created_at >= start_date,
                    InventoryRecord.created_at < end_date,
                )
            )
            .all()
        )

        total_in = sum(r.quantity for r in in_records)
        total_out = sum(r.quantity for r in out_records)

        new_shortages = (
            db.query(ShortageOrder)
            .filter(
                and_(
                    ShortageOrder.created_at >= start_date,
                    ShortageOrder.created_at < end_date,
                )
            )
            .count()
        )

        resolved_shortages = (
            db.query(ShortageOrder)
            .filter(
                and_(
                    ShortageOrder.status == ShortageOrderStatus.SUPPLEMENTED,
                    ShortageOrder.updated_at >= start_date,
                    ShortageOrder.updated_at < end_date,
                )
            )
            .count()
        )

        return {
            "date": report_date.isoformat(),
            "total_in": total_in,
            "total_out": total_out,
            "net_change": total_in - total_out,
            "in_count": len(in_records),
            "out_count": len(out_records),
            "new_shortages": new_shortages,
            "resolved_shortages": resolved_shortages,
            "generated_at": datetime.now().isoformat(),
        }


analytics_service = AnalyticsService()
