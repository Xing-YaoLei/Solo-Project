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
class ApprovalFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    case_id: Optional[str] = None
    case_type: Optional[str] = None
    lawyer_id: Optional[str] = None
    approver_id: Optional[str] = None
    status: Optional[str] = None
    anomaly_type: Optional[str] = None
    min_delay_hours: Optional[float] = None
    max_delay_hours: Optional[float] = None


APPROVAL_ANOMALIES_VIEW_SQL = """
CREATE OR REPLACE VIEW v_approval_anomalies AS
SELECT 
    an.id,
    an.case_id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    c.lawyer_id,
    lawyer.name AS lawyer_name,
    an.node_name,
    an.order_index,
    an.approver_id,
    approver.name AS approver_name,
    approver.role AS approver_role,
    an.submit_time,
    an.expected_complete_time,
    an.actual_complete_time,
    an.status,
    CASE 
        WHEN an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - an.expected_complete_time) / 3600
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time
        THEN EXTRACT(EPOCH FROM (an.actual_complete_time - an.expected_complete_time)) / 3600
        ELSE 0 
    END AS delay_hours,
    CASE 
        WHEN an.status = 'rejected' THEN 'rejected'
        WHEN an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP THEN 'overdue'
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time THEN 'delayed'
        ELSE 'normal'
    END AS anomaly_type,
    an.reason,
    CURRENT_TIMESTAMP AS updated_at
FROM approval_nodes an
JOIN cases c ON an.case_id = c.id
LEFT JOIN users lawyer ON c.lawyer_id = lawyer.id
LEFT JOIN users approver ON an.approver_id = approver.id
WHERE an.status = 'rejected' 
   OR (an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP)
   OR (an.actual_complete_time IS NOT NULL AND an.actual_complete_time > an.expected_complete_time)
ORDER BY an.submit_time DESC;
"""

APPROVAL_SUMMARY_VIEW_SQL = """
CREATE OR REPLACE VIEW v_approval_summary AS
SELECT 
    c.case_type,
    an.status,
    CASE 
        WHEN an.status = 'rejected' THEN 'rejected'
        WHEN an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP THEN 'overdue'
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time THEN 'delayed'
        ELSE 'normal'
    END AS anomaly_type,
    COUNT(*) AS count,
    ROUND(AVG(CASE 
        WHEN an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - an.expected_complete_time) / 3600
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time
        THEN EXTRACT(EPOCH FROM (an.actual_complete_time - an.expected_complete_time)) / 3600
        ELSE 0 
    END), 2
    ) AS avg_delay_hours,
    ROUND(MAX(CASE 
        WHEN an.status = 'pending' AND an.expected_complete_time < CURRENT_TIMESTAMP 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - an.expected_complete_time) / 3600
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time
        THEN EXTRACT(EPOCH FROM (an.actual_complete_time - an.expected_complete_time)) / 3600
        ELSE 0 
    END), 2
    ) AS max_delay_hours,
    CURRENT_TIMESTAMP AS updated_at
FROM approval_nodes an
JOIN cases c ON an.case_id = c.id
GROUP BY c.case_type, an.status
ORDER BY count DESC;
"""


class ApprovalAnalyzer:
    def __init__(
        self,
        initializer: Optional[DuckDBInitializer] = None,
        config: Optional[DatabaseConfig] = None,
    ) -> None:
        self.initializer = initializer or get_duckdb_connection(config)

    def sync_data(self) -> List[SyncResult]:
        try:
            tables = ["approval_nodes", "cases", "users"]
            results = self.initializer.sync_from_postgres(tables)
            self.create_view()
            logger.info("审批数据同步完成")
            return results
        except (psycopg2.Error, duckdb.Error, DataSyncError) as e:
            logger.error(f"同步审批数据失败: {e}")
            raise

    def create_view(self) -> None:
        try:
            conn = self.initializer._get_duckdb_connection()
            conn.execute(APPROVAL_ANOMALIES_VIEW_SQL)
            conn.execute(APPROVAL_SUMMARY_VIEW_SQL)
            logger.info("审批异常视图创建成功")
        except duckdb.Error as e:
            logger.error(f"创建审批异常视图失败: {e}")
            raise

    def _build_query(
        self,
        filters: ApprovalFilter,
    ) -> tuple[str, tuple[Any, ...]]:
        base_sql = "SELECT * FROM v_approval_anomalies WHERE 1=1"
        params: List[Any] = []
        where_clauses: List[str] = []

        if filters.start_date:
            where_clauses.append("submit_time >= ?")
            params.append(filters.start_date.isoformat())

        if filters.end_date:
            where_clauses.append("submit_time <= ?")
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

        if filters.approver_id:
            where_clauses.append("approver_id = ?")
            params.append(filters.approver_id)

        if filters.status:
            where_clauses.append("status = ?")
            params.append(filters.status)

        if filters.anomaly_type:
            where_clauses.append("anomaly_type = ?")
            params.append(filters.anomaly_type)

        if filters.min_delay_hours is not None:
            where_clauses.append("delay_hours >= ?")
            params.append(filters.min_delay_hours)

        if filters.max_delay_hours is not None:
            where_clauses.append("delay_hours <= ?")
            params.append(filters.max_delay_hours)

        if where_clauses:
            base_sql += " AND " + " AND ".join(where_clauses)

        base_sql += " ORDER BY submit_time DESC"

        return base_sql, tuple(params)

    def get_anomalies(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None,
        case_type: Optional[str] = None,
        lawyer_id: Optional[str] = None,
        approver_id: Optional[str] = None,
        status: Optional[str] = None,
        anomaly_type: Optional[str] = None,
        min_delay_hours: Optional[float] = None,
        max_delay_hours: Optional[float] = None,
    ) -> QueryResult:
        filters = ApprovalFilter(
            start_date=start_date,
            end_date=end_date,
            case_id=case_id,
            case_type=case_type,
            lawyer_id=lawyer_id,
            approver_id=approver_id,
            status=status,
            anomaly_type=anomaly_type,
            min_delay_hours=min_delay_hours,
            max_delay_hours=max_delay_hours,
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
            logger.error(f"查询审批异常失败: {e}")
            raise

    def get_summary_by_anomaly_type(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                anomaly_type,
                COUNT(*) AS count,
                ROUND(AVG(delay_hours), 2) AS avg_delay_hours,
                ROUND(MAX(delay_hours), 2) AS max_delay_hours,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY anomaly_type ORDER BY count DESC"

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
            logger.error(f"按异常类型查询失败: {e}")
            raise

    def get_by_approver_performance(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                approver_id,
                approver_name,
                approver_role,
                COUNT(*) AS total_approvals,
                SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) AS anomaly_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                    THEN SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) 
                    ELSE 0 
                END, 2
            ) AS anomaly_rate,
                ROUND(AVG(CASE WHEN delay_hours > 0 THEN delay_hours ELSE NULL END), 2
            ) AS avg_delay_when_anomaly,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY approver_id, approver_name, approver_role ORDER BY anomaly_count DESC"

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
            logger.error(f"查询审批人绩效失败: {e}")
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
                COUNT(*) AS total_nodes,
                SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) AS anomaly_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                    THEN SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) 
                    ELSE 0 
                END, 2
            ) AS anomaly_rate,
                ROUND(AVG(delay_hours), 2) AS avg_delay_hours,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY case_type ORDER BY anomaly_count DESC"

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
                COUNT(*) AS total_nodes,
                SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) AS anomaly_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                    THEN SUM(CASE WHEN anomaly_type != 'normal' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) 
                    ELSE 0 
                END, 2
            ) AS anomaly_rate,
                ROUND(AVG(delay_hours), 2) AS avg_delay_hours,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY lawyer_id, lawyer_name ORDER BY anomaly_count DESC"

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

    def get_top_delayed_cases(
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
                COUNT(*) AS anomaly_count,
                ROUND(SUM(delay_hours), 2) AS total_delay_hours,
                ROUND(AVG(delay_hours), 2) AS avg_delay_hours,
                LIST(DISTINCT anomaly_type) AS anomaly_types,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE anomaly_type != 'normal'
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY case_id, case_no, case_name, case_type, lawyer_name"
            sql += " ORDER BY total_delay_hours DESC LIMIT ?"
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
            logger.error(f"查询延迟最多的案件失败: {e}")
            raise

    def get_monthly_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                DATE_TRUNC('month', submit_time) AS report_month,
                anomaly_type,
                COUNT(*) AS count,
                ROUND(SUM(delay_hours), 2) AS total_delay_hours,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE 1=1
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY DATE_TRUNC('month', submit_time), anomaly_type"
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
            logger.error(f"查询月度趋势失败: {e}")
            raise

    def get_processing_time_analysis(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                node_name,
                COUNT(*) AS count,
                ROUND(
                    AVG(
                        CASE 
                            WHEN actual_complete_time IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM (actual_complete_time - submit_time) / 3600 
                            ELSE NULL 
                        END
                    ), 2
            ) AS avg_processing_hours,
                ROUND(
                    AVG(delay_hours) FILTER (WHERE delay_hours > 0), 2
            ) AS avg_delay_when_late,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE actual_complete_time IS NOT NULL
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY node_name ORDER BY avg_processing_hours DESC"

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
            logger.error(f"查询处理时间分析失败: {e}")
            raise

    def get_rejection_reasons(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> QueryResult:
        try:
            sql = """
            SELECT 
                reason,
                COUNT(*) AS count,
                COUNT(DISTINCT case_id) AS case_count,
                CURRENT_TIMESTAMP AS updated_at
            FROM v_approval_anomalies
            WHERE anomaly_type = 'rejected' AND reason IS NOT NULL
            """
            params: List[Any] = []

            if start_date:
                sql += " AND submit_time >= ?"
                params.append(start_date.isoformat())
            if end_date:
                sql += " AND submit_time <= ?"
                params.append(end_date.isoformat())

            sql += " GROUP BY reason ORDER BY count DESC"

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
            logger.error(f"查询拒绝原因失败: {e}")
            raise

    def _filters_to_dict(self, filters: ApprovalFilter) -> Dict[str, Any]:
        return {
            "start_date": filters.start_date.isoformat() if filters.start_date else None,
            "end_date": filters.end_date.isoformat() if filters.end_date else None,
            "case_id": filters.case_id,
            "case_type": filters.case_type,
            "lawyer_id": filters.lawyer_id,
            "approver_id": filters.approver_id,
            "status": filters.status,
            "anomaly_type": filters.anomaly_type,
            "min_delay_hours": filters.min_delay_hours,
            "max_delay_hours": filters.max_delay_hours,
        }
