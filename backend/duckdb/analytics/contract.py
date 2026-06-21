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
class ContractFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    case_id: Optional[str] = None
    case_type: Optional[str] = None
    lawyer_id: Optional[str] = None
    attachment_type: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


CONTRACT_COMPOSITION_VIEW_SQL = """
CREATE OR REPLACE VIEW v_contract_composition AS
SELECT 
    ca.id AS attachment_id,
    ca.case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    c.lawyer_id,
    u.name AS lawyer_name,
    ca.attachment_type,
    ca.file_name,
    ca.file_path,
    ca.amount,
    ca.uploaded_at,
    CURRENT_TIMESTAMP AS updated_at
FROM contract_attachments ca
JOIN cases c ON ca.case_id = c.id
LEFT JOIN users u ON c.lawyer_id = u.id
ORDER BY ca.uploaded_at DESC;
"""

CONTRACT_SUMMARY_VIEW_SQL = """
CREATE OR REPLACE VIEW v_contract_summary AS
SELECT 
    ca.attachment_type,
    COUNT(*) AS count,
    SUM(ca.amount) AS total_amount,
    ROUND(
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contract_attachments), 
        2
    ) AS count_percentage,
    ROUND(
        SUM(ca.amount) * 100.0 / NULLIF((SELECT SUM(amount) FROM contract_attachments WHERE amount > 0), 0), 
        2
    ) AS amount_percentage,
    COUNT(DISTINCT ca.case_id) AS case_count,
    CURRENT_TIMESTAMP AS updated_at
FROM contract_attachments ca
GROUP BY ca.attachment_type
ORDER BY count DESC;
"""


class ContractAnalyzer:
    def __init__(
        self,
        initializer: Optional[DuckDBInitializer] = None,
        config: Optional[DatabaseConfig] = None,
    ) -> None:
        self.initializer = initializer or get_duckdb_connection(config)

    def sync_data(self) -> List[SyncResult]:
        try:
            tables = ["contract_attachments", "cases", "users"]
            results = self.initializer.sync_from_postgres(tables)
            self.create_view()
            logger.info("合同附件数据同步完成")
            return results
        except (psycopg2.Error, duckdb.Error, DataSyncError) as e:
            logger.error(f"同步合同附件数据失败: {e}")
            raise

    def create_view(self) -> None:
        try:
            conn = self.initializer._get_duckdb_connection()
            conn.execute(CONTRACT_COMPOSITION_VIEW_SQL)
            conn.execute(CONTRACT_SUMMARY_VIEW_SQL)
            logger.info("合同附件视图创建成功")
        except duckdb.Error as e:
            logger.error(f"创建合同附件视图失败: {e}")
            raise

    def _build_query(
        self,
        filters: ContractFilter,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_contract_composition WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("uploaded_at >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("uploaded_at <= ?")
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

        if filters.attachment_type:
            where_clauses.append("attachment_type = ?")
            params.append(filters.attachment_type)

        if filters.min_amount is not None:
            where_clauses.append("amount >= ?")
            params.append(filters.min_amount)

        if filters.max_amount is not None:
            where_clauses.append("amount <= ?")
            params.append(filters.max_amount)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        base_sql += " ORDER BY uploaded_at DESC"

        return base_sql, tuple(params)

    def get_attachments(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        attachment_type: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> QueryResult:
        filters = ContractFilter(
            start_date=start_date,
            end_date=end_date,
            case_id=case_id,
            case_type=case_type,
            lawyer_id=lawyer_id,
            attachment_type=attachment_type,
            min_amount=min_amount,
            max_amount=max_amount,
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
            logger.error(f"查询合同附件失败: {e}")
            raise

    def get_composition_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = "SELECT * FROM v_contract_summary ORDER BY count DESC"
            params: List[Any] = []

            if start_date or end_date:
                sql = """
                SELECT 
                    ca.attachment_type,
                    COUNT(*) AS count,
                    SUM(ca.amount) AS total_amount,
                    ROUND(
                        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contract_attachments ca2 
                            WHERE 1=1
                            {date_condition}
                        ), 
                        2
                    ) AS count_percentage,
                    ROUND(
                        SUM(ca.amount) * 100.0 / NULLIF(
                            (SELECT SUM(amount) FROM contract_attachments ca3 
                             WHERE amount > 0
                             {date_condition}
                            ), 0
                        ), 
                        2
                    ) AS amount_percentage,
                    COUNT(DISTINCT ca.case_id) AS case_count,
                    CURRENT_TIMESTAMP AS updated_at
                FROM contract_attachments ca
                WHERE 1=1
                {date_condition}
                GROUP BY ca.attachment_type
                ORDER BY count DESC
                """

                date_conditions: List[str] = []
                if start_date:
                    date_conditions.append("uploaded_at >= ?")
                    params.append(start_date.isoformat())
                if end_date:
                    date_conditions.append("uploaded_at <= ?")
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
            logger.error(f"查询附件构成汇总失败: {e}")
            raise

    def get_by_case_type(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                c.case_type,
                ca.attachment_type,
                COUNT(*) AS count,
                SUM(ca.amount) AS total_amount,
                ROUND(
                    COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM contract_attachments ca2
                        JOIN cases c2 ON ca2.case_id = c2.id
                        WHERE c2.case_type = c.case_type
                        {date_condition}
                    ), 
                    2
                ) AS type_percentage,
                CURRENT_TIMESTAMP AS updated_at
            FROM contract_attachments ca
            JOIN cases c ON ca.case_id = c.id
            WHERE 1=1
            {date_condition}
            GROUP BY c.case_type, ca.attachment_type
            ORDER BY c.case_type, count DESC
            """

            date_conditions: List[str] = []
            params: List[Any] = []
            if start_date:
                date_conditions.append("ca.uploaded_at >= ?")
                params.append(start_date.isoformat())
            if end_date:
                date_conditions.append("ca.uploaded_at <= ?")
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
            logger.error(f"按案件类型查询附件构成失败: {e}")
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
                ca.attachment_type,
                COUNT(*) AS count,
                SUM(ca.amount) AS total_amount,
                COUNT(DISTINCT ca.case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM contract_attachments ca
            JOIN cases c ON ca.case_id = c.id
            LEFT JOIN users u ON c.lawyer_id = u.id
            WHERE u.role = 'lawyer'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND ca.uploaded_at >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND ca.uploaded_at <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY u.id, u.name, ca.attachment_type ORDER BY u.name, count DESC"

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
            logger.error(f"按律师查询附件构成失败: {e}")
            raise

    def get_top_cases_by_attachments(
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
                COUNT(ca.id) AS attachment_count,
                SUM(ca.amount) AS total_amount,
                LIST(DISTINCT ca.attachment_type) AS attachment_types,
                CURRENT_TIMESTAMP AS updated_at
            FROM cases c
            LEFT JOIN contract_attachments ca ON c.id = ca.case_id
            LEFT JOIN users u ON c.lawyer_id = u.id
            WHERE c.status != 'cancelled'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND ca.uploaded_at >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND ca.uploaded_at <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY c.id, c.case_no, c.name, c.case_type, u.name"
            sql += " ORDER BY attachment_count DESC LIMIT ?"
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
            logger.error(f"查询附件最多的案件失败: {e}")
            raise

    def get_monthly_upload_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                DATE_TRUNC('month', ca.uploaded_at) AS report_month,
                ca.attachment_type,
                COUNT(*) AS count,
                SUM(ca.amount) AS total_amount,
                CURRENT_TIMESTAMP AS updated_at
            FROM contract_attachments ca
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND ca.uploaded_at >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND ca.uploaded_at <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY DATE_TRUNC('month', ca.uploaded_at), ca.attachment_type"
            sql += " ORDER BY report_month, count DESC"

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
            logger.error(f"查询月度上传趋势失败: {e}")
            raise

    def get_amount_distribution(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                CASE 
                    WHEN ca.amount = 0 THEN '无金额'
                    WHEN ca.amount < 100000 THEN '10万以下'
                    WHEN ca.amount < 500000 THEN '10万-50万'
                    WHEN ca.amount < 1000000 THEN '50万-100万'
                    WHEN ca.amount < 5000000 THEN '100万-500万'
                    ELSE '500万以上'
                END AS amount_range,
                ca.attachment_type,
                COUNT(*) AS count,
                SUM(ca.amount) AS total_amount,
                CURRENT_TIMESTAMP AS updated_at
            FROM contract_attachments ca
            WHERE ca.amount >= 0
            """
            params: List[Any] = []

            if start_date:
                sql += " AND ca.uploaded_at >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND ca.uploaded_at <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY amount_range, ca.attachment_type"
            sql += " ORDER BY MIN(CASE WHEN ca.amount = 0 THEN -1 ELSE ca.amount END)"

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
            logger.error(f"查询金额分布失败: {e}")
            raise

    def _filters_to_dict(self, filters: ContractFilter) -> Dict[str, Any]:
        return {
            "start_date": filters.start_date.isoformat() if filters.start_date else None,
            "end_date": filters.end_date.isoformat() if filters.end_date else None,
            "case_id": filters.case_id,
            "case_type": filters.case_type,
            "lawyer_id": filters.lawyer_id,
            "attachment_type": filters.attachment_type,
            "min_amount": filters.min_amount,
            "max_amount": filters.max_amount,
        }
