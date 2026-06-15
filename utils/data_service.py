import pandas as pd
import logging
import json
from datetime import datetime, date
from config import Config
from models import (
    get_db,
    Course,
    Classroom,
    Student,
    EnrollmentApplication,
    EnrollmentStatus,
    Schedule,
    ClassroomConflict,
    AnomalyRecord,
    SyncLog,
    RawStudentApplication,
    RawTeachingPlatform,
    RawSmartCard,
)
from sqlalchemy import func, case, and_, or_, text

logger = logging.getLogger(__name__)


class BaseDataService:
    def get_funnel_data(self, academic_term=None, college=None):
        raise NotImplementedError

    def get_courses(self, academic_term=None, college=None, course_type=None, has_conflict=None):
        raise NotImplementedError

    def get_classrooms(self, building=None, room_type=None, has_conflict=None):
        raise NotImplementedError

    def get_students(self, college=None, grade=None, is_verified=None):
        raise NotImplementedError

    def get_applications(self, academic_term=None, college=None, status=None, has_conflict=None,
                         student_id=None, course_code=None, course_type=None,
                         start_date=None, end_date=None):
        raise NotImplementedError

    def get_schedules(self, academic_term=None, course_code=None, room_code=None, is_conflict=None):
        raise NotImplementedError

    def get_conflicts(self, academic_term=None, status=None, severity=None):
        raise NotImplementedError

    def get_anomalies(self, source_system=None, anomaly_type=None, severity=None, status=None):
        raise NotImplementedError

    def get_sync_logs(self, source_system=None, status=None, limit=50):
        raise NotImplementedError

    def get_raw_samples(self, source_system=None, is_anomaly=None, limit=200, course_code=None):
        raise NotImplementedError

    def get_duration_stats(self, academic_term=None, college=None, course_type=None):
        raise NotImplementedError

    def get_college_stats(self, academic_term=None):
        raise NotImplementedError

    def get_course_details(self, course_code):
        raise NotImplementedError

    def get_room_schedule_heatmap(self, room_code, academic_term=None):
        raise NotImplementedError


class DataService(BaseDataService):
    def __init__(self):
        self._db_available = True
        try:
            with get_db() as db:
                db.execute(text("SELECT 1"))
        except Exception as e:
            logger.warning(f"数据库连接不可用: {e}")
            self._db_available = False

    def _query_to_df(self, query_fn):
        if not self._db_available:
            return pd.DataFrame()
        try:
            with get_db() as db:
                result = query_fn(db)
                if isinstance(result, list):
                    return pd.DataFrame([r.to_dict() if hasattr(r, "to_dict") else dict(r) for r in result])
                if isinstance(result, pd.DataFrame):
                    return result
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"查询失败: {e}")
            return pd.DataFrame()

    def _enrich_course_with_stats(self, db, course):
        app_count = db.query(func.count(EnrollmentApplication.id)).filter(
            EnrollmentApplication.course_code == course.course_code
        ).scalar() or 0
        schedule_ids = [s.id for s in course.schedules]
        has_conflict = db.query(func.count(Schedule.id)).filter(
            Schedule.course_code == course.course_code,
            Schedule.is_conflict == True
        ).scalar() or 0
        d = course.to_dict()
        d["enroll_rate"] = round(app_count / course.capacity * 100, 1) if course.capacity else 0
        d["has_conflict"] = 1 if has_conflict > 0 else 0
        return d

    def get_funnel_data(self, academic_term=None, college=None):
        def _query(db):
            base_q = db.query(EnrollmentApplication)
            if academic_term:
                base_q = base_q.filter(EnrollmentApplication.academic_term == academic_term)
            if college:
                base_q = base_q.filter(EnrollmentApplication.course.has(college=college))

            stages = Config.FUNNEL_STAGES
            status_counts = {s: 0 for s in stages}
            apps = base_q.all()

            for app in apps:
                st = app.status.value if isinstance(app.status, EnrollmentStatus) else str(app.status)
                if st in ["已浏览"]:
                    status_counts[stages[1]] += 1
                elif st in ["已提交", "初审中", "初审驳回"]:
                    status_counts[stages[2]] += 1
                elif st in ["初审通过", "排课中"]:
                    status_counts[stages[3]] += 1
                elif st in ["已排课"]:
                    status_counts[stages[4]] += 1
                elif st in ["终审中", "终审通过", "终审驳回"]:
                    status_counts[stages[5]] += 1
                elif st == "选课成功":
                    status_counts[stages[6]] += 1

            catalog_count = db.query(func.count(Course.id)).filter(
                Course.academic_term == academic_term
            ).scalar() if academic_term else db.query(func.count(Course.id)).scalar()
            status_counts[stages[0]] = catalog_count or 0

            return [
                {"stage": s, "count": status_counts[s], "order": i}
                for i, s in enumerate(stages)
            ]
        return self._query_to_df(_query)

    def get_courses(self, academic_term=None, college=None, course_type=None, has_conflict=None):
        def _query(db):
            q = db.query(Course)
            if academic_term:
                q = q.filter(Course.academic_term == academic_term)
            if college:
                q = q.filter(Course.college == college)
            if course_type:
                q = q.filter(Course.course_type == course_type)

            courses = q.all()
            result = [self._enrich_course_with_stats(db, c) for c in courses]

            if has_conflict is not None and has_conflict != "":
                result = [r for r in result if r.get("has_conflict") == (1 if has_conflict == 1 or has_conflict == "1" else 0)]
            return result
        return self._query_to_df(_query)

    def get_classrooms(self, building=None, room_type=None, has_conflict=None):
        def _query(db):
            q = db.query(Classroom)
            if building:
                q = q.filter(Classroom.building == building)
            if room_type:
                q = q.filter(Classroom.room_type == room_type)
            rooms = q.all()

            result = []
            for r in rooms:
                rd = r.to_dict()
                conflict_count = db.query(func.count(ClassroomConflict.id)).filter(
                    ClassroomConflict.room_code == r.room_code
                ).scalar() or 0
                sched_count = db.query(func.count(Schedule.id)).filter(
                    Schedule.room_code == r.room_code
                ).scalar() or 0
                total_slots = len(Config.TIME_SLOTS) * 5
                rd["weekly_schedule_hours"] = sched_count * 2
                rd["weekly_utilization"] = round(sched_count / total_slots * 100, 1) if total_slots else 0
                rd["has_conflict"] = 1 if conflict_count > 0 else 0
                result.append(rd)

            if has_conflict is not None and has_conflict != "":
                flag = 1 if has_conflict == 1 or has_conflict == "1" else 0
                result = [r for r in result if r.get("has_conflict") == flag]
            return result
        return self._query_to_df(_query)

    def get_students(self, college=None, grade=None, is_verified=None):
        def _query(db):
            q = db.query(Student)
            if college:
                q = q.filter(Student.college == college)
            if grade:
                q = q.filter(Student.grade == grade)
            if is_verified is not None:
                q = q.filter(Student.is_verified == bool(is_verified))
            return q.all()
        return self._query_to_df(_query)

    def get_applications(self, academic_term=None, college=None, status=None, has_conflict=None,
                         student_id=None, course_code=None, course_type=None,
                         start_date=None, end_date=None):
        def _query(db):
            q = db.query(EnrollmentApplication)
            if academic_term:
                q = q.filter(EnrollmentApplication.academic_term == academic_term)
            if college:
                q = q.filter(EnrollmentApplication.course.has(college=college))
            if status:
                q = q.filter(EnrollmentApplication.status == status)
            if has_conflict is not None and has_conflict != "":
                flag = 1 if has_conflict == 1 or has_conflict == "1" else 0
                q = q.filter(EnrollmentApplication.has_conflict == flag)
            if student_id:
                q = q.filter(EnrollmentApplication.student_id == student_id)
            if course_code:
                q = q.filter(EnrollmentApplication.course_code == course_code)
            if course_type:
                q = q.filter(EnrollmentApplication.course.has(course_type=course_type))
            if start_date:
                start = datetime.combine(start_date, datetime.min.time()) if isinstance(start_date, date) else start_date
                q = q.filter(EnrollmentApplication.submitted_at >= start)
            if end_date:
                end = datetime.combine(end_date, datetime.max.time()) if isinstance(end_date, date) else end_date
                q = q.filter(EnrollmentApplication.submitted_at <= end)
            return q.all()
        return self._query_to_df(_query)

    def get_schedules(self, academic_term=None, course_code=None, room_code=None, is_conflict=None):
        def _query(db):
            q = db.query(Schedule)
            if academic_term:
                q = q.filter(Schedule.academic_term == academic_term)
            if course_code:
                q = q.filter(Schedule.course_code == course_code)
            if room_code:
                q = q.filter(Schedule.room_code == room_code)
            if is_conflict is not None and is_conflict != "":
                q = q.filter(Schedule.is_conflict == bool(is_conflict))

            scheds = q.all()
            result = []
            for s in scheds:
                sd = s.to_dict()
                course = db.query(Course).filter(Course.course_code == s.course_code).first()
                if course:
                    sd["course_name"] = course.course_name
                    sd["college"] = course.college
                    sd["teacher"] = course.teacher
                result.append(sd)
            return result
        return self._query_to_df(_query)

    def get_conflicts(self, academic_term=None, status=None, severity=None):
        def _query(db):
            q = db.query(ClassroomConflict)
            if academic_term:
                q = q.filter(ClassroomConflict.academic_term == academic_term)
            if status:
                q = q.filter(ClassroomConflict.status == status)
            if severity:
                q = q.filter(ClassroomConflict.severity == severity)

            conflicts = q.all()
            result = []
            for c in conflicts:
                cd = c.to_dict()
                room = db.query(Classroom).filter(Classroom.room_code == c.room_code).first()
                if room:
                    cd["building"] = room.building
                result.append(cd)
            return result
        return self._query_to_df(_query)

    def get_anomalies(self, source_system=None, anomaly_type=None, severity=None, status=None):
        def _query(db):
            q = db.query(AnomalyRecord)
            if source_system:
                q = q.filter(AnomalyRecord.source_system == source_system)
            if anomaly_type:
                q = q.filter(AnomalyRecord.anomaly_type == anomaly_type)
            if severity:
                q = q.filter(AnomalyRecord.severity == severity)
            if status:
                q = q.filter(AnomalyRecord.status == status)
            return q.order_by(AnomalyRecord.detected_at.desc()).all()
        return self._query_to_df(_query)

    def get_sync_logs(self, source_system=None, status=None, limit=50):
        def _query(db):
            q = db.query(SyncLog)
            if source_system:
                q = q.filter(SyncLog.source_system == source_system)
            if status:
                q = q.filter(SyncLog.status == status)
            return q.order_by(SyncLog.start_time.desc()).limit(limit).all()
        return self._query_to_df(_query)

    def get_raw_samples(self, source_system=None, is_anomaly=None, limit=200, course_code=None):
        def _query(db):
            samples = []

            if source_system is None or source_system == "学生申请表":
                q1 = db.query(RawStudentApplication)
                if is_anomaly is not None:
                    q1 = q1.filter(RawStudentApplication.is_anomaly == bool(is_anomaly))
                if course_code:
                    q1 = q1.filter(RawStudentApplication.course_code == course_code)
                for r in q1.limit(limit).all():
                    samples.append({
                        "sample_id": f"RAW{r.id:07d}",
                        "source_system": "学生申请表",
                        "batch_id": r.batch_id,
                        "source_id": r.source_id,
                        "raw_payload": json.dumps(r.raw_payload, ensure_ascii=False) if r.raw_payload else "",
                        "is_processed": r.is_processed,
                        "is_anomaly": r.is_anomaly,
                        "anomaly_note": r.anomaly_note or "",
                        "synced_at": r.synced_at.strftime("%Y-%m-%d %H:%M:%S") if r.synced_at else None,
                        "course_code": r.course_code,
                        "student_id": r.student_id,
                    })

            if source_system is None or source_system == "教学平台":
                q2 = db.query(RawTeachingPlatform)
                if is_anomaly is not None:
                    q2 = q2.filter(RawTeachingPlatform.is_anomaly == bool(is_anomaly))
                if course_code:
                    q2 = q2.filter(RawTeachingPlatform.course_code == course_code)
                for r in q2.limit(limit).all():
                    samples.append({
                        "sample_id": f"RAW{r.id:07d}",
                        "source_system": "教学平台",
                        "batch_id": r.batch_id,
                        "source_id": r.source_id,
                        "raw_payload": json.dumps(r.raw_payload, ensure_ascii=False) if r.raw_payload else "",
                        "is_processed": r.is_processed,
                        "is_anomaly": r.is_anomaly,
                        "anomaly_note": r.anomaly_note or "",
                        "synced_at": r.synced_at.strftime("%Y-%m-%d %H:%M:%S") if r.synced_at else None,
                        "course_code": r.course_code,
                        "data_type": r.data_type,
                    })

            if source_system is None or source_system == "一卡通系统":
                q3 = db.query(RawSmartCard)
                if is_anomaly is not None:
                    q3 = q3.filter(RawSmartCard.is_anomaly == bool(is_anomaly))
                for r in q3.limit(limit).all():
                    samples.append({
                        "sample_id": f"RAW{r.id:07d}",
                        "source_system": "一卡通系统",
                        "batch_id": r.batch_id,
                        "source_id": r.source_id,
                        "raw_payload": json.dumps(r.raw_payload, ensure_ascii=False) if r.raw_payload else "",
                        "is_processed": r.is_processed,
                        "is_anomaly": r.is_anomaly,
                        "anomaly_note": r.anomaly_note or "",
                        "synced_at": r.synced_at.strftime("%Y-%m-%d %H:%M:%S") if r.synced_at else None,
                        "student_id": r.student_id,
                        "card_id": r.card_id,
                    })

            samples.sort(key=lambda x: x.get("synced_at", "") or "", reverse=True)
            return samples[:limit]
        return self._query_to_df(_query)

    def get_duration_stats(self, academic_term=None, college=None, course_type=None):
        def _query(db):
            apps_df = self.get_applications(
                academic_term=academic_term,
                college=college,
                course_type=course_type
            )
            if apps_df.empty:
                return pd.DataFrame(columns=["phase", "interval", "count", "percentage"])

            bins = [0, 4, 8, 12, 24, 48, 72, 99999]
            labels = ["0-4h", "4-8h", "8-12h", "12-24h", "24-48h", "48-72h", ">72h"]
            phases = [
                ("初审", "first_review_duration"),
                ("排课", "schedule_duration"),
                ("终审", "final_review_duration"),
                ("总计", "total_duration"),
            ]

            rows = []
            for phase_name, col in phases:
                if col in apps_df.columns:
                    valid = apps_df[apps_df[col] > 0][col]
                    if len(valid) > 0:
                        cats = pd.cut(valid, bins=bins, labels=labels, right=False)
                        counts = cats.value_counts().reindex(labels, fill_value=0)
                        total = counts.sum()
                        for lbl, cnt in counts.items():
                            rows.append({
                                "phase": phase_name,
                                "interval": lbl,
                                "count": int(cnt),
                                "percentage": round(cnt / total * 100, 1) if total else 0,
                            })

            df = pd.DataFrame(rows)
            if not df.empty:
                totals = df[df["phase"] == "总计"]["count"].sum()
                first_avg = apps_df[apps_df["first_review_duration"] > 0]["first_review_duration"].mean()
                sched_avg = apps_df[apps_df["schedule_duration"] > 0]["schedule_duration"].mean()
                final_avg = apps_df[apps_df["final_review_duration"] > 0]["final_review_duration"].mean()
                total_avg = apps_df[apps_df["total_duration"] > 0]["total_duration"].mean()
                df.attrs = {
                    "total_avg_hours": round(total_avg, 1) if pd.notna(total_avg) else 0,
                    "first_avg_hours": round(first_avg, 1) if pd.notna(first_avg) else 0,
                    "schedule_avg_hours": round(sched_avg, 1) if pd.notna(sched_avg) else 0,
                    "final_avg_hours": round(final_avg, 1) if pd.notna(final_avg) else 0,
                    "total_applications": totals,
                }
            return df
        return self._query_to_df(_query)

    def get_college_stats(self, academic_term=None):
        def _query(db):
            q = db.query(
                Course.college,
                func.count(Course.id).label("total_courses"),
            ).group_by(Course.college)
            if academic_term:
                q = q.filter(Course.academic_term == academic_term)
            course_stats = {row.college: row.total_courses for row in q.all()}

            apps = self.get_applications(academic_term=academic_term)
            if apps.empty:
                return pd.DataFrame(columns=["college", "total_applications", "success_count", "success_rate", "total_courses"])

            grouped = apps.groupby("college").agg(
                total_applications=("id", "count"),
                success_count=("status", lambda x: (x == "选课成功").sum()),
            ).reset_index()
            grouped["total_courses"] = grouped["college"].map(course_stats).fillna(0)
            grouped["success_rate"] = round(
                grouped["success_count"] / grouped["total_applications"] * 100, 1
            )
            return grouped.to_dict("records")
        return self._query_to_df(_query)

    def get_course_details(self, course_code):
        def _query(db):
            course = db.query(Course).filter(Course.course_code == course_code).first()
            if not course:
                return {}

            course_data = self._enrich_course_with_stats(db, course)

            schedules = db.query(Schedule).filter(Schedule.course_code == course_code).all()
            schedule_dicts = []
            for s in schedules:
                sd = s.to_dict()
                room = db.query(Classroom).filter(Classroom.room_code == s.room_code).first()
                if room:
                    sd["room_type"] = room.room_type
                    sd["building"] = room.building
                    sd["capacity"] = room.capacity
                schedule_dicts.append(sd)

            applications = self.get_applications(course_code=course_code)
            app_dicts = applications.to_dict("records") if not applications.empty else []
            student_ids = [a["student_id"] for a in app_dicts if a.get("student_id")]

            students = []
            if student_ids:
                student_objs = db.query(Student).filter(Student.student_id.in_(student_ids)).all()
                students = [s.to_dict() for s in student_objs]

            raw_samples = self.get_raw_samples(course_code=course_code, limit=50)
            raw_dicts = raw_samples.to_dict("records") if not raw_samples.empty else []

            return {
                "course": course_data,
                "schedules": schedule_dicts,
                "students": students,
                "applications": app_dicts,
                "raw_samples": raw_dicts,
            }
        if not self._db_available:
            return {}
        try:
            with get_db() as db:
                return _query(db)
        except Exception as e:
            logger.error(f"get_course_details 查询失败: {e}")
            return {}

    def get_room_schedule_heatmap(self, room_code, academic_term=None):
        def _query(db):
            schedules = self.get_schedules(academic_term=academic_term, room_code=room_code)
            if schedules.empty:
                schedules = pd.DataFrame(columns=["weekday", "time_slot", "course_code", "course_name", "is_conflict"])

            weekdays = Config.WEEKDAYS[:5]
            slots = Config.TIME_SLOTS
            result = []
            for wd in weekdays:
                for ts in slots:
                    s = schedules[
                        (schedules["weekday"] == wd) &
                        (schedules["time_slot"] == ts)
                    ]
                    if s.empty:
                        result.append({
                            "weekday": wd,
                            "time_slot": ts,
                            "course_code": "",
                            "course_name": "空闲",
                            "is_conflict": 0,
                            "value": 0,
                        })
                    else:
                        row = s.iloc[0]
                        result.append({
                            "weekday": wd,
                            "time_slot": ts,
                            "course_code": row.get("course_code", ""),
                            "course_name": row.get("course_name", ""),
                            "is_conflict": 1 if row.get("is_conflict") else 0,
                            "value": 1,
                        })
            return pd.DataFrame(result)
        return self._query_to_df(_query)


class MockDataService(BaseDataService):
    def __init__(self):
        from utils.mock_data import generate_all_mock_data
        self._data = generate_all_mock_data()

    def _filter(self, df, **filters):
        result = df.copy()
        for key, value in filters.items():
            if value is None or value == [] or value == "":
                continue
            if isinstance(value, list):
                result = result[result[key].isin(value)]
            else:
                result = result[result[key] == value]
        return result

    def get_funnel_data(self, academic_term=None, college=None):
        df = self._data["funnel"].copy()
        if college:
            multiplier = 1.0 if college in ["计算机学院", "数学学院"] else (0.85 if college in ["物理学院"] else 0.75)
            df["count"] = (df["count"] * multiplier).astype(int)
        return df

    def get_courses(self, academic_term=None, college=None, course_type=None, has_conflict=None):
        df = self._data["courses"].copy()
        df = self._filter(df, academic_term=academic_term, college=college, course_type=course_type,
                            has_conflict=has_conflict)
        return df

    def get_classrooms(self, building=None, room_type=None, has_conflict=None):
        df = self._data["classrooms"].copy()
        df = self._filter(df, building=building, room_type=room_type, has_conflict=has_conflict)
        return df

    def get_students(self, college=None, grade=None, is_verified=None):
        df = self._data["students"].copy()
        df = self._filter(df, college=college, grade=grade, is_verified=is_verified)
        return df

    def get_applications(self, academic_term=None, college=None, status=None, has_conflict=None,
                         student_id=None, course_code=None, course_type=None,
                         start_date=None, end_date=None):
        df = self._data["applications"].copy()
        df = self._filter(df, academic_term=academic_term, college=college, status=status,
                            has_conflict=has_conflict)
        if student_id:
            df = df[df["student_id"] == student_id]
        if course_code:
            df = df[df["course_code"] == course_code]
        if course_type and "course_code" in df.columns:
            course_codes = self._data["courses"][
                self._data["courses"]["course_type"] == course_type
            ]["course_code"].tolist()
            df = df[df["course_code"].isin(course_codes)]
        if start_date and "submitted_at" in df.columns:
            df["submitted_at_dt"] = pd.to_datetime(df["submitted_at"], errors="coerce")
            df = df[df["submitted_at_dt"] >= pd.to_datetime(start_date)]
            df = df.drop(columns=["submitted_at_dt"])
        if end_date and "submitted_at" in df.columns:
            df["submitted_at_dt"] = pd.to_datetime(df["submitted_at"], errors="coerce")
            df = df[df["submitted_at_dt"] <= pd.to_datetime(end_date) + pd.Timedelta(days=1)]
            df = df.drop(columns=["submitted_at_dt"])
        return df

    def get_schedules(self, academic_term=None, course_code=None, room_code=None, is_conflict=None):
        df = self._data["schedules"].copy()
        df = self._filter(df, academic_term=academic_term, is_conflict=is_conflict)
        if course_code:
            df = df[df["course_code"].astype(str) == str(course_code)]
        if room_code:
            df = df[df["room_code"].astype(str) == str(room_code)]
        return df

    def get_conflicts(self, academic_term=None, status=None, severity=None):
        df = self._data["conflicts"].copy()
        df = self._filter(df, academic_term=academic_term, status=status, severity=severity)
        return df

    def get_anomalies(self, source_system=None, anomaly_type=None, severity=None, status=None):
        df = self._data["anomalies"].copy()
        df = self._filter(df, source_system=source_system, anomaly_type=anomaly_type,
                            severity=severity, status=status)
        return df

    def get_sync_logs(self, source_system=None, status=None, limit=50):
        df = self._data["sync_logs"].copy()
        df = self._filter(df, source_system=source_system, status=status)
        return df.head(limit)

    def get_raw_samples(self, source_system=None, is_anomaly=None, limit=200, course_code=None):
        df = self._data["raw_samples"].copy()
        df = self._filter(df, source_system=source_system, is_anomaly=is_anomaly)
        if course_code:
            df = df[df["course_code"].astype(str) == str(course_code)]
        return df.head(limit)

    def get_duration_stats(self, academic_term=None, college=None, course_type=None):
        apps = self.get_applications(
            academic_term=academic_term,
            college=college,
            course_type=course_type
        )
        if apps.empty:
            return self._data["duration_stats"].copy()

        bins = [0, 4, 8, 12, 24, 48, 72, 99999]
        labels = ["0-4h", "4-8h", "8-12h", "12-24h", "24-48h", "48-72h", ">72h"]
        phases = [
            ("初审", "first_review_duration"),
            ("排课", "schedule_duration"),
            ("终审", "final_review_duration"),
            ("总计", "total_duration"),
        ]

        rows = []
        for phase_name, col in phases:
            if col in apps.columns:
                valid = apps[apps[col] > 0][col]
                if len(valid) > 0:
                    cats = pd.cut(valid, bins=bins, labels=labels, right=False)
                    counts = cats.value_counts().reindex(labels, fill_value=0)
                    total = counts.sum()
                    for lbl, cnt in counts.items():
                        rows.append({
                            "phase": phase_name,
                            "interval": lbl,
                            "count": int(cnt),
                            "percentage": round(cnt / total * 100, 1) if total else 0,
                        })

        df = pd.DataFrame(rows)
        if not df.empty:
            totals = df[df["phase"] == "总计"]["count"].sum()
            first_avg = apps[apps["first_review_duration"] > 0]["first_review_duration"].mean()
            sched_avg = apps[apps["schedule_duration"] > 0]["schedule_duration"].mean()
            final_avg = apps[apps["final_review_duration"] > 0]["final_review_duration"].mean()
            total_avg = apps[apps["total_duration"] > 0]["total_duration"].mean()
            df.attrs = {
                "total_avg_hours": round(total_avg, 1) if pd.notna(total_avg) else 0,
                "first_avg_hours": round(first_avg, 1) if pd.notna(first_avg) else 0,
                "schedule_avg_hours": round(sched_avg, 1) if pd.notna(sched_avg) else 0,
                "final_avg_hours": round(final_avg, 1) if pd.notna(final_avg) else 0,
                "total_applications": totals,
            }
        return df

    def get_college_stats(self, academic_term=None):
        return self._data["colleges"].copy()

    def get_course_details(self, course_code):
        df = self._data["courses"]
        course_row = df[df["course_code"] == course_code]
        if course_row.empty:
            return {}
        course = course_row.iloc[0].to_dict()

        schedules = self._data["schedules"]
        course_sched = schedules[schedules["course_code"] == course_code].to_dict("records")

        apps = self._data["applications"]
        course_apps = apps[apps["course_code"] == course_code]
        students_ids = course_apps["student_id"].unique().tolist()

        students = self._data["students"]
        course_students = students[students["student_id"].isin(students_ids)].to_dict("records")

        raw = self._data["raw_samples"]
        course_raw = raw[raw["course_code"].astype(str) == str(course_code)].head(50).to_dict("records")

        return {
            "course": course,
            "schedules": course_sched,
            "students": course_students,
            "applications": course_apps.to_dict("records"),
            "raw_samples": course_raw,
        }

    def get_room_schedule_heatmap(self, room_code, academic_term=None):
        schedules = self._data["schedules"]
        room_sched = schedules[schedules["room_code"] == room_code]

        weekdays = Config.WEEKDAYS[:5]
        slots = Config.TIME_SLOTS
        result = []
        for wd in weekdays:
            for ts in slots:
                s = room_sched[(room_sched["weekday"] == wd) & (room_sched["time_slot"] == ts)]
                if s.empty:
                    result.append({
                        "weekday": wd,
                        "time_slot": ts,
                        "course_code": "",
                        "course_name": "空闲",
                        "is_conflict": 0,
                        "value": 0,
                    })
                else:
                    row = s.iloc[0]
                    result.append({
                        "weekday": wd,
                        "time_slot": ts,
                        "course_code": row["course_code"],
                        "course_name": row["course_name"],
                        "is_conflict": 1 if row.get("is_conflict") else 0,
                        "value": 1,
                    })
        return pd.DataFrame(result)
