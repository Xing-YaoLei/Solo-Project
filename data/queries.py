import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from sqlalchemy import and_, func, or_
from database.connection import get_session
from database.models import (
    Appointment, Patient, TreatmentPlan, FollowUpTask,
    ImagingRecord, BillingRecord, SyncLog, Doctor
)
from config.settings import Config


def get_cleaning_appointments(start_date=None, end_date=None, include_anomalies=True):
    session = get_session()
    try:
        query = session.query(
            Appointment,
            Patient.name.label("patient_name"),
            Patient.patient_no.label("patient_number"),
            Doctor.name.label("doctor_name"),
            TreatmentPlan.plan_content.label("plan_content"),
            TreatmentPlan.status.label("plan_status"),
            TreatmentPlan.has_cleaning.label("plan_has_cleaning"),
            BillingRecord.total_amount.label("billing_amount"),
            BillingRecord.caliber_changed.label("caliber_changed"),
            BillingRecord.data_version.label("billing_version")
        ).outerjoin(Patient, Appointment.patient_id == Patient.id
        ).outerjoin(Doctor, Appointment.doctor_id == Doctor.id
        ).outerjoin(TreatmentPlan, Appointment.id == TreatmentPlan.appointment_id
        ).outerjoin(BillingRecord, Appointment.id == BillingRecord.appointment_id
        ).filter(Appointment.is_cleaning == True)

        if start_date:
            query = query.filter(Appointment.appointment_date >= start_date)
        if end_date:
            query = query.filter(Appointment.appointment_date <= end_date)

        results = query.all()

        data = []
        for row in results:
            appt = row.Appointment
            anomaly_types = []
            if appt.anomaly_flag:
                anomaly_types = [f for f in appt.anomaly_flag.split("|") if f]

            data.append({
                "id": appt.id,
                "appointment_no": appt.appointment_no,
                "appointment_date": appt.appointment_date,
                "appointment_time": appt.appointment_time,
                "patient_id": appt.patient_id,
                "patient_name": row.patient_name or "未知",
                "patient_number": row.patient_number or "",
                "doctor_name": row.doctor_name or "",
                "procedure_type": appt.procedure_type,
                "procedure_code": appt.procedure_code,
                "status": appt.status,
                "source": appt.source,
                "his_created_at": appt.his_created_at,
                "his_updated_at": appt.his_updated_at,
                "synced_at": appt.synced_at,
                "sync_delay_minutes": appt.sync_delay_minutes or 0,
                "review_note": appt.review_note or "",
                "anomaly_flag": appt.anomaly_flag or "",
                "anomaly_types": anomaly_types,
                "has_his_delay": "HIS_DELAY" in anomaly_types,
                "has_imaging_missing": "IMAGING_MISSING" in anomaly_types,
                "has_billing_caliber": "BILLING_CALIBER" in anomaly_types,
                "plan_content": row.plan_content or "",
                "plan_status": row.plan_status or "",
                "plan_has_cleaning": row.plan_has_cleaning or False,
                "billing_amount": row.billing_amount or 0,
                "caliber_changed": row.caliber_changed or False,
                "billing_version": row.billing_version or "",
                "is_no_show": appt.status in ["no_show", "cancelled", "missed"]
            })

        df = pd.DataFrame(data)
        if not df.empty:
            df["appointment_date"] = pd.to_datetime(df["appointment_date"])
            df["date_str"] = df["appointment_date"].dt.strftime("%Y-%m-%d")
            df["is_weekend"] = df["appointment_date"].dt.dayofweek >= 5

        return df

    finally:
        session.close()


def get_follow_up_tasks(appointment_ids=None, start_date=None, end_date=None):
    session = get_session()
    try:
        query = session.query(
            FollowUpTask,
            Patient.name.label("patient_name"),
            Patient.patient_no.label("patient_number"),
            Appointment.appointment_date.label("original_appt_date"),
            Appointment.status.label("appt_status")
        ).outerjoin(Patient, FollowUpTask.patient_id == Patient.id
        ).outerjoin(Appointment, FollowUpTask.appointment_id == Appointment.id)

        if appointment_ids:
            query = query.filter(FollowUpTask.appointment_id.in_(appointment_ids))
        if start_date:
            query = query.filter(FollowUpTask.task_date >= start_date)
        if end_date:
            query = query.filter(FollowUpTask.task_date <= end_date)

        results = query.all()
        data = []
        for row in results:
            task = row.FollowUpTask
            data.append({
                "task_id": task.id,
                "task_no": task.task_no,
                "appointment_id": task.appointment_id,
                "patient_id": task.patient_id,
                "patient_name": row.patient_name or "未知",
                "patient_number": row.patient_number or "",
                "original_appt_date": row.original_appt_date,
                "appt_status": row.appt_status or "",
                "task_date": task.task_date,
                "task_type": task.task_type or "",
                "assigned_to": task.assigned_to or "",
                "status": task.status,
                "completed_at": task.completed_at,
                "content": task.content or "",
                "result_note": task.result_note or ""
            })

        df = pd.DataFrame(data)
        return df
    finally:
        session.close()


def get_imaging_records(appointment_ids=None, include_missing=True):
    session = get_session()
    try:
        query = session.query(
            ImagingRecord,
            Patient.name.label("patient_name"),
            Patient.patient_no.label("patient_number"),
            Appointment.appointment_date.label("appt_date")
        ).outerjoin(Patient, ImagingRecord.patient_id == Patient.id
        ).outerjoin(Appointment, ImagingRecord.appointment_id == Appointment.id)

        if appointment_ids:
            query = query.filter(ImagingRecord.appointment_id.in_(appointment_ids))
        if not include_missing:
            query = query.filter(ImagingRecord.is_missing == False)

        results = query.all()
        data = []
        for row in results:
            img = row.ImagingRecord
            data.append({
                "image_id": img.id,
                "image_no": img.image_no,
                "appointment_id": img.appointment_id,
                "patient_id": img.patient_id,
                "patient_name": row.patient_name or "未知",
                "patient_number": row.patient_number or "",
                "appt_date": row.appt_date,
                "image_type": img.image_type or "",
                "image_date": img.image_date,
                "storage_path": img.storage_path or "",
                "is_missing": img.is_missing,
                "missing_note": img.missing_note or "",
                "upload_status": img.upload_status,
                "checksum_verified": img.checksum_verified
            })

        return pd.DataFrame(data)
    finally:
        session.close()


def get_treatment_plans(patient_ids=None, start_date=None, end_date=None):
    session = get_session()
    try:
        query = session.query(
            TreatmentPlan,
            Patient.name.label("patient_name"),
            Patient.patient_no.label("patient_number"),
            Appointment.appointment_date.label("appt_date"),
            Appointment.status.label("appt_status")
        ).outerjoin(Patient, TreatmentPlan.patient_id == Patient.id
        ).outerjoin(Appointment, TreatmentPlan.appointment_id == Appointment.id)

        if patient_ids:
            query = query.filter(TreatmentPlan.patient_id.in_(patient_ids))
        if start_date:
            query = query.filter(TreatmentPlan.plan_date >= start_date)
        if end_date:
            query = query.filter(TreatmentPlan.plan_date <= end_date)

        results = query.all()
        data = []
        for row in results:
            plan = row.TreatmentPlan
            data.append({
                "plan_id": plan.id,
                "plan_no": plan.plan_no,
                "appointment_id": plan.appointment_id,
                "patient_id": plan.patient_id,
                "patient_name": row.patient_name or "未知",
                "patient_number": row.patient_number or "",
                "appt_date": row.appt_date,
                "appt_status": row.appt_status or "",
                "plan_date": plan.plan_date,
                "plan_content": plan.plan_content or "",
                "estimated_fee": plan.estimated_fee or 0,
                "actual_fee": plan.actual_fee or 0,
                "status": plan.status,
                "has_cleaning": plan.has_cleaning or False,
                "cleaning_stage": plan.cleaning_stage or ""
            })

        return pd.DataFrame(data)
    finally:
        session.close()


def get_his_sync_logs(limit=100):
    session = get_session()
    try:
        logs = session.query(SyncLog
        ).filter(SyncLog.sync_type == "HIS_SYNC"
        ).order_by(SyncLog.started_at.desc()
        ).limit(limit).all()

        data = []
        for log in logs:
            data.append({
                "log_id": log.id,
                "started_at": log.started_at,
                "completed_at": log.completed_at,
                "status": log.status,
                "records_count": log.records_count or 0,
                "delay_minutes": log.delay_minutes or 0,
                "error_message": log.error_message or ""
            })

        return pd.DataFrame(data)
    finally:
        session.close()


def calculate_return_visit_rate(df_appointments, df_follow_ups=None, window_days=180):
    if df_appointments.empty:
        return pd.DataFrame(), {"total": 0, "returned": 0, "rate": 0, "details": []}

    follow_up_window = timedelta(days=window_days)
    today = pd.Timestamp.today().normalize()

    stats = []
    for _, row in df_appointments.iterrows():
        appt_date = pd.to_datetime(row["appointment_date"]).normalize()
        patient_id = row["patient_id"]

        if today - appt_date < follow_up_window:
            eligible = False
            reason = "未达到随访窗口期"
        else:
            eligible = True
            reason = ""

        if df_follow_ups is not None and not df_follow_ups.empty:
            patient_followups = df_follow_ups[
                (df_follow_ups["patient_id"] == patient_id) &
                (pd.to_datetime(df_follow_ups["task_date"]) > appt_date) &
                (pd.to_datetime(df_follow_ups["task_date"]) <= appt_date + follow_up_window)
            ]
            followup_completed = (patient_followups["status"] == "completed").any()
            followup_count = len(patient_followups)
        else:
            followup_completed = False
            followup_count = 0

        if not df_appointments.empty:
            later_visits = df_appointments[
                (df_appointments["patient_id"] == patient_id) &
                (pd.to_datetime(df_appointments["appointment_date"]) > appt_date) &
                (pd.to_datetime(df_appointments["appointment_date"]) <= appt_date + follow_up_window) &
                (~df_appointments["is_no_show"])
            ]
            return_count = len(later_visits)
        else:
            return_count = 0

        has_returned = (return_count > 0) or followup_completed

        stats.append({
            "appointment_id": row["id"],
            "appointment_no": row["appointment_no"],
            "patient_id": patient_id,
            "patient_name": row["patient_name"],
            "appointment_date": row["appointment_date"],
            "followup_window_end": appt_date + follow_up_window,
            "is_eligible": eligible,
            "not_eligible_reason": reason,
            "followup_tasks_count": followup_count,
            "followup_completed": followup_completed,
            "return_visits_count": return_count,
            "has_returned": has_returned
        })

    df_return = pd.DataFrame(stats)

    eligible_count = df_return["is_eligible"].sum() if not df_return.empty else 0
    returned_count = df_return[df_return["is_eligible"]]["has_returned"].sum() if eligible_count > 0 else 0
    return_rate = (returned_count / eligible_count * 100) if eligible_count > 0 else 0

    summary = {
        "total_cleanings": len(df_appointments),
        "eligible_for_return": int(eligible_count),
        "returned_count": int(returned_count),
        "return_rate": round(return_rate, 2),
        "window_days": window_days,
        "calculation_time": datetime.now().isoformat(),
        "rate_formula": "复诊率 = (180天内复诊或完成随访的人数 / 已过180天随访期的洁牙人数) × 100%"
    }

    return df_return, summary


def aggregate_daily_stats(df_appointments):
    if df_appointments.empty:
        return pd.DataFrame()

    daily = df_appointments.groupby("date_str").agg(
        total_appointments=("id", "count"),
        completed_count=("status", lambda x: (x.isin(["completed", "done"])).sum()),
        no_show_count=("is_no_show", "sum"),
        his_delay_count=("has_his_delay", "sum"),
        imaging_missing_count=("has_imaging_missing", "sum"),
        caliber_change_count=("has_billing_caliber", "sum"),
        total_billing=("billing_amount", "sum"),
        avg_sync_delay=("sync_delay_minutes", "mean")
    ).reset_index()

    daily["no_show_rate"] = (daily["no_show_count"] / daily["total_appointments"] * 100).round(2)
    daily["completion_rate"] = (daily["completed_count"] / daily["total_appointments"] * 100).round(2)
    daily["anomaly_total"] = daily["his_delay_count"] + daily["imaging_missing_count"] + daily["caliber_change_count"]
    daily["date"] = pd.to_datetime(daily["date_str"])

    return daily.sort_values("date_str")


def detect_no_show_impact_periods(df_daily, threshold_rate=5.0, min_days=2):
    if df_daily.empty:
        return []

    high_impact = df_daily[df_daily["no_show_rate"] >= threshold_rate].copy()
    if high_impact.empty:
        return []

    high_impact = high_impact.sort_values("date")
    high_impact["date_diff"] = high_impact["date"].diff().dt.days
    high_impact["group"] = (high_impact["date_diff"].fillna(2) > 1).cumsum()

    periods = []
    for group_id, group_data in high_impact.groupby("group"):
        if len(group_data) >= min_days:
            avg_rate = group_data["no_show_rate"].mean()
            total_no_show = group_data["no_show_count"].sum()
            total_appt = group_data["total_appointments"].sum()
            periods.append({
                "start_date": group_data["date_str"].iloc[0],
                "end_date": group_data["date_str"].iloc[-1],
                "days_count": len(group_data),
                "avg_no_show_rate": round(avg_rate, 2),
                "total_no_shows": int(total_no_show),
                "total_appointments": int(total_appt)
            })

    return periods


def get_sync_delay_annotations(df_sync_logs, threshold_minutes=60):
    if df_sync_logs.empty:
        return []

    delayed = df_sync_logs[
        (df_sync_logs["delay_minutes"] > threshold_minutes) &
        (df_sync_logs["status"] == "success")
    ].copy()

    annotations = []
    for _, row in delayed.iterrows():
        annotations.append({
            "time": row["started_at"],
            "delay_minutes": round(row["delay_minutes"], 1),
            "records_count": row["records_count"],
            "label": f"HIS延迟 {round(row['delay_minutes'], 1)}分钟"
        })

    return annotations
