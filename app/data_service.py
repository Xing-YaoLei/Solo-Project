import pandas as pd
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal

from sqlalchemy import and_, func
from models.database import SessionLocal
from models import (
    ReservationFunnel,
    DataBatch,
    CapacityRule,
    CameraStats,
    GateRecord,
    MerchantTransaction,
)
from config import Config


class DataService:
    @staticmethod
    def get_funnel_data(
        start_date: date,
        end_date: date,
        zones: Optional[List[str]] = None,
        time_slots: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        db = SessionLocal()
        try:
            query = db.query(ReservationFunnel).filter(
                and_(
                    ReservationFunnel.funnel_date >= start_date,
                    ReservationFunnel.funnel_date <= end_date,
                )
            )
            if zones:
                query = query.filter(ReservationFunnel.zone.in_(zones))
            if time_slots:
                query = query.filter(ReservationFunnel.time_slot.in_(time_slots))

            rows = query.all()
            data = []
            for r in rows:
                data.append({
                    "date": r.funnel_date,
                    "time_slot": r.time_slot,
                    "zone": r.zone,
                    "reservation_count": int(r.reservation_count or 0),
                    "reminder_sent": int(r.reminder_sent or 0),
                    "reminder_confirmed": int(r.reminder_confirmed or 0),
                    "checked_in": int(r.checked_in or 0),
                    "in_zone": int(r.in_zone or 0),
                    "consumed": int(r.consumed or 0),
                    "cancelled": int(r.cancelled or 0),
                    "no_show": int(r.no_show or 0),
                    "checkin_rate": float(r.checkin_rate or 0),
                    "in_zone_rate": float(r.in_zone_rate or 0),
                    "conversion_rate": float(r.conversion_rate or 0),
                    "arrival_status": r.arrival_status or "normal",
                    "remark": r.remark or "",
                    "camera_total_flow": int(r.camera_total_flow or 0),
                    "merchant_total_visitors": int(r.merchant_total_visitors or 0),
                    "merchant_total_amount": float(r.merchant_total_amount or 0),
                })
            return pd.DataFrame(data)
        finally:
            db.close()

    @staticmethod
    def get_arrival_status_distribution(
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["arrival_status", "count"])
        status_counts = df.groupby("arrival_status").size().reset_index(name="count")
        status_map = {
            "normal": "正常",
            "warning": "预警",
            "critical": "严重",
        }
        status_counts = status_counts.assign(
            arrival_status=status_counts["arrival_status"].map(status_map).fillna(status_counts["arrival_status"])
        )
        return status_counts

    @staticmethod
    def get_funnel_summary(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["stage", "count"])
        stages = [
            ("预约总数", "reservation_count"),
            ("已发提醒", "reminder_sent"),
            ("提醒确认", "reminder_confirmed"),
            ("已检票", "checked_in"),
            ("到达区域", "in_zone"),
            ("已消费", "consumed"),
        ]
        summary = []
        for label, col in stages:
            summary.append({"stage": label, "count": int(df[col].sum())})
        return pd.DataFrame(summary)

    @staticmethod
    def get_calendar_timeslot_rank(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["time_slot", "zone", "checked_in", "reservation_count"])
        agg = df.groupby(["time_slot", "zone"]).agg({
            "checked_in": "sum",
            "reservation_count": "sum",
        }).reset_index()
        agg["checkin_rate"] = agg.apply(
            lambda r: r["checked_in"] / r["reservation_count"] if r["reservation_count"] > 0 else 0,
            axis=1,
        )
        agg = agg.sort_values("checked_in", ascending=False)
        return agg

    @staticmethod
    def get_capacity_changes(
        start_date: date,
        end_date: date,
        zones: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        db = SessionLocal()
        try:
            query = db.query(CapacityRule).filter(
                and_(
                    CapacityRule.effective_date >= start_date,
                    CapacityRule.effective_date <= end_date,
                )
            )
            if zones:
                query = query.filter(CapacityRule.zone.in_(zones))
            rows = query.order_by(CapacityRule.effective_date, CapacityRule.zone, CapacityRule.time_slot).all()
            data = []
            for r in rows:
                data.append({
                    "date": r.effective_date,
                    "zone": r.zone,
                    "time_slot": r.time_slot,
                    "max_capacity": int(r.max_capacity or 0),
                    "warning_threshold": int(r.warning_threshold or 0),
                    "rule_type": r.rule_type or "normal",
                    "reason": r.reason or "",
                })
            return pd.DataFrame(data)
        finally:
            db.close()

    @staticmethod
    def get_reminder_list(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["date", "zone", "time_slot", "pending_reminder", "checkin_rate"])
        df = df.copy()
        df = df.assign(pending_reminder=df["reminder_sent"] - df["checked_in"])
        filtered = df[df["pending_reminder"] > 10].copy()
        filtered = filtered.sort_values("pending_reminder", ascending=False)
        return filtered[["date", "zone", "time_slot", "pending_reminder", "checkin_rate", "reservation_count", "checked_in"]]

    @staticmethod
    def get_recent_batches(limit: int = 20) -> pd.DataFrame:
        db = SessionLocal()
        try:
            rows = db.query(DataBatch).order_by(DataBatch.started_at.desc()).limit(limit).all()
            data = []
            source_map = {"camera": "摄像头", "gate": "闸机", "merchant": "商户", "merge": "合并加工", "manual": "手动"}
            status_map = {"pending": "待处理", "processing": "处理中", "completed": "已完成", "failed": "失败"}
            for r in rows:
                data.append({
                    "批次号": r.batch_no,
                    "来源": source_map.get(r.source, r.source),
                    "记录数": int(r.record_count or 0),
                    "状态": status_map.get(r.status, r.status),
                    "开始时间": r.started_at.strftime("%Y-%m-%d %H:%M:%S") if r.started_at else "",
                    "完成时间": r.completed_at.strftime("%Y-%m-%d %H:%M:%S") if r.completed_at else "",
                    "刷新时间": r.refresh_time.strftime("%Y-%m-%d %H:%M:%S") if r.refresh_time else "",
                    "备注": r.remark or "",
                })
            return pd.DataFrame(data)
        finally:
            db.close()

    @staticmethod
    def get_zone_detail_rates(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["zone", "avg_checkin_rate", "avg_conversion_rate", "total_checked_in"])
        agg = df.groupby("zone").agg({
            "checked_in": "sum",
            "reservation_count": "sum",
            "consumed": "sum",
            "checkin_rate": "mean",
            "conversion_rate": "mean",
        }).reset_index()
        agg.columns = ["zone", "total_checked_in", "total_reservation", "total_consumed", "avg_checkin_rate", "avg_conversion_rate"]
        return agg.sort_values("total_checked_in", ascending=False)
