from sqlalchemy.orm import Session
from models.group_batch import GroupBatch, GroupBatchStatus
from models.arrival_list import ArrivalList, ArrivalListStatus
from models.exception_order import ExceptionOrder
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
import json


class ReportService:
    DELIVERY_CALIBER = """
    【履约准时率统计口径说明】
    1. 统计范围：统计周期内所有状态为已到货/提货中/已完成的团购批次
    2. 准时判定：实际到货时间 ≤ 预计到货时间 + 24小时 视为准时
    3. 延迟判定：实际到货时间 > 预计到货时间 + 24小时 视为延迟
    4. 排除规则：已取消的批次不纳入统计
    5. 到货短少率 = 短少商品件数 / 应到货商品件数 × 100%
    6. 异常处理率 = 已结案异常单数 / 总异常单数 × 100%
    7. 数据更新时间：{update_time}
    """

    @staticmethod
    def calculate_delivery_performance(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        query = db.query(GroupBatch).filter(
            GroupBatch.status.notin_([GroupBatchStatus.PENDING, GroupBatchStatus.CANCELLED])
        )
        if start_date:
            query = query.filter(GroupBatch.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(GroupBatch.created_at <= datetime.combine(end_date, datetime.max.time()))

        batches = query.all()
        total = len(batches)
        on_time = 0
        delayed = 0
        total_delay_hours = 0

        for batch in batches:
            if batch.expected_arrival_time and batch.actual_arrival_time:
                delay = (batch.actual_arrival_time - batch.expected_arrival_time).total_seconds() / 3600
                if delay <= 24:
                    on_time += 1
                else:
                    delayed += 1
                    total_delay_hours += max(0, delay - 24)

        arrival_query = db.query(ArrivalList)
        if start_date:
            arrival_query = arrival_query.filter(ArrivalList.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            arrival_query = arrival_query.filter(ArrivalList.created_at <= datetime.combine(end_date, datetime.max.time()))
        arrivals = arrival_query.all()

        total_expected = sum(a.expected_quantity for a in arrivals)
        total_actual = sum(a.actual_quantity for a in arrivals)
        total_shortage = sum(a.shortage_quantity for a in arrivals)

        exception_query = db.query(ExceptionOrder)
        if start_date:
            exception_query = exception_query.filter(ExceptionOrder.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            exception_query = exception_query.filter(ExceptionOrder.created_at <= datetime.combine(end_date, datetime.max.time()))
        exceptions = exception_query.all()
        total_exceptions = len(exceptions)
        closed_exceptions = sum(1 for e in exceptions if e.status == "closed")

        on_time_rate = round(on_time / total * 100, 2) if total > 0 else 0
        shortage_rate = round(total_shortage / total_expected * 100, 2) if total_expected > 0 else 0
        exception_resolve_rate = round(closed_exceptions / total_exceptions * 100, 2) if total_exceptions > 0 else 100
        avg_delay_hours = round(total_delay_hours / delayed, 2) if delayed > 0 else 0

        return {
            "summary": {
                "total_batches": total,
                "on_time_batches": on_time,
                "delayed_batches": delayed,
                "on_time_rate": on_time_rate,
                "avg_delay_hours": avg_delay_hours,
                "total_expected_qty": total_expected,
                "total_actual_qty": total_actual,
                "total_shortage_qty": total_shortage,
                "shortage_rate": shortage_rate,
                "total_exceptions": total_exceptions,
                "closed_exceptions": closed_exceptions,
                "exception_resolve_rate": exception_resolve_rate,
            },
            "caliber": ReportService.DELIVERY_CALIBER.format(update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "period": {
                "start_date": start_date.strftime("%Y-%m-%d") if start_date else None,
                "end_date": end_date.strftime("%Y-%m-%d") if end_date else None,
            },
        }

    @staticmethod
    def get_trend_data(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        from sqlalchemy import func

        query = db.query(
            func.date(GroupBatch.created_at).label("stat_date"),
            func.count(GroupBatch.id).label("total"),
        ).filter(
            GroupBatch.status.notin_([GroupBatchStatus.PENDING, GroupBatchStatus.CANCELLED])
        )
        if start_date:
            query = query.filter(GroupBatch.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(GroupBatch.created_at <= datetime.combine(end_date, datetime.max.time()))

        result = query.group_by(func.date(GroupBatch.created_at)).order_by("stat_date").all()

        trend = []
        for row in result:
            stat_date = row.stat_date
            day_batches = (
                db.query(GroupBatch)
                .filter(
                    func.date(GroupBatch.created_at) == stat_date,
                    GroupBatch.status.notin_([GroupBatchStatus.PENDING, GroupBatchStatus.CANCELLED]),
                )
                .all()
            )
            day_on_time = 0
            for batch in day_batches:
                if batch.expected_arrival_time and batch.actual_arrival_time:
                    delay = (batch.actual_arrival_time - batch.expected_arrival_time).total_seconds() / 3600
                    if delay <= 24:
                        day_on_time += 1
            day_rate = round(day_on_time / len(day_batches) * 100, 2) if day_batches else 0
            trend.append(
                {
                    "date": stat_date.strftime("%Y-%m-%d"),
                    "total": row.total,
                    "on_time": day_on_time,
                    "rate": day_rate,
                }
            )
        return trend

    @staticmethod
    def export_excel_data(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        performance = ReportService.calculate_delivery_performance(db, start_date, end_date)
        trend = ReportService.get_trend_data(db, start_date, end_date)

        query = db.query(GroupBatch).filter(
            GroupBatch.status.notin_([GroupBatchStatus.PENDING, GroupBatchStatus.CANCELLED])
        )
        if start_date:
            query = query.filter(GroupBatch.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(GroupBatch.created_at <= datetime.combine(end_date, datetime.max.time()))
        batches = query.order_by(GroupBatch.created_at.desc()).all()

        batch_data = []
        for batch in batches:
            delay_hours = 0
            is_on_time = None
            if batch.expected_arrival_time and batch.actual_arrival_time:
                delay = (batch.actual_arrival_time - batch.expected_arrival_time).total_seconds() / 3600
                delay_hours = round(max(0, delay - 24), 2)
                is_on_time = delay <= 24

            batch_data.append(
                {
                    "团单号": batch.batch_no,
                    "团单名称": batch.name,
                    "状态": dict(GroupBatchStatus.CHOICES).get(batch.status, batch.status),
                    "开团时间": batch.group_start_time.strftime("%Y-%m-%d %H:%M") if batch.group_start_time else "",
                    "预计到货": batch.expected_arrival_time.strftime("%Y-%m-%d %H:%M") if batch.expected_arrival_time else "",
                    "实际到货": batch.actual_arrival_time.strftime("%Y-%m-%d %H:%M") if batch.actual_arrival_time else "",
                    "是否准时": "是" if is_on_time is True else "否" if is_on_time is False else "-",
                    "延迟小时数": delay_hours,
                    "订单数": batch.total_orders,
                    "商品件数": batch.total_items,
                    "总金额": float(batch.total_amount) if batch.total_amount else 0,
                    "提货点": batch.pickup_point or "",
                    "操作人": batch.operator or "",
                    "创建时间": batch.created_at.strftime("%Y-%m-%d %H:%M"),
                }
            )

        return {
            "summary": performance["summary"],
            "caliber": performance["caliber"],
            "period": performance["period"],
            "trend": trend,
            "batch_data": batch_data,
        }
