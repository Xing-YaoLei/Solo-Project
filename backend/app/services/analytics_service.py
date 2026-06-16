import duckdb
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from ..core.config import get_settings
from ..core.database import SessionLocal
from ..core.duckdb_conn import get_duckdb_connection
from ..models.education import Student, Course, Chapter, Question, Grade, Enrollment
from ..services.data_sources import DataSourceRegistry

settings = get_settings()


def _get_db() -> Session:
    return SessionLocal()


def _is_postgres_available() -> bool:
    try:
        db = _get_db()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception:
        return False


def _fallback_tag_trend(days: int = 30) -> Dict[str, Any]:
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
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "duckdb_fallback"
        }


def _fallback_progress_composition() -> Dict[str, Any]:
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
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "duckdb_fallback"
        }


def _fallback_grade_feedback(page: int = 1, page_size: int = 20, course: str = None) -> Dict[str, Any]:
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
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "duckdb_fallback"
        }


def _fallback_anomaly_alerts(page: int = 1, page_size: int = 20, severity: str = None) -> Dict[str, Any]:
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
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "duckdb_fallback"
        }


def _fallback_chapter_rank(sort_by: str = "completion_rate", view_mode: str = "rate") -> Dict[str, Any]:
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
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "duckdb_fallback"
        }


def get_tag_trend(days: int = 30) -> Dict[str, Any]:
    if not _is_postgres_available():
        return _fallback_tag_trend(days)

    try:
        db = _get_db()
        try:
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days - 1)

            postgres_source = DataSourceRegistry.get_source("postgresql")
            grades_data = postgres_source.fetch_data(
                data_type="grades",
                params={"start_date": datetime.combine(start_date, datetime.min.time()),
                        "end_date": datetime.combine(end_date, datetime.max.time()),
                        "limit": 10000}
            )

            tag_counts = {}
            grade_list = grades_data.get("grades", {}).get("data", [])

            for grade in grade_list:
                submit_date = grade["submit_time"][:10] if grade.get("submit_time") else None
                if not submit_date:
                    continue

                chapter_id = grade.get("chapter_id")
                chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
                if not chapter:
                    continue

                questions = db.query(Question).filter(Question.chapter_id == chapter_id).all()
                for q in questions:
                    if q.tags:
                        for tag in q.tags:
                            if submit_date not in tag_counts:
                                tag_counts[submit_date] = {}
                            tag_counts[submit_date][tag] = tag_counts[submit_date].get(tag, 0) + 1

            data = []
            all_tags = set()
            all_dates = set()

            for date_str, tags in tag_counts.items():
                all_dates.add(date_str)
                for tag in tags.keys():
                    all_tags.add(tag)

            for date_str in sorted(all_dates):
                for tag in sorted(all_tags):
                    data.append({
                        "date": date_str,
                        "tag": tag,
                        "count": tag_counts.get(date_str, {}).get(tag, 0)
                    })

            return {
                "data": data,
                "tags": sorted(list(all_tags)),
                "date_range": [min(all_dates), max(all_dates)] if all_dates else [],
                "refreshed_at": datetime.now(),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
                "data_source": "postgresql"
            }
        finally:
            db.close()
    except Exception:
        return _fallback_tag_trend(days)


def get_progress_composition() -> Dict[str, Any]:
    if not _is_postgres_available():
        return _fallback_progress_composition()

    try:
        postgres_source = DataSourceRegistry.get_source("postgresql")
        enrollments_data = postgres_source.fetch_data(
            data_type="enrollments",
            params={"limit": 10000}
        )

        enrollment_list = enrollments_data.get("enrollments", {}).get("data", [])

        progress_buckets = {
            "0-25%": 0,
            "25-50%": 0,
            "50-75%": 0,
            "75-100%": 0
        }

        status_counts = {}

        for e in enrollment_list:
            progress = e.get("progress", 0)
            status = e.get("status", "in_progress")

            if progress < 25:
                progress_buckets["0-25%"] += 1
            elif progress < 50:
                progress_buckets["25-50%"] += 1
            elif progress < 75:
                progress_buckets["50-75%"] += 1
            else:
                progress_buckets["75-100%"] += 1

            status_counts[status] = status_counts.get(status, 0) + 1

        data = []
        for bucket, count in progress_buckets.items():
            data.append({
                "category": "学习进度",
                "value": bucket,
                "count": count
            })

        for status, count in status_counts.items():
            status_name = {"in_progress": "学习中", "completed": "已完成", "not_started": "未开始"}.get(status, status)
            data.append({
                "category": "学习状态",
                "value": status_name,
                "count": count
            })

        total = sum(progress_buckets.values())

        return {
            "data": data,
            "total": total,
            "refreshed_at": datetime.now(),
            "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
            "data_source": "postgresql"
        }
    except Exception:
        return _fallback_progress_composition()


def get_grade_feedback(page: int = 1, page_size: int = 20, course: str = None) -> Dict[str, Any]:
    if not _is_postgres_available():
        return _fallback_grade_feedback(page, page_size, course)

    try:
        db = _get_db()
        try:
            postgres_source = DataSourceRegistry.get_source("postgresql")

            params = {"limit": 10000}
            if course:
                course_obj = db.query(Course).filter(Course.course_name == course).first()
                if course_obj:
                    params["course_id"] = course_obj.id

            grades_data = postgres_source.fetch_data(
                data_type="grades",
                params=params
            )

            grade_list = grades_data.get("grades", {}).get("data", [])

            enriched_data = []
            for g in grade_list:
                student = db.query(Student).filter(Student.id == g["student_id"]).first()
                chapter = db.query(Chapter).filter(Chapter.id == g["chapter_id"]).first()
                course_obj = db.query(Course).filter(Course.id == g["course_id"]).first()

                enriched_data.append({
                    "student_id": g["student_id"],
                    "student_name": student.name if student else f"学生{g['student_id']}",
                    "course": course_obj.course_name if course_obj else f"课程{g['course_id']}",
                    "chapter": chapter.chapter_name if chapter else f"章节{g['chapter_id']}",
                    "score": g["score"],
                    "total_questions": g["total_questions"],
                    "correct_count": g["correct_count"],
                    "time_spent": g["time_spent"],
                    "submit_time": g["submit_time"]
                })

            total = len(enriched_data)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_data = enriched_data[start_idx:end_idx]

            return {
                "data": paginated_data,
                "total": total,
                "page": page,
                "page_size": page_size,
                "refreshed_at": datetime.now(),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
                "data_source": "postgresql"
            }
        finally:
            db.close()
    except Exception:
        return _fallback_grade_feedback(page, page_size, course)


def get_anomaly_alerts(page: int = 1, page_size: int = 20, severity: str = None) -> Dict[str, Any]:
    if not _is_postgres_available():
        return _fallback_anomaly_alerts(page, page_size, severity)

    try:
        db = _get_db()
        try:
            postgres_source = DataSourceRegistry.get_source("postgresql")
            grades_data = postgres_source.fetch_data(
                data_type="grades",
                params={"limit": 10000}
            )

            enrollments_data = postgres_source.fetch_data(
                data_type="enrollments",
                params={"limit": 10000}
            )

            grade_list = grades_data.get("grades", {}).get("data", [])
            enrollment_list = enrollments_data.get("enrollments", {}).get("data", [])

            alerts = []

            for g in grade_list:
                student = db.query(Student).filter(Student.id == g["student_id"]).first()
                chapter = db.query(Chapter).filter(Chapter.id == g["chapter_id"]).first()
                course_obj = db.query(Course).filter(Course.id == g["course_id"]).first()

                if g["score"] < 60:
                    alerts.append({
                        "id": len(alerts) + 1,
                        "rule_name": "成绩异常",
                        "rule_type": "low_score",
                        "student_id": g["student_id"],
                        "student_name": student.name if student else f"学生{g['student_id']}",
                        "course": course_obj.course_name if course_obj else f"课程{g['course_id']}",
                        "description": f"在章节「{chapter.chapter_name if chapter else '未知'}」得分低于60分",
                        "severity": "high" if g["score"] < 40 else "medium",
                        "detected_at": g["submit_time"],
                        "is_resolved": False
                    })

                if g["time_spent"] and g["time_spent"] > 3600:
                    alerts.append({
                        "id": len(alerts) + 1,
                        "rule_name": "用时异常",
                        "rule_type": "excessive_time",
                        "student_id": g["student_id"],
                        "student_name": student.name if student else f"学生{g['student_id']}",
                        "course": course_obj.course_name if course_obj else f"课程{g['course_id']}",
                        "description": f"完成章节「{chapter.chapter_name if chapter else '未知'}」用时超过1小时",
                        "severity": "medium",
                        "detected_at": g["submit_time"],
                        "is_resolved": False
                    })

                if g["attempt_count"] and g["attempt_count"] >= 3:
                    alerts.append({
                        "id": len(alerts) + 1,
                        "rule_name": "多次尝试",
                        "rule_type": "multiple_attempts",
                        "student_id": g["student_id"],
                        "student_name": student.name if student else f"学生{g['student_id']}",
                        "course": course_obj.course_name if course_obj else f"课程{g['course_id']}",
                        "description": f"章节「{chapter.chapter_name if chapter else '未知'}」尝试次数达{g['attempt_count']}次",
                        "severity": "low",
                        "detected_at": g["submit_time"],
                        "is_resolved": False
                    })

            for e in enrollment_list:
                if e.get("progress", 0) < 10 and e.get("status") == "in_progress":
                    student = db.query(Student).filter(Student.id == e["student_id"]).first()
                    course_obj = db.query(Course).filter(Course.id == e["course_id"]).first()

                    alerts.append({
                        "id": len(alerts) + 1,
                        "rule_name": "学习停滞",
                        "rule_type": "stagnation",
                        "student_id": e["student_id"],
                        "student_name": student.name if student else f"学生{e['student_id']}",
                        "course": course_obj.course_name if course_obj else f"课程{e['course_id']}",
                        "description": "课程进度低于10%，可能存在学习困难",
                        "severity": "medium",
                        "detected_at": e.get("last_activity_at") or e.get("enrollment_date"),
                        "is_resolved": False
                    })

            if severity:
                alerts = [a for a in alerts if a["severity"] == severity]

            alerts.sort(key=lambda x: x["detected_at"], reverse=True)

            severity_dict = {
                "high": sum(1 for a in alerts if a["severity"] == "high"),
                "medium": sum(1 for a in alerts if a["severity"] == "medium"),
                "low": sum(1 for a in alerts if a["severity"] == "low")
            }

            total = len(alerts)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_alerts = alerts[start_idx:end_idx]

            return {
                "data": paginated_alerts,
                "total": total,
                "severity_stats": severity_dict,
                "refreshed_at": datetime.now(),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
                "data_source": "postgresql"
            }
        finally:
            db.close()
    except Exception:
        return _fallback_anomaly_alerts(page, page_size, severity)


def get_chapter_rank(sort_by: str = "completion_rate", view_mode: str = "rate") -> Dict[str, Any]:
    if not _is_postgres_available():
        return _fallback_chapter_rank(sort_by, view_mode)

    try:
        db = _get_db()
        try:
            postgres_source = DataSourceRegistry.get_source("postgresql")
            chapters_data = postgres_source.fetch_data(
                data_type="chapters",
                params={}
            )

            chapter_list = chapters_data.get("chapters", {}).get("data", [])

            enriched_data = []
            for c in chapter_list:
                chapter = db.query(Chapter).filter(Chapter.chapter_name == c["chapter_name"]).first()
                course_obj = db.query(Course).filter(Course.id == chapter.course_id).first() if chapter else None

                enriched_data.append({
                    "chapter_id": chapter.id if chapter else 0,
                    "chapter_name": c["chapter_name"],
                    "course": course_obj.course_name if course_obj else "未知课程",
                    "total_students": c["student_count"],
                    "completed_students": c["passed_count"],
                    "completion_rate": c["completion_rate"],
                    "avg_score": c["avg_score"]
                })

            if sort_by == "completion_rate":
                enriched_data.sort(key=lambda x: x["completion_rate"], reverse=True)
            else:
                enriched_data.sort(key=lambda x: x["total_students"], reverse=True)

            return {
                "data": enriched_data,
                "total": len(enriched_data),
                "view_mode": view_mode,
                "refreshed_at": datetime.now(),
                "completion_rate_formula": settings.COMPLETION_RATE_FORMULA,
                "data_source": "postgresql"
            }
        finally:
            db.close()
    except Exception:
        return _fallback_chapter_rank(sort_by, view_mode)


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
    for source in sources:
        if data_source != "all" and source != data_source:
            continue

        try:
            if source == "tag_trend":
                data = get_tag_trend()
            elif source == "progress_composition":
                data = get_progress_composition()
            elif source == "grade_feedback":
                data = get_grade_feedback(page_size=1)
            elif source == "anomaly_alerts":
                data = get_anomaly_alerts(page_size=1)
            else:
                data = get_chapter_rank()

            results.append({
                "data_source": source_names.get(source, source),
                "refreshed_at": data.get("refreshed_at", datetime.now()),
                "status": "success",
                "record_count": len(data.get("data", [])),
                "actual_source": data.get("data_source", "unknown")
            })
        except Exception as e:
            results.append({
                "data_source": source_names.get(source, source),
                "refreshed_at": datetime.now(),
                "status": "error",
                "record_count": 0,
                "error": str(e)
            })

    return results[0] if len(results) == 1 else results
