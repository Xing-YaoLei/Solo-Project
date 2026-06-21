import logging
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import duckdb
import psycopg2
from psycopg2.extras import RealDictCursor

from ..init_duckdb import (
    DuckDBInitializer,
    QueryResult,
    DatabaseConfig,
    SyncResult,
    DataSyncError,
    get_duckdb_connection,
)

logger = logging.getLogger(__name__)


@dataclass
class ReconciliationFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    case_type: Optional[str] = None
    lawyer_id: Optional[str] = None
    case_id: Optional[str] = None
    min_difference: Optional[float] = None
    max_difference: Optional[float] = None


RECONCILIATION_VIEW_SQL = """
CREATE OR REPLACE VIEW v_reconciliation_trend AS
SELECT 
    DATE_TRUNC('day', i.invoice_date) AS report_date,
    c.id AS case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    c.lawyer_id,
    u.name AS lawyer_name,
    SUM(c.quoted_amount) AS total_quoted,
    SUM(c.actual_amount) AS total_actual,
    SUM(c.actual_amount - c.quoted_amount) AS total_difference,
    CASE 
        WHEN SUM(c.quoted_amount) > 0 
        THEN ROUND(SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100, 2) 
        ELSE 0 
    END AS difference_rate,
    COUNT(DISTINCT c.id) AS case_count,
    COUNT(DISTINCT i.id) AS invoice_count,
    CURRENT_TIMESTAMP AS updated_at
FROM cases c
LEFT JOIN invoices i ON c.id = i.case_id
LEFT JOIN users u ON c.lawyer_id = u.id
WHERE c.status != 'cancelled'
GROUP BY 
    DATE_TRUNC('day', i.invoice_date),
    c.id, c.case_no, c.name, c.case_type, c.lawyer_id, u.name
ORDER BY report_date DESC;
"""

RECONCILIATION_SUMMARY_SQL = """
CREATE OR REPLACE VIEW v_reconciliation_summary AS
SELECT 
    c.case_type,
    SUM(c.quoted_amount) AS total_quoted,
    SUM(c.actual_amount) AS total_actual,
    SUM(c.actual_amount - c.quoted_amount) AS total_difference,
    ROUND(
        CASE 
            WHEN SUM(c.quoted_amount) > 0 
            THEN SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100 
            ELSE 0 
        END, 2
    ) AS difference_rate,
    COUNT(DISTINCT c.id) AS case_count,
    CURRENT_TIMESTAMP AS updated_at
FROM cases c
WHERE c.status != 'cancelled'
GROUP BY c.case_type
ORDER BY total_difference DESC;
"""


class ReconciliationAnalyzer:
    def __init__(
        self,
        initializer: Optional[DuckDBInitializer] = None,
        config: Optional[DatabaseConfig] = None,
    ) -> None:
        self.initializer = initializer or get_duckdb_connection(config)

    def sync_data(self) -> List[SyncResult]:
        try:
            tables = ["cases", "invoices", "users"]
            results = self.initializer.sync_from_postgres(tables)
            self.create_view()
            logger.info("对账数据同步完成")
            return results
        except (psycopg2.Error, duckdb.Error, DataSyncError) as e:
            logger.error(f"同步对账数据失败: {e}")
            raise

    def create_view(self) -> None:
        try:
            conn = self.initializer._get_duckdb_connection()
            conn.execute(RECONCILIATION_VIEW_SQL)
            conn.execute(RECONCILIATION_SUMMARY_SQL)
            logger.info("对账差异视图创建成功")
        except duckdb.Error as e:
            logger.error(f"创建对账差异视图失败: {e}")
            raise

    def _build_query(
        self,
        filters: ReconciliationFilter,
        group_by: Optional[str] = None,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_reconciliation_trend WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("report_date >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("report_date <= ?")
            params.append(filters.end_date.isoformat())

        if filters.case_type:
            where_clauses.append("case_type = ?")
            params.append(filters.case_type)

        if filters.lawyer_id:
            where_clauses.append("lawyer_id = ?")
            params.append(filters.lawyer_id)

        if filters.case_id:
            where_clauses.append("case_id = ?")
            params.append(filters.case_id)

        if filters.min_difference is not None:
            where_clauses.append("total_difference >= ?")
            params.append(filters.min_difference)

        if filters.max_difference is not None:
            where_clauses.append("total_difference <= ?")
            params.append(filters.max_difference)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        if group_by:
            base_sql += f" GROUP BY {group_by}"

        base_sql += " ORDER BY report_date DESC"

        return base_sql, tuple(params)

    def get_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        case_id: Optional[str] = None,
        min_difference: Optional[float] = None,
        max_difference: Optional[float] = None,
    ) -> QueryResult:
        filters = ReconciliationFilter(
            start_date=start_date,
            end_date=end_date,
            case_type=case_type,
            lawyer_id=lawyer_id,
            case_id=case_id,
            min_difference=min_difference,
            max_difference=max_difference,
        )

        try:
            query, params = self._build_query(filters)
            data = self.initializer.execute_query(query, params)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters=self._filters_to_dict(filters),
            )
        except duckdb.Error as e:
            logger.error(f"查询对账差异趋势失败: {e}")
            raise

    def get_summary_by_case_type(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = "SELECT * FROM v_reconciliation_summary WHERE 1=1"
            params: List[Any] = []

            if start_date or end_date:
                sql = """
                SELECT 
                    c.case_type,
                    SUM(c.quoted_amount) AS total_quoted,
                    SUM(c.actual_amount) AS total_actual,
                    SUM(c.actual_amount - c.quoted_amount) AS total_difference,
                    ROUND(
                        CASE 
                            WHEN SUM(c.quoted_amount) > 0 
                            THEN SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100 
                            ELSE 0 
                        END, 2
                    ) AS difference_rate,
                    COUNT(DISTINCT c.id) AS case_count,
                    CURRENT_TIMESTAMP AS updated_at
                FROM cases c
                LEFT JOIN invoices i ON c.id = i.case_id
                WHERE c.status != 'cancelled'
                """
                if start_date:
                    sql += " AND i.invoice_date >= ?"
                    params.append(start_date.isoformat())
                if end_date:
                    sql += " AND i.invoice_date <= ?"
                    params.append(end_date.isoformat())
                sql += " GROUP BY c.case_type ORDER BY total_difference DESC"

            data = self.initializer.execute_query(sql, tuple(params) if params else None)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters={
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                },
            )
        except duckdb.Error as e:
            logger.error(f"查询按案件类型汇总失败: {e}")
            raise

    def get_summary_by_lawyer(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                u.id AS lawyer_id,
                u.name AS lawyer_name,
                SUM(c.quoted_amount) AS total_quoted,
                SUM(c.actual_amount) AS total_actual,
                SUM(c.actual_amount - c.quoted_amount) AS total_difference,
                ROUND(
                    CASE 
                        WHEN SUM(c.quoted_amount) > 0 
                        THEN SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100 
                        ELSE 0 
                    END, 2
                ) AS difference_rate,
                COUNT(DISTINCT c.id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM cases c
            LEFT JOIN invoices i ON c.id = i.case_id
            LEFT JOIN users u ON c.lawyer_id = u.id
            WHERE c.status != 'cancelled' AND u.role = 'lawyer'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND i.invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND i.invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY u.id, u.name ORDER BY total_difference DESC"

            data = self.initializer.execute_query(sql, tuple(params) if params else None)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters={
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                },
            )
        except duckdb.Error as e:
            logger.error(f"查询按律师汇总失败: {e}")
            raise

    def get_top_difference_cases(
        self,
        limit: int = 10,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                c.id AS case_id,
                c.case_no,
                c.name AS case_name,
                c.case_type,
                u.name AS lawyer_name,
                c.quoted_amount,
                c.actual_amount,
                (c.actual_amount - c.quoted_amount) AS difference,
                ROUND(
                    CASE 
                        WHEN c.quoted_amount > 0 
                        THEN (c.actual_amount - c.quoted_amount) / c.quoted_amount * 100 
                        ELSE 0 
                    END, 2
                ) AS difference_rate,
                c.status,
                CURRENT_TIMESTAMP AS updated_at
            FROM cases c
            LEFT JOIN invoices i ON c.id = i.case_id
            LEFT JOIN users u ON c.lawyer_id = u.id
            WHERE c.status != 'cancelled'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND i.invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND i.invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY c.id, c.case_no, c.name, c.case_type, u.name, c.quoted_amount, c.actual_amount, c.status"
            sql += " ORDER BY ABS(c.actual_amount - c.quoted_amount) DESC LIMIT ?"
            params.append(limit)

            data = self.initializer.execute_query(sql, tuple(params))

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters={
                    "limit": limit,
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                },
            )
        except duckdb.Error as e:
            logger.error(f"查询差异最大案件失败: {e}")
            raise

    def get_monthly_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                DATE_TRUNC('month', i.invoice_date) AS report_month,
                SUM(c.quoted_amount) AS total_quoted,
                SUM(c.actual_amount) AS total_actual,
                SUM(c.actual_amount - c.quoted_amount) AS total_difference,
                ROUND(
                    CASE 
                        WHEN SUM(c.quoted_amount) > 0 
                        THEN SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100 
                        ELSE 0 
                    END, 2
                ) AS difference_rate,
                COUNT(DISTINCT c.id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM cases c
            LEFT JOIN invoices i ON c.id = i.case_id
            WHERE c.status != 'cancelled'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND i.invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND i.invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY DATE_TRUNC('month', i.invoice_date) ORDER BY report_month"

            data = self.initializer.execute_query(sql, tuple(params) if params else None)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters={
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                },
            )
        except duckdb.Error as e:
            logger.error(f"查询月度趋势失败: {e}")
            raise

    def _filters_to_dict(self, filters: ReconciliationFilter) -> Dict[str, Any]:
        return {
            "start_date": filters.start_date.isoformat() if filters.start_date else None,
            "end_date": filters.end_date.isoformat() if filters.end_date else None,
            "case_type": filters.case_type,
            "lawyer_id": filters.lawyer_id,
            "case_id": filters.case_id,
            "min_difference": filters.min_difference,
            "max_difference": filters.max_difference,
        }
