from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime, timedelta
import polars as pl
from src.data_layer.data_repository import DataRepository


class OversellDetector:
    def __init__(self, repository: DataRepository):
        self.repository = repository

    def detect_oversell(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
        auto_create_records: bool = True,
    ) -> pl.DataFrame:
        inventory = self.repository.get_package_inventory(
            start_date=start_date, end_date=end_date, package_id=package_id
        )

        if inventory.is_empty():
            return pl.DataFrame()

        oversell = inventory.filter(
            (pl.col("booked_rooms") + pl.col("reserved_rooms")) > pl.col("total_rooms")
        ).with_columns(
            oversell_rooms=(pl.col("booked_rooms") + pl.col("reserved_rooms") - pl.col("total_rooms"))
        )

        if oversell.is_empty():
            return pl.DataFrame()

        oversell = oversell.select(
            [
                pl.lit(None).alias("oversell_id"),
                pl.col("package_id"),
                pl.lit(None).alias("order_id"),
                pl.col("date").alias("oversell_date"),
                pl.col("oversell_rooms"),
                pl.lit(datetime.now()).alias("detected_at"),
                pl.lit("pending").alias("status"),
                pl.lit(None).alias("handler"),
                pl.lit(None).alias("handled_at"),
                pl.lit(None).alias("handling_result"),
                pl.concat_str(
                    [
                        pl.lit("超卖检测: 总房量"),
                        pl.col("total_rooms").cast(pl.Utf8),
                        pl.lit(", 已订"),
                        pl.col("booked_rooms").cast(pl.Utf8),
                        pl.lit(", 预留"),
                        pl.col("reserved_rooms").cast(pl.Utf8),
                    ]
                ).alias("remark"),
                pl.lit(datetime.now()).alias("created_at"),
            ]
        )

        if auto_create_records:
            for row in oversell.iter_rows(named=True):
                row_data = {k: v for k, v in row.items() if v is not None}
                existing = self.repository.get_oversell_records(
                    start_date=row["oversell_date"],
                    end_date=row["oversell_date"],
                    package_id=row["package_id"],
                    status=["pending", "processing"],
                )
                if existing.is_empty():
                    self.repository.save_oversell_record(row_data)

        return oversell

    def get_affected_orders(
        self,
        package_id: str,
        oversell_date: date,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            package_id=package_id,
            order_status=["confirmed", "paid"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        affected = orders.filter(
            (pl.col("checkin_date") <= oversell_date)
            & (pl.col("checkout_date") > oversell_date)
        ).sort("order_date", descending=False)

        return affected

    def get_oversell_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pl.DataFrame:
        oversell = self.repository.get_oversell_records(
            start_date=start_date, end_date=end_date
        )

        if oversell.is_empty():
            return pl.DataFrame()

        return (
            oversell.group_by(["package_id", "status"])
            .agg(
                pl.count("oversell_id").alias("incident_count"),
                pl.sum("oversell_rooms").alias("total_oversell_rooms"),
                pl.min("oversell_date").alias("first_oversell_date"),
                pl.max("oversell_date").alias("last_oversell_date"),
            )
            .sort("total_oversell_rooms", descending=True)
        )

    def create_handling_task(
        self,
        oversell_id: str,
        handler: str,
        priority: str = "high",
    ) -> Dict[str, Any]:
        self.repository.update_oversell_status(
            oversell_id=oversell_id,
            status="processing",
            handler=handler,
        )

        oversell_records = self.repository.get_oversell_records()
        oversell = oversell_records.filter(pl.col("oversell_id") == oversell_id)

        if oversell.is_empty():
            raise ValueError(f"Oversell record not found: {oversell_id}")

        row = oversell.row(0, named=True)
        affected_orders = self.get_affected_orders(row["package_id"], row["oversell_date"])

        return {
            "task_id": f"TASK{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "oversell_id": oversell_id,
            "package_id": row["package_id"],
            "oversell_date": row["oversell_date"],
            "oversell_rooms": row["oversell_rooms"],
            "handler": handler,
            "priority": priority,
            "status": "processing",
            "affected_orders_count": len(affected_orders),
            "affected_orders": affected_orders.to_dicts(),
            "created_at": datetime.now(),
        }

    def resolve_oversell(
        self,
        oversell_id: str,
        handling_result: str,
        remark: Optional[str] = None,
    ) -> None:
        self.repository.update_oversell_status(
            oversell_id=oversell_id,
            status="resolved",
            handling_result=handling_result,
            remark=remark,
        )

    def get_pending_oversells(self) -> pl.DataFrame:
        return self.repository.get_oversell_records(status=["pending", "processing"])

    def analyze_oversell_root_cause(
        self,
        package_id: str,
        oversell_date: date,
    ) -> Dict[str, Any]:
        orders = self.get_affected_orders(package_id, oversell_date)
        inventory = self.repository.get_package_inventory(
            start_date=oversell_date - timedelta(days=7),
            end_date=oversell_date,
            package_id=package_id,
        )

        channels = orders["channel"].value_counts().to_dicts() if not orders.is_empty() else []
        booking_dates = orders.group_by("order_date").agg(
            pl.count("order_id").alias("orders_count")
        ).sort("order_date") if not orders.is_empty() else pl.DataFrame()

        inventory_trend = (
            inventory.sort("date")
            .select(["date", "total_rooms", "booked_rooms", "reserved_rooms", "available_rooms"])
            if not inventory.is_empty()
            else pl.DataFrame()
        )

        pricing = self.repository.get_pricing_rules(package_id=package_id, is_active=True)
        active_pricing = pricing.filter(
            (pl.col("start_date") <= oversell_date) & (pl.col("end_date") >= oversell_date)
        ) if not pricing.is_empty() else pl.DataFrame()

        return {
            "package_id": package_id,
            "oversell_date": oversell_date,
            "total_affected_orders": len(orders),
            "total_affected_rooms": orders["rooms"].sum() if not orders.is_empty() else 0,
            "channel_distribution": channels,
            "booking_timeline": booking_dates.to_dicts(),
            "inventory_trend_7d": inventory_trend.to_dicts(),
            "active_pricing_rules": active_pricing.to_dicts(),
            "potential_causes": self._identify_potential_causes(
                orders, inventory, oversell_date
            ),
        }

    def _identify_potential_causes(
        self,
        orders: pl.DataFrame,
        inventory: pl.DataFrame,
        oversell_date: date,
    ) -> List[str]:
        causes = []

        if orders.is_empty() or inventory.is_empty():
            return causes

        last_inventory = inventory.sort("date").tail(1).row(0, named=True)
        if last_inventory["available_rooms"] < 0:
            causes.append("库存可用量为负，系统未及时阻止超卖")

        channel_counts = orders["channel"].value_counts()
        if len(channel_counts) > 1:
            max_channel = channel_counts.sort("count", descending=True).row(0)
            if max_channel["count"] / len(orders) > 0.7:
                causes.append(f"渠道集中，{max_channel['channel']} 占比超过70%")

        last_minute = orders.filter(
            (oversell_date - pl.col("order_date")).cast(pl.Int32) <= 2
        )
        if len(last_minute) / len(orders) > 0.5:
            causes.append("超过50%的订单为临期预订（2天内）")

        same_day_booking = orders.filter(pl.col("order_date") == pl.col("checkin_date"))
        if len(same_day_booking) > 0:
            causes.append(f"存在 {len(same_day_booking)} 个当天预订订单")

        pricing = self.repository.get_pricing_rules(
            package_id=orders["package_id"][0] if len(orders) > 0 else None,
            is_active=True,
        )
        if not pricing.is_empty():
            active = pricing.filter(
                (pl.col("start_date") <= oversell_date) & (pl.col("end_date") >= oversell_date)
            )
            if not active.is_empty():
                rule = active.row(0, named=True)
                if rule["last_minute_discount"] > 0:
                    causes.append("启用了临期折扣，可能导致订单激增")
                if rule["long_stay_discount"] > 0:
                    causes.append("启用了长住折扣，可能导致房间被长时间占用")

        return causes

    def get_oversell_statistics(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        oversell = self.repository.get_oversell_records(
            start_date=start_date, end_date=end_date
        )

        if oversell.is_empty():
            return {
                "total_incidents": 0,
                "total_oversell_rooms": 0,
                "pending_count": 0,
                "processing_count": 0,
                "resolved_count": 0,
                "avg_resolution_time_hours": 0,
                "affected_packages": 0,
            }

        resolved = oversell.filter(pl.col("status") == "resolved")
        resolution_times = []
        if not resolved.is_empty():
            for row in resolved.iter_rows(named=True):
                if row["handled_at"] and row["detected_at"]:
                    delta = row["handled_at"] - row["detected_at"]
                    resolution_times.append(delta.total_seconds() / 3600)

        return {
            "total_incidents": len(oversell),
            "total_oversell_rooms": oversell["oversell_rooms"].sum(),
            "pending_count": (oversell["status"] == "pending").sum(),
            "processing_count": (oversell["status"] == "processing").sum(),
            "resolved_count": (oversell["status"] == "resolved").sum(),
            "avg_resolution_time_hours": (
                sum(resolution_times) / len(resolution_times) if resolution_times else 0
            ),
            "affected_packages": oversell["package_id"].n_unique(),
        }
