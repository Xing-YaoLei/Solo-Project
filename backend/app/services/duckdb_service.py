import duckdb
import os
from typing import List, Optional, Dict, Any
from datetime import date

from app.core.config import settings


class DuckDBService:
    def __init__(self):
        os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
        self.db_path = settings.DUCKDB_PATH

    def _get_connection(self):
        return duckdb.connect(self.db_path)

    def init_tables(self, postgres_conn_str: str):
        conn = self._get_connection()
        try:
            conn.execute(f"ATTACH '{postgres_conn_str}' AS pg (TYPE postgres)")
            conn.execute("CREATE SCHEMA IF NOT EXISTS analytics")
            self._create_sales_agg_view(conn)
            self._create_funnel_view(conn)
            self._create_display_impact_view(conn)
            conn.execute("DETACH pg")
        finally:
            conn.close()

    def _create_sales_agg_view(self, conn: duckdb.DuckDBPyConnection):
        conn.execute("""
            CREATE OR REPLACE TABLE analytics.sales_daily_agg AS
            SELECT
                p.id AS promotion_id,
                p.promo_code,
                p.promo_name,
                s.id AS store_id,
                s.store_name,
                s.region,
                sr.sale_date,
                SUM(sr.sales_amount) AS sales_amount,
                SUM(sr.sales_units) AS sales_units,
                SUM(sr.original_amount) AS original_amount,
                SUM(sr.member_sales_amount) AS member_amount,
                SUM(sr.medical_insurance_amount) AS mi_amount,
                SUM(CASE WHEN sr.cashier_delay_minutes > 30 THEN 1 ELSE 0 END) AS cashier_delay_count,
                SUM(sr.member_record_missing_count) AS member_missing_total,
                SUM(CASE WHEN sr.medical_insurance_caliber_changed THEN 1 ELSE 0 END) AS mi_caliber_change_count
            FROM pg.public.sales_records sr
            JOIN pg.public.promotions p ON sr.promotion_id = p.id
            JOIN pg.public.stores s ON sr.store_id = s.id
            GROUP BY p.id, p.promo_code, p.promo_name, s.id, s.store_name, s.region, sr.sale_date
        """)

    def _create_funnel_view(self, conn: duckdb.DuckDBPyConnection):
        conn.execute("""
            CREATE OR REPLACE TABLE analytics.funnel_agg AS
            WITH promo_dates AS (
                SELECT
                    p.id AS promotion_id,
                    p.promo_code,
                    p.promo_name,
                    p.start_date,
                    p.end_date,
                    p.target_sales,
                    p.target_units,
                    s.store_name,
                    s.region,
                    s.id AS store_id
                FROM pg.public.promotions p
                JOIN pg.public.stores s ON p.store_id = s.id
            ),
            sales_total AS (
                SELECT
                    promotion_id,
                    SUM(sales_amount) AS total_sales,
                    SUM(sales_units) AS total_units
                FROM pg.public.sales_records
                GROUP BY promotion_id
            ),
            qualified_display AS (
                SELECT
                    promotion_id,
                    COUNT(*) FILTER (WHERE is_qualified = true) AS qualified_count,
                    COUNT(*) AS total_inspections,
                    AVG(overall_score) AS avg_score
                FROM pg.public.display_inspections
                GROUP BY promotion_id
            ),
            rectification_stats AS (
                SELECT
                    promotion_id,
                    COUNT(*) FILTER (WHERE rectification_status = 'completed') AS rectified_count,
                    COUNT(*) AS total_issues
                FROM pg.public.rectifications
                GROUP BY promotion_id
            )
            SELECT
                pd.*,
                COALESCE(st.total_sales, 0) AS actual_sales,
                COALESCE(st.total_units, 0) AS actual_units,
                COALESCE(qd.qualified_count, 0) AS qualified_display_count,
                COALESCE(qd.total_inspections, 0) AS total_display_checks,
                COALESCE(qd.avg_score, 0) AS avg_display_score,
                COALESCE(rs.rectified_count, 0) AS rectified_count,
                COALESCE(rs.total_issues, 0) AS total_issues
            FROM promo_dates pd
            LEFT JOIN sales_total st ON pd.promotion_id = st.promotion_id
            LEFT JOIN qualified_display qd ON pd.promotion_id = qd.promotion_id
            LEFT JOIN rectification_stats rs ON pd.promotion_id = rs.promotion_id
        """)

    def _create_display_impact_view(self, conn: duckdb.DuckDBPyConnection):
        conn.execute("""
            CREATE OR REPLACE TABLE analytics.display_impact AS
            SELECT
                di.promotion_id,
                di.inspection_date,
                di.is_qualified,
                di.overall_score,
                di.store_id,
                LEAD(di.inspection_date) OVER (
                    PARTITION BY di.promotion_id, di.store_id
                    ORDER BY di.inspection_date
                ) AS next_inspection_date,
                sr.sales_amount AS day_sales,
                sr.sales_units AS day_units
            FROM pg.public.display_inspections di
            LEFT JOIN pg.public.sales_records sr
                ON di.promotion_id = sr.promotion_id
                AND di.inspection_date = sr.sale_date
                AND di.store_id = sr.store_id
        """)

    def refresh_data(self, postgres_conn_str: str) -> int:
        conn = self._get_connection()
        try:
            conn.execute(f"ATTACH '{postgres_conn_str}' AS pg (TYPE postgres)")
            self._create_sales_agg_view(conn)
            self._create_funnel_view(conn)
            self._create_display_impact_view(conn)
            result = conn.execute("SELECT COUNT(*) FROM analytics.funnel_agg").fetchone()
            conn.execute("DETACH pg")
            return result[0] if result else 0
        finally:
            conn.close()

    def query_funnel_data(
        self,
        promotion_id: Optional[int] = None,
        region: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            query = "SELECT * FROM analytics.funnel_agg WHERE 1=1"
            params = []
            if promotion_id:
                query += " AND promotion_id = ?"
                params.append(promotion_id)
            if region:
                query += " AND region = ?"
                params.append(region)
            if start_date:
                query += " AND start_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                query += " AND end_date <= ?"
                params.append(end_date.isoformat())
            query += " ORDER BY promotion_id DESC"
            rows = conn.execute(query, params).fetchall()
            columns = [desc[0] for desc in conn.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            conn.close()

    def query_sales_trend(
        self,
        promotion_id: Optional[int] = None,
        store_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            query = "SELECT * FROM analytics.sales_daily_agg WHERE 1=1"
            params = []
            if promotion_id:
                query += " AND promotion_id = ?"
                params.append(promotion_id)
            if store_id:
                query += " AND store_id = ?"
                params.append(store_id)
            if start_date:
                query += " AND sale_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                query += " AND sale_date <= ?"
                params.append(end_date.isoformat())
            query += " ORDER BY sale_date ASC"
            rows = conn.execute(query, params).fetchall()
            columns = [desc[0] for desc in conn.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            conn.close()

    def detect_display_impact_ranges(
        self,
        promotion_id: int,
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            query = """
                WITH unqualified_periods AS (
                    SELECT
                        inspection_date,
                        COALESCE(next_inspection_date,
                            (SELECT MAX(sale_date) FROM analytics.sales_daily_agg WHERE promotion_id = ?))
                            AS end_boundary,
                        overall_score,
                        day_sales,
                        promotion_id
                    FROM analytics.display_impact
                    WHERE promotion_id = ? AND is_qualified = false
                ),
                daily_avg AS (
                    SELECT
                        promotion_id,
                        AVG(sales_amount) AS avg_daily_sales
                    FROM analytics.sales_daily_agg
                    WHERE promotion_id = ?
                    GROUP BY promotion_id
                )
                SELECT
                    up.inspection_date AS start_date,
                    up.end_boundary AS end_date,
                    (up.end_boundary - up.inspection_date) + 1 AS impact_days,
                    ROUND(
                        COALESCE(da.avg_daily_sales * ((up.end_boundary - up.inspection_date) + 1) * 0.3, 0),
                        2
                    ) AS estimated_loss_sales,
                    ROUND(AVG(up.overall_score) OVER (), 0) AS avg_score_during_period
                FROM unqualified_periods up
                CROSS JOIN daily_avg da
                WHERE up.end_boundary >= up.inspection_date
            """
            rows = conn.execute(query, [promotion_id, promotion_id, promotion_id]).fetchall()
            columns = [desc[0] for desc in conn.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            conn.close()


duckdb_service = DuckDBService()
