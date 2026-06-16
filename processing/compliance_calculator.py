import polars as pl
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
import uuid
import logging

from config import config, COMPLIANCE_RULES
from data import DuckDBClient, ComplianceTask

logger = logging.getLogger(__name__)


class ComplianceCalculator:
    def __init__(self, db_client: Optional[DuckDBClient] = None):
        self.db = db_client or DuckDBClient()
        self.threshold = config.thresholds.compliance_threshold

    def calculate_compliance_rate(self, df: pl.DataFrame) -> float:
        if len(df) == 0:
            return 0.0
        
        compliant_count = df.filter(pl.col("is_compliant") == True).height
        return round(compliant_count / len(df) * 100, 2)

    def calculate_weighted_compliance(self, 
                                       activities_df: pl.DataFrame,
                                       checkins_df: pl.DataFrame,
                                       health_df: Optional[pl.DataFrame] = None,
                                       risk_df: Optional[pl.DataFrame] = None) -> Dict[str, Any]:
        weights = COMPLIANCE_RULES["权重分配"]
        
        activity_participation_rate = self._calculate_activity_participation(activities_df)
        nursing_standard_rate = self._calculate_nursing_standard(activities_df, checkins_df)
        health_monitoring_rate = self._calculate_health_monitoring(health_df) if health_df is not None else 90.0
        risk_event_rate = self._calculate_risk_impact(risk_df) if risk_df is not None else 95.0
        
        weighted_score = (
            activity_participation_rate * weights["康复活动参与率"] +
            nursing_standard_rate * weights["护理操作规范率"] +
            health_monitoring_rate * weights["健康监测完成率"] +
            risk_event_rate * weights["风险事件发生率"]
        )
        
        return {
            "weighted_score": round(weighted_score, 2),
            "activity_participation_rate": round(activity_participation_rate, 2),
            "nursing_standard_rate": round(nursing_standard_rate, 2),
            "health_monitoring_rate": round(health_monitoring_rate, 2),
            "risk_event_rate": round(risk_event_rate, 2),
            "level": self._get_compliance_level(weighted_score)
        }

    def _calculate_activity_participation(self, activities_df: pl.DataFrame) -> float:
        if len(activities_df) == 0:
            return 0.0
        
        total = activities_df.height
        checked_in = activities_df.filter(pl.col("checkin_time").is_not_null()).height
        
        return checked_in / total * 100 if total > 0 else 0.0

    def _calculate_nursing_standard(self, activities_df: pl.DataFrame, 
                                     checkins_df: pl.DataFrame) -> float:
        if len(activities_df) == 0:
            return 0.0
        
        completed = activities_df.filter(pl.col("status") == "已完成").height
        total = activities_df.height
        
        on_time_rate = 0.0
        if len(checkins_df) > 0:
            on_time = checkins_df.filter(pl.col("is_late") == False).height
            on_time_rate = on_time / len(checkins_df) * 100 if len(checkins_df) > 0 else 0.0
        
        completion_rate = completed / total * 100 if total > 0 else 0.0
        
        return (completion_rate * 0.6 + on_time_rate * 0.4)

    def _calculate_health_monitoring(self, health_df: pl.DataFrame) -> float:
        if len(health_df) == 0:
            return 90.0
        
        completed = health_df.filter(pl.col("is_completed") == True).height
        return completed / len(health_df) * 100 if len(health_df) > 0 else 90.0

    def _calculate_risk_impact(self, risk_df: pl.DataFrame) -> float:
        if len(risk_df) == 0:
            return 95.0
        
        high_risk = risk_df.filter(
            (pl.col("risk_level") == "高风险") | (pl.col("risk_level") == "极高风险")
        ).height
        
        if high_risk > 0:
            return max(60.0, 95.0 - high_risk * 10)
        
        return 95.0

    def _get_compliance_level(self, score: float) -> str:
        if score >= 95:
            return "优秀"
        elif score >= 85:
            return "良好"
        elif score >= 70:
            return "合格"
        else:
            return "待改进"

    def check_elder_compliance_threshold(self, elder_id: str, 
                                          start_date: str, 
                                          end_date: str) -> Tuple[bool, float, str]:
        activities = self.db.get_activities(start_date, end_date).filter(
            pl.col("elder_id") == elder_id
        )
        
        if len(activities) == 0:
            return False, 0.0, "无活动数据"
        
        compliance_rate = self.calculate_compliance_rate(activities)
        is_below_threshold = compliance_rate < self.threshold
        
        return is_below_threshold, compliance_rate, self._get_compliance_level(compliance_rate)

    def generate_compliance_tasks(self, start_date: str, end_date: str) -> List[ComplianceTask]:
        activities = self.db.get_activities(start_date, end_date)
        
        if len(activities) == 0:
            return []
        
        elder_activities = activities.group_by(["elder_id", "elder_name"]).agg(
            pl.col("activity_id").count().alias("total_activities"),
            (pl.col("is_compliant").cast(pl.Int64).sum() * 100.0 / pl.col("activity_id").count()).alias("compliance_rate")
        )
        
        below_threshold = elder_activities.filter(
            (pl.col("compliance_rate") < self.threshold) &
            (pl.col("total_activities") >= 3)
        )
        
        tasks = []
        now = datetime.now()
        
        for row in below_threshold.iter_rows(named=True):
            task_id = str(uuid.uuid4())
            task = ComplianceTask(
                task_id=task_id,
                elder_id=row["elder_id"],
                elder_name=row["elder_name"],
                task_type="护理达标跟进",
                compliance_rate=round(row["compliance_rate"], 2),
                threshold=self.threshold,
                create_time=now,
                due_time=now + timedelta(days=3),
                status="pending",
                notes=f"老人{row['elder_name']}在{start_date}至{end_date}期间护理达标率为{row['compliance_rate']:.2f}%，低于阈值{self.threshold}%，请跟进处理。"
            )
            tasks.append(task)
        
        self._save_tasks(tasks)
        return tasks

    def _save_tasks(self, tasks: List[ComplianceTask]) -> None:
        if not tasks:
            return
        
        data = []
        for task in tasks:
            data.append({
                "task_id": task.task_id,
                "elder_id": task.elder_id,
                "elder_name": task.elder_name,
                "task_type": task.task_type,
                "compliance_rate": task.compliance_rate,
                "threshold": task.threshold,
                "create_time": task.create_time,
                "due_time": task.due_time,
                "handler": task.handler,
                "status": task.status,
                "notes": task.notes,
                "resolution": task.resolution,
                "resolve_time": task.resolve_time
            })
        
        df = pl.DataFrame(data)
        existing_tasks = self.db.get_compliance_tasks()
        
        if len(existing_tasks) > 0:
            existing_ids = set(existing_tasks["task_id"].to_list())
            new_tasks = df.filter(~pl.col("task_id").is_in(existing_ids))
            if len(new_tasks) > 0:
                self.db.insert_dataframe("compliance_tasks", new_tasks)
                logger.info(f"Generated {len(new_tasks)} new compliance tasks")
        else:
            self.db.insert_dataframe("compliance_tasks", df)
            logger.info(f"Generated {len(df)} new compliance tasks")

    def get_compliance_summary(self, start_date: str, end_date: str) -> Dict[str, Any]:
        activities = self.db.get_activities(start_date, end_date)
        
        if len(activities) == 0:
            return {
                "total_activities": 0,
                "compliant_count": 0,
                "compliance_rate": 0.0,
                "level": "无数据",
                "elder_count": 0,
                "below_threshold_count": 0
            }
        
        total = len(activities)
        compliant = activities.filter(pl.col("is_compliant") == True).height
        rate = compliant / total * 100 if total > 0 else 0.0
        
        elder_summary = activities.group_by("elder_id").agg(
            (pl.col("is_compliant").cast(pl.Int64).sum() * 100.0 / pl.col("activity_id").count()).alias("elder_rate")
        )
        
        elder_count = len(elder_summary)
        below_threshold = elder_summary.filter(pl.col("elder_rate") < self.threshold).height
        
        return {
            "total_activities": total,
            "compliant_count": compliant,
            "compliance_rate": round(rate, 2),
            "level": self._get_compliance_level(rate),
            "elder_count": elder_count,
            "below_threshold_count": below_threshold,
            "threshold": self.threshold
        }

    def close(self):
        self.db.close()
