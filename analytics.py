import uuid
import json
from datetime import datetime, timedelta
import polars as pl
import duckdb
from database import db
from minio_storage import minio_mgr
from config import settings

class AnalyticsEngine:
    def __init__(self):
        self.conn = db.get_conn()

    def get_funnel_data(self, package_id: str = None, date_range: tuple = None) -> pl.DataFrame:
        base_sql = """
            SELECT 
                fr.package_id,
                p.package_name,
                fr.stage,
                fr.channel,
                COUNT(DISTINCT fr.user_id) as user_count,
                DATE_TRUNC('day', fr.stage_time) as record_date
            FROM funnel_records fr
            LEFT JOIN packages p ON fr.package_id = p.package_id
            WHERE fr.is_deleted = FALSE
        """
        conditions = []
        params = []

        if package_id:
            conditions.append("fr.package_id = ?")
            params.append(package_id)
        if date_range:
            conditions.append("fr.stage_time BETWEEN ? AND ?")
            params.extend([date_range[0], date_range[1]])

        if conditions:
            base_sql += " AND " + " AND ".join(conditions)

        base_sql += " GROUP BY fr.package_id, p.package_name, fr.stage, fr.channel, DATE_TRUNC('day', fr.stage_time)"
        
        return pl.from_pandas(self.conn.execute(base_sql, params).fetchdf()) if self._is_pandas_issue() else self.conn.execute(base_sql, params).pl()

    def _is_pandas_issue(self):
        return False

    def get_conversion_rates(self, package_id: str = None, date_range: tuple = None) -> pl.DataFrame:
        funnel_sql = """
            WITH stage_counts AS (
                SELECT 
                    package_id,
                    stage,
                    COUNT(DISTINCT user_id) as cnt
                FROM funnel_records
                WHERE is_deleted = FALSE
        """
        conditions = []
        params = []

        if package_id:
            conditions.append("package_id = ?")
            params.append(package_id)
        if date_range:
            conditions.append("stage_time BETWEEN ? AND ?")
            params.extend([date_range[0], date_range[1]])

        if conditions:
            funnel_sql += " AND " + " AND ".join(conditions)

        funnel_sql += """
                GROUP BY package_id, stage
            ),
            pivot_stages AS (
                SELECT 
                    package_id,
                    MAX(CASE WHEN stage = '浏览商品' THEN cnt ELSE 0 END) as browse_cnt,
                    MAX(CASE WHEN stage = '加入购物车' THEN cnt ELSE 0 END) as cart_cnt,
                    MAX(CASE WHEN stage = '提交订单' THEN cnt ELSE 0 END) as order_cnt,
                    MAX(CASE WHEN stage = '完成支付' THEN cnt ELSE 0 END) as pay_cnt,
                    MAX(CASE WHEN stage = '预约入住' THEN cnt ELSE 0 END) as booking_cnt,
                    MAX(CASE WHEN stage = '完成核销' THEN cnt ELSE 0 END) as verify_cnt
                FROM stage_counts
                GROUP BY package_id
            )
            SELECT 
                p.package_id,
                p.package_name,
                ps.browse_cnt as 浏览人数,
                ps.cart_cnt as 加购人数,
                ps.order_cnt as 下单人数,
                ps.pay_cnt as 支付人数,
                ps.booking_cnt as 预约人数,
                ps.verify_cnt as 核销人数,
                CASE WHEN ps.browse_cnt > 0 THEN ROUND(ps.cart_cnt::FLOAT / ps.browse_cnt, 4) ELSE 0 END as 加购转化率,
                CASE WHEN ps.cart_cnt > 0 THEN ROUND(ps.order_cnt::FLOAT / ps.cart_cnt, 4) ELSE 0 END as 下单转化率,
                CASE WHEN ps.order_cnt > 0 THEN ROUND(ps.pay_cnt::FLOAT / ps.order_cnt, 4) ELSE 0 END as 支付转化率,
                CASE WHEN ps.pay_cnt > 0 THEN ROUND(ps.booking_cnt::FLOAT / ps.pay_cnt, 4) ELSE 0 END as 预约转化率,
                CASE WHEN ps.booking_cnt > 0 THEN ROUND(ps.verify_cnt::FLOAT / ps.booking_cnt, 4) ELSE 0 END as 核销转化率,
                CASE WHEN ps.browse_cnt > 0 THEN ROUND(ps.pay_cnt::FLOAT / ps.browse_cnt, 4) ELSE 0 END as 整体转化率,
                CASE WHEN ps.browse_cnt > 0 THEN ROUND(ps.verify_cnt::FLOAT / ps.browse_cnt, 4) ELSE 0 END as 端到端转化率
            FROM pivot_stages ps
            LEFT JOIN packages p ON ps.package_id = p.package_id
            ORDER BY 整体转化率 DESC
        """
        return self.conn.execute(funnel_sql, params).pl()

    def detect_oversold_packages(self) -> pl.DataFrame:
        sql = """
            SELECT 
                p.package_id,
                p.package_name,
                p.original_stock,
                p.current_stock,
                COUNT(DISTINCT pr.order_id) as paid_orders,
                (p.original_stock - COUNT(DISTINCT pr.order_id)) as stock_gap,
                CASE WHEN COUNT(DISTINCT pr.order_id) > p.original_stock THEN TRUE ELSE FALSE END as is_oversold
            FROM packages p
            LEFT JOIN payment_records pr ON p.package_id = pr.package_id AND pr.status = '成功'
            GROUP BY p.package_id, p.package_name, p.original_stock, p.current_stock
            HAVING is_oversold = TRUE OR stock_gap < 0
            ORDER BY stock_gap ASC
        """
        return self.conn.execute(sql).pl()

    def get_cs_message_consistency_check(self) -> pl.DataFrame:
        sql = """
            WITH cs_promises AS (
                SELECT 
                    order_id,
                    package_id,
                    LIST(DISTINCT promised_refund_policy) as refund_policies,
                    LIST(DISTINCT CAST(promised_delivery_time AS VARCHAR)) as delivery_times,
                    COUNT(*) as message_count,
                    MAX(message_time) as last_message
                FROM customer_service_messages
                WHERE sender_type = '客服'
                GROUP BY order_id, package_id
            ),
            order_actual AS (
                SELECT 
                    pr.order_id,
                    pr.package_id,
                    dlr.checkin_time as actual_checkin,
                    CASE WHEN dr.status = '已退款' THEN dr.refund_amount ELSE 0 END as actual_refund
                FROM payment_records pr
                LEFT JOIN door_lock_records dlr ON pr.order_id = dlr.order_id
                LEFT JOIN deposit_records dr ON pr.order_id = dr.order_id
            )
            SELECT 
                cp.order_id,
                cp.package_id,
                cp.refund_policies,
                cp.delivery_times,
                cp.message_count,
                oa.actual_checkin,
                oa.actual_refund,
                CASE 
                    WHEN ARRAY_SIZE(cp.refund_policies) > 1 THEN '退款政策口径不一致'
                    WHEN ARRAY_SIZE(cp.delivery_times) > 1 THEN '入住时间口径不一致'
                    WHEN oa.actual_checkin IS NOT NULL AND ARRAY_SIZE(cp.delivery_times) > 0 
                         AND cp.delivery_times[1] IS NOT NULL 
                         AND CAST(oa.actual_checkin AS VARCHAR) != cp.delivery_times[1] 
                         THEN '承诺入住时间与实际不符'
                    ELSE '一致'
                END as consistency_status,
                cp.last_message
            FROM cs_promises cp
            LEFT JOIN order_actual oa ON cp.order_id = oa.order_id
            ORDER BY consistency_status != '一致' DESC, cp.last_message DESC
        """
        return self.conn.execute(sql).pl()

    def get_verification_overview(self, date_range: tuple = None) -> pl.DataFrame:
        sql = """
            SELECT 
                vr.package_id,
                p.package_name,
                vr.verification_type,
                COUNT(*) as verify_count,
                ROUND(SUM(p.price), 2) as total_amount,
                DATE_TRUNC('day', vr.verification_time) as verify_date
            FROM verification_records vr
            LEFT JOIN packages p ON vr.package_id = p.package_id
        """
        conditions = []
        params = []

        if date_range:
            conditions.append("vr.verification_time BETWEEN ? AND ?")
            params.extend([date_range[0], date_range[1]])

        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " GROUP BY vr.package_id, p.package_name, vr.verification_type, DATE_TRUNC('day', vr.verification_time)"
        sql += " ORDER BY verify_count DESC"
        return self.conn.execute(sql, params).pl()

    def get_deposit_inventory_linkage(self, package_id: str = None) -> pl.DataFrame:
        sql = """
            SELECT 
                p.package_id,
                p.package_name,
                p.original_stock,
                p.current_stock,
                COUNT(CASE WHEN dr.status = '已支付' THEN 1 END) as paid_deposit_count,
                COUNT(CASE WHEN dr.status = '已退款' THEN 1 END) as refunded_deposit_count,
                ROUND(SUM(CASE WHEN dr.status = '已支付' THEN dr.deposit_amount ELSE 0 END), 2) as total_deposit_paid,
                ROUND(SUM(CASE WHEN dr.status = '已退款' THEN dr.refund_amount ELSE 0 END), 2) as total_deposit_refunded,
                ROUND(p.current_stock::FLOAT / NULLIF(p.original_stock, 0), 4) as stock_remaining_rate
            FROM packages p
            LEFT JOIN deposit_records dr ON p.package_id = dr.package_id
        """
        params = []
        if package_id:
            sql += " WHERE p.package_id = ?"
            params.append(package_id)

        sql += " GROUP BY p.package_id, p.package_name, p.original_stock, p.current_stock"
        sql += " ORDER BY stock_remaining_rate ASC"
        return self.conn.execute(sql, params).pl()

    def get_channel_abnormal_analysis(self) -> pl.DataFrame:
        sql = """
            SELECT 
                co.channel_name,
                co.package_id,
                p.package_name,
                COUNT(*) as total_orders,
                COUNT(CASE WHEN co.is_abnormal = TRUE THEN 1 END) as abnormal_count,
                ROUND(COUNT(CASE WHEN co.is_abnormal = TRUE THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0), 4) as abnormal_rate,
                ROUND(AVG(co.order_amount), 2) as avg_order_amount,
                LIST(CASE WHEN co.is_abnormal = TRUE THEN co.abnormal_reason END) as abnormal_reasons
            FROM channel_orders co
            LEFT JOIN packages p ON co.package_id = p.package_id
            GROUP BY co.channel_name, co.package_id, p.package_name
            HAVING abnormal_count > 0
            ORDER BY abnormal_rate DESC
        """
        return self.conn.execute(sql).pl()

    def get_conversion_trend(self, package_id: str = None, days: int = 30) -> pl.DataFrame:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        sql = """
            WITH daily_funnel AS (
                SELECT 
                    DATE_TRUNC('day', stage_time) as stat_date,
                    package_id,
                    COUNT(DISTINCT CASE WHEN stage = '浏览商品' THEN user_id END) as daily_browse,
                    COUNT(DISTINCT CASE WHEN stage = '完成支付' THEN user_id END) as daily_pay,
                    COUNT(DISTINCT CASE WHEN stage = '完成核销' THEN user_id END) as daily_verify
                FROM funnel_records
                WHERE stage_time BETWEEN ? AND ? AND is_deleted = FALSE
        """
        params = [start_date, end_date]
        if package_id:
            sql += " AND package_id = ?"
            params.append(package_id)

        sql += """
                GROUP BY DATE_TRUNC('day', stage_time), package_id
            ),
            all_dates AS (
                SELECT CAST(generate_series AS DATE) as stat_date
                FROM generate_series(CAST(? AS DATE), CAST(? AS DATE), INTERVAL '1 day')
            )
            SELECT 
                ad.stat_date,
                df.package_id,
                p.package_name,
                COALESCE(df.daily_browse, 0) as daily_browse,
                COALESCE(df.daily_pay, 0) as daily_pay,
                COALESCE(df.daily_verify, 0) as daily_verify,
                CASE WHEN COALESCE(df.daily_browse, 0) > 0 
                     THEN ROUND(COALESCE(df.daily_pay, 0)::FLOAT / df.daily_browse, 4) 
                     ELSE 0 END as daily_conversion
            FROM all_dates ad
            LEFT JOIN daily_funnel df ON ad.stat_date = CAST(df.stat_date AS DATE)
            LEFT JOIN packages p ON df.package_id = p.package_id
            ORDER BY ad.stat_date ASC
        """
        params.extend([start_date, end_date])
        if package_id:
            params.append(package_id)
        return self.conn.execute(sql, params).pl()

    def check_conversion_threshold_and_create_task(self):
        conversion_df = self.get_conversion_rates()
        threshold = settings.CONVERSION_RATE_THRESHOLD
        
        tasks_created = []
        for row in conversion_df.iter_rows(named=True):
            overall_rate = float(row.get('整体转化率', 0))
            if overall_rate > threshold:
                package_id = row['package_id']
                task_id = str(uuid.uuid4())[:8]
                
                existing = self.conn.execute(
                    "SELECT COUNT(*) FROM remark_tasks WHERE package_id = ? AND task_type = '转化率超阈值' AND status = '待处理'",
                    [package_id]
                ).fetchone()[0]
                
                if existing == 0:
                    self.conn.execute("""
                        INSERT INTO remark_tasks (task_id, package_id, task_type, trigger_value, threshold, chart_anchor)
                        VALUES (?, ?, '转化率超阈值', ?, ?, 'conversion_chart')
                    """, [task_id, package_id, overall_rate, threshold])
                    tasks_created.append({
                        'task_id': task_id,
                        'package_id': package_id,
                        'package_name': row['package_name'],
                        'conversion_rate': overall_rate
                    })
        
        return tasks_created

    def update_remark_task(self, task_id: str, conclusion: str, handler: str = None):
        self.conn.execute("""
            UPDATE remark_tasks 
            SET status = '已处理', conclusion = ?, handler = ?, resolved_time = CURRENT_TIMESTAMP
            WHERE task_id = ?
        """, [conclusion, handler, task_id])
        return True

    def get_pending_remark_tasks(self) -> pl.DataFrame:
        return self.conn.execute("""
            SELECT 
                rt.*,
                p.package_name
            FROM remark_tasks rt
            LEFT JOIN packages p ON rt.package_id = p.package_id
            ORDER BY rt.trigger_time DESC
        """).pl()

analytics = AnalyticsEngine()
