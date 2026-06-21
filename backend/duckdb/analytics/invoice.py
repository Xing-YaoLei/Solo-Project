import logging
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import duckdb
import psycopg2

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
class InvoiceFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    case_id: Optional[str] = None
    case_type: Optional[str] = None
    lawyer_id: Optional[str] = None
    invoice_id: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    fee_type: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    has_attachment: Optional[bool] = None


INVOICE_SUMMARY_VIEW_SQL = """
CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT 
    i.id AS invoice_id,
    i.invoice_no,
    c.id AS case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    u.id AS lawyer_id,
    u.name AS lawyer_name,
    i.amount AS invoice_amount,
    i.status,
    i.invoice_date,
    i.source,
    COUNT(ii.id) AS item_count,
    SUM(ii.amount) AS items_total,
    (i.amount - SUM(ii.amount)) AS amount_difference,
    CASE 
        WHEN EXISTS (SELECT 1 FROM email_attachments ea WHERE ea.linked_invoice_id = i.id)
        THEN true
        ELSE false
    END AS has_attachment,
    CURRENT_TIMESTAMP AS updated_at
FROM invoices i
JOIN cases c ON i.case_id = c.id
JOIN users u ON c.lawyer_id = u.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_no, c.id, c.case_no, c.name, c.case_type, u.id, u.name, i.amount, i.status, i.invoice_date, i.source
ORDER BY i.invoice_date DESC;
"""

INVOICE_ITEMS_VIEW_SQL = """
CREATE OR REPLACE VIEW v_invoice_items_detail AS
SELECT 
    ii.id AS item_id,
    i.id AS invoice_id,
    i.invoice_no,
    c.id AS case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    u.name AS lawyer_name,
    ii.item_name,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.amount,
    ii.fee_type,
    i.invoice_date,
    i.status,
    i.source,
    CURRENT_TIMESTAMP AS updated_at
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN cases c ON i.case_id = c.id
JOIN users u ON c.lawyer_id = u.id
ORDER BY i.invoice_date DESC, ii.id;
"""

FEE_TYPE_SUMMARY_VIEW_SQL = """
CREATE OR REPLACE VIEW v_fee_type_summary AS
SELECT 
    ii.fee_type,
    COUNT(ii.id) AS item_count,
    COUNT(DISTINCT i.id) AS invoice_count,
    COUNT(DISTINCT c.id) AS case_count,
    SUM(ii.amount) AS total_amount,
    ROUND(
        SUM(ii.amount) * 100.0 / (SELECT SUM(amount) FROM invoice_items WHERE amount > 0), 
        2
    ) AS amount_percentage,
    ROUND(AVG(ii.amount), 2) AS avg_amount,
    CURRENT_TIMESTAMP AS updated_at
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN cases c ON i.case_id = c.id
GROUP BY ii.fee_type
ORDER BY total_amount DESC;
"""


class InvoiceAnalyzer:
    def __init__(
        self,
        initializer: Optional[DuckDBInitializer] = None,
        config: Optional[DatabaseConfig] = None,
    ) -> None:
        self.initializer = initializer or get_duckdb_connection(config)

    def sync_data(self) -> List[SyncResult]:
        try:
            tables = ["invoices", "invoice_items", "cases", "users", "email_attachments"]
            results = self.initializer.sync_from_postgres(tables)
            self.create_view()
            logger.info("单据数据同步完成")
            return results
        except (psycopg2.Error, duckdb.Error, DataSyncError) as e:
            logger.error(f"同步单据数据失败: {e}")
            raise

    def create_view(self) -> None:
        try:
            conn = self.initializer._get_duckdb_connection()
            conn.execute(INVOICE_SUMMARY_VIEW_SQL)
            conn.execute(INVOICE_ITEMS_VIEW_SQL)
            conn.execute(FEE_TYPE_SUMMARY_VIEW_SQL)
            logger.info("单据视图创建成功")
        except duckdb.Error as e:
            logger.error(f"创建单据视图失败: {e}")
            raise

    def _build_invoice_query(
        self,
        filters: InvoiceFilter,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_invoice_summary WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("invoice_date >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("invoice_date <= ?")
            params.append(filters.end_date.isoformat())

        if filters.case_id:
            where_clauses.append("case_id = ?")
            params.append(filters.case_id)

        if filters.case_type:
            where_clauses.append("case_type = ?")
            params.append(filters.case_type)

        if filters.lawyer_id:
            where_clauses.append("lawyer_id = ?")
            params.append(filters.lawyer_id)

        if filters.invoice_id:
            where_clauses.append("invoice_id = ?")
            params.append(filters.invoice_id)

        if filters.status:
            where_clauses.append("status = ?")
            params.append(filters.status)

        if filters.source:
            where_clauses.append("source = ?")
            params.append(filters.source)

        if filters.min_amount is not None:
            where_clauses.append("invoice_amount >= ?")
            params.append(filters.min_amount)

        if filters.max_amount is not None:
            where_clauses.append("invoice_amount <= ?")
            params.append(filters.max_amount)

        if filters.has_attachment is not None:
            where_clauses.append("has_attachment = ?")
            params.append(filters.has_attachment)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        base_sql += " ORDER BY invoice_date DESC"

        return base_sql, tuple(params)

    def _build_items_query(
        self,
        filters: InvoiceFilter,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_invoice_items_detail WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("invoice_date >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("invoice_date <= ?")
            params.append(filters.end_date.isoformat())

        if filters.case_id:
            where_clauses.append("case_id = ?")
            params.append(filters.case_id)

        if filters.case_type:
            where_clauses.append("case_type = ?")
            params.append(filters.case_type)

        if filters.lawyer_id:
            where_clauses.append("lawyer_id = ?")
            params.append(filters.lawyer_id)

        if filters.invoice_id:
            where_clauses.append("invoice_id = ?")
            params.append(filters.invoice_id)

        if filters.status:
            where_clauses.append("status = ?")
            params.append(filters.status)

        if filters.fee_type:
            where_clauses.append("fee_type = ?")
            params.append(filters.fee_type)

        if filters.min_amount is not None:
            where_clauses.append("amount >= ?")
            params.append(filters.min_amount)

        if filters.max_amount is not None:
            where_clauses.append("amount <= ?")
            params.append(filters.max_amount)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        base_sql += " ORDER BY invoice_date DESC, item_id"

        return base_sql, tuple(params)

    def get_invoices(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        invoice_id: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        has_attachment: Optional[bool] = None,
    ) -> QueryResult:
        filters = InvoiceFilter(
            start_date=start_date,
            end_date=end_date,
            case_id=case_id,
            case_type=case_type,
            lawyer_id=lawyer_id,
            invoice_id=invoice_id,
            status=status,
            source=source,
            min_amount=min_amount,
            max_amount=max_amount,
            has_attachment=has_attachment,
        )

        try:
            query, params = self._build_invoice_query(filters)
            data = self.initializer.execute_query(query, params)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters=self._filters_to_dict(filters),
            )
        except duckdb.Error as e:
            logger.error(f"查询单据失败: {e}")
            raise

    def get_invoice_items(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        invoice_id: Optional[str] = None,
        status: Optional[str] = None,
        fee_type: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> QueryResult:
        filters = InvoiceFilter(
            start_date=start_date,
            end_date=end_date,
            case_id=case_id,
            case_type=case_type,
            lawyer_id=lawyer_id,
            invoice_id=invoice_id,
            status=status,
            fee_type=fee_type,
            min_amount=min_amount,
            max_amount=max_amount,
        )

        try:
            query, params = self._build_items_query(filters)
            data = self.initializer.execute_query(query, params)

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters=self._filters_to_dict(filters),
            )
        except duckdb.Error as e:
            logger.error(f"查询单据明细失败: {e}")
            raise

    def get_fee_type_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = "SELECT * FROM v_fee_type_summary ORDER BY total_amount DESC"
            params: List[Any] = []

            if start_date or end_date:
                sql = """
                SELECT 
                    ii.fee_type,
                    COUNT(ii.id) AS item_count,
                    COUNT(DISTINCT i.id) AS invoice_count,
                    COUNT(DISTINCT c.id) AS case_count,
                    SUM(ii.amount) AS total_amount,
                    ROUND(
                        SUM(ii.amount) * 100.0 / NULLIF(
                            (SELECT SUM(ii2.amount) FROM invoice_items ii2
                             JOIN invoices i2 ON ii2.invoice_id = i2.id
                             WHERE ii2.amount > 0
                             {date_condition}
                            ), 0
                        ), 
                        2
                    ) AS amount_percentage,
                    ROUND(AVG(ii.amount), 2) AS avg_amount,
                    CURRENT_TIMESTAMP AS updated_at
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN cases c ON i.case_id = c.id
                WHERE 1=1
                {date_condition}
                GROUP BY ii.fee_type
                ORDER BY total_amount DESC
                """

                date_conditions: List[str] = []
                if start_date:
                    date_conditions.append("i.invoice_date >= ?")
                    params.append(start_date.isoformat())
                if end_date:
                    date_conditions.append("i.invoice_date <= ?")
                    params.append(end_date.isoformat())

                date_condition_str = ""
                if date_conditions:
                    date_condition_str = " AND " + " AND ".join(date_conditions)

                sql = sql.format(date_condition=date_condition_str)

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
            logger.error(f"查询费用类型汇总失败: {e}")
            raise

    def get_by_status(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                i.status,
                COUNT(i.id) AS invoice_count,
                SUM(i.amount) AS total_amount,
                ROUND(
                    COUNT(i.id) * 100.0 / (SELECT COUNT(*) FROM invoices WHERE 1=1 {date_condition}), 
                    2
                ) AS count_percentage,
                COUNT(DISTINCT i.case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM invoices i
            WHERE 1=1
            {date_condition}
            GROUP BY i.status
            ORDER BY total_amount DESC
            """

            date_conditions: List[str] = []
            params: List[Any] = []
            if start_date:
                date_conditions.append("i.invoice_date >= ?")
                params.append(start_date.isoformat())
            if end_date:
                date_conditions.append("i.invoice_date <= ?")
                params.append(end_date.isoformat())

            date_condition_str = ""
            if date_conditions:
                date_condition_str = " AND " + " AND ".join(date_conditions)

            sql = sql.format(date_condition=date_condition_str)

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
            logger.error(f"按状态查询单据失败: {e}")
            raise

    def get_by_source(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                i.source,
                COUNT(i.id) AS invoice_count,
                SUM(i.amount) AS total_amount,
                ROUND(AVG(i.amount), 2) AS avg_amount,
                COUNT(DISTINCT i.case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM invoices i
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND i.invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND i.invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY i.source ORDER BY total_amount DESC"

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
            logger.error(f"按来源查询单据失败: {e}")
            raise

    def get_amount_difference(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                invoice_id,
                invoice_no,
                case_no,
                case_name,
                lawyer_name,
                invoice_amount,
                items_total,
                amount_difference,
                ROUND(
                    CASE 
                        WHEN invoice_amount > 0 
                        THEN amount_difference / invoice_amount * 100 
                        ELSE 0 
                    END, 2
                ) AS difference_percentage,
                updated_at
            FROM v_invoice_summary
            WHERE ABS(amount_difference) > 0
            """
            params: List[Any] = []

            if start_date:
                sql += " AND invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " ORDER BY ABS(amount_difference) DESC"

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
            logger.error(f"查询金额差异失败: {e}")
            raise

    def get_monthly_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                DATE_TRUNC('month', i.invoice_date) AS report_month,
                COUNT(i.id) AS invoice_count,
                SUM(i.amount) AS total_amount,
                ROUND(AVG(i.amount), 2) AS avg_amount,
                COUNT(DISTINCT i.case_id) AS case_count,
                SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END) AS pending_amount,
                SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END) AS overdue_amount,
                CURRENT_TIMESTAMP AS updated_at
            FROM invoices i
            WHERE 1=1
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
            logger.error(f"查询月度汇总失败: {e}")
            raise

    def get_by_lawyer(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                u.id AS lawyer_id,
                u.name AS lawyer_name,
                COUNT(i.id) AS invoice_count,
                SUM(i.amount) AS total_amount,
                ROUND(AVG(i.amount), 2) AS avg_amount,
                COUNT(DISTINCT i.case_id) AS case_count,
                SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END) AS pending_amount,
                CURRENT_TIMESTAMP AS updated_at
            FROM invoices i
            JOIN cases c ON i.case_id = c.id
            JOIN users u ON c.lawyer_id = u.id
            WHERE u.role = 'lawyer'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND i.invoice_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND i.invoice_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY u.id, u.name ORDER BY total_amount DESC"

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
            logger.error(f"按律师查询单据失败: {e}")
            raise

    def _filters_to_dict(self, filters: InvoiceFilter) -> Dict[str, Any]:
        return {
            "start_date": filters.start_date.isoformat() if filters.start_date else None,
            "end_date": filters.end_date.isoformat() if filters.end_date else None,
            "case_id": filters.case_id,
            "case_type": filters.case_type,
            "lawyer_id": filters.lawyer_id,
            "invoice_id": filters.invoice_id,
            "status": filters.status,
            "source": filters.source,
            "fee_type": filters.fee_type,
            "min_amount": filters.min_amount,
            "max_amount": filters.max_amount,
            "has_attachment": filters.has_attachment,
        }
