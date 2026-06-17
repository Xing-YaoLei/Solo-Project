from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
import polars as pl

from src.data import DuckDBStore
from src.services.threshold_service import ThresholdService
from src.processing import DataMatcher


class FallReviewService:
    def __init__(self, db: DuckDBStore, threshold_service: ThresholdService):
        self.db = db
        self.threshold_service = threshold_service
        self.matcher = DataMatcher()

    def get_pending_fall_events(self, days: int = 7) -> pl.DataFrame:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        fall_events = self.db.get_fall_events(start_date=start_date, end_date=end_date)
        if fall_events.is_empty():
            return pl.DataFrame()
        
        reviewed = self.db.get_fall_reviews(status="completed")
        if not reviewed.is_empty():
            reviewed_ids = set(reviewed.select([
                pl.col("elder_id").cast(pl.Utf8),
                pl.col("fall_time").cast(pl.Utf8)
            ]).apply(lambda x: f"{x[0]}_{x[1]}").to_series().to_list())
            
            fall_events = fall_events.with_columns([
                pl.concat_str([
                    pl.col("elder_id").cast(pl.Utf8),
                    pl.col("record_time").cast(pl.Utf8)
                ], separator="_").alias("_review_key")
            ]).filter(~pl.col("_review_key").is_in(reviewed_ids)).drop("_review_key")
        
        return fall_events

    def get_fall_event_detail(self, elder_id: str, fall_time: datetime) -> Dict:
        fall_event = self.db.get_fall_events(elder_id=elder_id).filter(
            pl.col("record_time") == fall_time
        )
        
        if fall_event.is_empty():
            return {}
        
        elder_profile = self.db.get_elder_profiles(elder_id=elder_id)
        nursing_records = self.db.get_nursing_records(
            elder_id=elder_id,
            start_date=fall_time.date() - timedelta(days=1),
            end_date=fall_time.date() + timedelta(days=1)
        )
        
        fall_responses = nursing_records.filter(
            pl.col("activity_code") == "fall_response"
        ).filter(
            (pl.col("activity_start_time") >= fall_time - timedelta(minutes=15)) &
            (pl.col("activity_start_time") <= fall_time + timedelta(hours=2))
        )
        
        matched = self.matcher.match_fall_events_with_care(fall_event, nursing_records)
        
        health_before = self.db.get_health_data(
            elder_id=elder_id,
            start_date=fall_time.date() - timedelta(days=7),
            end_date=fall_time.date()
        )
        
        return {
            "fall_event": fall_event.to_dicts()[0] if not fall_event.is_empty() else None,
            "elder_profile": elder_profile.to_dicts()[0] if not elder_profile.is_empty() else None,
            "fall_responses": fall_responses.to_dicts(),
            "matched_care": matched.to_dicts(),
            "health_7d_before": health_before.to_dicts(),
            "recent_care_7d": nursing_records.to_dicts()
        }

    def analyze_fall_care_compliance(self, elder_id: str, fall_time: datetime) -> Dict:
        detail = self.get_fall_event_detail(elder_id, fall_time)
        if not detail or not detail["fall_responses"]:
            return {
                "has_response": False,
                "overall_compliant": False,
                "response_time": None,
                "response_time_compliant": False,
                "quality_score": None,
                "quality_compliant": False,
                "nursing_duration": None,
                "issues": ["跌倒事件发生后2小时内未记录护理响应"]
            }
        
        first_response = sorted(detail["fall_responses"], key=lambda x: x["activity_start_time"])[0]
        response_time = (first_response["activity_start_time"] - fall_time).total_seconds() / 60
        quality_score = first_response.get("quality_score", 0)
        nursing_duration = first_response.get("activity_duration", 0)
        
        validation = self.threshold_service.validate_fall_response(
            response_minutes=response_time,
            quality_score=quality_score
        )
        
        issues = []
        if not validation["response_time_compliant"]:
            issues.append(f"响应时间{response_time:.1f}分钟，超过阈值{validation['response_time_threshold']}分钟")
        if not validation["quality_compliant"]:
            issues.append(f"质量评分{quality_score}分，低于要求{validation['quality_threshold']}分")
        if nursing_duration < 30:
            issues.append(f"护理时长{nursing_duration}分钟，建议不少于30分钟")
        
        return {
            "has_response": True,
            "overall_compliant": validation["overall_compliant"] and nursing_duration >= 30,
            "response_time": round(response_time, 1),
            "response_time_compliant": validation["response_time_compliant"],
            "response_time_threshold": validation["response_time_threshold"],
            "quality_score": quality_score,
            "quality_compliant": validation["quality_compliant"],
            "quality_threshold": validation["quality_threshold"],
            "nursing_duration": nursing_duration,
            "nurse_id": first_response.get("nurse_id"),
            "issues": issues
        }

    def create_review_record(self, 
                            elder_id: str,
                            fall_time: datetime,
                            fall_location: str,
                            fall_severity: str,
                            review_notes: str,
                            reviewed_by: str) -> int:
        compliance = self.analyze_fall_care_compliance(elder_id, fall_time)
        
        review_data = {
            "elder_id": elder_id,
            "fall_time": fall_time,
            "fall_location": fall_location,
            "fall_severity": fall_severity,
            "response_time": compliance.get("response_time"),
            "nursing_duration": compliance.get("nursing_duration"),
            "nurse_id": compliance.get("nurse_id"),
            "quality_score": compliance.get("quality_score"),
            "is_care_compliant": compliance.get("overall_compliant", False),
            "review_notes": review_notes + "\n\n" + "\n".join([f"- {i}" for i in compliance.get("issues", [])]),
            "review_status": "completed"
        }
        
        return self.db.insert_fall_review(review_data)

    def get_review_summary(self, start_date: date, end_date: date) -> Dict:
        fall_events = self.db.get_fall_events(start_date=start_date, end_date=end_date)
        reviews = self.db.get_fall_reviews()
        
        if not reviews.is_empty():
            reviews = reviews.filter(
                (pl.col("fall_time").dt.date() >= start_date) &
                (pl.col("fall_time").dt.date() <= end_date)
            )
        
        total_falls = len(fall_events)
        total_reviews = len(reviews)
        pending_reviews = total_falls - total_reviews
        
        if total_reviews > 0:
            compliant = reviews.filter(pl.col("is_care_compliant") == True)
            compliance_rate = len(compliant) / total_reviews * 100
            avg_response = reviews["response_time"].mean()
            avg_quality = reviews["quality_score"].mean()
        else:
            compliance_rate = 0
            avg_response = None
            avg_quality = None
        
        severity_dist = {}
        if not reviews.is_empty():
            severity_dist = reviews["fall_severity"].value_counts().to_dict()
        
        return {
            "period": f"{start_date} ~ {end_date}",
            "total_fall_events": total_falls,
            "completed_reviews": total_reviews,
            "pending_reviews": pending_reviews,
            "review_completion_rate": round(total_reviews / total_falls * 100, 1) if total_falls > 0 else 0,
            "care_compliance_rate": round(compliance_rate, 1),
            "avg_response_time_minutes": round(avg_response, 1) if avg_response else None,
            "avg_quality_score": round(avg_quality, 1) if avg_quality else None,
            "severity_distribution": severity_dist
        }

    def generate_review_material(self, elder_id: str, fall_time: datetime) -> Dict:
        detail = self.get_fall_event_detail(elder_id, fall_time)
        compliance = self.analyze_fall_care_compliance(elder_id, fall_time)
        
        if not detail.get("elder_profile"):
            return {}
        
        elder = detail["elder_profile"]
        
        material = {
            "title": f"跌倒事件复盘报告 - {elder.get('name', elder_id)}",
            "fall_time": fall_time.strftime("%Y-%m-%d %H:%M:%S"),
            "elder_basic_info": {
                "name": elder.get("name"),
                "age": elder.get("age"),
                "gender": elder.get("gender"),
                "care_level": elder.get("care_level_name"),
                "room_number": elder.get("room_number"),
                "bed_number": elder.get("bed_number"),
                "chronic_diseases": elder.get("chronic_diseases", []),
            },
            "fall_event": detail.get("fall_event"),
            "care_response_analysis": compliance,
            "health_trend_7d": self._summarize_health_trend(detail.get("health_7d_before", [])),
            "care_history_7d": self._summarize_care_history(detail.get("recent_care_7d", [])),
            "action_items": self._generate_action_items(compliance, detail),
            "improvement_suggestions": self._generate_suggestions(compliance, detail)
        }
        
        return material

    def _summarize_health_trend(self, health_data: List[Dict]) -> Dict:
        if not health_data:
            return {"summary": "无健康数据"}
        
        df = pl.DataFrame(health_data)
        if df.is_empty():
            return {"summary": "无健康数据"}
        
        summary = {}
        metrics = ["heart_rate", "bp_systolic", "bp_diastolic", "blood_oxygen", "blood_glucose"]
        for metric in metrics:
            metric_data = df.filter(pl.col("metric_type") == metric)
            if not metric_data.is_empty():
                values = metric_data["metric_value"]
                summary[metric] = {
                    "avg": round(values.mean(), 1),
                    "min": round(values.min(), 1),
                    "max": round(values.max(), 1),
                    "count": len(values)
                }
        
        return summary

    def _summarize_care_history(self, care_data: List[Dict]) -> Dict:
        if not care_data:
            return {"summary": "无护理记录"}
        
        df = pl.DataFrame(care_data)
        if df.is_empty():
            return {"summary": "无护理记录"}
        
        category_summary = df.group_by("activity_category").agg([
            pl.count("activity_code").alias("count"),
            pl.sum("activity_duration").alias("total_minutes"),
            pl.mean("quality_score").alias("avg_quality")
        ]).to_dicts()
        
        return {
            "total_activities": len(df),
            "total_minutes": int(df["activity_duration"].sum()),
            "avg_quality": round(df["quality_score"].mean(), 1) if "quality_score" in df.columns else None,
            "category_breakdown": category_summary
        }

    def _generate_action_items(self, compliance: Dict, detail: Dict) -> List[str]:
        actions = []
        
        if not compliance.get("response_time_compliant", False):
            actions.append("优化跌倒报警响应流程，确保护理人员在规定时间内到达现场")
            actions.append("检查呼叫系统响应延迟问题")
        
        if not compliance.get("quality_compliant", False):
            actions.append("组织跌倒应急处理规范培训")
            actions.append("建立跌倒处理质量双人复核机制")
        
        if compliance.get("nursing_duration", 0) < 30:
            actions.append("明确跌倒后观察监测时长要求，建议不少于30分钟")
        
        elder = detail.get("elder_profile", {})
        if elder.get("care_level") in ["level_4", "level_5"]:
            actions.append("对高护理等级老人增加环境安全评估频次")
        
        if not actions:
            actions.append("本次跌倒处理符合规范，继续保持")
        
        return actions

    def _generate_suggestions(self, compliance: Dict, detail: Dict) -> List[str]:
        suggestions = [
            "在老人房间增设防滑垫和扶手",
            "夜间增加巡视频次，重点关注高风险老人",
            "定期检查老人鞋子和衣物是否合适",
            "组织老人进行防跌倒知识宣教"
        ]
        
        health = self._summarize_health_trend(detail.get("health_7d_before", []))
        if health.get("bp_systolic", {}).get("max", 0) > 140:
            suggestions.append("关注老人血压波动情况，必要时调整用药")
        
        if health.get("blood_oxygen", {}).get("min", 100) < 95:
            suggestions.append("监测老人睡眠时血氧情况，考虑夜间吸氧")
        
        return suggestions
