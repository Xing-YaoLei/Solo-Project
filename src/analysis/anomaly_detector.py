import polars as pl
import numpy as np
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from src.data.database import db
from config import setup_logger

logger = setup_logger()


class AnomalyDetector:
    ANOMALY_TYPES = [
        {"code": "quantity_abnormal", "name": "订购量异常", "severity": "high"},
        {"code": "approval_timeout", "name": "审批超时", "severity": "medium"},
        {"code": "price_abnormal", "name": "价格异常", "severity": "medium"},
        {"code": "stock_abnormal", "name": "库存异常", "severity": "high"},
        {"code": "classroom_mismatch", "name": "教室容量不匹配", "severity": "medium"},
        {"code": "zero_quantity", "name": "零订购量", "severity": "high"},
    ]

    def detect_anomalies(self, term_id: str) -> pl.DataFrame:
        anomalies = []

        anomalies.extend(self._detect_quantity_anomalies(term_id))
        anomalies.extend(self._detect_approval_timeout(term_id))
        anomalies.extend(self._detect_price_anomalies(term_id))
        anomalies.extend(self._detect_classroom_mismatch(term_id))
        anomalies.extend(self._detect_zero_quantity(term_id))

        return pl.DataFrame(anomalies) if anomalies else pl.DataFrame()

    def _detect_quantity_anomalies(self, term_id: str) -> List[Dict]:
        anomalies = []

        sql = f"""
        SELECT
            o.order_id,
            o.textbook_name,
            o.quantity,
            c.student_count,
            c.course_name,
            d.dept_name,
            ABS(o.quantity - c.student_count) as diff,
            CASE
                WHEN c.student_count > 0
                THEN ABS(o.quantity - c.student_count) * 100.0 / c.student_count
                ELSE 100
            END as diff_pct
        FROM textbook_order o
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE o.term_id = ?
        AND o.quantity > 0
        AND c.student_count > 0
        """
        result = db.query(sql, {"1": term_id})

        if result.is_empty():
            return anomalies

        quantities = result["quantity"].to_numpy()
        mean = np.mean(quantities)
        std = np.std(quantities)
        threshold = mean + 2 * std

        for row in result.to_dicts():
            if row["quantity"] > threshold or row["diff_pct"] > 30:
                anomalies.append(self._create_anomaly_record(
                    order_id=row["order_id"],
                    anomaly_type="quantity_abnormal",
                    severity="high",
                    description=f"订购量({row['quantity']})与选课人数({row['student_count']})差异{row['diff_pct']:.1f}%，或偏离均值超过2倍标准差",
                    related_data={
                        "ordered": row["quantity"],
                        "students": row["student_count"],
                        "difference": row["diff"],
                        "diff_percent": round(row["diff_pct"], 2),
                    }
                ))

        return anomalies

    def _detect_approval_timeout(self, term_id: str) -> List[Dict]:
        anomalies = []

        sql = f"""
        SELECT
            o.order_id,
            o.textbook_name,
            o.created_at,
            a.approval_time,
            a.approval_step,
            c.course_name,
            d.dept_name,
            DATEDIFF('day', o.created_at, COALESCE(a.approval_time, CURRENT_TIMESTAMP)) as days_pending
        FROM textbook_order o
        LEFT JOIN approval_record a ON o.order_id = a.order_id
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE o.term_id = ?
        AND o.order_status IN ('submitted', 'pending')
        """
        result = db.query(sql, {"1": term_id})

        for row in result.to_dicts():
            days_pending = row["days_pending"] or 0
            if days_pending > 7:
                anomalies.append(self._create_anomaly_record(
                    order_id=row["order_id"],
                    anomaly_type="approval_timeout",
                    severity="medium",
                    description=f"审批已超时{days_pending}天，当前在第{row['approval_step']}步",
                    related_data={
                        "days_pending": days_pending,
                        "current_step": row["approval_step"],
                        "submitted_at": str(row["created_at"]),
                    }
                ))

        return anomalies

    def _detect_price_anomalies(self, term_id: str) -> List[Dict]:
        anomalies = []

        sql = f"""
        SELECT
            o.order_id,
            o.textbook_name,
            o.price,
            o.textbook_isbn,
            c.course_name,
            d.dept_name
        FROM textbook_order o
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE o.term_id = ?
        AND o.price > 0
        """
        result = db.query(sql, {"1": term_id})

        if result.is_empty():
            return anomalies

        prices = result["price"].to_numpy()
        mean = np.mean(prices)
        std = np.std(prices)
        upper_threshold = mean + 2 * std
        lower_threshold = max(5, mean - 2 * std)

        for row in result.to_dicts():
            price = row["price"] or 0
            if price > upper_threshold or price < lower_threshold:
                direction = "偏高" if price > upper_threshold else "偏低"
                anomalies.append(self._create_anomaly_record(
                    order_id=row["order_id"],
                    anomaly_type="price_abnormal",
                    severity="medium",
                    description=f"教材价格{price}元{direction}，均值{mean:.2f}元，标准差{std:.2f}元",
                    related_data={
                        "price": price,
                        "mean_price": round(mean, 2),
                        "std_price": round(std, 2),
                        "isbn": row["textbook_isbn"],
                    }
                ))

        return anomalies

    def _detect_classroom_mismatch(self, term_id: str) -> List[Dict]:
        anomalies = []

        sql = f"""
        SELECT
            o.order_id,
            o.textbook_name,
            o.quantity,
            c.course_name,
            c.student_count,
            cr.capacity,
            cr.building,
            cr.room_number,
            d.dept_name
        FROM textbook_order o
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        JOIN course_schedule cs ON c.course_id = cs.course_id
        JOIN classroom cr ON cs.classroom_id = cr.classroom_id
        WHERE o.term_id = ?
        AND c.student_count > cr.capacity
        """
        result = db.query(sql, {"1": term_id})

        for row in result.to_dicts():
            anomalies.append(self._create_anomaly_record(
                order_id=row["order_id"],
                anomaly_type="classroom_mismatch",
                severity="medium",
                description=f"选课人数({row['student_count']})超过教室容量({row['capacity']})，教室: {row['building']}{row['room_number']}",
                related_data={
                    "student_count": row["student_count"],
                    "classroom_capacity": row["capacity"],
                    "classroom": f"{row['building']}{row['room_number']}",
                    "ordered_quantity": row["quantity"],
                }
            ))

        return anomalies

    def _detect_zero_quantity(self, term_id: str) -> List[Dict]:
        anomalies = []

        sql = f"""
        SELECT
            o.order_id,
            o.textbook_name,
            c.course_name,
            c.student_count,
            d.dept_name
        FROM textbook_order o
        JOIN course c ON o.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE o.term_id = ?
        AND (o.quantity = 0 OR o.quantity IS NULL)
        AND c.student_count > 0
        """
        result = db.query(sql, {"1": term_id})

        for row in result.to_dicts():
            anomalies.append(self._create_anomaly_record(
                order_id=row["order_id"],
                anomaly_type="zero_quantity",
                severity="high",
                description=f"教材订购数量为0，但课程有{row['student_count']}名学生",
                related_data={
                    "student_count": row["student_count"],
                    "ordered_quantity": 0,
                }
            ))

        return anomalies

    def _create_anomaly_record(
        self,
        order_id: str,
        anomaly_type: str,
        severity: str,
        description: str,
        related_data: Optional[Dict] = None
    ) -> Dict:
        return {
            "anomaly_id": f"ANOM_{order_id}_{anomaly_type}",
            "order_id": order_id,
            "anomaly_type": anomaly_type,
            "anomaly_name": self._get_anomaly_name(anomaly_type),
            "severity": severity,
            "description": description,
            "related_data": related_data or {},
            "detected_at": datetime.now(),
            "status": "open",
        }

    def _get_anomaly_name(self, code: str) -> str:
        for at in self.ANOMALY_TYPES:
            if at["code"] == code:
                return at["name"]
        return code

    def get_anomaly_summary(self, term_id: str) -> Dict:
        anomalies = self.detect_anomalies(term_id)

        if anomalies.is_empty():
            return {
                "total_anomalies": 0,
                "by_severity": {"high": 0, "medium": 0, "low": 0},
                "by_type": {},
            }

        total = len(anomalies)
        by_severity = {
            "high": anomalies.filter(pl.col("severity") == "high").height,
            "medium": anomalies.filter(pl.col("severity") == "medium").height,
            "low": anomalies.filter(pl.col("severity") == "low").height,
        }

        type_counts = anomalies.group_by("anomaly_type").agg(pl.count("anomaly_id").alias("count"))
        by_type = {row["anomaly_type"]: row["count"] for row in type_counts.to_dicts()}

        return {
            "total_anomalies": total,
            "by_severity": by_severity,
            "by_type": by_type,
        }

    def get_classroom_info(self, course_id: str) -> pl.DataFrame:
        sql = """
        SELECT
            cs.*,
            cr.building,
            cr.room_number,
            cr.capacity,
            cr.equipment,
            cr.building_type
        FROM course_schedule cs
        JOIN classroom cr ON cs.classroom_id = cr.classroom_id
        WHERE cs.course_id = ?
        """
        return db.query(sql, {"1": course_id})


anomaly_detector = AnomalyDetector()
