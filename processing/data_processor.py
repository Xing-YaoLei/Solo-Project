import polars as pl
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
import logging

from config import config
from data import DuckDBClient, AnomalyType, FunnelStage

logger = logging.getLogger(__name__)


class DataProcessor:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()

    def detect_terminal_delay(self, threshold_hours: Optional[int] = None) -> pl.DataFrame:
        threshold = threshold_hours or config.thresholds.terminal_delay_threshold_hours
        
        query = f"""
            SELECT 
                checkin_id,
                activity_id,
                elder_id,
                elder_name,
                checkin_time,
                terminal_id,
                delay_minutes,
                data_source
            FROM activity_checkins
            WHERE delay_minutes > {threshold * 60}
              AND checkin_time >= NOW() - INTERVAL '{threshold * 2} hours'
            ORDER BY checkin_time DESC
        """
        
        result = self.db.execute_query(query)
        return result

    def detect_charging_missing(self) -> pl.DataFrame:
        query = """
            SELECT 
                a.activity_id,
                a.activity_name,
                a.elder_id,
                a.elder_name,
                a.plan_date,
                a.status,
                a.checkin_time
            FROM rehabilitation_activities a
            WHERE a.status = '已完成'
              AND a.checkin_time IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM activity_checkins c 
                  WHERE c.activity_id = a.activity_id 
                    AND c.data_source = '收费系统'
              )
              AND a.plan_date >= NOW() - INTERVAL '7 days'
            ORDER BY a.plan_date DESC
        """
        
        result = self.db.execute_query(query)
        return result

    def detect_device_caliber_change(self) -> pl.DataFrame:
        query = """
            WITH daily_stats AS (
                SELECT 
                    DATE(checkin_time) as check_date,
                    data_source,
                    COUNT(*) as checkin_count,
                    AVG(delay_minutes) as avg_delay
                FROM activity_checkins
                WHERE data_source = '健康设备'
                  AND checkin_time >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(checkin_time), data_source
            ),
            stats_with_prev AS (
                SELECT 
                    *,
                    LAG(checkin_count, 1) OVER (ORDER BY check_date) as prev_count,
                    LAG(avg_delay, 1) OVER (ORDER BY check_date) as prev_avg_delay
                FROM daily_stats
            )
            SELECT 
                check_date,
                checkin_count,
                prev_count,
                ROUND(
                    CASE WHEN prev_count > 0 
                         THEN (checkin_count - prev_count) * 100.0 / prev_count 
                         ELSE 0 
                    END, 2
                ) as count_change_pct,
                avg_delay,
                prev_avg_delay,
                ROUND(
                    CASE WHEN prev_avg_delay > 0 
                         THEN (avg_delay - prev_avg_delay) * 100.0 / prev_avg_delay 
                         ELSE 0 
                    END, 2
                ) as delay_change_pct
            FROM stats_with_prev
            WHERE ABS(
                CASE WHEN prev_count > 0 
                     THEN (checkin_count - prev_count) * 100.0 / prev_count 
                     ELSE 0 
                END
            ) > 30
               OR ABS(
                CASE WHEN prev_avg_delay > 0 
                     THEN (avg_delay - prev_avg_delay) * 100.0 / prev_avg_delay 
                     ELSE 0 
                END
            ) > 50
            ORDER BY check_date DESC
        """
        
        result = self.db.execute_query(query)
        return result

    def detect_fall_impact_periods(self, impact_days: Optional[int] = None) -> pl.DataFrame:
        days = impact_days or config.thresholds.fall_impact_days
        
        query = f"""
            SELECT 
                r.event_id,
                r.elder_id,
                r.elder_name,
                r.event_time as fall_time,
                r.risk_level,
                r.description,
                DATE(r.event_time) as fall_date,
                DATE(r.event_time) + INTERVAL '{days} days' as impact_end_date,
                {days} as impact_days,
                COUNT(a.activity_id) as affected_activities,
                SUM(CASE WHEN a.is_compliant THEN 0 ELSE 1 END) as non_compliant_count
            FROM risk_events r
            LEFT JOIN rehabilitation_activities a 
              ON a.elder_id = r.elder_id
              AND a.plan_date BETWEEN DATE(r.event_time) AND DATE(r.event_time) + INTERVAL '{days} days'
            WHERE r.event_type = '跌倒'
              AND r.is_impact_trend = true
              AND r.event_time >= NOW() - INTERVAL '90 days'
            GROUP BY r.event_id, r.elder_id, r.elder_name, r.event_time, 
                     r.risk_level, r.description
            ORDER BY r.event_time DESC
        """
        
        result = self.db.execute_query(query)
        return result

    def detect_all_anomalies(self) -> Dict[str, pl.DataFrame]:
        return {
            "terminal_delay": self.detect_terminal_delay(),
            "charging_missing": self.detect_charging_missing(),
            "device_caliber_change": self.detect_device_caliber_change(),
            "fall_impact": self.detect_fall_impact_periods()
        }

    def calculate_funnel_stages(self, start_date: str, end_date: str) -> List[FunnelStage]:
        raw_data = self.db.get_funnel_data(start_date, end_date)
        
        stage_order = ["活动计划", "活动通知", "老人签到", "活动完成", "护理达标"]
        ordered_data = []
        
        for stage in stage_order:
            stage_row = raw_data.filter(pl.col("stage") == stage)
            if len(stage_row) > 0:
                ordered_data.append((stage, stage_row["count"][0]))
            else:
                ordered_data.append((stage, 0))
        
        total_count = ordered_data[0][1] if ordered_data else 0
        stages = []
        prev_count = total_count
        
        for i, (stage_name, count) in enumerate(ordered_data):
            rate = (count / total_count * 100) if total_count > 0 else 0
            cumulative_rate = rate
            stages.append(FunnelStage(
                stage_name=stage_name,
                count=count,
                rate=rate,
                cumulative_rate=cumulative_rate,
                notes=self._get_stage_notes(stage_name, count, prev_count)
            ))
            prev_count = count
        
        return stages

    def _get_stage_notes(self, stage_name: str, current_count: int, prev_count: int) -> str:
        if prev_count == 0:
            return ""
        
        drop_rate = ((prev_count - current_count) / prev_count * 100) if prev_count > 0 else 0
        
        notes_map = {
            "活动计划": "本期计划康复活动总数",
            "活动通知": f"已通知老人参与，流失率{drop_rate:.1f}%",
            "老人签到": f"实际签到参与，流失率{drop_rate:.1f}%",
            "活动完成": f"顺利完成活动，流失率{drop_rate:.1f}%",
            "护理达标": f"符合护理标准，达标率{(current_count / prev_count * 100) if prev_count > 0 else 0:.1f}%"
        }
        
        return notes_map.get(stage_name, "")

    def get_daily_trend(self, start_date: str, end_date: str) -> pl.DataFrame:
        query = f"""
            SELECT 
                plan_date,
                COUNT(*) as total_activities,
                SUM(CASE WHEN checkin_time IS NOT NULL THEN 1 ELSE 0 END) as checkin_count,
                SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) as compliant_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                         THEN SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
                         ELSE 0 
                    END, 2
                ) as compliance_rate
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY plan_date
            ORDER BY plan_date
        """
        
        return self.db.execute_query(query)

    def get_activity_type_summary(self, start_date: str, end_date: str) -> pl.DataFrame:
        query = f"""
            SELECT 
                activity_type,
                COUNT(*) as total_count,
                SUM(CASE WHEN checkin_time IS NOT NULL THEN 1 ELSE 0 END) as checkin_count,
                SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) as compliant_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                         THEN SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
                         ELSE 0 
                    END, 2
                ) as compliance_rate
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY activity_type
            ORDER BY total_count DESC
        """
        
        return self.db.execute_query(query)

    def get_elder_compliance_ranking(self, start_date: str, end_date: str, 
                                     limit: int = 20) -> pl.DataFrame:
        query = f"""
            SELECT 
                elder_id,
                elder_name,
                COUNT(*) as total_activities,
                SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) as compliant_count,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                         THEN SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
                         ELSE 0 
                    END, 2
                ) as compliance_rate
            FROM rehabilitation_activities
            WHERE plan_date BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY elder_id, elder_name
            HAVING COUNT(*) >= 5
            ORDER BY compliance_rate DESC
            LIMIT {limit}
        """
        
        return self.db.execute_query(query)

    def get_risk_event_summary(self, start_date: str, end_date: str) -> pl.DataFrame:
        query = f"""
            SELECT 
                event_type,
                risk_level,
                COUNT(*) as event_count,
                SUM(CASE WHEN follow_up_required THEN 1 ELSE 0 END) as followup_count
            FROM risk_events
            WHERE DATE(event_time) BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY event_type, risk_level
            ORDER BY event_count DESC
        """
        
        return self.db.execute_query(query)

    def close(self):
        self.db.close()
