from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime, timedelta
import polars as pl
from src.data_layer.data_repository import DataRepository
from src.data_layer.polars_processor import PolarsProcessor
from src.business_logic.conversion_rate import ConversionRateCalculator


class SalesAnalyzer:
    def __init__(self, repository: DataRepository):
        self.repository = repository
        self.processor = PolarsProcessor()
        self.conversion_calculator = ConversionRateCalculator(repository)

    def get_sales_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> Dict[str, Any]:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            channel=channel,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return {
                "total_orders": 0,
                "total_rooms": 0,
                "total_revenue": 0.0,
                "avg_order_value": 0.0,
                "avg_price_per_room": 0.0,
                "avg_length_of_stay": 0.0,
                "total_guests": 0,
                "cancellation_rate": 0.0,
            }

        all_orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            channel=channel,
        )

        cancelled = all_orders.filter(pl.col("order_status") == "cancelled")
        cancellation_rate = (
            len(cancelled) / len(all_orders) * 100 if len(all_orders) > 0 else 0
        )

        return {
            "total_orders": len(orders),
            "total_rooms": orders["rooms"].sum(),
            "total_revenue": orders["paid_amount"].sum(),
            "avg_order_value": orders["paid_amount"].mean(),
            "avg_price_per_room": orders["paid_amount"].sum() / orders["rooms"].sum()
            if orders["rooms"].sum() > 0
            else 0,
            "avg_length_of_stay": orders["nights"].mean(),
            "total_guests": orders["guests"].sum(),
            "cancellation_rate": cancellation_rate,
        }

    def get_sales_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
        period: str = "day",
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        trend = self.processor.aggregate_by_period(
            orders,
            date_col="order_date",
            value_cols=["rooms", "paid_amount"],
            period=period,
            agg_func="sum",
        )

        trend = trend.rename({"paid_amount": "revenue"})
        trend = self.processor.calculate_growth_rate(
            trend, value_col="revenue", date_col="order_date"
        )
        trend = self.processor.calculate_moving_average(
            trend, value_col="revenue", date_col="order_date", window=7
        )

        return trend

    def get_channel_performance(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
        )

        if orders.is_empty():
            return pl.DataFrame()

        all_orders = orders.clone()
        paid_orders = orders.filter(
            pl.col("order_status").is_in(["confirmed", "paid", "completed"])
        )
        cancelled_orders = orders.filter(pl.col("order_status") == "cancelled")

        channel_stats = paid_orders.group_by("channel").agg(
            pl.count("order_id").alias("orders_count"),
            pl.sum("rooms").alias("rooms_sold"),
            pl.sum("paid_amount").alias("revenue"),
            pl.mean("paid_amount").alias("avg_order_value"),
            pl.sum("order_amount").alias("gross_revenue"),
        )

        cancelled_stats = cancelled_orders.group_by("channel").agg(
            pl.count("order_id").alias("cancelled_orders")
        )

        all_stats = all_orders.group_by("channel").agg(
            pl.count("order_id").alias("total_orders")
        )

        result = channel_stats.join(all_stats, on="channel", how="left")
        result = result.join(cancelled_stats, on="channel", how="left")
        result = result.fill_null(0)

        result = self.processor.safe_divide(
            result, "cancelled_orders", "total_orders", "cancellation_rate", 0.0
        )
        result = result.with_columns((pl.col("cancellation_rate") * 100).alias("cancellation_rate"))

        result = result.with_columns(
            channel_fee=(pl.col("gross_revenue") * 0.05).round(2),
            net_revenue=(pl.col("revenue") - pl.col("gross_revenue") * 0.05).round(2),
        )

        return result.sort("revenue", descending=True)

    def get_package_performance(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        conversion_version: str = "v1.0",
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        inventory = self.repository.get_package_inventory(
            start_date=start_date, end_date=end_date
        )

        package_stats = orders.group_by("package_id").agg(
            pl.count("order_id").alias("orders_count"),
            pl.sum("rooms").alias("rooms_sold"),
            pl.sum("paid_amount").alias("revenue"),
            pl.mean("paid_amount").alias("avg_order_value"),
            pl.mean("nights").alias("avg_length_of_stay"),
        )

        inventory_stats = inventory.group_by("package_id").agg(
            pl.sum("total_rooms").alias("total_available_rooms"),
            pl.mean("unit_price").alias("avg_unit_price"),
        )

        result = package_stats.join(inventory_stats, on="package_id", how="left")
        result = self.processor.safe_divide(
            result, "rooms_sold", "total_available_rooms", "occupancy_rate", 0.0
        )
        result = result.with_columns((pl.col("occupancy_rate") * 100).alias("occupancy_rate"))

        try:
            conversion = self.conversion_calculator.calculate_conversion(
                orders, inventory, conversion_version, group_by=["package_id"]
            )
            if not conversion.is_empty():
                result = result.join(
                    conversion.select(["package_id", "conversion_rate"]),
                    on="package_id",
                    how="left",
                )
        except (ValueError, Exception):
            result = result.with_columns(conversion_rate=pl.lit(None).cast(pl.Float64))

        return result.sort("revenue", descending=True)

    def get_price_elasticity(
        self,
        package_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        inventory = self.repository.get_package_inventory(
            start_date=start_date, end_date=end_date, package_id=package_id
        )

        if inventory.is_empty():
            return pl.DataFrame()

        daily_orders = orders.group_by("order_date").agg(
            pl.count("order_id").alias("orders_count"),
            pl.sum("rooms").alias("rooms_sold"),
            pl.mean("paid_amount").alias("avg_price"),
        )

        result = daily_orders.join(
            inventory.select(["date", "unit_price", "available_rooms"]),
            left_on="order_date",
            right_on="date",
            how="left",
        )

        result = result.sort("order_date")
        result = result.with_columns(
            price_change_pct=(
                (pl.col("unit_price") - pl.col("unit_price").shift(1))
                / pl.col("unit_price").shift(1)
                * 100
            ),
            demand_change_pct=(
                (pl.col("rooms_sold") - pl.col("rooms_sold").shift(1))
                / pl.col("rooms_sold").shift(1)
                * 100
            ),
        )

        result = self.processor.safe_divide(
            result, "demand_change_pct", "price_change_pct", "price_elasticity", 0.0
        )

        return result

    def get_booking_lead_time_analysis(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        orders = orders.with_columns(
            lead_days=(pl.col("checkin_date") - pl.col("order_date")).cast(pl.Int32)
        )

        lead_time_bins = [0, 1, 3, 7, 14, 30, float("inf")]
        lead_time_labels = ["当天", "1-2天", "3-6天", "7-13天", "14-29天", "30天以上"]

        orders = orders.with_columns(
            lead_time_category=pl.col("lead_days").cut(
                breaks=lead_time_bins, labels=lead_time_labels, left_closed=True
            )
        )

        result = orders.group_by("lead_time_category").agg(
            pl.count("order_id").alias("orders_count"),
            pl.sum("rooms").alias("rooms_sold"),
            pl.sum("paid_amount").alias("revenue"),
            pl.mean("paid_amount").alias("avg_order_value"),
            pl.mean("lead_days").alias("avg_lead_days"),
        )

        total_orders = result["orders_count"].sum()
        result = result.with_columns(
            percentage=(pl.col("orders_count") / total_orders * 100).round(2)
        )

        return result

    def get_length_of_stay_analysis(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        los_bins = [1, 2, 3, 5, 7, 14, float("inf")]
        los_labels = ["1晚", "2晚", "3-4晚", "5-6晚", "7-13晚", "14晚以上"]

        orders = orders.with_columns(
            los_category=pl.col("nights").cut(
                breaks=los_bins, labels=los_labels, left_closed=True
            )
        )

        result = orders.group_by("los_category").agg(
            pl.count("order_id").alias("orders_count"),
            pl.sum("rooms").alias("rooms_sold"),
            pl.sum("paid_amount").alias("revenue"),
            pl.mean("paid_amount").alias("avg_order_value"),
            pl.mean("nights").alias("avg_nights"),
        )

        total_orders = result["orders_count"].sum()
        result = result.with_columns(
            percentage=(pl.col("orders_count") / total_orders * 100).round(2)
        )

        return result

    def compare_periods(
        self,
        current_start: date,
        current_end: date,
        previous_start: date,
        previous_end: date,
        package_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        current = self.get_sales_summary(current_start, current_end, package_id)
        previous = self.get_sales_summary(previous_start, previous_end, package_id)

        comparison = {}
        for key in current:
            if isinstance(current[key], (int, float)) and isinstance(previous[key], (int, float)):
                abs_diff = current[key] - previous[key]
                rel_diff = (abs_diff / previous[key] * 100) if previous[key] != 0 else None
                comparison[key] = {
                    "current": current[key],
                    "previous": previous[key],
                    "absolute_difference": abs_diff,
                    "relative_difference": rel_diff,
                }
            else:
                comparison[key] = {
                    "current": current[key],
                    "previous": previous[key],
                }

        return comparison

    def get_actuals_vs_forecast(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        package_id: Optional[str] = None,
    ) -> pl.DataFrame:
        orders = self.repository.get_ota_orders(
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            order_status=["confirmed", "paid", "completed"],
        )

        if orders.is_empty():
            return pl.DataFrame()

        daily_actuals = orders.group_by("order_date").agg(
            pl.sum("rooms").alias("actual_rooms"),
            pl.sum("paid_amount").alias("actual_revenue"),
        )

        inventory = self.repository.get_package_inventory(
            start_date=start_date, end_date=end_date, package_id=package_id
        )

        if inventory.is_empty():
            return daily_actuals

        daily_forecast = inventory.group_by("date").agg(
            pl.mean("unit_price").alias("forecast_price"),
            pl.sum("total_rooms").alias("total_rooms"),
        )

        daily_forecast = daily_forecast.with_columns(
            forecast_rooms=(pl.col("total_rooms") * 0.7).cast(pl.Int32),
            forecast_revenue=(pl.col("total_rooms") * 0.7 * pl.col("forecast_price")).round(2),
        )

        result = daily_actuals.join(
            daily_forecast.select(["date", "forecast_rooms", "forecast_revenue", "total_rooms"]),
            left_on="order_date",
            right_on="date",
            how="outer",
        ).sort("order_date")

        result = result.fill_null(0)
        result = result.with_columns(
            rooms_variance=pl.col("actual_rooms") - pl.col("forecast_rooms"),
            revenue_variance=pl.col("actual_revenue") - pl.col("forecast_revenue"),
            occupancy_rate=self.processor.safe_divide(
                result, "actual_rooms", "total_rooms", "occupancy_rate", 0.0
            )["occupancy_rate"]
            * 100,
        )

        return result
