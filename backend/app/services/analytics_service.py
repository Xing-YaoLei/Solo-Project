import duckdb
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from ..core.config import get_settings
from ..core.duckdb_conn import get_duckdb_connection

settings = get_settings()


def get_tag_trend(days: int = 30) -> Dict[str, Any]:
    with get_duckdb_connection() as con:
        df = con.execute(f"""
            SELECT date, tag, count
            FROM tag_trend
            ORDER BY date, tag
        """).fetchdf()

        tags = sorted(df["tag"].unique().tolist())
        dates = sorted(df["date"].unique().tolist())

        return {
            "data": df.to_dict("records"),
            "tags": tags,
            "date_range": [dates[0], dates[-1]] if dates else [],
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
        }


def get_progress_composition() -> Dict[str, Any]:
    with get_duckdb_connection() as con:
        df = con.execute("""
            SELECT category, value, count
            FROM progress_composition
            ORDER BY value DESC
        """).fetchdf()

        total = int(df["count"].sum())

        return {
            "data": df.to_dict("records"),
            "total": total,
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
        }


def get_grade_feedback(page: int = 1, page_size: int = 20, course: str = None) -> Dict[str, Any]:
    with get_duckdb_connection() as con:
        where_clause = ""
        params = []
        if course:
            where_clause = "WHERE course = ?"
            params = [course]

        count_query = f"SELECT COUNT(*) as total FROM grade_feedback {where_clause}"
        total = con.execute(count_query, params).fetchone()[0]

        offset = (page - 1) * page_size
        query = f"""
            SELECT student_id, student_name, course, chapter, score,
                   total_questions, correct_count, time_spent, submit_time
            FROM grade_feedback
            {where_clause}
            ORDER BY submit_time DESC
            LIMIT ? OFFSET ?
        """
        df = con.execute(query, params + [page_size, offset]).fetchdf()

        return {
            "data": df.to_dict("records"),
            "total": total,
            "page": page,
            "page_size": page_size,
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
        }


def get_anomaly_alerts(page: int = 1, page_size: int = 20, severity: str = None) -> Dict[str, Any]:
    with get_duckdb_connection() as con:
        where_clause = ""
        params = []
        if severity:
            where_clause = "WHERE severity = ?"
            params = [severity]

        count_query = f"SELECT COUNT(*) as total FROM anomaly_alerts {where_clause}"
        total = con.execute(count_query, params).fetchone()[0]

        severity_stats = con.execute("""
            SELECT severity, COUNT(*) as count
            FROM anomaly_alerts
            GROUP BY severity
        """).fetchdf()
        severity_dict = dict(zip(severity_stats["severity"], severity_stats["count"].astype(int)))

        offset = (page - 1) * page_size
        query = f"""
            SELECT id, rule_name, rule_type, student_id, student_name,
                   course, description, severity, detected_at, is_resolved
            FROM anomaly_alerts
            {where_clause}
            ORDER BY detected_at DESC
            LIMIT ? OFFSET ?
        """
        df = con.execute(query, params + [page_size, offset]).fetchdf()

        return {
            "data": df.to_dict("records"),
            "total": total,
            "severity_stats": severity_dict,
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
        }


def get_chapter_rank(sort_by: str = "completion_rate", view_mode: str = "rate") -> Dict[str, Any]:
    with get_duckdb_connection() as con:
        sort_column = "completion_rate" if sort_by == "completion_rate" else "total_students"
        sort_order = "DESC"

        df = con.execute(f"""
            SELECT chapter_id, chapter_name, course, total_students,
                   completed_students, completion_rate, avg_score
            FROM chapter_rank
            ORDER BY {sort_column} {sort_order}
        """).fetchdf()

        return {
            "data": df.to_dict("records"),
            "total": len(df),
            "view_mode": view_mode,
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
        }


def get_refresh_info(data_source: str = "all") -> Dict[str, Any]:
    sources = ["tag_trend", "progress_composition", "grade_feedback", "anomaly_alerts", "chapter_rank"]
    source_names = {
        "tag_trend": "题目标签数据",
        "progress_composition": "学习进度数据",
        "grade_feedback": "成绩反馈数据",
        "anomaly_alerts": "异常提醒数据",
        "chapter_rank": "章节排行数据"
    }

    results = []
    with get_duckdb_connection() as con:
        for source in sources:
            if data_source != "all" and source != data_source:
                continue
            try:
                count = con.execute(f"SELECT COUNT(*) FROM {source}").fetchone()[0]
                results.append({
                    "data_source": source_names.get(source, source),
                    "refreshed_at": datetime.now(),
                    "status": "success",
                    "record_count": count
                })
            except:
                results.append({
                    "data_source": source_names.get(source, source),
                    "refreshed_at": datetime.now(),
                    "status": "error",
                    "record_count": 0
                })

    return results[0] if len(results) == 1 else results
