import polars as pl
from typing import Optional, Dict, List
from src.data.database import db
from config import setup_logger, FUNNEL_STAGES

logger = setup_logger()


class FunnelEngine:
    def calculate_funnel(
        self,
        term_id: str,
        filters: Optional[Dict] = None
    ) -> pl.DataFrame:
        filter_sql = self._build_filter_sql(filters)

        sql = f"""
        WITH course_plan AS (
            SELECT COUNT(DISTINCT c.course_id) as count, 'course_plan' as stage
            FROM course c
            JOIN textbook_order o ON c.course_id = o.course_id
            WHERE o.term_id = ? {filter_sql}
        ),
        course_selection AS (
            SELECT COUNT(DISTINCT c.course_id) as count, 'course_selection' as stage
            FROM course c
            JOIN textbook_order o ON c.course_id = o.course_id
            WHERE o.term_id = ? AND c.student_count > 0 {filter_sql}
        ),
        textbook_apply AS (
            SELECT COUNT(DISTINCT o.order_id) as count, 'textbook_apply' as stage
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            WHERE o.term_id = ? AND o.order_status IN ('submitted', 'approved', 'purchased', 'stocked', 'distributed') {filter_sql}
        ),
        approval AS (
            SELECT COUNT(DISTINCT o.order_id) as count, 'approval' as stage
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN approval_record a ON o.order_id = a.order_id
            WHERE o.term_id = ? AND a.approval_result = 'approved' {filter_sql}
        ),
        purchase AS (
            SELECT COUNT(DISTINCT o.order_id) as count, 'purchase' as stage
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            WHERE o.term_id = ? AND o.order_status IN ('purchased', 'stocked', 'distributed') {filter_sql}
        ),
        stock_in AS (
            SELECT COUNT(DISTINCT o.order_id) as count, 'stock_in' as stage
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            WHERE o.term_id = ? AND o.order_status IN ('stocked', 'distributed') {filter_sql}
        ),
        distribution AS (
            SELECT COUNT(DISTINCT o.order_id) as count, 'distribution' as stage
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN campus_card_record cc ON o.order_id = cc.order_id
            WHERE o.term_id = ? AND o.order_status = 'distributed' {filter_sql}
        )
        SELECT * FROM course_plan
        UNION ALL SELECT * FROM course_selection
        UNION ALL SELECT * FROM textbook_apply
        UNION ALL SELECT * FROM approval
        UNION ALL SELECT * FROM purchase
        UNION ALL SELECT * FROM stock_in
        UNION ALL SELECT * FROM distribution
        """

        params = {str(i + 1): term_id for i in range(7)}
        result = db.query(sql, params)

        funnel_data = []
        for i, stage in enumerate(FUNNEL_STAGES):
            stage_data = result.filter(pl.col("stage") == stage["code"])
            count = stage_data["count"][0] if not stage_data.is_empty() else 0

            prev_count = funnel_data[i - 1]["count"] if i > 0 else count
            stage_conv = (count / prev_count * 100) if prev_count > 0 else 100
            total_conv = (count / funnel_data[0]["count"] * 100) if funnel_data and funnel_data[0]["count"] > 0 else 0

            funnel_data.append({
                "stage_code": stage["code"],
                "stage_name": stage["name"],
                "description": stage["description"],
                "color": stage["color"],
                "count": count,
                "stage_conversion": round(stage_conv, 2),
                "conversion_rate": round(stage_conv, 2),
                "total_conversion": round(total_conv, 2),
                "drop_off": round(100 - stage_conv, 2),
            })

        return pl.DataFrame(funnel_data)

    def _build_filter_sql(self, filters: Optional[Dict]) -> str:
        if not filters:
            return ""

        conditions = []
        for key, value in filters.items():
            if value is None or value == "":
                continue
            if isinstance(value, list):
                if value:
                    placeholders = ", ".join([f"'{v}'" for v in value])
                    conditions.append(f"c.{key} IN ({placeholders})")
            else:
                conditions.append(f"c.{key} = '{value}'")

        return " AND " + " AND ".join(conditions) if conditions else ""

    def get_funnel_metrics(
        self,
        term_id: str,
        filters: Optional[Dict] = None
    ) -> Dict:
        funnel_df = self.calculate_funnel(term_id, filters)

        if funnel_df.is_empty():
            return {}

        rows = funnel_df.to_dicts()
        total_courses = rows[0]["count"]
        final_count = rows[-1]["count"]
        overall_conversion = (final_count / total_courses * 100) if total_courses > 0 else 0

        drop_offs = [(r["stage_name"], r["drop_off"]) for r in rows[1:]]
        biggest_drop = max(drop_offs, key=lambda x: x[1]) if drop_offs else ("", 0)

        return {
            "total_courses": total_courses,
            "final_completed": final_count,
            "overall_conversion": round(overall_conversion, 2),
            "biggest_drop_stage": biggest_drop[0],
            "biggest_drop_value": round(biggest_drop[1], 2),
            "avg_stage_conversion": round(sum(r["stage_conversion"] for r in rows[1:]) / (len(rows) - 1), 2) if len(rows) > 1 else 100,
        }

    def get_trend_data(
        self,
        start_term: str,
        end_term: str,
        filters: Optional[Dict] = None
    ) -> pl.DataFrame:
        terms_sql = """
        SELECT term_id, term_name
        FROM academic_term
        WHERE term_id BETWEEN ? AND ?
        ORDER BY start_date
        """
        terms = db.query(terms_sql, {"1": start_term, "2": end_term})

        trend_data = []
        for term in terms.to_dicts():
            funnel = self.calculate_funnel(term["term_id"], filters)
            for row in funnel.to_dicts():
                trend_data.append({
                    "term_id": term["term_id"],
                    "term_name": term["term_name"],
                    "stage_code": row["stage_code"],
                    "stage_name": row["stage_name"],
                    "count": row["count"],
                    "total_conversion": row["total_conversion"],
                })

        return pl.DataFrame(trend_data)

    def drill_down(
        self,
        stage: str,
        term_id: str,
        filters: Optional[Dict] = None
    ) -> pl.DataFrame:
        filter_sql = self._build_filter_sql(filters)

        stage_queries = {
            "course_plan": f"""
            SELECT c.*, d.dept_name, o.textbook_name, o.quantity
            FROM course c
            JOIN department d ON c.dept_id = d.dept_id
            LEFT JOIN textbook_order o ON c.course_id = o.course_id AND o.term_id = ?
            WHERE o.term_id = ? {filter_sql}
            """,
            "course_selection": f"""
            SELECT c.*, d.dept_name, o.textbook_name, o.quantity
            FROM course c
            JOIN department d ON c.dept_id = d.dept_id
            JOIN textbook_order o ON c.course_id = o.course_id
            WHERE o.term_id = ? AND c.student_count > 0 {filter_sql}
            """,
            "textbook_apply": f"""
            SELECT o.*, c.course_name, d.dept_name
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN department d ON c.dept_id = d.dept_id
            WHERE o.term_id = ? AND o.order_status IN ('submitted', 'approved', 'purchased', 'stocked', 'distributed') {filter_sql}
            """,
            "approval": f"""
            SELECT o.*, c.course_name, d.dept_name, a.approver, a.approval_time, a.opinion
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN department d ON c.dept_id = d.dept_id
            JOIN approval_record a ON o.order_id = a.order_id
            WHERE o.term_id = ? AND a.approval_result = 'approved' {filter_sql}
            """,
            "purchase": f"""
            SELECT o.*, c.course_name, d.dept_name
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN department d ON c.dept_id = d.dept_id
            WHERE o.term_id = ? AND o.order_status IN ('purchased', 'stocked', 'distributed') {filter_sql}
            """,
            "stock_in": f"""
            SELECT o.*, c.course_name, d.dept_name
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN department d ON c.dept_id = d.dept_id
            WHERE o.term_id = ? AND o.order_status IN ('stocked', 'distributed') {filter_sql}
            """,
            "distribution": f"""
            SELECT o.*, c.course_name, d.dept_name, cc.trans_time, cc.amount
            FROM textbook_order o
            JOIN course c ON o.course_id = c.course_id
            JOIN department d ON c.dept_id = d.dept_id
            JOIN campus_card_record cc ON o.order_id = cc.order_id
            WHERE o.term_id = ? AND o.order_status = 'distributed' {filter_sql}
            """,
        }

        sql = stage_queries.get(stage, stage_queries["course_plan"])
        return db.query(sql, {"1": term_id, "2": term_id})

    def get_terms(self) -> pl.DataFrame:
        sql = "SELECT * FROM academic_term ORDER BY start_date DESC"
        return db.query(sql)


funnel_engine = FunnelEngine()
