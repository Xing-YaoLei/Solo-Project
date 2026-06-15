import pandas as pd
import logging
from datetime import datetime
from config import Config

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
                         student_id=None, course_code=None):
        raise NotImplementedError

    def get_schedules(self, academic_term=None, course_code=None, room_code=None, is_conflict=None):
        raise NotImplementedError

    def get_conflicts(self, academic_term=None, status=None, severity=None):
        raise NotImplementedError

    def get_anomalies(self, source_system=None, anomaly_type=None, severity=None, status=None):
        raise NotImplementedError

    def get_sync_logs(self, source_system=None, status=None, limit=50):
        raise NotImplementedError

    def get_raw_samples(self, source_system=None, is_anomaly=None, limit=200):
        raise NotImplementedError

    def get_duration_stats(self, academic_term=None, college=None):
        raise NotImplementedError

    def get_college_stats(self, academic_term=None):
        raise NotImplementedError

    def get_course_details(self, course_code):
        raise NotImplementedError

    def get_room_schedule_heatmap(self, room_code, academic_term=None):
        raise NotImplementedError


class DataService(BaseDataService):
    def __init__(self):
        try:
            from models import get_db
            self._db_available = True
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
                return result
        except Exception as e:
            logger.error(f"查询失败: {e}")
            return pd.DataFrame()


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
                         student_id=None, course_code=None):
        df = self._data["applications"].copy()
        df = self._filter(df, academic_term=academic_term, college=college, status=status,
                            has_conflict=has_conflict)
        if student_id:
            df = df[df["student_id"] == student_id]
        if course_code:
            df = df[df["course_code"] == course_code]
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

    def get_raw_samples(self, source_system=None, is_anomaly=None, limit=200):
        df = self._data["raw_samples"].copy()
        df = self._filter(df, source_system=source_system, is_anomaly=is_anomaly)
        return df.head(limit)

    def get_duration_stats(self, academic_term=None, college=None):
        df = self._data["duration_stats"].copy()
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
        course_raw = raw[raw["source_system"] == "教学平台"].head(5).to_dict("records")

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
                if not s.empty:
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
