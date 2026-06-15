import polars as pl
from typing import Optional, Dict, List
from src.data.database import db
from config import setup_logger

logger = setup_logger()


class EvaluationAnalysis:
    def get_evaluation_coverage(self, term_id: str, filters: Optional[Dict] = None) -> Dict:
        filter_sql = ""
        params = {"1": term_id}
        param_idx = 2

        if filters:
            if filters.get("dept_id") and filters["dept_id"] != "全部":
                filter_sql += f" AND c.dept_id = ${param_idx}"
                params[str(param_idx)] = filters["dept_id"]
                param_idx += 1
            if filters.get("course_id") and filters["course_id"] != "全部":
                filter_sql += f" AND c.course_id = ${param_idx}"
                params[str(param_idx)] = filters["course_id"]
                param_idx += 1

        sql = f"""
        SELECT
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) as evaluated_courses,
            COUNT(DISTINCT s.student_id) as total_students,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN s.student_id END) as submitted_students,
            AVG(e.score) as avg_score
        FROM course c
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        LEFT JOIN student s ON c.dept_id = s.dept_id
        WHERE c.course_id IN (
            SELECT DISTINCT course_id FROM textbook_order WHERE term_id = $1
        )
        {filter_sql}
        """
        result = db.query(sql, params)

        if result.is_empty():
            return {}

        row = result.to_dicts()[0]
        total_courses = row["total_courses"] or 0
        evaluated_courses = row["evaluated_courses"] or 0
        total_students = row["total_students"] or 0
        submitted_students = row["submitted_students"] or 0
        avg_score = row["avg_score"] or 0

        coverage_rate = (submitted_students / total_students * 100) if total_students > 0 else 0

        return {
            "total_courses": total_courses,
            "evaluated_courses": evaluated_courses,
            "course_coverage": round((evaluated_courses / total_courses * 100) if total_courses > 0 else 0, 2),
            "total_count": total_students,
            "submitted_count": submitted_students,
            "student_coverage": round(coverage_rate, 2),
            "coverage_rate": round(coverage_rate, 2),
            "avg_score": round(float(avg_score) if avg_score else 0, 2),
        }

    def get_evaluation_details(self, term_id: str) -> pl.DataFrame:
        sql = """
        SELECT
            c.course_id,
            c.course_name,
            c.course_code,
            d.dept_name,
            c.student_count,
            COUNT(DISTINCT e.eval_id) as eval_count,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) as submitted_count,
            AVG(e.score) as avg_score,
            CASE
                WHEN c.student_count > 0
                THEN COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) * 100.0 / c.student_count
                ELSE 0
            END as coverage_rate
        FROM course c
        JOIN department d ON c.dept_id = d.dept_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE c.course_id IN (
            SELECT DISTINCT course_id FROM textbook_order WHERE term_id = ?
        )
        GROUP BY c.course_id, c.course_name, c.course_code, d.dept_name, c.student_count
        ORDER BY coverage_rate ASC
        """
        return db.query(sql, {"1": term_id})

    def get_correlation_analysis(self, term_id: str) -> pl.DataFrame:
        sql = """
        SELECT
            c.course_id,
            c.course_name,
            d.dept_name,
            o.quantity as ordered_quantity,
            c.student_count,
            CASE
                WHEN o.quantity > 0
                THEN c.student_count * 100.0 / o.quantity
                ELSE 0
            END as fulfillment_rate,
            AVG(e.score) as avg_eval_score,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) as eval_submitted,
            CASE
                WHEN c.student_count > 0
                THEN COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) * 100.0 / c.student_count
                ELSE 0
            END as eval_coverage
        FROM course c
        JOIN department d ON c.dept_id = d.dept_id
        JOIN textbook_order o ON c.course_id = o.course_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE o.term_id = ?
        GROUP BY c.course_id, c.course_name, d.dept_name, o.quantity, c.student_count
        """
        return db.query(sql, {"1": term_id})

    def get_coverage_trend(self, terms: List[str]) -> pl.DataFrame:
        if not terms:
            return pl.DataFrame()

        placeholders = ", ".join([f"'{t}'" for t in terms])

        sql = f"""
        SELECT
            o.term_id,
            at.term_name,
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) as evaluated_courses,
            CASE
                WHEN COUNT(DISTINCT c.course_id) > 0
                THEN COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) * 100.0 / COUNT(DISTINCT c.course_id)
                ELSE 0
            END as course_coverage,
            AVG(e.score) as avg_score
        FROM course c
        JOIN textbook_order o ON c.course_id = o.course_id
        JOIN academic_term at ON o.term_id = at.term_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE o.term_id IN ({placeholders})
        GROUP BY o.term_id, at.term_name
        ORDER BY at.start_date
        """
        return db.query(sql)

    def _get_previous_term(self, current_term: str) -> Optional[str]:
        sql = """
        SELECT term_id, start_date
        FROM academic_term
        ORDER BY start_date
        """
        terms = db.query(sql)
        if terms.is_empty():
            return None

        current_idx = None
        for i, row in enumerate(terms.to_dicts()):
            if row["term_id"] == current_term:
                current_idx = i
                break

        if current_idx is None or current_idx == 0:
            return None

        return terms["term_id"][current_idx - 1]

    def analyze_coverage_improvement(
        self,
        current_term: str,
        previous_term: Optional[str] = None
    ) -> Dict:
        if previous_term is None:
            previous_term = self._get_previous_term(current_term)

        if previous_term is None:
            return {
                "trend": 0,
                "score_trend": 0,
                "count_trend": 0,
                "prev_coverage": 0,
                "current_coverage": 0,
            }

        current = self.get_evaluation_coverage(current_term)
        previous = self.get_evaluation_coverage(previous_term)

        if not current or not previous:
            return {
                "trend": 0,
                "score_trend": 0,
                "count_trend": 0,
                "prev_coverage": 0,
                "current_coverage": 0,
            }

        trend = current.get("coverage_rate", 0) - previous.get("coverage_rate", 0)
        score_trend = current.get("avg_score", 0) - previous.get("avg_score", 0)
        count_trend = current.get("submitted_count", 0) - previous.get("submitted_count", 0)

        return {
            "trend": round(trend, 2),
            "score_trend": round(score_trend, 2),
            "count_trend": count_trend,
            "prev_coverage": previous.get("coverage_rate", 0),
            "current_coverage": current.get("coverage_rate", 0),
            "prev_score": previous.get("avg_score", 0),
            "current_score": current.get("avg_score", 0),
            "improved": trend > 0,
        }

    def get_low_coverage_courses(
        self,
        term_id: str,
        threshold: float = 60.0
    ) -> pl.DataFrame:
        sql = """
        SELECT
            c.course_id,
            c.course_name,
            d.dept_name,
            c.grade,
            c.major,
            c.student_count,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) as submitted_count,
            CASE
                WHEN c.student_count > 0
                THEN COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) * 100.0 / c.student_count
                ELSE 0
            END as coverage_rate,
            o.order_status,
            o.quantity
        FROM course c
        JOIN department d ON c.dept_id = d.dept_id
        JOIN textbook_order o ON c.course_id = o.course_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE o.term_id = ?
        GROUP BY c.course_id, c.course_name, d.dept_name, c.grade, c.major, c.student_count, o.order_status, o.quantity
        HAVING coverage_rate < ?
        ORDER BY coverage_rate ASC
        """
        return db.query(sql, {"1": term_id, "2": threshold})

    def get_dept_coverage(self, term_id: str) -> pl.DataFrame:
        sql = """
        SELECT
            d.dept_id,
            d.dept_name,
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) as evaluated_courses,
            CASE
                WHEN COUNT(DISTINCT c.course_id) > 0
                THEN COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) * 100.0 / COUNT(DISTINCT c.course_id)
                ELSE 0
            END as coverage_rate
        FROM department d
        JOIN course c ON d.dept_id = c.dept_id
        JOIN textbook_order o ON c.course_id = o.course_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE o.term_id = ?
        GROUP BY d.dept_id, d.dept_name
        ORDER BY coverage_rate ASC
        """
        return db.query(sql, {"1": term_id})

    def get_coverage_by_department(self, term_id: str) -> pl.DataFrame:
        return self.get_dept_coverage(term_id)

    def get_term_trend(self) -> pl.DataFrame:
        sql = """
        SELECT
            o.term_id,
            at.term_name,
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) as evaluated_courses,
            CASE
                WHEN COUNT(DISTINCT c.course_id) > 0
                THEN COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) * 100.0 / COUNT(DISTINCT c.course_id)
                ELSE 0
            END as coverage_rate,
            AVG(e.score) as avg_score
        FROM course c
        JOIN textbook_order o ON c.course_id = o.course_id
        JOIN academic_term at ON o.term_id = at.term_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        GROUP BY o.term_id, at.term_name, at.start_date
        ORDER BY at.start_date
        """
        return db.query(sql)

    def get_correlation_analysis(self, term_id: str) -> Dict:
        sql = """
        SELECT
            c.course_id,
            c.course_name,
            d.dept_name,
            o.quantity as ordered_quantity,
            c.student_count,
            CASE
                WHEN o.quantity > 0
                THEN c.student_count * 100.0 / o.quantity
                ELSE 0
            END as fulfillment_rate,
            AVG(e.score) as avg_score,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) as eval_submitted,
            CASE
                WHEN c.student_count > 0
                THEN COUNT(DISTINCT CASE WHEN e.is_submitted THEN e.eval_id END) * 100.0 / c.student_count
                ELSE 0
            END as eval_coverage
        FROM course c
        JOIN department d ON c.dept_id = d.dept_id
        JOIN textbook_order o ON c.course_id = o.course_id
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        WHERE o.term_id = ?
        GROUP BY c.course_id, c.course_name, d.dept_name, o.quantity, c.student_count
        """
        df = db.query(sql, {"1": term_id})

        if df.is_empty():
            return {}

        high_score_df = df.filter(pl.col("avg_score") >= 80)
        low_score_df = df.filter(pl.col("avg_score") < 60)

        high_score_order_rate = high_score_df["fulfillment_rate"].mean() if len(high_score_df) > 0 else 0
        low_score_order_rate = low_score_df["fulfillment_rate"].mean() if len(low_score_df) > 0 else 0

        by_course = df.select([
            "course_name",
            "avg_score",
            pl.col("fulfillment_rate").alias("order_rate"),
            "student_count"
        ])

        return {
            "high_score_order_rate": round(float(high_score_order_rate) if high_score_order_rate else 0, 2),
            "low_score_order_rate": round(float(low_score_order_rate) if low_score_order_rate else 0, 2),
            "correlation": round(float(high_score_order_rate - low_score_order_rate) if high_score_order_rate and low_score_order_rate else 0, 2),
            "by_course": by_course,
        }


evaluation_analysis = EvaluationAnalysis()
