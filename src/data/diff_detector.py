import polars as pl
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from src.data.database import db
from src.data.version_manager import version_manager
from config import setup_logger

logger = setup_logger()


class DiffDetector:
    COMPARE_FIELDS = [
        "textbook_name",
        "textbook_isbn",
        "publisher",
        "price",
        "quantity",
        "order_status",
    ]

    def detect_diff(
        self,
        source_a: str,
        source_b: str,
        version_a: Optional[int] = None,
        version_b: Optional[int] = None,
        term_id: Optional[str] = None
    ) -> pl.DataFrame:
        if version_a is None:
            ver_a = version_manager.get_latest_version(source_a)
            version_a = ver_a["version_id"] if ver_a else 0

        if version_b is None:
            ver_b = version_manager.get_latest_version(source_b)
            version_b = ver_b["version_id"] if ver_b else 0

        term_filter = f"AND term_id = '{term_id}'" if term_id else ""

        sql = f"""
        SELECT
            COALESCE(a.order_id, b.order_id) as order_id,
            a.data_source as source_a,
            b.data_source as source_b,
            {self._generate_field_compare_sql()}
        FROM (
            SELECT * FROM textbook_order
            WHERE data_source = ? AND version_id = ? {term_filter}
        ) a
        FULL OUTER JOIN (
            SELECT * FROM textbook_order
            WHERE data_source = ? AND version_id = ? {term_filter}
        ) b ON a.order_id = b.order_id
        WHERE {self._generate_where_clause()}
        """

        result = db.query(sql, {
            "1": source_a,
            "2": version_a,
            "3": source_b,
            "4": version_b
        })

        diffs = self._parse_diff_result(result, source_a, source_b)
        logger.info(f"检测到 {len(diffs)} 条差异记录")
        return diffs

    def _generate_field_compare_sql(self) -> str:
        fields_sql = []
        for field in self.COMPARE_FIELDS:
            fields_sql.append(f"""
            CASE
                WHEN a.{field} != b.{field}
                    OR (a.{field} IS NULL AND b.{field} IS NOT NULL)
                    OR (a.{field} IS NOT NULL AND b.{field} IS NULL)
                THEN 1 ELSE 0
            END as {field}_diff,
            a.{field} as {field}_a,
            b.{field} as {field}_b
            """)
        return ", ".join(fields_sql)

    def _generate_where_clause(self) -> str:
        conditions = []
        for field in self.COMPARE_FIELDS:
            conditions.append(f"""
            (a.{field} != b.{field}
                OR (a.{field} IS NULL AND b.{field} IS NOT NULL)
                OR (a.{field} IS NOT NULL AND b.{field} IS NULL))
            """)
        return " OR ".join(conditions)

    def _parse_diff_result(
        self,
        result: pl.DataFrame,
        source_a: str,
        source_b: str
    ) -> pl.DataFrame:
        if result.is_empty():
            return pl.DataFrame(schema={
                "diff_id": str,
                "order_id": str,
                "source_a": str,
                "source_b": str,
                "field_name": str,
                "value_a": str,
                "value_b": str,
                "detected_at": datetime,
                "status": str,
            })

        diff_records = []
        for row in result.to_dicts():
            order_id = row["order_id"]
            for field in self.COMPARE_FIELDS:
                if row.get(f"{field}_diff", 0) == 1:
                    diff_records.append({
                        "diff_id": str(uuid.uuid4()),
                        "order_id": order_id,
                        "source_a": source_a,
                        "source_b": source_b,
                        "field_name": field,
                        "value_a": str(row.get(f"{field}_a", "")) if row.get(f"{field}_a") is not None else None,
                        "value_b": str(row.get(f"{field}_b", "")) if row.get(f"{field}_b") is not None else None,
                        "detected_at": datetime.now(),
                        "status": "pending",
                    })

        return pl.DataFrame(diff_records)

    def save_diff_records(self, diff_df: pl.DataFrame) -> int:
        if diff_df.is_empty():
            return 0
        return db.insert_dataframe("data_diff", diff_df)

    def get_diff_records(
        self,
        order_id: Optional[str] = None,
        source_a: Optional[str] = None,
        source_b: Optional[str] = None,
        status: Optional[str] = None
    ) -> pl.DataFrame:
        sql = "SELECT * FROM data_diff WHERE 1=1"
        params = {}
        param_idx = 1

        if order_id:
            sql += f" AND order_id = ?"
            params[str(param_idx)] = order_id
            param_idx += 1

        if source_a:
            sql += f" AND source_a = ?"
            params[str(param_idx)] = source_a
            param_idx += 1

        if source_b:
            sql += f" AND source_b = ?"
            params[str(param_idx)] = source_b
            param_idx += 1

        if status:
            sql += f" AND status = ?"
            params[str(param_idx)] = status
            param_idx += 1

        sql += " ORDER BY detected_at DESC"
        return db.query(sql, params if params else None)

    def get_diff_summary(
        self,
        order_id: Optional[str] = None,
        term_id: Optional[str] = None
    ) -> Dict:
        term_join = ""
        if term_id:
            term_join = f"JOIN textbook_order o ON d.order_id = o.order_id WHERE o.term_id = '{term_id}'"

        sql = f"""
        SELECT
            source_a,
            source_b,
            field_name,
            COUNT(*) as diff_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
        FROM data_diff d
        {term_join}
        GROUP BY source_a, source_b, field_name
        ORDER BY diff_count DESC
        """

        result = db.query(sql)
        return {
            "total_diffs": result["diff_count"].sum() if not result.is_empty() else 0,
            "pending_diffs": result["pending_count"].sum() if not result.is_empty() else 0,
            "by_field": result.to_dicts(),
        }

    def resolve_diff(self, diff_id: str, status: str = "resolved") -> bool:
        sql = "UPDATE data_diff SET status = ? WHERE diff_id = ?"
        try:
            db.execute(sql, {"1": status, "2": diff_id})
            logger.info(f"差异记录已更新: diff_id={diff_id}, status={status}")
            return True
        except Exception as e:
            logger.error(f"更新差异记录失败: {e}")
            return False


diff_detector = DiffDetector()
