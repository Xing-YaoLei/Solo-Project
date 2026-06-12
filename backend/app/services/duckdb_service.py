import os
import math
import duckdb
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

def _clean_nan(obj):
    if isinstance(obj, dict):
        return {k: _clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_clean_nan(x) for x in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, pd.Timestamp):
        if pd.isna(obj):
            return None
        return obj.to_pydatetime()
    elif pd.isna(obj) if hasattr(pd, 'isna') else False:
        return None
    return obj

class DuckDBAnalytics:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.getenv("DUCKDB_PATH", "./data/coffee_analytics.db")
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.con = duckdb.connect(self.db_path)
        self._init_tables()

    def _init_tables(self):
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS inventory_snapshot (
                version_id INTEGER,
                batch_id VARCHAR,
                snapshot_date TIMESTAMP,
                store_id INTEGER,
                sku_code VARCHAR,
                sku_name VARCHAR,
                category VARCHAR,
                quantity DOUBLE,
                unit VARCHAR,
                unit_price DOUBLE,
                total_price DOUBLE,
                cleaning_item_flag BOOLEAN,
                sync_delay_minutes INTEGER,
                created_at TIMESTAMP
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS pos_snapshot (
                version_id INTEGER,
                batch_id VARCHAR,
                business_date TIMESTAMP,
                store_id INTEGER,
                txn_id VARCHAR,
                txn_time TIMESTAMP,
                member_id VARCHAR,
                total_amount DOUBLE,
                pay_amount DOUBLE,
                pay_method VARCHAR,
                sku_code VARCHAR,
                sku_name VARCHAR,
                quantity DOUBLE,
                unit_price DOUBLE,
                subtotal DOUBLE,
                sync_delay_minutes INTEGER,
                created_at TIMESTAMP
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS member_receipt_snapshot (
                receipt_no VARCHAR,
                pos_txn_id VARCHAR,
                member_id VARCHAR,
                business_date TIMESTAMP,
                receipt_time TIMESTAMP,
                store_id INTEGER,
                total_amount DOUBLE,
                pay_amount DOUBLE,
                points_earned DOUBLE,
                sku_code VARCHAR,
                sku_name VARCHAR,
                quantity DOUBLE,
                unit_price DOUBLE,
                subtotal DOUBLE,
                created_at TIMESTAMP
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS equipment_clean_metrics (
                record_date TIMESTAMP,
                store_id INTEGER,
                equipment_id INTEGER,
                equipment_code VARCHAR,
                clean_risk_score DOUBLE,
                fault_count INTEGER,
                inspection_score DOUBLE,
                offline_minutes INTEGER,
                status VARCHAR,
                anomaly_type VARCHAR,
                anomaly_reason VARCHAR,
                sample_ref VARCHAR,
                created_at TIMESTAMP
            )
        """)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS inspection_comparison (
                period_type VARCHAR,
                period_start TIMESTAMP,
                period_end TIMESTAMP,
                store_id INTEGER,
                pass_rate DOUBLE,
                prev_pass_rate DOUBLE,
                improvement_rate DOUBLE,
                avg_score DOUBLE,
                prev_avg_score DOUBLE,
                total_inspections INTEGER,
                created_at TIMESTAMP
            )
        """)

    def load_inventory_data(self, df: pd.DataFrame) -> int:
        if df.empty:
            return 0
        existing = self.con.execute(
            "SELECT COUNT(*) FROM inventory_snapshot WHERE batch_id = ?",
            [df["batch_id"].iloc[0] if "batch_id" in df.columns and len(df) > 0 else ""]
        ).fetchone()[0]
        if existing > 0:
            self.con.execute(
                "DELETE FROM inventory_snapshot WHERE batch_id = ?",
                [df["batch_id"].iloc[0]]
            )
        self.con.register("inv_df", df)
        self.con.execute("INSERT INTO inventory_snapshot SELECT * FROM inv_df")
        self.con.unregister("inv_df")
        return len(df)

    def load_pos_data(self, df: pd.DataFrame) -> int:
        if df.empty:
            return 0
        existing = self.con.execute(
            "SELECT COUNT(*) FROM pos_snapshot WHERE batch_id = ?",
            [df["batch_id"].iloc[0] if "batch_id" in df.columns and len(df) > 0 else ""]
        ).fetchone()[0]
        if existing > 0:
            self.con.execute(
                "DELETE FROM pos_snapshot WHERE batch_id = ?",
                [df["batch_id"].iloc[0]]
            )
        self.con.register("pos_df", df)
        self.con.execute("INSERT INTO pos_snapshot SELECT * FROM pos_df")
        self.con.unregister("pos_df")
        return len(df)

    def load_member_receipt_data(self, df: pd.DataFrame) -> int:
        if df.empty:
            return 0
        self.con.register("mr_df", df)
        self.con.execute("""
            DELETE FROM member_receipt_snapshot 
            WHERE business_date >= (SELECT MIN(business_date) FROM mr_df)
              AND business_date <= (SELECT MAX(business_date) FROM mr_df)
              AND store_id IN (SELECT DISTINCT store_id FROM mr_df)
        """)
        self.con.execute("INSERT INTO member_receipt_snapshot SELECT * FROM mr_df")
        self.con.unregister("mr_df")
        return len(df)

    def load_clean_metrics(self, df: pd.DataFrame) -> int:
        if df.empty:
            return 0
        self.con.register("cm_df", df)
        self.con.execute("""
            DELETE FROM equipment_clean_metrics
            WHERE record_date >= (SELECT MIN(record_date) FROM cm_df)
              AND record_date <= (SELECT MAX(record_date) FROM cm_df)
        """)
        self.con.execute("INSERT INTO equipment_clean_metrics SELECT * FROM cm_df")
        self.con.unregister("cm_df")
        return len(df)

    def compare_inventory_versions(
        self,
        version_id_1: int,
        version_id_2: int,
        store_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        sql = """
            WITH v1 AS (
                SELECT sku_code, sku_name, category, SUM(quantity) as qty, SUM(total_price) as total
                FROM inventory_snapshot
                WHERE version_id = ? {store_filter}
                GROUP BY sku_code, sku_name, category
            ),
            v2 AS (
                SELECT sku_code, sku_name, category, SUM(quantity) as qty, SUM(total_price) as total
                FROM inventory_snapshot
                WHERE version_id = ? {store_filter}
                GROUP BY sku_code, sku_name, category
            )
            SELECT
                COALESCE(v1.sku_code, v2.sku_code) as sku_code,
                COALESCE(v1.sku_name, v2.sku_name) as sku_name,
                COALESCE(v1.category, v2.category) as category,
                v1.qty as v1_quantity,
                v2.qty as v2_quantity,
                (v2.qty - v1.qty) as qty_diff,
                CASE WHEN v1.qty != 0 THEN ROUND((v2.qty - v1.qty) / v1.qty * 100, 2) ELSE NULL END as qty_diff_pct,
                v1.total as v1_total,
                v2.total as v2_total,
                (v2.total - v1.total) as total_diff,
                CASE
                    WHEN v1.sku_code IS NULL THEN 'new_in_v2'
                    WHEN v2.sku_code IS NULL THEN 'removed_in_v2'
                    WHEN v1.qty != v2.qty OR v1.total != v2.total THEN 'modified'
                    ELSE 'unchanged'
                END as change_type
            FROM v1
            FULL OUTER JOIN v2 ON v1.sku_code = v2.sku_code
            WHERE v1.sku_code IS NULL OR v2.sku_code IS NULL OR v1.qty != v2.qty OR v1.total != v2.total
            ORDER BY ABS(COALESCE(v2.total, 0) - COALESCE(v1.total, 0)) DESC
        """
        store_filter = f"AND store_id = {store_id}" if store_id else ""
        sql = sql.format(store_filter=store_filter)
        result = self.con.execute(sql, [version_id_1, version_id_2]).fetchdf()
        return result.to_dict("records")

    def compare_pos_versions(
        self,
        version_id_1: int,
        version_id_2: int,
        store_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        sql = """
            WITH v1_agg AS (
                SELECT
                    DATE_TRUNC('day', business_date) as biz_date,
                    COUNT(DISTINCT txn_id) as txn_count,
                    SUM(total_amount) as total_amount,
                    SUM(subtotal) as goods_amount
                FROM pos_snapshot
                WHERE version_id = ? {store_filter}
                GROUP BY DATE_TRUNC('day', business_date)
            ),
            v2_agg AS (
                SELECT
                    DATE_TRUNC('day', business_date) as biz_date,
                    COUNT(DISTINCT txn_id) as txn_count,
                    SUM(total_amount) as total_amount,
                    SUM(subtotal) as goods_amount
                FROM pos_snapshot
                WHERE version_id = ? {store_filter}
                GROUP BY DATE_TRUNC('day', business_date)
            )
            SELECT
                COALESCE(v1_agg.biz_date, v2_agg.biz_date) as business_date,
                v1_agg.txn_count as v1_txn_count,
                v2_agg.txn_count as v2_txn_count,
                (v2_agg.txn_count - v1_agg.txn_count) as txn_count_diff,
                v1_agg.total_amount as v1_total,
                v2_agg.total_amount as v2_total,
                (v2_agg.total_amount - v1_agg.total_amount) as total_diff,
                ROUND(
                    CASE WHEN v1_agg.total_amount != 0
                        THEN (v2_agg.total_amount - v1_agg.total_amount) / v1_agg.total_amount * 100
                        ELSE NULL END, 2
                ) as total_diff_pct,
                CASE
                    WHEN v1_agg.biz_date IS NULL THEN 'new_data'
                    WHEN v2_agg.biz_date IS NULL THEN 'missing_data'
                    ELSE 'amount_changed'
                END as change_type
            FROM v1_agg
            FULL OUTER JOIN v2_agg ON v1_agg.biz_date = v2_agg.biz_date
            WHERE v1_agg.biz_date IS NULL
               OR v2_agg.biz_date IS NULL
               OR ABS(COALESCE(v2_agg.total_amount, 0) - COALESCE(v1_agg.total_amount, 0)) > 0.01
            ORDER BY business_date DESC
        """
        store_filter = f"AND store_id = {store_id}" if store_id else ""
        sql = sql.format(store_filter=store_filter)
        result = self.con.execute(sql, [version_id_1, version_id_2]).fetchdf()
        return result.to_dict("records")

    def detect_member_pos_conflicts(
        self,
        start_date: str,
        end_date: str,
        store_id: Optional[int] = None
    ) -> Dict[str, Any]:
        store_filter = f"AND p.store_id = {store_id}" if store_id else ""

        summary_sql = f"""
            SELECT
                COUNT(DISTINCT p.txn_id) as pos_txn_count,
                COUNT(DISTINCT m.receipt_no) as member_txn_count,
                COUNT(DISTINCT CASE WHEN m.receipt_no IS NOT NULL THEN p.txn_id END) as matched_count,
                COUNT(DISTINCT CASE WHEN m.receipt_no IS NULL THEN p.txn_id END) as pos_only_count,
                COUNT(DISTINCT CASE WHEN p.txn_id IS NULL THEN m.receipt_no END) as member_only_count,
                SUM(CASE WHEN p.total_amount != m.total_amount THEN 1 ELSE 0 END) as amount_mismatch_count
            FROM pos_snapshot p
            FULL OUTER JOIN member_receipt_snapshot m
                ON p.txn_id = m.pos_txn_id AND p.store_id = m.store_id
            WHERE (p.business_date BETWEEN ? AND ? OR m.business_date BETWEEN ? AND ?)
              {store_filter}
        """
        summary = self.con.execute(summary_sql, [start_date, end_date, start_date, end_date]).fetchdf().iloc[0].to_dict()

        detail_sql = f"""
            (
                SELECT
                    'pos_only' as conflict_type,
                    p.txn_id as pos_txn_id,
                    NULL as member_receipt_no,
                    p.member_id as pos_member_id,
                    NULL as member_id,
                    p.business_date,
                    p.txn_time as txn_time,
                    p.total_amount as pos_total,
                    NULL as member_total,
                    NULL as amount_diff,
                    'POS流水有记录但会员小票无记录' as description
                FROM pos_snapshot p
                LEFT JOIN member_receipt_snapshot m
                    ON p.txn_id = m.pos_txn_id AND p.store_id = m.store_id
                WHERE p.business_date BETWEEN ? AND ?
                  AND p.member_id IS NOT NULL AND p.member_id != ''
                  AND m.receipt_no IS NULL
                  {store_filter}
                GROUP BY p.txn_id, p.member_id, p.business_date, p.txn_time, p.total_amount
            )
            UNION ALL
            (
                SELECT
                    'member_only' as conflict_type,
                    m.pos_txn_id as pos_txn_id,
                    m.receipt_no as member_receipt_no,
                    NULL as pos_member_id,
                    m.member_id as member_id,
                    m.business_date,
                    m.receipt_time as txn_time,
                    NULL as pos_total,
                    m.total_amount as member_total,
                    NULL as amount_diff,
                    '会员小票有记录但POS流水无记录' as description
                FROM member_receipt_snapshot m
                LEFT JOIN pos_snapshot p
                    ON m.pos_txn_id = p.txn_id AND m.store_id = p.store_id
                WHERE m.business_date BETWEEN ? AND ?
                  AND p.txn_id IS NULL
                  {store_filter}
            )
            UNION ALL
            (
                SELECT
                    'amount_mismatch' as conflict_type,
                    p.txn_id as pos_txn_id,
                    m.receipt_no as member_receipt_no,
                    p.member_id as pos_member_id,
                    m.member_id as member_id,
                    p.business_date,
                    p.txn_time as txn_time,
                    p.total_amount as pos_total,
                    m.total_amount as member_total,
                    ROUND(m.total_amount - p.total_amount, 2) as amount_diff,
                    '同一交易金额不一致' as description
                FROM pos_snapshot p
                INNER JOIN member_receipt_snapshot m
                    ON p.txn_id = m.pos_txn_id AND p.store_id = m.store_id
                WHERE p.business_date BETWEEN ? AND ?
                  AND ABS(m.total_amount - p.total_amount) > 0.01
                  {store_filter}
                GROUP BY p.txn_id, m.receipt_no, p.member_id, m.member_id,
                         p.business_date, p.txn_time, p.total_amount, m.total_amount
            )
            ORDER BY business_date DESC, txn_time DESC
            LIMIT 500
        """
        params = [start_date, end_date, start_date, end_date, start_date, end_date]
        details = self.con.execute(detail_sql, params).fetchdf().to_dict("records")

        return _clean_nan({"summary": summary, "details": details})

    def get_clean_risk_timeseries(
        self,
        start_date: str,
        end_date: str,
        store_id: Optional[int] = None,
        equipment_id: Optional[int] = None
    ) -> Dict[str, Any]:
        filters = ["record_date BETWEEN ? AND ?"]
        params = [start_date, end_date]

        if store_id:
            filters.append("store_id = ?")
            params.append(store_id)
        if equipment_id:
            filters.append("equipment_id = ?")
            params.append(equipment_id)

        where_clause = " AND ".join(filters)

        daily_sql = f"""
            SELECT
                DATE_TRUNC('day', record_date) as stat_date,
                COUNT(DISTINCT equipment_id) as equipment_count,
                ROUND(AVG(clean_risk_score), 2) as avg_risk_score,
                ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY clean_risk_score), 2) as median_risk_score,
                ROUND(MAX(clean_risk_score), 2) as max_risk_score,
                SUM(CASE WHEN clean_risk_score >= 70 THEN 1 ELSE 0 END) as high_risk_count,
                SUM(CASE WHEN clean_risk_score >= 50 AND clean_risk_score < 70 THEN 1 ELSE 0 END) as medium_risk_count,
                SUM(CASE WHEN clean_risk_score < 50 THEN 1 ELSE 0 END) as low_risk_count,
                SUM(offline_minutes) as total_offline_minutes,
                SUM(CASE WHEN anomaly_type IS NOT NULL AND anomaly_type != '' THEN 1 ELSE 0 END) as anomaly_count
            FROM equipment_clean_metrics
            WHERE {where_clause}
            GROUP BY DATE_TRUNC('day', record_date)
            ORDER BY stat_date ASC
        """
        daily = self.con.execute(daily_sql, params).fetchdf()

        anomaly_sql = f"""
            SELECT
                record_date,
                store_id,
                equipment_id,
                equipment_code,
                clean_risk_score,
                anomaly_type,
                anomaly_reason,
                offline_minutes,
                status,
                sample_ref,
                fault_count,
                inspection_score
            FROM equipment_clean_metrics
            WHERE {where_clause}
              AND (anomaly_type IS NOT NULL AND anomaly_type != '' OR status = 'offline' OR clean_risk_score >= 70)
            ORDER BY clean_risk_score DESC, record_date DESC
            LIMIT 100
        """
        anomalies = self.con.execute(anomaly_sql, params).fetchdf().to_dict("records")

        sync_delay_sql = """
            SELECT DISTINCT
                DATE_TRUNC('day', CAST(expected_sync_time AS TIMESTAMP)) as delay_date,
                data_type,
                '' as source_system,
                delay_minutes,
                affected_date,
                description
            FROM (
                SELECT
                    CAST(snapshot_date AS TIMESTAMP) as expected_sync_time,
                    'inventory' as data_type,
                    sync_delay_minutes as delay_minutes,
                    snapshot_date as affected_date,
                    CONCAT('库存表延迟同步 ', sync_delay_minutes, ' 分钟') as description
                FROM inventory_snapshot
                WHERE sync_delay_minutes > 30
                  AND CAST(snapshot_date AS TIMESTAMP) BETWEEN CAST(? AS TIMESTAMP) AND CAST(? AS TIMESTAMP)
                UNION ALL
                SELECT
                    CAST(business_date AS TIMESTAMP) as expected_sync_time,
                    'pos' as data_type,
                    sync_delay_minutes as delay_minutes,
                    business_date as affected_date,
                    CONCAT('POS流水延迟同步 ', sync_delay_minutes, ' 分钟') as description
                FROM pos_snapshot
                WHERE sync_delay_minutes > 30
                  AND CAST(business_date AS TIMESTAMP) BETWEEN CAST(? AS TIMESTAMP) AND CAST(? AS TIMESTAMP)
            ) delay_info
            ORDER BY affected_date DESC
        """
        sync_delays = self.con.execute(
            sync_delay_sql,
            [start_date, end_date, start_date, end_date]
        ).fetchdf().to_dict("records")

        return _clean_nan({
            "daily": daily.to_dict("records"),
            "anomalies": anomalies,
            "sync_delays": sync_delays
        })

    def get_offline_gap_samples(
        self,
        equipment_id: int,
        gap_start: str,
        gap_end: str
    ) -> Dict[str, Any]:
        sql = """
            SELECT
                record_date,
                store_id,
                equipment_id,
                equipment_code,
                clean_risk_score,
                fault_count,
                inspection_score,
                offline_minutes,
                status,
                anomaly_type,
                anomaly_reason,
                sample_ref
            FROM equipment_clean_metrics
            WHERE equipment_id = ?
              AND record_date BETWEEN ? AND ?
            ORDER BY record_date ASC
        """
        samples = self.con.execute(sql, [equipment_id, gap_start, gap_end]).fetchdf().to_dict("records")

        before_sql = """
            SELECT
                record_date,
                clean_risk_score,
                status,
                anomaly_type
            FROM equipment_clean_metrics
            WHERE equipment_id = ?
              AND record_date < ?
            ORDER BY record_date DESC
            LIMIT 5
        """
        before = self.con.execute(before_sql, [equipment_id, gap_start]).fetchdf().to_dict("records")

        after_sql = """
            SELECT
                record_date,
                clean_risk_score,
                status,
                anomaly_type
            FROM equipment_clean_metrics
            WHERE equipment_id = ?
              AND record_date > ?
            ORDER BY record_date ASC
            LIMIT 5
        """
        after = self.con.execute(after_sql, [equipment_id, gap_end]).fetchdf().to_dict("records")

        return {
            "gap_samples": samples,
            "before_context": before,
            "after_context": after
        }

    def get_inspection_comparison(
        self,
        period_type: str = "weekly",
        store_id: Optional[int] = None,
        periods: int = 8
    ) -> List[Dict[str, Any]]:
        store_filter = f"WHERE store_id = {store_id}" if store_id else ""
        sql = f"""
            WITH periods AS (
                SELECT DISTINCT period_start, period_end
                FROM inspection_comparison
                {store_filter}
                ORDER BY period_start DESC
                LIMIT ?
            )
            SELECT
                ic.period_type,
                ic.period_start,
                ic.period_end,
                ic.store_id,
                ic.pass_rate,
                ic.prev_pass_rate,
                ic.improvement_rate,
                ic.avg_score,
                ic.prev_avg_score,
                ic.total_inspections
            FROM inspection_comparison ic
            INNER JOIN periods p ON ic.period_start = p.period_start AND ic.period_end = p.period_end
            {("AND ic.store_id = " + str(store_id)) if store_id else ""}
            ORDER BY ic.period_start ASC
        """
        result = self.con.execute(sql, [periods]).fetchdf()
        return result.to_dict("records")

    def close(self):
        self.con.close()

_analytics_instance = None

def get_analytics() -> DuckDBAnalytics:
    global _analytics_instance
    if _analytics_instance is None:
        _analytics_instance = DuckDBAnalytics()
    return _analytics_instance
