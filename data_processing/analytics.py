import pandas as pd
import numpy as np
from datetime import date, timedelta, datetime, time
from typing import Optional, List, Tuple

from utils.db_adapter import (
    get_session,
    Appointment, CourseSchedule, AttendanceRecord, AccessRecord,
    RescheduleRecord, Region, Coach, Member, ConflictRecord,
)


def _orm_query_to_df(query, session):
    from sqlalchemy.orm import class_mapper
    needs_expand = False
    mapper = None
    if len(query.column_descriptions) == 1:
        desc = query.column_descriptions[0]
        entity = desc.get("entity")
        expr = desc.get("expr")
        if entity is not None and entity is expr:
            try:
                mapper = class_mapper(entity)
                needs_expand = True
            except Exception:
                pass

    if needs_expand and mapper:
        cols = [c for c in mapper.columns]
        query = query.with_entities(*cols)

    result = session.execute(query.statement)
    columns = list(result.keys())
    data = [dict(zip(columns, row)) for row in result.fetchall()]
    return pd.DataFrame(data, columns=columns) if data else pd.DataFrame(columns=columns)


def _sql_to_df(statement, session):
    result = session.execute(statement)
    columns = list(result.keys())
    data = [dict(zip(columns, row)) for row in result.fetchall()]
    return pd.DataFrame(data, columns=columns) if data else pd.DataFrame(columns=columns)


def get_regions_df() -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(Region)
        return _orm_query_to_df(query, session)
    finally:
        session.close()


def get_coaches_df() -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(Coach)
        return _orm_query_to_df(query, session)
    finally:
        session.close()


def get_appointments_df(start_date: date, end_date: date,
                        region_ids: Optional[List[int]] = None) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(
            Appointment.id.label("id"),
            Appointment.appointment_no,
            Appointment.schedule_id,
            CourseSchedule.schedule_no,
            Appointment.member_id,
            Appointment.coach_id,
            Appointment.region_id,
            Appointment.appointment_date,
            Appointment.start_time,
            Appointment.end_time,
            Appointment.status,
            Appointment.booked_at,
            Appointment.cancelled_at,
            Appointment.cancel_reason,
            Appointment.is_rescheduled,
            Appointment.original_appointment_no,
            Appointment.batch_no,
            Appointment.created_at,
            Appointment.updated_at,
            Region.region_name,
            Coach.coach_name,
            Member.member_name,
            Member.member_no.label("member_code"),
            CourseSchedule.course_type,
            CourseSchedule.course_name,
            CourseSchedule.max_capacity,
            CourseSchedule.actual_capacity,
        ).outerjoin(Region, Appointment.region_id == Region.id
        ).outerjoin(Coach, Appointment.coach_id == Coach.id
        ).outerjoin(Member, Appointment.member_id == Member.id
        ).outerjoin(CourseSchedule, Appointment.schedule_id == CourseSchedule.id
        ).filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date
        )
        if region_ids:
            query = query.filter(Appointment.region_id.in_(region_ids))
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["appointment_date"] = pd.to_datetime(df["appointment_date"]).dt.date
            df["start_time_str"] = df["start_time"].astype(str)
            df["hour"] = df["start_time_str"].str.slice(0, 2).astype(int)
            df["time_slot"] = df["hour"].apply(lambda h: f"{h:02d}:00-{h+1:02d}:00")
            df["weekday_idx"] = pd.to_datetime(df["appointment_date"]).dt.weekday
            df["weekday"] = pd.to_datetime(df["appointment_date"]).dt.day_name()
            df["is_weekend"] = pd.to_datetime(df["appointment_date"]).dt.weekday >= 5
        return df
    finally:
        session.close()


def get_schedules_df(start_date: date, end_date: date,
                     region_ids: Optional[List[int]] = None) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(
            CourseSchedule.id.label("id"),
            CourseSchedule.schedule_no,
            CourseSchedule.course_date,
            CourseSchedule.start_time,
            CourseSchedule.end_time,
            CourseSchedule.coach_id,
            CourseSchedule.region_id,
            CourseSchedule.course_type,
            CourseSchedule.course_name,
            CourseSchedule.max_capacity,
            CourseSchedule.actual_capacity,
            CourseSchedule.status,
            CourseSchedule.batch_no,
            CourseSchedule.created_at,
            CourseSchedule.updated_at,
            Region.region_name,
            Coach.coach_name,
        ).outerjoin(Region, CourseSchedule.region_id == Region.id
        ).outerjoin(Coach, CourseSchedule.coach_id == Coach.id
        ).filter(
            CourseSchedule.course_date >= start_date,
            CourseSchedule.course_date <= end_date
        )
        if region_ids:
            query = query.filter(CourseSchedule.region_id.in_(region_ids))
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["course_date"] = pd.to_datetime(df["course_date"]).dt.date
            df["start_time_str"] = df["start_time"].astype(str)
            df["hour"] = df["start_time_str"].str.slice(0, 2).astype(int)
            df["time_slot"] = df["hour"].apply(lambda h: f"{h:02d}:00-{h+1:02d}:00")
            df["utilization_rate"] = np.where(
                df["max_capacity"] > 0,
                df["actual_capacity"] / df["max_capacity"], 0
            )
        return df
    finally:
        session.close()


def get_attendance_df(start_date: date, end_date: date,
                      region_ids: Optional[List[int]] = None) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(
            AttendanceRecord,
            Appointment.appointment_date,
            Appointment.start_time,
            Appointment.status.label("appt_status"),
            Region.region_name,
            Coach.coach_name,
            Member.member_name,
        ).outerjoin(Appointment, AttendanceRecord.appointment_no == Appointment.appointment_no
        ).outerjoin(Region, AttendanceRecord.region_id == Region.id
        ).outerjoin(Coach, AttendanceRecord.coach_id == Coach.id
        ).outerjoin(Member, AttendanceRecord.member_id == Member.id
        ).filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date
        )
        if region_ids:
            query = query.filter(AttendanceRecord.region_id.in_(region_ids))
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["appointment_date"] = pd.to_datetime(df["appointment_date"]).dt.date
        return df
    finally:
        session.close()


def get_reschedule_df(start_date: date, end_date: date) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(RescheduleRecord).filter(
            ((RescheduleRecord.old_date >= start_date) & (RescheduleRecord.old_date <= end_date)) |
            ((RescheduleRecord.new_date >= start_date) & (RescheduleRecord.new_date <= end_date))
        )
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["old_date"] = pd.to_datetime(df["old_date"]).dt.date
            df["new_date"] = pd.to_datetime(df["new_date"]).dt.date
            df["rescheduled_at"] = pd.to_datetime(df["rescheduled_at"])
        return df
    finally:
        session.close()


def get_access_df(start_date: date, end_date: date,
                  region_ids: Optional[List[int]] = None) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(
            AccessRecord,
            Region.region_name,
        ).outerjoin(Region, AccessRecord.region_id == Region.id
        ).filter(
            AccessRecord.access_date >= start_date,
            AccessRecord.access_date <= end_date
        )
        if region_ids:
            query = query.filter(AccessRecord.region_id.in_(region_ids))
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["access_date"] = pd.to_datetime(df["access_date"]).dt.date
            df["access_time"] = pd.to_datetime(df["access_time"])
            df["hour"] = df["access_time"].dt.hour
        return df
    finally:
        session.close()


def get_conflicts_df(start_date: date, end_date: date) -> pd.DataFrame:
    session = get_session()
    try:
        query = session.query(
            ConflictRecord.id.label("id"),
            ConflictRecord.conflict_no,
            ConflictRecord.conflict_type,
            ConflictRecord.region_id,
            ConflictRecord.coach_id,
            ConflictRecord.member_id,
            ConflictRecord.conflict_date,
            ConflictRecord.conflict_start_time,
            ConflictRecord.conflict_end_time,
            ConflictRecord.appointment_no_1,
            ConflictRecord.appointment_no_2,
            ConflictRecord.schedule_no_1,
            ConflictRecord.schedule_no_2,
            ConflictRecord.description,
            ConflictRecord.severity,
            ConflictRecord.is_resolved,
            ConflictRecord.resolved_at,
            ConflictRecord.resolution_note,
            ConflictRecord.detected_at,
            Region.region_name,
            Coach.coach_name,
            Member.member_name,
        ).outerjoin(Region, ConflictRecord.region_id == Region.id
        ).outerjoin(Coach, ConflictRecord.coach_id == Coach.id
        ).outerjoin(Member, ConflictRecord.member_id == Member.id
        ).filter(
            ConflictRecord.conflict_date >= start_date,
            ConflictRecord.conflict_date <= end_date
        )
        df = _orm_query_to_df(query, session)
        if not df.empty:
            df["conflict_date"] = pd.to_datetime(df["conflict_date"]).dt.date
            df["detected_at"] = pd.to_datetime(df["detected_at"])
            df["is_resolved"] = df["is_resolved"].fillna(False).astype(bool)
        return df
    finally:
        session.close()


def compute_week_over_week(df: pd.DataFrame, date_col: str,
                           value_cols: List[str],
                           date_freq: str = "D") -> pd.DataFrame:
    if df.empty:
        return df

    df_temp = df.copy()
    df_temp[date_col] = pd.to_datetime(df_temp[date_col])
    df_temp = df_temp.set_index(date_col)

    daily = df_temp[value_cols].resample(date_freq).sum()
    daily["woy"] = daily.index.isocalendar().week.astype(int)
    daily["dow"] = daily.index.dayofweek

    merged = daily.merge(
        daily.shift(7),
        left_index=True,
        right_index=True,
        suffixes=("_current", "_last_week"),
        how="left"
    )

    for col in value_cols:
        cur = f"{col}_current"
        lw = f"{col}_last_week"
        wow = f"{col}_wow_pct"
        if cur in merged.columns and lw in merged.columns:
            merged[wow] = np.where(
                merged[lw] > 0,
                (merged[cur] - merged[lw]) / merged[lw] * 100,
                np.nan
            )

    return merged.reset_index()


def compute_period_over_period(current_df: pd.DataFrame,
                               compare_df: pd.DataFrame,
                               group_cols: List[str],
                               value_cols: List[str]) -> pd.DataFrame:
    if current_df.empty:
        return pd.DataFrame()

    cur = current_df.groupby(group_cols, as_index=False, dropna=False)[value_cols].sum()
    cur = cur.rename(columns={c: f"{c}_current" for c in value_cols})

    if compare_df.empty:
        for c in value_cols:
            cur[f"{c}_compare"] = 0
            cur[f"{c}_pop_pct"] = np.nan
        return cur

    comp = compare_df.groupby(group_cols, as_index=False, dropna=False)[value_cols].sum()
    comp = comp.rename(columns={c: f"{c}_compare" for c in value_cols})

    merged = cur.merge(comp, on=group_cols, how="outer").fillna(0)
    for c in value_cols:
        cur_col = f"{c}_current"
        comp_col = f"{c}_compare"
        pct_col = f"{c}_pop_pct"
        merged[pct_col] = np.where(
            merged[comp_col] > 0,
            (merged[cur_col] - merged[comp_col]) / merged[comp_col] * 100,
            np.nan
        )

    return merged


def calculate_attendance_rate(appointments_df: pd.DataFrame) -> pd.DataFrame:
    if appointments_df.empty:
        return pd.DataFrame(
            columns=["appointment_date", "region_name", "total_appointments",
                     "attended", "cancelled", "no_show", "booked",
                     "attendance_rate", "cancel_rate", "no_show_rate"]
        )

    total = appointments_df.groupby(
        ["appointment_date", "region_name"],
        as_index=False, dropna=False
    ).agg(
        total_appointments=("appointment_no", "nunique"),
        attended=("status", lambda x: (x == "attended").sum()),
        cancelled=("status", lambda x: (x == "cancelled").sum()),
        no_show=("status", lambda x: (x == "no_show").sum()),
        booked=("status", lambda x: (x == "booked").sum()),
    )

    total["attendance_rate"] = np.where(
        total["total_appointments"] > 0,
        total["attended"] / total["total_appointments"] * 100,
        0
    )
    total["cancel_rate"] = np.where(
        total["total_appointments"] > 0,
        total["cancelled"] / total["total_appointments"] * 100,
        0
    )
    total["no_show_rate"] = np.where(
        total["total_appointments"] > 0,
        total["no_show"] / total["total_appointments"] * 100,
        0
    )
    return total


def calculate_capacity_utilization(schedules_df: pd.DataFrame) -> pd.DataFrame:
    if schedules_df.empty:
        return pd.DataFrame(
            columns=["course_date", "region_name", "time_slot",
                     "total_slots", "total_max_capacity", "total_actual_capacity",
                     "utilization_rate", "fill_rate"]
        )

    grouped = schedules_df.groupby(
        ["course_date", "region_name", "time_slot"],
        as_index=False, dropna=False
    ).agg(
        total_slots=("schedule_no", "nunique"),
        total_max_capacity=("max_capacity", "sum"),
        total_actual_capacity=("actual_capacity", "sum"),
    )

    grouped["utilization_rate"] = np.where(
        grouped["total_max_capacity"] > 0,
        grouped["total_actual_capacity"] / grouped["total_max_capacity"] * 100,
        0
    )

    def _fill_rate(g):
        return (g > 0).sum() / max(1, len(g)) * 100

    fill = schedules_df.groupby(
        ["course_date", "region_name", "time_slot"],
        as_index=False, dropna=False
    )["actual_capacity"].apply(_fill_rate)
    fill.columns = list(fill.columns[:-1]) + ["fill_rate"]
    if "fill_rate" in fill.columns:
        grouped = grouped.merge(
            fill[["course_date", "region_name", "time_slot", "fill_rate"]],
            on=["course_date", "region_name", "time_slot"],
            how="left"
        )
    else:
        grouped["fill_rate"] = grouped["utilization_rate"]

    return grouped


def calculate_hourly_distribution(df: pd.DataFrame, date_col: str,
                                  hour_col: str, value_col: str) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["hour", "count", "time_slot"])
    hourly = df.groupby(hour_col, as_index=False)[value_col].count()
    hourly.columns = ["hour", "count"]
    hourly["time_slot"] = hourly["hour"].apply(lambda h: f"{int(h):02d}:00")
    return hourly.sort_values("hour").reset_index(drop=True)


def get_prev_period_dates(current_start: date, current_end: date,
                          mode: str = "week") -> Tuple[date, date]:
    duration = (current_end - current_start).days + 1
    if mode == "week":
        prev_start = current_start - timedelta(days=7)
        prev_end = current_end - timedelta(days=7)
    elif mode == "month":
        prev_start = current_start - timedelta(days=30)
        prev_end = prev_start + timedelta(days=duration - 1)
    elif mode == "yoy":
        try:
            prev_start = date(current_start.year - 1, current_start.month, current_start.day)
            prev_end = date(current_end.year - 1, current_end.month, current_end.day)
        except ValueError:
            prev_start = current_start - timedelta(days=365)
            prev_end = current_end - timedelta(days=365)
    else:
        prev_start = current_start - timedelta(days=duration)
        prev_end = prev_start + timedelta(days=duration - 1)
    return prev_start, prev_end


def inject_overload_schedules(overload_ratio: float = 0.08,
                              max_overload: int = 3) -> int:
    import random as _random
    session = get_session()
    try:
        query = session.query(CourseSchedule).filter(
            CourseSchedule.max_capacity >= 1,
            CourseSchedule.actual_capacity <= CourseSchedule.max_capacity,
        )
        count = query.count()
        if count == 0:
            return 0

        targets = query.all()
        n_update = max(1, int(count * overload_ratio))
        selected = _random.sample(targets, min(n_update, len(targets)))
        updated = 0
        for sched in selected:
            extra = _random.randint(1, max_overload)
            new_actual = sched.max_capacity + extra
            sched.actual_capacity = new_actual
            updated += 1
        session.commit()
        return updated
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def detect_conflicts(appointments_df: pd.DataFrame, schedules_df: pd.DataFrame,
                     persist: bool = False) -> pd.DataFrame:
    conflicts = []

    if appointments_df.empty:
        return pd.DataFrame()

    coach_cols_needed = ["coach_id", "appointment_date", "start_time", "end_time"]
    if all(c in appointments_df.columns for c in coach_cols_needed):
        df_sorted = appointments_df.sort_values(
            ["coach_id", "appointment_date", "start_time"]
        ).copy()
        df_sorted["end_time_str"] = df_sorted["end_time"].astype(str)
        df_sorted["start_time_str"] = df_sorted["start_time"].astype(str)
        df_sorted["next_start"] = df_sorted.groupby(
            ["coach_id", "appointment_date"]
        )["start_time_str"].shift(-1)
        df_sorted["next_appt_no"] = df_sorted.groupby(
            ["coach_id", "appointment_date"]
        )["appointment_no"].shift(-1)

        mask = df_sorted["next_start"].notna() & (df_sorted["end_time_str"] > df_sorted["next_start"])
        coach_conflicts = df_sorted[mask]

        for _, row in coach_conflicts.iterrows():
            try:
                ct_st = datetime.strptime(str(row["conflict_start_time"]) if "conflict_start_time" in row else str(row["start_time"]), "%H:%M:%S").time()
            except:
                ct_st = time(0, 0)
            try:
                ct_et = datetime.strptime(str(row.get("next_start") or row["end_time"]), "%H:%M:%S").time()
            except:
                ct_et = time(0, 0)

            conflicts.append({
                "conflict_no": f"CF{datetime.now().strftime('%Y%m%d%H%M%S')}{len(conflicts):05d}",
                "conflict_type": "coach_double_book",
                "region_id": row.get("region_id"),
                "coach_id": row.get("coach_id"),
                "member_id": row.get("member_id"),
                "conflict_date": row.get("appointment_date"),
                "conflict_start_time": ct_st,
                "conflict_end_time": ct_et,
                "appointment_no_1": row.get("appointment_no"),
                "appointment_no_2": row.get("next_appt_no"),
                "description": f"教练ID={row.get('coach_id')} 课程重叠: {row.get('start_time')}-{row.get('end_time')} 与 {row.get('next_start')}",
                "severity": "error",
            })

    member_cols_needed = ["member_id", "appointment_date", "start_time", "end_time"]
    if all(c in appointments_df.columns for c in member_cols_needed):
        df_member = appointments_df.sort_values(
            ["member_id", "appointment_date", "start_time"]
        ).copy()
        df_member["end_time_str"] = df_member["end_time"].astype(str)
        df_member["start_time_str"] = df_member["start_time"].astype(str)
        df_member["next_start"] = df_member.groupby(
            ["member_id", "appointment_date"]
        )["start_time_str"].shift(-1)
        df_member["next_appt_no"] = df_member.groupby(
            ["member_id", "appointment_date"]
        )["appointment_no"].shift(-1)

        mask_m = df_member["next_start"].notna() & (df_member["end_time_str"] > df_member["next_start"])
        member_conflicts = df_member[mask_m]
        for _, row in member_conflicts.iterrows():
            try:
                ct_st = datetime.strptime(str(row["start_time"]), "%H:%M:%S").time()
            except:
                ct_st = time(0, 0)
            try:
                ct_et = datetime.strptime(str(row.get("next_start") or row["end_time"]), "%H:%M:%S").time()
            except:
                ct_et = time(0, 0)
            conflicts.append({
                "conflict_no": f"CF{datetime.now().strftime('%Y%m%d%H%M%S')}{len(conflicts):05d}",
                "conflict_type": "member_double_book",
                "region_id": row.get("region_id"),
                "coach_id": row.get("coach_id"),
                "member_id": row.get("member_id"),
                "conflict_date": row.get("appointment_date"),
                "conflict_start_time": ct_st,
                "conflict_end_time": ct_et,
                "appointment_no_1": row.get("appointment_no"),
                "appointment_no_2": row.get("next_appt_no"),
                "description": f"会员ID={row.get('member_id')} 课程重叠: {row.get('start_time')}-{row.get('end_time')} 与 {row.get('next_start')}",
                "severity": "warning",
            })

    if not schedules_df.empty and "max_capacity" in schedules_df.columns and "actual_capacity" in schedules_df.columns:
        overloaded = schedules_df[schedules_df["actual_capacity"] > schedules_df["max_capacity"]]
        for _, row in overloaded.iterrows():
            try:
                ct_st = datetime.strptime(str(row["start_time"]), "%H:%M:%S").time()
            except:
                ct_st = time(0, 0)
            try:
                ct_et = datetime.strptime(str(row["end_time"]), "%H:%M:%S").time()
            except:
                ct_et = time(0, 0)
            conflicts.append({
                "conflict_no": f"CF{datetime.now().strftime('%Y%m%d%H%M%S')}{len(conflicts):05d}",
                "conflict_type": "capacity_exceeded",
                "region_id": row.get("region_id"),
                "coach_id": row.get("coach_id"),
                "conflict_date": row.get("course_date"),
                "conflict_start_time": ct_st,
                "conflict_end_time": ct_et,
                "schedule_no_1": row.get("schedule_no"),
                "description": f"时段超容: 实际{row.get('actual_capacity')}/{row.get('max_capacity')}",
                "severity": "warning",
            })

    conflicts_df = pd.DataFrame(conflicts)

    if persist and not conflicts_df.empty:
        from utils.db_adapter import ConflictRecord as CRModel
        session = get_session()
        try:
            for _, row in conflicts_df.iterrows():
                ct = row.get("conflict_type")
                if ct == "capacity_exceeded":
                    keys = ["conflict_type", "conflict_date", "schedule_no_1"]
                else:
                    keys = ["conflict_type", "conflict_date", "appointment_no_1", "appointment_no_2"]
                filters = {}
                for key in keys:
                    if pd.notna(row.get(key)) and row.get(key) not in (None, ""):
                        filters[key] = row[key]
                if not filters:
                    continue
                existing = session.query(CRModel).filter_by(**filters).first()
                if not existing:
                    obj_dict = {}
                    for k, v in row.to_dict().items():
                        if k not in [c.name for c in CRModel.__table__.columns]:
                            continue
                        if isinstance(v, float) and np.isnan(v):
                            obj_dict[k] = None
                        else:
                            obj_dict[k] = v
                    session.add(CRModel(**obj_dict))
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"持久化冲突失败: {e}")
        finally:
            session.close()

    return conflicts_df


def analyze_reschedule_impact(reschedule_df: pd.DataFrame,
                              appointments_df: pd.DataFrame) -> dict:
    if reschedule_df.empty:
        return {
            "total_reschedules": 0,
            "by_reason": pd.DataFrame(columns=["reschedule_reason", "count", "pct"]),
            "by_type": pd.DataFrame(columns=["reschedule_type", "count", "pct"]),
            "date_shift_dist": pd.DataFrame(columns=["shift_group", "count"]),
            "appointment_impact": 0.0,
        }

    total = len(reschedule_df)
    by_reason = reschedule_df.groupby("reschedule_reason", dropna=False).size().reset_index(name="count")
    by_reason["pct"] = by_reason["count"] / total * 100
    by_reason = by_reason.sort_values("count", ascending=False).reset_index(drop=True)

    by_type = reschedule_df.groupby("reschedule_type", dropna=False).size().reset_index(name="count")
    by_type["pct"] = by_type["count"] / total * 100
    by_type = by_type.sort_values("count", ascending=False).reset_index(drop=True)

    reschedule_df["date_shift_days"] = (
        pd.to_datetime(reschedule_df["new_date"]) -
        pd.to_datetime(reschedule_df["old_date"])
    ).dt.days

    shift_bins = [-365, -14, -7, -2, -1, 0, 1, 2, 7, 14, 365]
    shift_labels = ["<-14天", "-14~-7天", "-7~-2天", "-2~-1天", "提前1天内",
                    "当天", "延后1天内", "延后2~7天", "延后7~14天", ">14天"]
    reschedule_df["shift_group"] = pd.cut(
        reschedule_df["date_shift_days"],
        bins=shift_bins,
        labels=shift_labels,
        include_lowest=True
    )
    date_shift_dist = reschedule_df.groupby(
        "shift_group", observed=True, dropna=False
    ).size().reset_index(name="count")

    total_appointments = len(appointments_df) if not appointments_df.empty else 0
    impact = (total / total_appointments * 100) if total_appointments > 0 else 0.0

    return {
        "total_reschedules": total,
        "by_reason": by_reason,
        "by_type": by_type,
        "date_shift_dist": date_shift_dist,
        "appointment_impact": impact,
    }


def get_multi_region_comparison(appointments_df: pd.DataFrame,
                                schedules_df: pd.DataFrame = None) -> pd.DataFrame:
    if appointments_df.empty:
        return pd.DataFrame(
            columns=["region_name", "total_appointments", "attended", "cancelled",
                     "no_show", "rescheduled_count", "attendance_rate",
                     "cancel_rate", "reschedule_rate"]
        )

    appt_stats = appointments_df.groupby("region_name", as_index=False, dropna=False).agg(
        total_appointments=("appointment_no", "nunique"),
        attended=("status", lambda x: (x == "attended").sum()),
        cancelled=("status", lambda x: (x == "cancelled").sum()),
        no_show=("status", lambda x: (x == "no_show").sum()),
        rescheduled_count=("is_rescheduled", lambda s: s.sum() if s.dtype == bool else (s == True).sum()),
    )

    appt_stats["attendance_rate"] = np.where(
        appt_stats["total_appointments"] > 0,
        appt_stats["attended"] / appt_stats["total_appointments"] * 100, 0
    )
    appt_stats["cancel_rate"] = np.where(
        appt_stats["total_appointments"] > 0,
        appt_stats["cancelled"] / appt_stats["total_appointments"] * 100, 0
    )
    appt_stats["reschedule_rate"] = np.where(
        appt_stats["total_appointments"] > 0,
        appt_stats["rescheduled_count"] / appt_stats["total_appointments"] * 100, 0
    )

    return appt_stats
