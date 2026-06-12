import duckdb
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.services.duckdb_service import DuckDBService
from app.services.threshold_service import ThresholdService
from app.models import EquipmentRemark


class ReviewService:
    def __init__(self):
        self.duckdb_service = DuckDBService()

    def get_thresholds(self, db: Session) -> Dict[str, float]:
        configs = ThresholdService.get_all(db)
        return {cfg.config_key: cfg.config_value for cfg in configs}

    def get_offline_warning_days(self, db: Session) -> float:
        return ThresholdService.get_threshold_value(db, "offline_warning_days", 3)

    def get_inspection_pass_rate_threshold(self, db: Session) -> float:
        return ThresholdService.get_threshold_value(db, "inspection_pass_rate", 90)

    def get_cleaning_cycle_days(self, db: Session) -> float:
        return ThresholdService.get_threshold_value(db, "cleaning_cycle_days", 7)

    def get_offline_equipments(self, db: Session) -> List[Dict[str, Any]]:
        warning_days = self.get_offline_warning_days(db)
        default_cycle = self.get_cleaning_cycle_days(db)

        query = """
            SELECT
                e.id,
                e.equipment_code,
                e.equipment_name,
                e.equipment_type,
                e.store_id,
                s.store_code,
                s.store_name,
                s.city,
                s.district,
                e.status,
                e.last_cleaning_date,
                e.next_cleaning_date,
                COALESCE(e.cleaning_cycle_days, ?) as cleaning_cycle_days,
                DATEDIFF('day', e.last_cleaning_date, CURRENT_DATE) as days_since_clean,
                CASE
                    WHEN e.last_cleaning_date IS NULL THEN 999
                    ELSE DATEDIFF('day', e.last_cleaning_date, CURRENT_DATE)
                END as days_since_clean_safe
            FROM equipments e
            LEFT JOIN stores s ON e.store_id = s.id
            WHERE e.status = 'offline'
               OR e.last_cleaning_date IS NULL
               OR (e.last_cleaning_date IS NOT NULL
                   AND DATEDIFF('day', e.last_cleaning_date, CURRENT_DATE) >
                       COALESCE(e.cleaning_cycle_days, ?) + ?)
            ORDER BY days_since_clean_safe DESC
        """
        result = self.duckdb_service.con.execute(
            query, [default_cycle, default_cycle, warning_days]
        ).fetchall()

        equipments = []
        for row in result:
            eq = {
                "id": row[0],
                "equipment_code": row[1],
                "equipment_name": row[2],
                "equipment_type": row[3],
                "store_id": row[4],
                "store_code": row[5],
                "store_name": row[6],
                "city": row[7],
                "district": row[8],
                "status": row[9],
                "last_cleaning_date": row[10],
                "next_cleaning_date": row[11],
                "cleaning_cycle_days": row[12],
                "days_since_clean": int(row[13]) if row[13] else 999,
            }
            eq["is_warning"] = (
                eq["days_since_clean"] > (eq["cleaning_cycle_days"] or default_cycle) + warning_days
                or eq["status"] == "offline"
            )
            equipments.append(eq)
        return equipments

    def generate_review_material(
        self,
        db: Session,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        thresholds = self.get_thresholds(db)
        pass_rate_threshold = self.get_inspection_pass_rate_threshold(db)
        warning_days = self.get_offline_warning_days(db)

        pass_rate_data = self.duckdb_service.get_inspection_pass_rate(start_date, end_date)
        funnel_data = self.duckdb_service.get_cleaning_funnel_data(start_date, end_date)
        status_dist = self.duckdb_service.get_equipment_status_distribution()
        offline_equipments = self.get_offline_equipments(db)

        where_clause = ""
        params: List[Any] = []
        if start_date:
            where_clause += " AND inspection_date >= ?"
            params.append(start_date)
        if end_date:
            where_clause += " AND inspection_date <= ?"
            params.append(end_date)

        failed_query = f"""
            SELECT
                ir.id,
                ir.record_code,
                ir.equipment_id,
                e.equipment_code,
                e.equipment_name,
                ir.store_id,
                s.store_code,
                s.store_name,
                s.city,
                ir.inspection_date,
                ir.inspector,
                ir.inspection_type,
                ir.score,
                ir.issues_found,
                ir.improvement_suggestions
            FROM inspection_records ir
            LEFT JOIN equipments e ON ir.equipment_id = e.id
            LEFT JOIN stores s ON ir.store_id = s.id
            WHERE ir.passed = FALSE {where_clause}
            ORDER BY ir.inspection_date DESC
        """
        failed_inspections_result = self.duckdb_service.con.execute(
            failed_query, params
        ).fetchall()

        failed_inspections = []
        for row in failed_inspections_result:
            failed_inspections.append({
                "id": row[0],
                "record_code": row[1],
                "equipment_id": row[2],
                "equipment_code": row[3],
                "equipment_name": row[4],
                "store_id": row[5],
                "store_code": row[6],
                "store_name": row[7],
                "city": row[8],
                "inspection_date": row[9],
                "inspector": row[10],
                "inspection_type": row[11],
                "score": float(row[12]) if row[12] else 0,
                "issues_found": row[13],
                "improvement_suggestions": row[14],
            })

        store_query = f"""
            SELECT
                s.id,
                s.store_code,
                s.store_name,
                s.city,
                COUNT(DISTINCT ir.id) as inspection_total,
                SUM(CASE WHEN ir.passed = TRUE THEN 1 ELSE 0 END) as inspection_passed,
                COALESCE(SUM(CASE WHEN ir.passed = TRUE THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(DISTINCT ir.id), 0), 0) as pass_rate
            FROM stores s
            LEFT JOIN equipments e ON s.id = e.store_id
            LEFT JOIN inspection_records ir ON e.id = ir.equipment_id
            WHERE 1=1 {where_clause.replace('inspection_date', 'ir.inspection_date') or ''}
            GROUP BY s.id, s.store_code, s.store_name, s.city
            HAVING COUNT(DISTINCT ir.id) > 0
            ORDER BY pass_rate ASC
        """
        store_stats_result = self.duckdb_service.con.execute(
            store_query, params
        ).fetchall()

        problematic_stores = []
        for row in store_stats_result:
            pass_rate = float(row[6]) if row[6] else 0
            if pass_rate < pass_rate_threshold:
                problematic_stores.append({
                    "store_id": row[0],
                    "store_code": row[1],
                    "store_name": row[2],
                    "city": row[3],
                    "inspection_total": int(row[4]),
                    "inspection_passed": int(row[5] or 0),
                    "pass_rate": round(pass_rate, 2),
                    "below_threshold": True,
                })

        overall_pass_rate = pass_rate_data.get("pass_rate", 0)
        review_summary = self._build_summary(
            pass_rate_data=pass_rate_data,
            pass_rate_threshold=pass_rate_threshold,
            funnel_data=funnel_data,
            offline_count=len(offline_equipments),
            failed_count=len(failed_inspections),
            problematic_store_count=len(problematic_stores),
            warning_days=warning_days,
        )

        equipment_ids_with_remarks = {eq["id"] for eq in offline_equipments}
        remarks_map: Dict[int, List[Dict[str, Any]]] = {}
        if equipment_ids_with_remarks:
            remarks = (
                db.query(EquipmentRemark)
                .filter(EquipmentRemark.equipment_id.in_(equipment_ids_with_remarks))
                .order_by(EquipmentRemark.created_at.desc())
                .all()
            )
            for r in remarks:
                eq_id = r.equipment_id
                if eq_id not in remarks_map:
                    remarks_map[eq_id] = []
                remarks_map[eq_id].append({
                    "id": r.id,
                    "remark_type": r.remark_type,
                    "content": r.content,
                    "operator": r.operator,
                    "related_date": r.related_date.isoformat() if r.related_date else None,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })

        for eq in offline_equipments:
            eq["remarks"] = remarks_map.get(eq["id"], [])

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "thresholds_used": thresholds,
            "summary": review_summary,
            "overall_metrics": pass_rate_data,
            "funnel": funnel_data,
            "equipment_status_distribution": status_dist,
            "offline_equipments": offline_equipments,
            "failed_inspections": failed_inspections,
            "problematic_stores": problematic_stores,
            "review_conclusion": self._build_conclusion(
                overall_pass_rate=overall_pass_rate,
                pass_rate_threshold=pass_rate_threshold,
                offline_count=len(offline_equipments),
                failed_count=len(failed_inspections),
            ),
        }

    def _build_summary(
        self,
        pass_rate_data: Dict[str, Any],
        pass_rate_threshold: float,
        funnel_data: List[Dict[str, Any]],
        offline_count: int,
        failed_count: int,
        problematic_store_count: int,
        warning_days: float,
    ) -> List[str]:
        bullets: List[str] = []
        overall = pass_rate_data.get("pass_rate", 0)

        if overall >= pass_rate_threshold:
            bullets.append(
                f"本期巡检合格率为 {overall}%，高于阈值 {pass_rate_threshold}%，整体清洁执行情况良好。"
            )
        else:
            bullets.append(
                f"本期巡检合格率为 {overall}%，低于阈值 {pass_rate_threshold}%，需要重点关注。"
            )

        total_inspections = pass_rate_data.get("total", 0)
        passed = pass_rate_data.get("passed", 0)
        failed = pass_rate_data.get("failed", 0)
        avg_score = pass_rate_data.get("avg_score", 0)
        bullets.append(
            f"共完成巡检 {total_inspections} 次，其中合格 {passed} 次，不合格 {failed} 次，平均得分 {avg_score} 分。"
        )

        if funnel_data:
            total_equip = next((f["count"] for f in funnel_data if f["stage"] == "总设备数"), 0)
            inspected_ok = next((f["count"] for f in funnel_data if f["stage"] == "巡检合格"), 0)
            if total_equip > 0:
                conversion = round(inspected_ok / total_equip * 100, 2)
                bullets.append(
                    f"清洁复查漏斗转化率：从总设备 {total_equip} 台到巡检合格 {inspected_ok} 台，转化率 {conversion}%。"
                )

        bullets.append(
            f"离线/超期未清洁设备 {offline_count} 台（预警阈值：超清洁周期 {warning_days} 天即命中预警）。"
        )

        if failed_count > 0:
            bullets.append(f"发现不合格巡检记录 {failed_count} 条，已在下方列出明细供复盘使用。")

        if problematic_store_count > 0:
            bullets.append(f"合格率低于阈值的门店共 {problematic_store_count} 家，需要重点跟进。")

        return bullets

    def _build_conclusion(
        self,
        overall_pass_rate: float,
        pass_rate_threshold: float,
        offline_count: int,
        failed_count: int,
    ) -> str:
        if overall_pass_rate >= pass_rate_threshold and offline_count == 0 and failed_count == 0:
            return "本期设备清洁执行情况良好，各项指标均达标，可按当前节奏继续推进。"

        reasons = []
        if overall_pass_rate < pass_rate_threshold:
            reasons.append(
                f"巡检合格率 {overall_pass_rate}% 未达 {pass_rate_threshold}% 阈值"
            )
        if offline_count > 0:
            reasons.append(f"存在 {offline_count} 台离线/超期未清洁设备")
        if failed_count > 0:
            reasons.append(f"存在 {failed_count} 条不合格巡检记录")

        return "本期需重点关注：" + "；".join(reasons) + "。建议针对性加强培训和巡检频次。"
