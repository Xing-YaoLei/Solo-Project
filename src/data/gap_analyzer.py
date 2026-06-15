import polars as pl
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from src.data.database import db
from config import setup_logger

logger = setup_logger()


class GapAnalyzer:
    GAP_TYPES = [
        {"code": "missing_isbn", "name": "缺少ISBN", "severity": "high"},
        {"code": "missing_price", "name": "缺少价格", "severity": "medium"},
        {"code": "missing_quantity", "name": "缺少数量", "severity": "high"},
        {"code": "missing_publisher", "name": "缺少出版社", "severity": "low"},
        {"code": "no_campus_card_record", "name": "无一卡通记录", "severity": "medium"},
        {"code": "no_student_application", "name": "无学生申请", "severity": "low"},
        {"code": "no_approval_record", "name": "无审批记录", "severity": "high"},
        {"code": "quantity_mismatch", "name": "数量不匹配", "severity": "medium"},
    ]

    def identify_gaps(self, term_id: str) -> pl.DataFrame:
        gaps = []

        gaps.extend(self._find_missing_field_gaps(term_id))
        gaps.extend(self._find_missing_related_records_gaps(term_id))
        gaps.extend(self._find_quantity_mismatch_gaps(term_id))

        if gaps:
            gap_df = pl.DataFrame(gaps)
            self._save_gaps(gap_df)
            logger.info(f"识别到 {len(gaps)} 个数据缺口")
            return gap_df
        return pl.DataFrame()

    def _find_missing_field_gaps(self, term_id: str) -> List[Dict]:
        gaps = []

        field_checks = [
            ("textbook_isbn", "missing_isbn", "high"),
            ("price", "missing_price", "medium"),
            ("quantity", "missing_quantity", "high"),
            ("publisher", "missing_publisher", "low"),
        ]

        for field, gap_type, severity in field_checks:
            sql = f"""
            SELECT order_id
            FROM textbook_order
            WHERE term_id = ?
            AND ({field} IS NULL OR {field} = '' OR {field} = 0)
            """
            result = db.query(sql, {"1": term_id})

            for row in result.to_dicts():
                gaps.append(self._create_gap_record(
                    order_id=row["order_id"],
                    gap_type=gap_type,
                    missing_field=field,
                    severity=severity,
                    suggested_action=f"补全{field}字段信息"
                ))

        return gaps

    def _find_missing_related_records_gaps(self, term_id: str) -> List[Dict]:
        gaps = []

        sql_no_card = """
        SELECT o.order_id
        FROM textbook_order o
        LEFT JOIN campus_card_record c ON o.order_id = c.order_id
        WHERE o.term_id = ? AND c.record_id IS NULL
        """
        result = db.query(sql_no_card, {"1": term_id})
        for row in result.to_dicts():
            gaps.append(self._create_gap_record(
                order_id=row["order_id"],
                gap_type="no_campus_card_record",
                missing_field=None,
                severity="medium",
                suggested_action="核对一卡通消费记录，确认是否已扣款"
            ))

        sql_no_approval = """
        SELECT o.order_id
        FROM textbook_order o
        LEFT JOIN approval_record a ON o.order_id = a.order_id
        WHERE o.term_id = ? AND a.approval_id IS NULL
        """
        result = db.query(sql_no_approval, {"1": term_id})
        for row in result.to_dicts():
            gaps.append(self._create_gap_record(
                order_id=row["order_id"],
                gap_type="no_approval_record",
                missing_field=None,
                severity="high",
                suggested_action="补全审批流程记录"
            ))

        sql_no_application = """
        SELECT o.order_id
        FROM textbook_order o
        LEFT JOIN student_application sa ON o.order_id = sa.order_id
        WHERE o.term_id = ? AND sa.application_id IS NULL
        AND o.order_status IN ('submitted', 'approved', 'purchased')
        """
        result = db.query(sql_no_application, {"1": term_id})
        for row in result.to_dicts():
            gaps.append(self._create_gap_record(
                order_id=row["order_id"],
                gap_type="no_student_application",
                missing_field=None,
                severity="low",
                suggested_action="核对学生申请表，确认是否已提交纸质申请"
            ))

        return gaps

    def _find_quantity_mismatch_gaps(self, term_id: str) -> List[Dict]:
        gaps = []

        sql = """
        SELECT
            o.order_id,
            o.quantity as order_qty,
            c.student_count as course_students
        FROM textbook_order o
        JOIN course c ON o.course_id = c.course_id
        WHERE o.term_id = ?
        AND o.quantity != c.student_count
        """
        result = db.query(sql, {"1": term_id})

        for row in result.to_dicts():
            gaps.append(self._create_gap_record(
                order_id=row["order_id"],
                gap_type="quantity_mismatch",
                missing_field="quantity",
                severity="medium",
                suggested_action=f"订购数量({row['order_qty']})与选课人数({row['course_students']})不匹配，请核实"
            ))

        return gaps

    def _create_gap_record(
        self,
        order_id: str,
        gap_type: str,
        missing_field: Optional[str],
        severity: str,
        suggested_action: str
    ) -> Dict:
        return {
            "gap_id": str(uuid.uuid4()),
            "order_id": order_id,
            "gap_type": gap_type,
            "missing_field": missing_field,
            "severity": severity,
            "suggested_action": suggested_action,
            "responsible_person": None,
            "deadline": (datetime.now() + timedelta(days=7)).date(),
            "status": "open",
        }

    def _save_gaps(self, gap_df: pl.DataFrame) -> int:
        return db.insert_dataframe("data_gap", gap_df)

    def get_gaps(
        self,
        term_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        gap_type: Optional[str] = None
    ) -> pl.DataFrame:
        sql = """
        SELECT g.*, o.textbook_name, o.course_id, c.course_name, d.dept_name
        FROM data_gap g
        JOIN textbook_order o ON g.order_id = o.order_id
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE 1=1
        """
        params = {}
        param_idx = 1

        if term_id:
            sql += f" AND o.term_id = ?"
            params[str(param_idx)] = term_id
            param_idx += 1

        if severity:
            sql += f" AND g.severity = ?"
            params[str(param_idx)] = severity
            param_idx += 1

        if status:
            sql += f" AND g.status = ?"
            params[str(param_idx)] = status
            param_idx += 1

        if gap_type:
            sql += f" AND g.gap_type = ?"
            params[str(param_idx)] = gap_type
            param_idx += 1

        sql += " ORDER BY CASE g.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, g.deadline"

        return db.query(sql, params if params else None)

    def get_gap_summary(self, term_id: Optional[str] = None) -> Dict:
        term_filter = f"WHERE o.term_id = '{term_id}'" if term_id else ""

        sql = f"""
        SELECT
            g.severity,
            g.status,
            g.gap_type,
            COUNT(*) as count
        FROM data_gap g
        JOIN textbook_order o ON g.order_id = o.order_id
        {term_filter}
        GROUP BY g.severity, g.status, g.gap_type
        """
        result = db.query(sql)

        if result.is_empty():
            return {
                "total_gaps": 0,
                "by_severity": {"high": 0, "medium": 0, "low": 0},
                "by_status": {"open": 0, "in_progress": 0, "closed": 0},
                "by_type": {},
            }

        total = result["count"].sum()
        by_severity = {
            "high": result.filter(pl.col("severity") == "high")["count"].sum(),
            "medium": result.filter(pl.col("severity") == "medium")["count"].sum(),
            "low": result.filter(pl.col("severity") == "low")["count"].sum(),
        }
        by_status = {
            "open": result.filter(pl.col("status") == "open")["count"].sum(),
            "in_progress": result.filter(pl.col("status") == "in_progress")["count"].sum(),
            "closed": result.filter(pl.col("status") == "closed")["count"].sum(),
        }
        by_type = {row["gap_type"]: row["count"] for row in result.to_dicts()}

        return {
            "total_gaps": total,
            "by_severity": by_severity,
            "by_status": by_status,
            "by_type": by_type,
        }

    def mark_gap(
        self,
        gap_id: str,
        status: str,
        responsible_person: Optional[str] = None
    ) -> bool:
        sql = "UPDATE data_gap SET status = ?"
        params = {"1": status}

        if responsible_person:
            sql += ", responsible_person = ?"
            params["2"] = responsible_person

        sql += " WHERE gap_id = ?"
        params[str(len(params) + 1)] = gap_id

        try:
            db.execute(sql, params)
            logger.info(f"缺口状态已更新: gap_id={gap_id}, status={status}")
            return True
        except Exception as e:
            logger.error(f"更新缺口状态失败: {e}")
            return False

    def get_gap_type_name(self, gap_code: str) -> str:
        for gt in self.GAP_TYPES:
            if gt["code"] == gap_code:
                return gt["name"]
        return gap_code


gap_analyzer = GapAnalyzer()
