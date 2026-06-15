import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import pandas as pd
import requests
from celery import group
from dotenv import load_dotenv

from app.sync.celery_app import celery_app
from app import db
from app.models import (
    Employment,
    LiveSession,
    LMSRecord,
    Student,
    Grade,
    AnomalyData,
    SyncTask,
    ReminderRule,
    Course,
)

load_dotenv()
logger = logging.getLogger(__name__)


def generate_sync_batch(data_source: str) -> str:
    return f"{data_source}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"


def save_anomaly_data(
    data_source: str,
    sync_batch: str,
    raw_data: Dict[str, Any],
    anomaly_type: str,
    anomaly_description: str = "",
    error_message: str = "",
    record_id_external: str = "",
) -> None:
    anomaly = AnomalyData(
        data_source=data_source,
        sync_batch=sync_batch,
        raw_data=json.dumps(raw_data, ensure_ascii=False),
        anomaly_type=anomaly_type,
        anomaly_description=anomaly_description,
        error_message=error_message,
        record_id_external=record_id_external,
    )
    db.session.add(anomaly)


def validate_employment_record(record: Dict[str, Any]) -> List[str]:
    errors = []
    if not record.get("student_id") and not record.get("external_student_id"):
        errors.append("缺少学生标识")
    if not record.get("employment_date"):
        errors.append("缺少就业日期")
    if record.get("salary") is not None and record.get("salary") < 0:
        errors.append("薪资数据异常")
    return errors


def validate_live_record(record: Dict[str, Any]) -> List[str]:
    errors = []
    if not record.get("student_id") and not record.get("external_student_id"):
        errors.append("缺少学生标识")
    if not record.get("live_room_id"):
        errors.append("缺少直播间标识")
    if record.get("join_time") and record.get("leave_time"):
        try:
            join_time = datetime.fromisoformat(str(record["join_time"]).replace("Z", "+00:00"))
            leave_time = datetime.fromisoformat(str(record["leave_time"]).replace("Z", "+00:00"))
            if join_time > leave_time:
                errors.append("进入时间晚于离开时间")
        except (ValueError, TypeError):
            errors.append("时间格式错误")
    if record.get("duration_minutes") is not None and record.get("duration_minutes") < 0:
        errors.append("观看时长为负数")
    return errors


def validate_lms_record(record: Dict[str, Any]) -> List[str]:
    errors = []
    if not record.get("student_id") and not record.get("external_student_id"):
        errors.append("缺少学生标识")
    if not record.get("course_id") and not record.get("chapter_id"):
        errors.append("缺少课程或章节标识")
    if record.get("progress_percent") is not None:
        progress = float(record["progress_percent"])
        if progress < 0 or progress > 100:
            errors.append("进度百分比超出正常范围")
    if record.get("quiz_score") is not None:
        score = float(record["quiz_score"])
        if score < 0 or score > 100:
            errors.append("测验分数超出正常范围")
    return errors


def get_or_create_student(external_student_id: str, student_info: Optional[Dict] = None) -> Optional[Student]:
    student = Student.query.filter_by(student_id=external_student_id).first()
    if student:
        return student

    if student_info:
        student = Student(
            student_id=external_student_id,
            name=student_info.get("name", f"学生_{external_student_id}"),
            gender=student_info.get("gender"),
            age=student_info.get("age"),
            major=student_info.get("major"),
            grade_class=student_info.get("grade_class"),
        )
        db.session.add(student)
        db.session.flush()
        return student

    return None


def _fetch_from_api(api_url: str, api_token: str, data_source: str, sync_batch: str) -> List[Dict]:
    """
    从配置的API地址获取数据，失败时记录到异常数据表
    """
    if not api_url or not api_token:
        logger.warning(f"{data_source} 未配置API地址或Token，跳过数据拉取")
        return []

    try:
        logger.info(f"开始从 {api_url} 拉取 {data_source} 数据")
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }
        response = requests.get(api_url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, dict) and "data" in data:
            records = data["data"]
        elif isinstance(data, list):
            records = data
        else:
            records = []

        logger.info(f"从 {api_url} 成功拉取 {len(records)} 条 {data_source} 数据")
        return records

    except requests.exceptions.RequestException as e:
        error_msg = f"API请求失败: {str(e)}"
        logger.error(f"{data_source} {error_msg}")
        anomaly = AnomalyData(
            data_source=data_source,
            sync_batch=sync_batch,
            raw_data=json.dumps({"api_url": api_url, "error": str(e)}, ensure_ascii=False),
            anomaly_type="API连接失败",
            anomaly_description=error_msg,
            error_message=str(e),
            record_id_external="API_REQUEST",
        )
        db.session.add(anomaly)
        db.session.commit()
        return []

    except (ValueError, json.JSONDecodeError) as e:
        error_msg = f"API返回数据格式错误: {str(e)}"
        logger.error(f"{data_source} {error_msg}")
        anomaly = AnomalyData(
            data_source=data_source,
            sync_batch=sync_batch,
            raw_data=json.dumps({"api_url": api_url, "error": str(e)}, ensure_ascii=False),
            anomaly_type="数据格式错误",
            anomaly_description=error_msg,
            error_message=str(e),
            record_id_external="API_RESPONSE",
        )
        db.session.add(anomaly)
        db.session.commit()
        return []


@celery_app.task(bind=True, name="sync_employment_data")
def sync_employment_data(self, records: Optional[List[Dict]] = None) -> Dict[str, Any]:
    data_source = "employment_system"
    sync_batch = generate_sync_batch(data_source)

    api_url = os.getenv("EMPLOYMENT_API_URL", "")
    api_token = os.getenv("API_TOKEN", "")

    sync_task = SyncTask(
        task_name="就业数据同步",
        data_source=data_source,
        sync_batch=sync_batch,
        status="running",
        started_at=datetime.utcnow(),
        config_source="EMPLOYMENT_API_URL",
        config_url=api_url,
    )
    db.session.add(sync_task)
    db.session.commit()

    try:
        if records is None:
            records = _fetch_from_api(api_url, api_token, data_source, sync_batch)

        total_records = len(records)
        success_count = 0
        error_count = 0

        for idx, record in enumerate(records, 1):
            self.update_state(
                state="PROGRESS",
                meta={"current": idx, "total": total_records, "success": success_count, "errors": error_count},
            )

            errors = validate_employment_record(record)
            if errors:
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="数据验证失败",
                    anomaly_description="; ".join(errors),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                continue

            try:
                external_student_id = str(record.get("external_student_id", record.get("student_id", "")))
                student = get_or_create_student(external_student_id, record)
                if not student:
                    save_anomaly_data(
                        data_source=data_source,
                        sync_batch=sync_batch,
                        raw_data=record,
                        anomaly_type="学生不存在",
                        anomaly_description="无法匹配到系统内学生",
                        record_id_external=external_student_id,
                    )
                    error_count += 1
                    continue

                employment = Employment.query.filter_by(
                    student_id=student.id,
                    external_student_id=external_student_id,
                    employment_date=datetime.fromisoformat(str(record["employment_date"])).date()
                    if record.get("employment_date")
                    else None,
                ).first()

                if employment is None:
                    employment = Employment(
                        student_id=student.id,
                        external_student_id=external_student_id,
                        sync_batch=sync_batch,
                    )
                    db.session.add(employment)

                employment.company_name = record.get("company_name")
                employment.position = record.get("position")
                employment.salary = record.get("salary")
                if record.get("employment_date"):
                    employment.employment_date = datetime.fromisoformat(
                        str(record["employment_date"])
                    ).date()
                employment.employment_status = record.get("employment_status")
                employment.is_match_major = record.get("is_match_major")

                success_count += 1

                if idx % 100 == 0:
                    db.session.commit()

            except Exception as e:
                db.session.rollback()
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="同步异常",
                    error_message=str(e),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                logger.error(f"就业数据同步异常: {e}", exc_info=True)

        db.session.commit()

        sync_task.status = "completed"
        sync_task.total_records = total_records
        sync_task.success_count = success_count
        sync_task.error_count = error_count
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"就业数据同步完成: 共{total_records}条, 成功{success_count}条, 失败{error_count}条")

        return {
            "status": "success",
            "sync_batch": sync_batch,
            "total_records": total_records,
            "success_count": success_count,
            "error_count": error_count,
            "data_source": data_source,
            "config_source": "EMPLOYMENT_API_URL",
            "config_url": api_url,
        }

    except Exception as e:
        db.session.rollback()
        sync_task.status = "failed"
        sync_task.error_message = str(e)
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()
        logger.error(f"就业数据同步任务失败: {e}", exc_info=True)
        return {"status": "failed", "error": str(e), "sync_batch": sync_batch}


@celery_app.task(bind=True, name="sync_live_platform_data")
def sync_live_platform_data(self, records: Optional[List[Dict]] = None) -> Dict[str, Any]:
    data_source = "live_platform"
    sync_batch = generate_sync_batch(data_source)

    api_url = os.getenv("LIVE_API_URL", "")
    api_token = os.getenv("API_TOKEN", "")

    sync_task = SyncTask(
        task_name="直播平台数据同步",
        data_source=data_source,
        sync_batch=sync_batch,
        status="running",
        started_at=datetime.utcnow(),
        config_source="LIVE_API_URL",
        config_url=api_url,
    )
    db.session.add(sync_task)
    db.session.commit()

    try:
        if records is None:
            records = _fetch_from_api(api_url, api_token, data_source, sync_batch)

        total_records = len(records)
        success_count = 0
        error_count = 0

        for idx, record in enumerate(records, 1):
            self.update_state(
                state="PROGRESS",
                meta={"current": idx, "total": total_records, "success": success_count, "errors": error_count},
            )

            errors = validate_live_record(record)
            if errors:
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="数据验证失败",
                    anomaly_description="; ".join(errors),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                continue

            try:
                external_student_id = str(record.get("external_student_id", record.get("student_id", "")))
                student = get_or_create_student(external_student_id, record)
                if not student:
                    save_anomaly_data(
                        data_source=data_source,
                        sync_batch=sync_batch,
                        raw_data=record,
                        anomaly_type="学生不存在",
                        anomaly_description="无法匹配到系统内学生",
                        record_id_external=external_student_id,
                    )
                    error_count += 1
                    continue

                live_session = LiveSession(
                    student_id=student.id,
                    external_student_id=external_student_id,
                    live_room_id=record.get("live_room_id"),
                    live_title=record.get("live_title"),
                    course_related=record.get("course_related"),
                    duration_minutes=record.get("duration_minutes", 0),
                    is_online=record.get("is_online", False),
                    interaction_count=record.get("interaction_count", 0),
                    sync_batch=sync_batch,
                )

                if record.get("join_time"):
                    live_session.join_time = datetime.fromisoformat(
                        str(record["join_time"]).replace("Z", "+00:00")
                    )
                if record.get("leave_time"):
                    live_session.leave_time = datetime.fromisoformat(
                        str(record["leave_time"]).replace("Z", "+00:00")
                    )

                db.session.add(live_session)
                success_count += 1

                if idx % 100 == 0:
                    db.session.commit()

            except Exception as e:
                db.session.rollback()
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="同步异常",
                    error_message=str(e),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                logger.error(f"直播数据同步异常: {e}", exc_info=True)

        db.session.commit()

        sync_task.status = "completed"
        sync_task.total_records = total_records
        sync_task.success_count = success_count
        sync_task.error_count = error_count
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"直播数据同步完成: 共{total_records}条, 成功{success_count}条, 失败{error_count}条")

        return {
            "status": "success",
            "sync_batch": sync_batch,
            "total_records": total_records,
            "success_count": success_count,
            "error_count": error_count,
            "data_source": data_source,
            "config_source": "LIVE_API_URL",
            "config_url": api_url,
        }

    except Exception as e:
        db.session.rollback()
        sync_task.status = "failed"
        sync_task.error_message = str(e)
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()
        logger.error(f"直播数据同步任务失败: {e}", exc_info=True)
        return {"status": "failed", "error": str(e), "sync_batch": sync_batch}


@celery_app.task(bind=True, name="sync_lms_data")
def sync_lms_data(self, records: Optional[List[Dict]] = None) -> Dict[str, Any]:
    data_source = "lms"
    sync_batch = generate_sync_batch(data_source)

    api_url = os.getenv("LMS_API_URL", "")
    api_token = os.getenv("API_TOKEN", "")

    sync_task = SyncTask(
        task_name="LMS学习数据同步",
        data_source=data_source,
        sync_batch=sync_batch,
        status="running",
        started_at=datetime.utcnow(),
        config_source="LMS_API_URL",
        config_url=api_url,
    )
    db.session.add(sync_task)
    db.session.commit()

    try:
        if records is None:
            records = _fetch_from_api(api_url, api_token, data_source, sync_batch)

        total_records = len(records)
        success_count = 0
        error_count = 0

        for idx, record in enumerate(records, 1):
            self.update_state(
                state="PROGRESS",
                meta={"current": idx, "total": total_records, "success": success_count, "errors": error_count},
            )

            errors = validate_lms_record(record)
            if errors:
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="数据验证失败",
                    anomaly_description="; ".join(errors),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                continue

            try:
                external_student_id = str(record.get("external_student_id", record.get("student_id", "")))
                student = get_or_create_student(external_student_id, record)
                if not student:
                    save_anomaly_data(
                        data_source=data_source,
                        sync_batch=sync_batch,
                        raw_data=record,
                        anomaly_type="学生不存在",
                        anomaly_description="无法匹配到系统内学生",
                        record_id_external=external_student_id,
                    )
                    error_count += 1
                    continue

                lms_record = LMSRecord(
                    student_id=student.id,
                    course_id=record.get("course_id"),
                    chapter_id=record.get("chapter_id"),
                    external_student_id=external_student_id,
                    study_duration_minutes=record.get("study_duration_minutes", 0),
                    completion_status=record.get("completion_status", "not_started"),
                    quiz_score=record.get("quiz_score"),
                    progress_percent=record.get("progress_percent", 0),
                    sync_batch=sync_batch,
                )

                if record.get("first_access_time"):
                    lms_record.first_access_time = datetime.fromisoformat(
                        str(record["first_access_time"]).replace("Z", "+00:00")
                    )
                if record.get("last_access_time"):
                    lms_record.last_access_time = datetime.fromisoformat(
                        str(record["last_access_time"]).replace("Z", "+00:00")
                    )

                db.session.add(lms_record)
                success_count += 1

                if idx % 100 == 0:
                    db.session.commit()

            except Exception as e:
                db.session.rollback()
                save_anomaly_data(
                    data_source=data_source,
                    sync_batch=sync_batch,
                    raw_data=record,
                    anomaly_type="同步异常",
                    error_message=str(e),
                    record_id_external=str(record.get("external_student_id", record.get("student_id", ""))),
                )
                error_count += 1
                logger.error(f"LMS数据同步异常: {e}", exc_info=True)

        db.session.commit()

        sync_task.status = "completed"
        sync_task.total_records = total_records
        sync_task.success_count = success_count
        sync_task.error_count = error_count
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"LMS数据同步完成: 共{total_records}条, 成功{success_count}条, 失败{error_count}条")

        return {
            "status": "success",
            "sync_batch": sync_batch,
            "total_records": total_records,
            "success_count": success_count,
            "error_count": error_count,
            "data_source": data_source,
            "config_source": "LMS_API_URL",
            "config_url": api_url,
        }

    except Exception as e:
        db.session.rollback()
        sync_task.status = "failed"
        sync_task.error_message = str(e)
        sync_task.completed_at = datetime.utcnow()
        db.session.commit()
        logger.error(f"LMS数据同步任务失败: {e}", exc_info=True)
        return {"status": "failed", "error": str(e), "sync_batch": sync_batch}


@celery_app.task(name="sync_all_sources")
def sync_all_sources() -> Dict[str, Any]:
    job = group(
        sync_employment_data.s(),
        sync_live_platform_data.s(),
        sync_lms_data.s(),
    )
    result = job.apply_async()
    return {"task_group_id": result.id, "status": "started"}


@celery_app.task(name="run_progress_warning_check")
def run_progress_warning_check() -> Dict[str, Any]:
    from app.services import update_progress_warnings
    result = update_progress_warnings()
    return result
