from typing import Optional, Dict, List
from datetime import datetime, timedelta
import polars as pl
from src.storage.duckdb_client import DuckDBClient

class RefundAnalyzer:
    def __init__(self, db_client: DuckDBClient):
        self.db = db_client

    def get_refund_statistics(self, days: int = 90, region: Optional[str] = None,
                               selected_regions: Optional[list] = None,
                               start_date: Optional[datetime] = None,
                               end_date: Optional[datetime] = None) -> Dict[str, any]:
        conditions = []
        if start_date and end_date:
            conditions.append(f"refund_time >= '{start_date}'")
            conditions.append(f"refund_time <= '{end_date}'")
        else:
            conditions.append(f"refund_time >= CURRENT_DATE - INTERVAL '{days} days'")
        if region:
            conditions.append(f"region = '{region}'")
        if selected_regions and len(selected_regions) > 0:
            regions_str = ",".join([f"'{r}'" for r in selected_regions])
            conditions.append(f"region IN ({regions_str})")
        where_clause = " AND ".join(conditions)
        
        query = f"""
            SELECT 
                refund_reason,
                explanation,
                COUNT(*) as refund_count,
                SUM(refund_amount) as total_refund_amount,
                AVG(refund_amount) as avg_refund_amount,
                region
            FROM refund_records
            WHERE {where_clause}
            GROUP BY refund_reason, explanation, region
            ORDER BY refund_count DESC
        """
        reason_df = self.db.query_to_polars(query)
        
        summary_query = f"""
            SELECT 
                COUNT(*) as total_refunds,
                SUM(refund_amount) as total_amount,
                AVG(refund_amount) as avg_amount,
                COUNT(DISTINCT student_id) as affected_students
            FROM refund_records
            WHERE {where_clause}
        """
        summary_df = self.db.query_to_polars(summary_query)
        
        return {
            "by_reason": reason_df,
            "summary": summary_df
        }

    def get_refund_reason_distribution(self, days: int = 90,
                                        selected_regions: Optional[list] = None,
                                        start_date: Optional[datetime] = None,
                                        end_date: Optional[datetime] = None) -> pl.DataFrame:
        conditions = []
        if start_date and end_date:
            conditions.append(f"refund_time >= '{start_date}'")
            conditions.append(f"refund_time <= '{end_date}'")
        else:
            conditions.append(f"refund_time >= CURRENT_DATE - INTERVAL '{days} days'")
        if selected_regions and len(selected_regions) > 0:
            regions_str = ",".join([f"'{r}'" for r in selected_regions])
            conditions.append(f"region IN ({regions_str})")
        where_clause = " AND ".join(conditions)
        
        date_filter = f"refund_time >= CURRENT_DATE - INTERVAL '{days} days'"
        if start_date and end_date:
            date_filter = f"refund_time >= '{start_date}' AND refund_time <= '{end_date}'"
        
        query = f"""
            SELECT 
                refund_reason,
                COUNT(*) as count,
                SUM(refund_amount) as total_amount,
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM refund_records WHERE {date_filter}) as percentage
            FROM refund_records
            WHERE {where_clause}
            GROUP BY refund_reason
            ORDER BY count DESC
        """
        return self.db.query_to_polars(query)

    def get_refund_trend(self, days: int = 90,
                         selected_regions: Optional[list] = None,
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None) -> pl.DataFrame:
        conditions = []
        if start_date and end_date:
            conditions.append(f"refund_time >= '{start_date}'")
            conditions.append(f"refund_time <= '{end_date}'")
        else:
            conditions.append(f"refund_time >= CURRENT_DATE - INTERVAL '{days} days'")
        if selected_regions and len(selected_regions) > 0:
            regions_str = ",".join([f"'{r}'" for r in selected_regions])
            conditions.append(f"region IN ({regions_str})")
        where_clause = " AND ".join(conditions)
        
        query = f"""
            SELECT 
                DATE_TRUNC('week', refund_time) as refund_week,
                region,
                COUNT(*) as refund_count,
                SUM(refund_amount) as refund_amount,
                COUNT(DISTINCT student_id) as affected_students
            FROM refund_records
            WHERE {where_clause}
            GROUP BY refund_week, region
            ORDER BY refund_week, region
        """
        return self.db.query_to_polars(query)

    def get_redemption_details(self, redemption_id: Optional[str] = None, 
                                student_id: Optional[str] = None,
                                days: int = 90,
                                selected_regions: Optional[list] = None,
                                start_date: Optional[datetime] = None,
                                end_date: Optional[datetime] = None) -> pl.DataFrame:
        conditions = []
        if start_date and end_date:
            conditions.append(f"redemption_time >= '{start_date}'")
            conditions.append(f"redemption_time <= '{end_date}'")
        else:
            conditions.append(f"redemption_time >= CURRENT_DATE - INTERVAL '{days} days'")
        if redemption_id:
            conditions.append(f"redemption_id = '{redemption_id}'")
        if student_id:
            conditions.append(f"student_id = '{student_id}'")
        if selected_regions and len(selected_regions) > 0:
            regions_str = ",".join([f"'{r}'" for r in selected_regions])
            conditions.append(f"region IN ({regions_str})")
        where_clause = " AND ".join(conditions)
        
        query = f"""
            SELECT 
                redemption_id,
                student_id,
                student_name,
                course_id,
                course_name,
                redemption_time,
                points_used,
                status,
                region,
                detail_link,
                CASE 
                    WHEN detail_link IS NOT NULL AND detail_link != ''
                    THEN TRUE ELSE FALSE 
                END as has_detail_link
            FROM redemption_records
            WHERE {where_clause}
            ORDER BY redemption_time DESC
        """
        return self.db.query_to_polars(query)

    def get_explanation_caliber(self) -> Dict[str, List[str]]:
        return {
            "课程质量问题": [
                "课程内容与描述不符",
                "讲师水平不达标",
                "课程更新不及时",
                "技术支持不足"
            ],
            "个人原因": [
                "时间安排冲突",
                "学习进度跟不上",
                "个人经济原因",
                "失去学习兴趣"
            ],
            "服务问题": [
                "客服响应不及时",
                "服务态度不好",
                "承诺服务未兑现",
                "售后流程复杂"
            ],
            "其他原因": [
                "误操作购买",
                "找到更合适的课程",
                "系统故障",
                "其他"
            ]
        }

    def get_refund_explanation_mapping(self) -> Dict[str, str]:
        return {
            "课程内容与描述不符": "课程质量问题",
            "讲师水平不达标": "课程质量问题",
            "课程更新不及时": "课程质量问题",
            "技术支持不足": "课程质量问题",
            "时间安排冲突": "个人原因",
            "学习进度跟不上": "个人原因",
            "个人经济原因": "个人原因",
            "失去学习兴趣": "个人原因",
            "客服响应不及时": "服务问题",
            "服务态度不好": "服务问题",
            "承诺服务未兑现": "服务问题",
            "售后流程复杂": "服务问题",
            "误操作购买": "其他原因",
            "找到更合适的课程": "其他原因",
            "系统故障": "其他原因"
        }
