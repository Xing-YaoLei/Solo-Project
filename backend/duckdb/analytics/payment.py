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
class PaymentFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    case_id: Optional[str] = None
    case_type: Optional[str] = None
    lawyer_id: Optional[str] = None
    client_id: Optional[str] = None
    status: Optional[str] = None
    payment_cycle_type: Optional[str] = None
    min_days_overdue: Optional[int] = None
    max_days_overdue: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


PAYMENT_TRACKING_VIEW_SQL = """
CREATE OR REPLACE VIEW v_payment_tracking AS
SELECT 
    ps.id AS payment_id,
    ps.case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    c.lawyer_id,
    lawyer.name AS lawyer_name,
    c.client_id,
    client.name AS client_name,
    ps.phase,
    ps.phase_name,
    ps.amount,
    ps.due_date,
    ps.actual_payment_date,
    ps.status,
    ps.payment_cycle_type,
    CASE 
        WHEN ps.status = 'paid' THEN 0
        WHEN ps.due_date < CURRENT_DATE AND ps.status != 'paid' 
        THEN EXTRACT(DAY FROM (CURRENT_DATE - ps.due_date))
        ELSE NULL
    END AS days_overdue,
    CASE 
        WHEN ps.status = 'paid' AND ps.actual_payment_date IS NOT NULL
        THEN EXTRACT(DAY FROM (ps.actual_payment_date - ps.due_date))
        ELSE NULL
    END AS actual_delay_days,
    CURRENT_TIMESTAMP AS updated_at
FROM payment_schedules ps
JOIN cases c ON ps.case_id = c.id
LEFT JOIN users lawyer ON c.lawyer_id = lawyer.id
LEFT JOIN users client ON c.client_id = client.id
ORDER BY c.case_no, ps.phase;
"""

PAYMENT_SUMMARY_VIEW_SQL = """
CREATE OR REPLACE VIEW v_payment_summary AS
SELECT 
    c.case_type,
    ps.status,
    ps.payment_cycle_type,
    COUNT(*) AS payment_count,
    SUM(ps.amount) AS total_amount,
    ROUND(AVG(ps.amount), 2) AS avg_amount,
    COUNT(DISTINCT ps.case_id) AS case_count,
    SUM(CASE 
        WHEN ps.status = 'paid' AND ps.actual_payment_date IS NOT NULL
        THEN EXTRACT(DAY FROM (ps.actual_payment_date - ps.due_date))
        ELSE NULL 
    END) AS total_delay_days,
    ROUND(AVG(CASE 
        WHEN ps.status = 'paid' AND ps.actual_payment_date IS NOT NULL
        THEN EXTRACT(DAY FROM (ps.actual_payment_date - ps.due_date))
        ELSE NULL 
    END), 2
    ) AS avg_delay_days,
    CURRENT_TIMESTAMP AS updated_at
FROM payment_schedules ps
JOIN cases c ON ps.case_id = c.id
GROUP BY c.case_type, ps.status, ps.payment_cycle_type
ORDER BY total_amount DESC;
"""


class PaymentAnalyzer:
    def __init__(
        self,
        initializer: Optional[DuckDBInitializer] = None,
        config: Optional[DatabaseConfig] = None,
    ) -> None:
        self.initializer = initializer or get_duckdb_connection(config)

    def sync_data(self) -> List[SyncResult]:
        try:
            tables = ["payment_schedules", "cases", "users"]
            results = self.initializer.sync_from_postgres(tables)
            self.create_view()
            logger.info("回款数据同步完成")
            return results
        except (psycopg2.Error, duckdb.Error, DataSyncError) as e:
            logger.error(f"同步回款数据失败: {e}")
            raise

    def create_view(self) -> None:
        try:
            conn = self.initializer._get_duckdb_connection()
            conn.execute(PAYMENT_TRACKING_VIEW_SQL)
            conn.execute(PAYMENT_SUMMARY_VIEW_SQL)
            logger.info("回款追踪视图创建成功")
        except duckdb.Error as e:
            logger.error(f"创建回款追踪视图失败: {e}")
            raise

    def _build_query(
        self,
        filters: PaymentFilter,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_payment_tracking WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("due_date >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("due_date <= ?")
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

        if filters.client_id:
            where_clauses.append("client_id = ?")
            params.append(filters.client_id)

        if filters.status:
            where_clauses.append("status = ?")
            params.append(filters.status)

        if filters.payment_cycle_type:
            where_clauses.append("payment_cycle_type = ?")
            params.append(filters.payment_cycle_type)

        if filters.min_days_overdue is not None:
            where_clauses.append("days_overdue >= ?")
            params.append(filters.min_days_overdue)

        if filters.max_days_overdue is not None:
            where_clauses.append("days_overdue <= ?")
            params.append(filters.max_days_overdue)

        if filters.min_amount is not None:
            where_clauses.append("amount >= ?")
            params.append(filters.min_amount)

        if filters.max_amount is not None:
            where_clauses.append("amount <= ?")
            params.append(filters.max_amount)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        base_sql += " ORDER BY due_date DESC, phase"

        return base_sql, tuple(params)

    def get_payments(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        payment_cycle_type: Optional[str] = None,
        min_days_overdue: Optional[int] = None,
        max_days_overdue: Optional[int] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> QueryResult:
        filters = PaymentFilter(
            start_date=start_date,
            end_date=end_date,
            case_id=case_id,
            case_type=case_type,
            lawyer_id=lawyer_id,
            client_id=client_id,
            status=status,
            payment_cycle_type=payment_cycle_type,
            min_days_overdue=min_days_overdue,
            max_days_overdue=max_days_overdue,
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
            logger.error(f"查询回款计划失败: {e}")
            raise

    def get_overdue_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                status,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                ROUND(AVG(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS avg_overdue_days,
                ROUND(MAX(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS max_overdue_days,
                COUNT(DISTINCT case_id) AS case_count,
                COUNT(DISTINCT client_id) AS client_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY status ORDER BY total_amount DESC"

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
            logger.error(f"查询逾期汇总失败: {e}")
            raise

    def get_by_case_type(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                case_type,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount,
                ROUND(
                    CASE WHEN SUM(amount) > 0 
                    THEN SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) * 100.0 / SUM(amount) 
                    ELSE 0 
                END, 2
            ) AS collection_rate,
                ROUND(AVG(actual_delay_days) FILTER (WHERE actual_delay_days IS NOT NULL), 2
            ) AS avg_actual_delay_days,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY case_type ORDER BY total_amount DESC"

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
            logger.error(f"按案件类型查询失败: {e}")
            raise

    def get_by_lawyer(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                lawyer_id,
                lawyer_name,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount,
                ROUND(
                    CASE WHEN SUM(amount) > 0 
                    THEN SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) * 100.0 / SUM(amount) 
                    ELSE 0 
                END, 2
            ) AS collection_rate,
                ROUND(AVG(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS avg_overdue_days,
                COUNT(DISTINCT case_id) AS case_count,
                COUNT(DISTINCT client_id) AS client_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY lawyer_id, lawyer_name ORDER BY total_amount DESC"

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
            logger.error(f"按律师查询失败: {e}")
            raise

    def get_by_client(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                client_id,
                client_name,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount,
                ROUND(
                    CASE WHEN SUM(amount) > 0 
                    THEN SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) * 100.0 / SUM(amount) 
                    ELSE 0 
                END, 2
            ) AS collection_rate,
                ROUND(AVG(actual_delay_days) FILTER (WHERE actual_delay_days IS NOT NULL), 2
            ) AS avg_actual_delay_days,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY client_id, client_name ORDER BY total_amount DESC"

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
            logger.error(f"按客户查询失败: {e}")
            raise

    def get_by_payment_cycle(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                payment_cycle_type,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                ROUND(AVG(actual_delay_days) FILTER (WHERE actual_delay_days IS NOT NULL), 2
            ) AS avg_actual_delay_days,
                ROUND(AVG(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS avg_overdue_days,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY payment_cycle_type ORDER BY total_amount DESC"

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
            logger.error(f"按回款周期查询失败: {e}")
            raise

    def get_top_overdue_cases(
        self,
        limit: int = 10,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                case_id,
                case_no,
                case_name,
                case_type,
                lawyer_name,
                client_name,
                COUNT(*) AS overdue_count,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS total_overdue_amount,
                ROUND(MAX(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS max_overdue_days,
                ROUND(AVG(days_overdue) FILTER (WHERE days_overdue > 0), 2
            ) AS avg_overdue_days,
                LIST(DISTINCT phase_name) AS overdue_phases,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE status = 'overdue' OR days_overdue > 0
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY case_id, case_no, case_name, case_type, lawyer_name, client_name"
            sql += " ORDER BY total_overdue_amount DESC LIMIT ?"
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
            logger.error(f"查询逾期最多的案件失败: {e}")
            raise

    def get_monthly_collection_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                DATE_TRUNC('month', due_date) AS report_month,
                COUNT(*) AS total_payments,
                SUM(amount) AS total_amount,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount,
                ROUND(
                    CASE WHEN SUM(amount) > 0 
                    THEN SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) * 100.0 / SUM(amount) 
                    ELSE 0 
                END, 2
            ) AS collection_rate,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY DATE_TRUNC('month', due_date) ORDER BY report_month"

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
            logger.error(f"查询月度回款趋势失败: {e}")
            raise

    def get_delay_distribution(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                CASE 
                    WHEN actual_delay_days IS NULL THEN '未回款'
                    WHEN actual_delay_days <= 0 THEN '提前/按时'
                    WHEN actual_delay_days <= 7 THEN '1-7天'
                    WHEN actual_delay_days <= 30 THEN '8-30天'
                    WHEN actual_delay_days <= 60 THEN '31-60天'
                    WHEN actual_delay_days <= 90 THEN '61-90天'
                    ELSE '90天以上'
                END AS delay_range,
                COUNT(*) AS count,
                SUM(amount) AS total_amount,
                ROUND(AVG(actual_delay_days) FILTER (WHERE actual_delay_days IS NOT NULL), 2
            ) AS avg_delay_days,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE status = 'paid'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY delay_range"
            sql += " ORDER BY MIN(CASE WHEN actual_delay_days IS NULL THEN 9999 ELSE actual_delay_days END)"

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
            logger.error(f"查询延迟分布失败: {e}")
            raise

    def get_phase_analysis(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                phase,
                phase_name,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount,
                ROUND(AVG(amount), 2) AS avg_amount,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
                ROUND(
                    CASE WHEN SUM(amount) > 0 
                    THEN SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) * 100.0 / SUM(amount) 
                    ELSE 0 
                END, 2
            ) AS collection_rate,
                ROUND(AVG(actual_delay_days) FILTER (WHERE actual_delay_days IS NOT NULL), 2
            ) AS avg_delay_days,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_payment_tracking
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND due_date >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND due_date <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY phase, phase_name ORDER BY phase"

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
            logger.error(f"查询阶段分析失败: {e}")
            raise

    def get_case_payment_schedule(
        self,
        case_id: str,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                payment_id,
                case_id,
                case_no,
                case_name,
                phase,
                phase_name,
                amount,
                due_date,
                actual_payment_date,
                status,
                payment_cycle_type,
                days_overdue,
                actual_delay_days,
                updated_at
            FROM v_payment_tracking
            WHERE case_id = ?
            ORDER BY phase
            """

            data = self.initializer.execute_query(sql, (case_id,))

            return QueryResult(
                data=data,
                updated_at=datetime.now(),
                total=len(data),
                filters={"case_id": case_id},
            )
        except duckdb.Error as e:
            logger.error(f"查询案件回款计划失败: {e}")
            raise

    def _filters_to_dict(self, filters: PaymentFilter) -> Dict[str, Any]:
        return {
            "start_date": filters.start_date.isoformat() if filters.start_date else None,
            "end_date": filters.end_date.isoformat() if filters.end_date else None,
            "case_id": filters.case_id,
            "case_type": filters.case_type,
            "lawyer_id": filters.lawyer_id,
            "client_id": filters.client_id,
            "status": filters.status,
            "payment_cycle_type": filters.payment_cycle_type,
            "min_days_overdue": filters.min_days_overdue,
            "max_days_overdue": filters.max_days_overdue,
            "min_amount": filters.min_amount,
            "max_amount": filters.max_amount,
        }
