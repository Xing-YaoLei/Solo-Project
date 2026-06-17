import pandas as pd
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.analytics.duckdb_client import duckdb_client
from app.schemas.analytics import (
    UtilityReadingDistribution,
    InspectionFunnel,
    PaymentRanking,
    ComplaintTagTrend,
    RepairDurationStats,
)


class AnalyticsMetrics:
    def __init__(self, client=None):
        self.client = client or duckdb_client

    def sync_data(self, tables: Optional[List[str]] = None):
        self.client.sync_from_postgres(tables)

    def get_utility_reading_distribution(
        self,
        start_month: Optional[str] = None,
        end_month: Optional[str] = None,
        district: Optional[str] = None,
    ) -> List[UtilityReadingDistribution]:
        where_conditions = []
        params = {}

        if start_month:
            where_conditions.append("strftime('%Y-%m', inspection_date) >= ?")
            params["start_month"] = start_month
        if end_month:
            where_conditions.append("strftime('%Y-%m', inspection_date) <= ?")
            params["end_month"] = end_month
        if district:
            where_conditions.append("p.district = ?")
            params["district"] = district

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        query = f"""
        SELECT
            strftime('%Y-%m', ir.inspection_date) AS month,
            p.district,
            AVG(ir.water_reading_end) AS avg_water,
            AVG(ir.electricity_reading_end) AS avg_electricity,
            AVG(ir.gas_reading_end) AS avg_gas,
            COUNT(*) AS count
        FROM inspection_records ir
        JOIN properties p ON ir.property_id = p.id
        WHERE {where_clause}
          AND ir.water_reading_end IS NOT NULL
          AND ir.status = 'completed'
        GROUP BY month, p.district
        ORDER BY month, p.district
        """

        df = self.client.execute_query(query, params)
        
        results = []
        for _, row in df.iterrows():
            results.append(UtilityReadingDistribution(
                month=row["month"],
                district=row["district"],
                avg_water=float(row["avg_water"]),
                avg_electricity=float(row["avg_electricity"]),
                avg_gas=float(row["avg_gas"]),
                count=int(row["count"]),
            ))
        
        return results

    def get_inspection_funnel(self) -> List[InspectionFunnel]:
        query = """
        SELECT
            'applied' AS stage,
            COUNT(*) AS count
        FROM inspection_records
        WHERE apply_date IS NOT NULL

        UNION ALL

        SELECT
            'assigned' AS stage,
            COUNT(*) AS count
        FROM inspection_records
        WHERE inspector_id IS NOT NULL

        UNION ALL

        SELECT
            'inspected' AS stage,
            COUNT(*) AS count
        FROM inspection_records
        WHERE inspection_date IS NOT NULL

        UNION ALL

        SELECT
            'completed' AS stage,
            COUNT(*) AS count
        FROM inspection_records
        WHERE status = 'completed'
        """

        df = self.client.execute_query(query)
        
        results = []
        total_applied = df[df["stage"] == "applied"]["count"].values[0] if len(df) > 0 else 0
        
        for _, row in df.iterrows():
            count = int(row["count"])
            conversion_rate = round(count / total_applied * 100, 2) if total_applied > 0 else 0
            results.append(InspectionFunnel(
                stage=row["stage"],
                count=count,
                conversion_rate=conversion_rate,
            ))
        
        return results

    def get_payment_ranking(
        self,
        dimension: str = "property",
        period: Optional[str] = None,
        limit: int = 10,
    ) -> List[PaymentRanking]:
        if dimension not in ["property", "district", "month"]:
            dimension = "property"

        if dimension == "property":
            key_column = "p.property_no"
            join_clause = "JOIN properties p ON pt.property_id = p.id"
            group_by = "p.property_no"
        elif dimension == "district":
            key_column = "p.district"
            join_clause = "JOIN properties p ON pt.property_id = p.id"
            group_by = "p.district"
        else:
            key_column = "strftime('%Y-%m', pt.payment_date)"
            join_clause = ""
            group_by = "strftime('%Y-%m', pt.payment_date)"

        where_clause = ""
        params = {}
        if period:
            where_clause = "WHERE strftime('%Y-%m', pt.payment_date) = ?"
            params["period"] = period

        query = f"""
        SELECT
            {key_column} AS key,
            SUM(pt.amount) AS total_amount,
            COUNT(*) AS transaction_count
        FROM payment_transactions pt
        {join_clause}
        {where_clause}
        GROUP BY {group_by}
        ORDER BY total_amount DESC
        LIMIT {limit}
        """

        df = self.client.execute_query(query, params)
        
        results = []
        for _, row in df.iterrows():
            results.append(PaymentRanking(
                period=period or "all",
                dimension=dimension,
                key=str(row["key"]),
                total_amount=int(row["total_amount"]),
                transaction_count=int(row["transaction_count"]),
            ))
        
        return results

    def get_complaint_tag_trend(
        self,
        start_month: Optional[str] = None,
        end_month: Optional[str] = None,
    ) -> List[ComplaintTagTrend]:
        where_conditions = []
        params = {}

        if start_month:
            where_conditions.append("strftime('%Y-%m', report_date) >= ?")
            params["start_month"] = start_month
        if end_month:
            where_conditions.append("strftime('%Y-%m', report_date) <= ?")
            params["end_month"] = end_month

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        query = f"""
        SELECT
            strftime('%Y-%m', report_date) AS month,
            unnest AS tag,
            COUNT(*) AS count
        FROM complaints,
             UNNEST(tags) AS t(unnest)
        WHERE {where_clause}
          AND tags IS NOT NULL
        GROUP BY month, unnest
        ORDER BY month, count DESC
        """

        df = self.client.execute_query(query, params)
        
        results = []
        for _, row in df.iterrows():
            results.append(ComplaintTagTrend(
                month=row["month"],
                tag=str(row["tag"]),
                count=int(row["count"]),
            ))
        
        return results

    def get_repair_duration_stats(
        self,
        worker_id: Optional[int] = None,
        repair_type: Optional[str] = None,
        caliber_version: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_role: Optional[str] = None,
        current_user_id: Optional[int] = None,
    ) -> List[RepairDurationStats]:
        where_conditions = []
        params = {}

        if user_role == "worker" and current_user_id is not None:
            where_conditions.append("ro.worker_id = ?")
            params["worker_id"] = current_user_id
        elif worker_id is not None:
            where_conditions.append("ro.worker_id = ?")
            params["worker_id"] = worker_id

        if repair_type:
            where_conditions.append("ro.repair_type = ?")
            params["repair_type"] = repair_type

        if caliber_version:
            where_conditions.append("ro.caliber_version = ?")
            params["caliber_version"] = caliber_version

        if start_date:
            where_conditions.append("ro.complete_time >= ?")
            params["start_date"] = start_date
        if end_date:
            where_conditions.append("ro.complete_time <= ?")
            params["end_date"] = end_date

        where_conditions.append("ro.status = 'completed'")
        where_conditions.append("ro.duration_hours IS NOT NULL")
        where_clause = " AND ".join(where_conditions)

        group_by_cols = ["ro.caliber_version"]
        select_cols = [
            "ro.caliber_version",
            "AVG(ro.duration_hours) AS avg_duration",
            "MEDIAN(ro.duration_hours) AS median_duration",
            "COUNT(*) AS total_orders",
        ]

        if user_role != "worker":
            group_by_cols.extend(["ro.worker_id", "u.full_name", "ro.repair_type"])
            select_cols.extend(["ro.worker_id", "u.full_name AS worker_name", "ro.repair_type"])

        group_by = ", ".join(group_by_cols)
        select = ", ".join(select_cols)

        query = f"""
        SELECT
            {select}
        FROM repair_orders ro
        LEFT JOIN users u ON ro.worker_id = u.id
        WHERE {where_clause}
        GROUP BY {group_by}
        ORDER BY avg_duration DESC
        """

        df = self.client.execute_query(query, params)
        
        results = []
        for _, row in df.iterrows():
            results.append(RepairDurationStats(
                worker_id=int(row["worker_id"]) if "worker_id" in row and pd.notna(row["worker_id"]) else None,
                worker_name=row["worker_name"] if "worker_name" in row and pd.notna(row["worker_name"]) else None,
                repair_type=row["repair_type"] if "repair_type" in row else None,
                avg_duration=float(row["avg_duration"]),
                median_duration=float(row["median_duration"]),
                total_orders=int(row["total_orders"]),
                caliber_version=str(row["caliber_version"]),
            ))
        
        return results

    def get_repair_duration_by_caliber(
        self,
        caliber_version: str,
        worker_id: Optional[int] = None,
        user_role: Optional[str] = None,
        current_user_id: Optional[int] = None,
    ) -> List[RepairDurationStats]:
        return self.get_repair_duration_stats(
            worker_id=worker_id,
            caliber_version=caliber_version,
            user_role=user_role,
            current_user_id=current_user_id,
        )


analytics_metrics = AnalyticsMetrics()
