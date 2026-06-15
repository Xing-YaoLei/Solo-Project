import polars as pl
from typing import Optional, Dict, List
from src.data.database import db
from config import setup_logger

logger = setup_logger()


class EvaluationAnalysis:
    def get_evaluation_coverage(self, term_id: str) -> Dict:
        sql = """
        SELECT
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.eval_id IS NOT NULL THEN c.course_id END) as evaluated_courses,
            COUNT(DISTINCT s.student_id) as total_students,
            COUNT(DISTINCT CASE WHEN e.is_submitted THEN s.student_id END) as submitted_students
        FROM course c
        LEFT JOIN teaching_evaluation e ON c.course_id = e.course_id
        LEFT JOIN student s ON c.dept_id = s.dept_id
        WHERE c.course_id IN (
            SELECT DISTINCT course_id FROM textbook_order WHERE term_id = ?
        )
        """
        result = db.query(sql, {"1": term_id})

        if result.is_empty():
            return {}

        row = result.to_dicts()[0]
        total_courses = row["total_courses"] or 0
        evaluated_courses = row["evaluated_courses"] or 0
        total_students = row["total_students"] or 0
        submitted_students = row["submitted_students"] or 0

        course_coverage = (evaluated_courses / total_courses * 100) if total_courses > 0 else 0
        student_coverage = (submitted_students / total_students * 100) if total_students > 0 else 0

        return {
            "total_courses": total_courses,
            "evaluated_courses": evaluated_courses,
            "course_coverage": round(course_coverage, 2),
            "total_students": total_students,
            "submitted_students": submitted_students,
            "student_coverage": round(student_coverage, 2),
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

    def analyze_coverage_improvement(
        self,
        current_term: str,
        previous_term: str
    ) -> Dict:
        current = self.get_evaluation_coverage(current_term)
        previous = self.get_evaluation_coverage(previous_term)

        if not current or not previous:
            return {}

        course_improvement = current["course_coverage"] - previous["course_coverage"]
        student_improvement = current["student_coverage"] - previous["student_coverage"]

        return {
            "current_term": current,
            "previous_term": previous,
            "course_coverage_improvement": round(course_improvement, 2),
            "student_coverage_improvement": round(student_improvement, 2),
            "improved": course_improvement > 0 or student_improvement > 0,
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


evaluation_analysis = EvaluationAnalysis()
