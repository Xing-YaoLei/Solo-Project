import pandas as pd
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from ..db.duckdb_conn import get_duckdb_connection
from ..models.models import (
    PerformanceSchedule, SeatAllocation, Order, CheckinRecord,
    Sponsor, SignCode, CameraStatistic, DataRefreshLog, MetricDefinition
)
from ..schemas.schemas import (
    SeatTrendResponse, SeatTrendPoint, SignCodeCompositionResponse,
    SignCodeComposition, DashboardOverview, DataRefreshStatus
)
from decimal import Decimal


class AnalyticsService:
    @staticmethod
    def get_seat_trend(db: Session, schedule_id: int) -> SeatTrendResponse:
        schedule = db.query(PerformanceSchedule).filter(PerformanceSchedule.id == schedule_id).first()
        if not schedule:
            raise ValueError("演出排期不存在")

        conn = get_duckdb_connection()
        try:
            conn.register("seat_allocations", pd.read_sql(
                db.query(SeatAllocation).filter(SeatAllocation.schedule_id == schedule_id).statement,
                db.bind
            ))
            df = conn.execute("""
                SELECT
                    DATE_TRUNC('hour', recorded_at) as hour,
                    COUNT(*) FILTER (WHERE status = 'sold') as sold,
                    COUNT(*) FILTER (WHERE status = 'available') as available,
                    COUNT(*) FILTER (WHERE status = 'reserved') as reserved
                FROM seat_allocations
                GROUP BY hour
                ORDER BY hour
            """).fetchdf()
        finally:
            conn.close()

        total = schedule.total_seats or 1
        data_points = []
        for _, row in df.iterrows():
            sold = int(row["sold"])
            data_points.append(SeatTrendPoint(
                timestamp=row["hour"],
                sold=sold,
                available=int(row["available"]),
                reserved=int(row["reserved"]),
                occupancy_rate=round(sold / total * 100, 2)
            ))

        return SeatTrendResponse(
            schedule_id=schedule_id,
            performance_name=schedule.performance_name,
            data=data_points
        )

    @staticmethod
    def get_sign_code_composition(db: Session, schedule_id: int) -> SignCodeCompositionResponse:
        orders = db.query(Order).filter(Order.schedule_id == schedule_id).all()
        order_ids = [o.id for o in orders]

        if not order_ids:
            return SignCodeCompositionResponse(schedule_id=schedule_id, total_codes=0, composition=[])

        sign_codes = db.query(SignCode).filter(SignCode.order_id.in_(order_ids)).all()
        total = len(sign_codes)

        type_map = {}
        for sc in sign_codes:
            code_type = sc.code_type.value if hasattr(sc.code_type, 'value') else str(sc.code_type)
            if code_type not in type_map:
                type_map[code_type] = {"count": 0, "used_count": 0}
            type_map[code_type]["count"] += 1
            if sc.is_used:
                type_map[code_type]["used_count"] += 1

        composition = []
        for code_type, stats in type_map.items():
            composition.append(SignCodeComposition(
                code_type=code_type,
                count=stats["count"],
                percentage=round(stats["count"] / total * 100, 2) if total > 0 else 0,
                used_count=stats["used_count"],
                used_percentage=round(stats["used_count"] / stats["count"] * 100, 2) if stats["count"] > 0 else 0
            ))

        return SignCodeCompositionResponse(
            schedule_id=schedule_id,
            total_codes=total,
            composition=composition
        )

    @staticmethod
    def get_sponsor_list(db: Session, schedule_id: int):
        sponsors = db.query(Sponsor).filter(Sponsor.schedule_id == schedule_id).order_by(Sponsor.contribution_amount.desc()).all()
        return sponsors

    @staticmethod
    def get_anomaly_checkins(db: Session, schedule_id: int = None):
        query = db.query(CheckinRecord).filter(CheckinRecord.is_anomaly == True)
        if schedule_id:
            query = query.filter(CheckinRecord.schedule_id == schedule_id)
        return query.order_by(CheckinRecord.checkin_time.desc()).all()

    @staticmethod
    def get_dashboard_overview(db: Session) -> DashboardOverview:
        refresh_log = db.query(DataRefreshLog).order_by(DataRefreshLog.created_at.desc()).first()

        performances = db.query(PerformanceSchedule).count()
        orders = db.query(Order).filter(Order.status == "paid").all()
        total_tickets = sum(o.ticket_count for o in orders)
        total_revenue = sum((o.total_amount or Decimal("0")) for o in orders)

        checkins = db.query(CheckinRecord).all()
        expected_checkins = max(total_tickets, 1)
        checkin_rate = round(len(checkins) / expected_checkins * 100, 2) if expected_checkins > 0 else 0

        anomaly_count = db.query(CheckinRecord).filter(CheckinRecord.is_anomaly == True).count()

        return DashboardOverview(
            last_refresh_time=refresh_log.completed_at if refresh_log and refresh_log.completed_at else datetime.utcnow(),
            total_performances=performances,
            total_tickets_sold=total_tickets,
            total_revenue=total_revenue,
            checkin_rate=checkin_rate,
            anomaly_count=anomaly_count
        )

    @staticmethod
    def get_refresh_status(db: Session) -> List[DataRefreshStatus]:
        from sqlalchemy import func
        results = db.query(
            DataRefreshLog.data_type,
            func.MAX(DataRefreshLog.completed_at).label("last_refresh"),
            func.MAX(DataRefreshLog.status).label("status"),
            func.SUM(DataRefreshLog.records_processed).label("records_count")
        ).group_by(DataRefreshLog.data_type).all()

        return [
            DataRefreshStatus(
                data_type=r.data_type,
                last_refresh=r.last_refresh,
                status=r.status or "unknown",
                records_count=int(r.records_count or 0)
            )
            for r in results
        ]

    @staticmethod
    def get_metric_definitions(db: Session, metric_code: str = None):
        query = db.query(MetricDefinition).filter(MetricDefinition.is_active == True)
        if metric_code:
            query = query.filter(MetricDefinition.metric_code == metric_code)
        return query.all()
