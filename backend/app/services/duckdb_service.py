import duckdb
import os
import pandas as pd
from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.config import settings


class DuckDBService:
    def __init__(self):
        os.makedirs(os.path.dirname(settings.DUCKDB_PATH), exist_ok=True)
        self.db_path = settings.DUCKDB_PATH

    def _get_connection(self):
        return duckdb.connect(self.db_path)

    def _ensure_schema(self, conn):
        conn.execute("CREATE SCHEMA IF NOT EXISTS analytics")

    def ensure_tables(self):
        conn = self._get_connection()
        try:
            self._ensure_schema(conn)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics.sales_daily_agg (
                    promotion_id INTEGER,
                    promo_code VARCHAR,
                    promo_name VARCHAR,
                    store_id INTEGER,
                    store_name VARCHAR,
                    region VARCHAR,
                    sale_date DATE,
                    sales_amount DOUBLE,
                    sales_units INTEGER,
                    original_amount DOUBLE,
                    member_amount DOUBLE,
                    mi_amount DOUBLE,
                    cashier_delay_count INTEGER,
                    member_missing_total INTEGER,
                    mi_caliber_change_count INTEGER
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics.funnel_agg (
                    promotion_id INTEGER,
                    promo_code VARCHAR,
                    promo_name VARCHAR,
                    start_date DATE,
                    end_date DATE,
                    target_sales DOUBLE,
                    target_units INTEGER,
                    store_name VARCHAR,
                    region VARCHAR,
                    store_id INTEGER,
                    actual_sales DOUBLE,
                    actual_units INTEGER,
                    qualified_display_count INTEGER,
                    total_display_checks INTEGER,
                    avg_display_score DOUBLE,
                    rectified_count INTEGER,
                    total_issues INTEGER
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics.display_impact (
                    promotion_id INTEGER,
                    inspection_date DATE,
                    is_qualified BOOLEAN,
                    overall_score INTEGER,
                    store_id INTEGER,
                    next_inspection_date DATE,
                    day_sales DOUBLE,
                    day_units INTEGER
                )
            """)
        finally:
            conn.close()

    def refresh_data(self, db: Session) -> int:
        from app import models

        self.ensure_tables()
        conn = self._get_connection()
        try:
            self._ensure_schema(conn)

            self._refresh_sales_agg(conn, db)
            self._refresh_funnel_agg(conn, db)
            self._refresh_display_impact(conn, db)

            result = conn.execute("SELECT COUNT(*) FROM analytics.funnel_agg").fetchone()
            return result[0] if result else 0
        finally:
            conn.close()

    def _refresh_sales_agg(self, conn, db: Session):
        from app import models

        rows = (
            db.query(
                models.Promotion.id.label("promotion_id"),
                models.Promotion.promo_code,
                models.Promotion.promo_name,
                models.Store.id.label("store_id"),
                models.Store.store_name,
                models.Store.region,
                models.SalesRecord.sale_date,
                func.SUM(models.SalesRecord.sales_amount).label("sales_amount"),
                func.SUM(models.SalesRecord.sales_units).label("sales_units"),
                func.SUM(models.SalesRecord.original_amount).label("original_amount"),
                func.SUM(models.SalesRecord.member_sales_amount).label("member_amount"),
                func.SUM(models.SalesRecord.medical_insurance_amount).label("mi_amount"),
                func.SUM(
                    case(
                        (models.SalesRecord.cashier_delay_minutes > 30, 1),
                        else_=0,
                    )
                ).label("cashier_delay_count"),
                func.SUM(models.SalesRecord.member_record_missing_count).label(
                    "member_missing_total"
                ),
                func.SUM(
                    case(
                        (models.SalesRecord.medical_insurance_caliber_changed == True, 1),
                        else_=0,
                    )
                ).label("mi_caliber_change_count"),
            )
            .join(models.Promotion, models.SalesRecord.promotion_id == models.Promotion.id)
            .join(models.Store, models.SalesRecord.store_id == models.Store.id)
            .group_by(
                models.Promotion.id,
                models.Promotion.promo_code,
                models.Promotion.promo_name,
                models.Store.id,
                models.Store.store_name,
                models.Store.region,
                models.SalesRecord.sale_date,
            )
            .all()
        )

        if rows:
            df = pd.DataFrame(rows, columns=[
                "promotion_id", "promo_code", "promo_name",
                "store_id", "store_name", "region", "sale_date",
                "sales_amount", "sales_units", "original_amount",
                "member_amount", "mi_amount",
                "cashier_delay_count", "member_missing_total", "mi_caliber_change_count",
            ])
            for col in ["sales_amount", "sales_units", "original_amount", "member_amount", "mi_amount"]:
                df.loc[:, col] = df[col].fillna(0)
            for col in ["cashier_delay_count", "member_missing_total", "mi_caliber_change_count"]:
                df.loc[:, col] = df[col].fillna(0).astype(int)
        else:
            df = pd.DataFrame(columns=[
                "promotion_id", "promo_code", "promo_name",
                "store_id", "store_name", "region", "sale_date",
                "sales_amount", "sales_units", "original_amount",
                "member_amount", "mi_amount",
                "cashier_delay_count", "member_missing_total", "mi_caliber_change_count",
            ])

        conn.execute("DELETE FROM analytics.sales_daily_agg")
        conn.register("_tmp_sales", df)
        conn.execute("INSERT INTO analytics.sales_daily_agg SELECT * FROM _tmp_sales")
        conn.unregister("_tmp_sales")

    def _refresh_funnel_agg(self, conn, db: Session):
        from app import models

        promo_dates = (
            db.query(
                models.Promotion.id.label("promotion_id"),
                models.Promotion.promo_code,
                models.Promotion.promo_name,
                models.Promotion.start_date,
                models.Promotion.end_date,
                models.Promotion.target_sales,
                models.Promotion.target_units,
                models.Store.store_name,
                models.Store.region,
                models.Store.id.label("store_id"),
            )
            .join(models.Store, models.Promotion.store_id == models.Store.id)
            .all()
        )

        sales_total = (
            db.query(
                models.SalesRecord.promotion_id.label("promotion_id"),
                func.SUM(models.SalesRecord.sales_amount).label("total_sales"),
                func.SUM(models.SalesRecord.sales_units).label("total_units"),
            )
            .group_by(models.SalesRecord.promotion_id)
            .all()
        )
        sales_map = {r.promotion_id: r for r in sales_total}

        qualified_display = (
            db.query(
                models.DisplayInspection.promotion_id.label("promotion_id"),
                func.SUM(case((models.DisplayInspection.is_qualified == True, 1), else_=0)).label(
                    "qualified_count"
                ),
                func.COUNT(models.DisplayInspection.id).label("total_inspections"),
                func.AVG(models.DisplayInspection.overall_score).label("avg_score"),
            )
            .group_by(models.DisplayInspection.promotion_id)
            .all()
        )
        display_map = {r.promotion_id: r for r in qualified_display}

        rectification_stats = (
            db.query(
                models.Rectification.promotion_id.label("promotion_id"),
                func.SUM(
                    case((models.Rectification.rectification_status == "completed", 1), else_=0)
                ).label("rectified_count"),
                func.COUNT(models.Rectification.id).label("total_issues"),
            )
            .group_by(models.Rectification.promotion_id)
            .all()
        )
        rect_map = {r.promotion_id: r for r in rectification_stats}

        funnel_rows = []
        for pd_row in promo_dates:
            pid = pd_row.promotion_id
            st = sales_map.get(pid)
            qd = display_map.get(pid)
            rs = rect_map.get(pid)

            funnel_rows.append({
                "promotion_id": pid,
                "promo_code": pd_row.promo_code,
                "promo_name": pd_row.promo_name,
                "start_date": pd_row.start_date,
                "end_date": pd_row.end_date,
                "target_sales": pd_row.target_sales or 0.0,
                "target_units": pd_row.target_units or 0,
                "store_name": pd_row.store_name,
                "region": pd_row.region,
                "store_id": pd_row.store_id,
                "actual_sales": st.total_sales if st else 0.0,
                "actual_units": st.total_units if st else 0,
                "qualified_display_count": qd.qualified_count if qd else 0,
                "total_display_checks": qd.total_inspections if qd else 0,
                "avg_display_score": float(qd.avg_score) if qd and qd.avg_score else 0.0,
                "rectified_count": rs.rectified_count if rs else 0,
                "total_issues": rs.total_issues if rs else 0,
            })

        if funnel_rows:
            df = pd.DataFrame(funnel_rows)
        else:
            df = pd.DataFrame(columns=[
                "promotion_id", "promo_code", "promo_name",
                "start_date", "end_date", "target_sales", "target_units",
                "store_name", "region", "store_id",
                "actual_sales", "actual_units",
                "qualified_display_count", "total_display_checks", "avg_display_score",
                "rectified_count", "total_issues",
            ])

        conn.execute("DELETE FROM analytics.funnel_agg")
        conn.register("_tmp_funnel", df)
        conn.execute("INSERT INTO analytics.funnel_agg SELECT * FROM _tmp_funnel")
        conn.unregister("_tmp_funnel")

    def _refresh_display_impact(self, conn, db: Session):
        from app import models

        inspections = (
            db.query(
                models.DisplayInspection.promotion_id,
                models.DisplayInspection.inspection_date,
                models.DisplayInspection.is_qualified,
                models.DisplayInspection.overall_score,
                models.DisplayInspection.store_id,
            )
            .order_by(
                models.DisplayInspection.promotion_id,
                models.DisplayInspection.store_id,
                models.DisplayInspection.inspection_date,
            )
            .all()
        )

        next_date_map = {}
        sorted_inspections = sorted(inspections, key=lambda x: (x.promotion_id, x.store_id, x.inspection_date))
        for i, ins in enumerate(sorted_inspections):
            key = (ins.promotion_id, ins.store_id)
            if i + 1 < len(sorted_inspections):
                next_ins = sorted_inspections[i + 1]
                if (next_ins.promotion_id, next_ins.store_id) == key:
                    next_date_map[id(ins)] = next_ins.inspection_date

        sales_records = (
            db.query(
                models.SalesRecord.promotion_id,
                models.SalesRecord.sale_date,
                models.SalesRecord.store_id,
                models.SalesRecord.sales_amount,
                models.SalesRecord.sales_units,
            )
            .all()
        )
        sales_map = {}
        for sr in sales_records:
            skey = (sr.promotion_id, sr.sale_date, sr.store_id)
            sales_map[skey] = (sr.sales_amount, sr.sales_units)

        impact_rows = []
        for ins in inspections:
            skey = (ins.promotion_id, ins.inspection_date, ins.store_id)
            day_sales, day_units = sales_map.get(skey, (0.0, 0))

            impact_rows.append({
                "promotion_id": ins.promotion_id,
                "inspection_date": ins.inspection_date,
                "is_qualified": ins.is_qualified,
                "overall_score": ins.overall_score,
                "store_id": ins.store_id,
                "next_inspection_date": next_date_map.get(id(ins)),
                "day_sales": day_sales,
                "day_units": day_units,
            })

        if impact_rows:
            df = pd.DataFrame(impact_rows)
        else:
            df = pd.DataFrame(columns=[
                "promotion_id", "inspection_date", "is_qualified", "overall_score",
                "store_id", "next_inspection_date", "day_sales", "day_units",
            ])

        conn.execute("DELETE FROM analytics.display_impact")
        conn.register("_tmp_impact", df)
        conn.execute("INSERT INTO analytics.display_impact SELECT * FROM _tmp_impact")
        conn.unregister("_tmp_impact")

    def query_funnel_data(
        self,
        promotion_id: Optional[int] = None,
        region: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        self.ensure_tables()
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
        self.ensure_tables()
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
        self.ensure_tables()
        conn = self._get_connection()
        try:
            unqualified_count = conn.execute(
                "SELECT COUNT(*) FROM analytics.display_impact WHERE promotion_id = ? AND is_qualified = false",
                [promotion_id],
            ).fetchone()[0]

            if unqualified_count == 0:
                return []

            max_sale_date_row = conn.execute(
                "SELECT MAX(sale_date) FROM analytics.sales_daily_agg WHERE promotion_id = ?",
                [promotion_id],
            ).fetchone()
            max_sale_date = max_sale_date_row[0] if max_sale_date_row and max_sale_date_row[0] else date.today()

            query = """
                WITH unqualified_periods AS (
                    SELECT
                        inspection_date,
                        COALESCE(next_inspection_date, ?) AS end_boundary,
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
            rows = conn.execute(query, [max_sale_date, promotion_id, promotion_id]).fetchall()
            columns = [desc[0] for desc in conn.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            conn.close()


duckdb_service = DuckDBService()
