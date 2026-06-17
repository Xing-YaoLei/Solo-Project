from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
import polars as pl
import json

from src.data import DuckDBStore
from src.config import CARE_LEVELS


class CareStandardService:
    def __init__(self, db: DuckDBStore):
        self.db = db
        self._ensure_initial_version()

    def _ensure_initial_version(self):
        existing = self.db.get_care_standard_versions(active_only=False)
        if existing.is_empty():
            default_minutes = {k: v.daily_care_minutes for k, v in CARE_LEVELS.items()}
            self.db.create_care_standard_version(
                version_code="V1.0_202401",
                version_name="养老护理达标标准V1.0",
                description="初始版本，根据护理等级设定基础护理时长要求",
                effective_date=date(2024, 1, 1),
                care_level_minutes=default_minutes,
                created_by="system_init"
            )

    def get_active_version(self) -> Optional[Dict]:
        return self.db.get_active_standard_version()

    def get_all_versions(self) -> List[Dict]:
        versions = self.db.get_care_standard_versions(active_only=False)
        if versions.is_empty():
            return []
        
        result = []
        for row in versions.iter_rows(named=True):
            if row.get("care_level_minutes"):
                row["care_level_minutes"] = json.loads(row["care_level_minutes"])
            result.append(row)
        return result

    def create_new_version(self,
                          version_code: str,
                          version_name: str,
                          description: str,
                          care_level_minutes: Dict[str, int],
                          effective_date: Optional[date] = None,
                          created_by: str = "admin") -> int:
        if effective_date is None:
            effective_date = date.today()
        
        for level_code, minutes in care_level_minutes.items():
            if level_code not in CARE_LEVELS:
                raise ValueError(f"无效的护理等级代码: {level_code}")
            if minutes < 0 or minutes > 480:
                raise ValueError(f"护理时长应在0-480分钟之间: {minutes}")
        
        return self.db.create_care_standard_version(
            version_code=version_code,
            version_name=version_name,
            description=description,
            effective_date=effective_date,
            care_level_minutes=care_level_minutes,
            created_by=created_by
        )

    def get_version_minutes(self, version_code: Optional[str] = None) -> Dict[str, int]:
        if version_code:
            versions = self.get_all_versions()
            for v in versions:
                if v["version_code"] == version_code:
                    return v.get("care_level_minutes", {})
        
        active = self.get_active_version()
        if active:
            return active.get("care_level_minutes", {})
        
        return {k: v.daily_care_minutes for k, v in CARE_LEVELS.items()}

    def compare_versions(self, version_code_1: str, version_code_2: str) -> Dict:
        versions = self.get_all_versions()
        v1 = next((v for v in versions if v["version_code"] == version_code_1), None)
        v2 = next((v for v in versions if v["version_code"] == version_code_2), None)
        
        if not v1 or not v2:
            return {"error": "版本不存在"}
        
        minutes1 = v1.get("care_level_minutes", {})
        minutes2 = v2.get("care_level_minutes", {})
        
        comparison = {}
        for level_code in CARE_LEVELS.keys():
            m1 = minutes1.get(level_code, 0)
            m2 = minutes2.get(level_code, 0)
            comparison[level_code] = {
                "level_name": CARE_LEVELS[level_code].name,
                "version_1_minutes": m1,
                "version_2_minutes": m2,
                "difference": m2 - m1,
                "change_percent": round((m2 - m1) / m1 * 100, 1) if m1 > 0 else None
            }
        
        return {
            "version_1": {
                "code": v1["version_code"],
                "name": v1["version_name"],
                "effective_date": v1["effective_date"]
            },
            "version_2": {
                "code": v2["version_code"],
                "name": v2["version_name"],
                "effective_date": v2["effective_date"]
            },
            "comparison": comparison
        }

    def recalculate_with_version(self, 
                                elder_id: str,
                                activity_date: date,
                                target_version_code: str) -> Dict:
        minutes = self.get_version_minutes(target_version_code)
        active_version = self.get_active_version()
        active_minutes = self.get_version_minutes()
        
        daily = self.db.get_daily_summary(
            elder_id=elder_id,
            start_date=activity_date,
            end_date=activity_date
        )
        
        if daily.is_empty():
            return {"error": "当日无护理记录"}
        
        row = daily.row(0, named=True)
        elder = self.db.get_elder_profiles(elder_id=elder_id)
        if elder.is_empty():
            return {"error": "老人信息不存在"}
        
        care_level = elder.row(0, named=True).get("care_level", "level_1")
        target_standard = minutes.get(care_level, 30)
        active_standard = active_minutes.get(care_level, 30)
        actual_minutes = row["total_care_minutes"]
        
        target_compliant = actual_minutes >= target_standard
        target_rate = round(actual_minutes / target_standard * 100, 1)
        active_compliant = actual_minutes >= active_standard
        active_rate = round(actual_minutes / active_standard * 100, 1)
        
        return {
            "elder_id": elder_id,
            "activity_date": activity_date,
            "care_level": care_level,
            "care_level_name": CARE_LEVELS[care_level].name,
            "actual_care_minutes": actual_minutes,
            "active_version": {
                "code": active_version["version_code"] if active_version else "current",
                "standard_minutes": active_standard,
                "is_compliant": active_compliant,
                "completion_rate": active_rate
            },
            "target_version": {
                "code": target_version_code,
                "standard_minutes": target_standard,
                "is_compliant": target_compliant,
                "completion_rate": target_rate
            },
            "impact_analysis": {
                "compliant_status_change": active_compliant != target_compliant,
                "rate_difference": round(target_rate - active_rate, 1),
                "minutes_deficit_reduction": target_standard - active_standard
            }
        }

    def explain_compliance_change(self, 
                                 start_date: date, 
                                 end_date: date,
                                 before_version: str,
                                 after_version: str) -> Dict:
        comparison = self.compare_versions(before_version, after_version)
        if "error" in comparison:
            return comparison
        
        daily_summary = self.db.get_daily_summary(
            start_date=start_date,
            end_date=end_date
        )
        
        if daily_summary.is_empty():
            return {"error": "该时间段无数据"}
        
        elders = self.db.get_elder_profiles()
        elder_levels = {}
        if not elders.is_empty():
            elder_levels = dict(zip(
                elders["elder_id"].to_list(),
                elders["care_level"].to_list()
            ))
        
        before_minutes = self.get_version_minutes(before_version)
        after_minutes = self.get_version_minutes(after_version)
        
        total_before_compliant = 0
        total_after_compliant = 0
        total_records = 0
        level_impact = {}
        
        for row in daily_summary.iter_rows(named=True):
            elder_id = row["elder_id"]
            care_level = elder_levels.get(elder_id, "level_1")
            actual = row["total_care_minutes"]
            
            before_std = before_minutes.get(care_level, 30)
            after_std = after_minutes.get(care_level, 30)
            
            before_ok = actual >= before_std
            after_ok = actual >= after_std
            
            if before_ok:
                total_before_compliant += 1
            if after_ok:
                total_after_compliant += 1
            total_records += 1
            
            if care_level not in level_impact:
                level_impact[care_level] = {
                    "level_name": CARE_LEVELS[care_level].name,
                    "before_standard": before_std,
                    "after_standard": after_std,
                    "total_count": 0,
                    "before_compliant": 0,
                    "after_compliant": 0
                }
            
            level_impact[care_level]["total_count"] += 1
            if before_ok:
                level_impact[care_level]["before_compliant"] += 1
            if after_ok:
                level_impact[care_level]["after_compliant"] += 1
        
        before_rate = round(total_before_compliant / total_records * 100, 1) if total_records > 0 else 0
        after_rate = round(total_after_compliant / total_records * 100, 1) if total_records > 0 else 0
        
        for level in level_impact.values():
            level["before_rate"] = round(level["before_compliant"] / level["total_count"] * 100, 1) if level["total_count"] > 0 else 0
            level["after_rate"] = round(level["after_compliant"] / level["total_count"] * 100, 1) if level["total_count"] > 0 else 0
            level["rate_change"] = round(level["after_rate"] - level["before_rate"], 1)
        
        return {
            "period": f"{start_date} ~ {end_date}",
            "version_comparison": comparison,
            "overall_impact": {
                "total_daily_records": total_records,
                "before_compliant_count": total_before_compliant,
                "after_compliant_count": total_after_compliant,
                "before_compliance_rate": before_rate,
                "after_compliance_rate": after_rate,
                "absolute_change": round(after_rate - before_rate, 1)
            },
            "level_breakdown": level_impact,
            "explanation": self._generate_explanation(comparison, before_rate, after_rate, level_impact)
        }

    def _generate_explanation(self, comparison: Dict, before_rate: float, after_rate: float, level_impact: Dict) -> List[str]:
        explanations = []
        
        diff = after_rate - before_rate
        
        if abs(diff) < 1:
            explanations.append(f"口径版本变更对整体达标率影响较小（变化{diff:+.1f}个百分点），各护理等级标准调整方向不同，整体相互抵消。")
        elif diff > 0:
            explanations.append(f"口径版本变更后，整体达标率提升{diff:+.1f}个百分点（从{before_rate}%→{after_rate}%），主要原因是部分护理等级的每日标准时长有所下调。")
        else:
            explanations.append(f"口径版本变更后，整体达标率下降{diff:+.1f}个百分点（从{before_rate}%→{after_rate}%），主要原因是护理标准更加严格，部分等级的每日要求时长有所提升。")
        
        for level_code, impact in level_impact.items():
            if impact["rate_change"] != 0:
                level_name = impact["level_name"]
                before_std = impact["before_standard"]
                after_std = impact["after_standard"]
                std_change = after_std - before_std
                rate_change = impact["rate_change"]
                
                if std_change < 0:
                    explanations.append(f"- {level_name}级：标准从{before_std}分钟下调至{after_std}分钟（{std_change:+d}），达标率从{impact['before_rate']}%→{impact['after_rate']}%（{rate_change:+.1f}pp）")
                elif std_change > 0:
                    explanations.append(f"- {level_name}级：标准从{before_std}分钟上调至{after_std}分钟（{std_change:+d}），达标率从{impact['before_rate']}%→{impact['after_rate']}%（{rate_change:+.1f}pp）")
        
        return explanations
