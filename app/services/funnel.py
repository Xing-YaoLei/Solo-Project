import os
import io
import json
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

import pandas as pd
import numpy as np
from sqlalchemy import and_, or_, func

from app import db
from app.models import (
    Course,
    CourseChapter,
    Student,
    Grade,
    LMSRecord,
    ReminderRule,
    Note,
    Employment,
    LiveSession,
)


FUNNEL_STAGES = [
    {"stage": "enrolled", "name": "课程报名", "description": "学生报名课程的人数"},
    {"stage": "started", "name": "开始学习", "description": "至少开始学习一个章节"},
    {"stage": "progressing", "name": "学习中", "description": "完成率在20%-80%之间"},
    {"stage": "nearing_complete", "name": "即将完成", "description": "完成率超过80%"},
    {"stage": "completed", "name": "课程完成", "description": "完成所有必修章节并通过考核"},
    {"stage": "passed", "name": "成绩合格", "description": "总成绩达到合格标准"},
    {"stage": "employed", "name": "成功就业", "description": "完成课程后成功就业"},
]

METRICS_CALIBER = {
    "completion_rate": {
        "name": "课程完成率",
        "calculation": "已完成必修章节数 / 总必修章节数 × 100%",
        "data_source": "LMS系统学习记录",
        "update_frequency": "实时同步",
    },
    "enrolled_count": {
        "name": "课程报名人数",
        "calculation": "筛选范围内报名课程的学生总数",
        "data_source": "LMS系统选课记录",
        "update_frequency": "每日同步",
    },
    "pass_rate": {
        "name": "合格率",
        "calculation": "成绩合格人数 / 完成课程人数 × 100%",
        "data_source": "成绩表 + LMS系统",
        "update_frequency": "实时同步",
    },
    "employment_rate": {
        "name": "就业率",
        "calculation": "完成课程后成功就业人数 / 完成课程人数 × 100%",
        "data_source": "成绩表 + 就业系统",
        "update_frequency": "每日同步",
    },
    "avg_study_duration": {
        "name": "平均学习时长",
        "calculation": "学生总学习分钟数 / 学习人数",
        "data_source": "LMS系统学习记录",
        "update_frequency": "实时同步",
    },
    "progress_warning_rate": {
        "name": "进度落后预警率",
        "calculation": "进度落后人数 / 在学人数 × 100%",
        "data_source": "成绩表 + 提醒规则配置",
        "update_frequency": "每小时计算",
    },
}


@dataclass
class FilterParams:
    course_ids: Optional[List[int]] = None
    major: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    status: Optional[List[str]] = None
    grade_level: Optional[List[str]] = None
    progress_warning_only: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "course_ids": self.course_ids,
            "major": self.major,
            "date_from": self.date_from.isoformat() if self.date_from else None,
            "date_to": self.date_to.isoformat() if self.date_to else None,
            "status": self.status,
            "grade_level": self.grade_level,
            "progress_warning_only": self.progress_warning_only,
        }

    def get_filter_description(self) -> str:
        parts = []
        if self.course_ids:
            parts.append(f"课程ID: {', '.join(map(str, self.course_ids))}")
        if self.major:
            parts.append(f"专业: {self.major}")
        if self.date_from and self.date_to:
            parts.append(f"时间范围: {self.date_from} 至 {self.date_to}")
        if self.status:
            parts.append(f"状态: {', '.join(self.status)}")
        if self.progress_warning_only:
            parts.append("仅显示进度落后")
        return "; ".join(parts) if parts else "无筛选条件"


def _build_query_conditions(filters: FilterParams):
    conditions = []
    if filters.course_ids:
        conditions.append(Grade.course_id.in_(filters.course_ids))
    if filters.major:
        conditions.append(Student.major == filters.major)
    if filters.date_from:
        conditions.append(Grade.enroll_date >= filters.date_from)
    if filters.date_to:
        conditions.append(Grade.enroll_date <= filters.date_to)
    if filters.status:
        conditions.append(Grade.status.in_(filters.status))
    if filters.grade_level:
        conditions.append(Grade.grade_level.in_(filters.grade_level))
    if filters.progress_warning_only:
        conditions.append(Grade.progress_warning == True)
    return conditions


def get_funnel_data(filters: FilterParams) -> Tuple[pd.DataFrame, List[Dict]]:
    conditions = _build_query_conditions(filters)

    query = (
        db.session.query(
            Grade.id,
            Grade.student_id,
            Grade.course_id,
            Grade.enroll_date,
            Grade.status,
            Grade.completion_rate,
            Grade.is_pass,
            Grade.progress_warning,
            Grade.total_score,
            Student.student_id.label("student_code"),
            Student.name,
            Student.major,
            Course.course_code,
            Course.course_name,
            Course.target_completion_days,
        )
        .join(Student, Grade.student_id == Student.id)
        .join(Course, Grade.course_id == Course.id)
    )

    if conditions:
        query = query.filter(and_(*conditions))

    df = pd.read_sql(query.statement, db.session.connection())

    if df.empty:
        return df, []

    funnel_stages_data = []
    total_enrolled = len(df)

    funnel_stages_data.append(
        {
            "stage": "enrolled",
            "name": "课程报名",
            "count": total_enrolled,
            "rate": 100.0,
            "conversion_from_prev": 100.0,
        }
    )

    started = df[df["completion_rate"] > 0]
    started_count = len(started)
    funnel_stages_data.append(
        {
            "stage": "started",
            "name": "开始学习",
            "count": started_count,
            "rate": (started_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (started_count / total_enrolled * 100) if total_enrolled > 0 else 0,
        }
    )

    progressing = df[(df["completion_rate"] >= 20) & (df["completion_rate"] < 80)]
    progressing_count = len(progressing)
    funnel_stages_data.append(
        {
            "stage": "progressing",
            "name": "学习中",
            "count": progressing_count,
            "rate": (progressing_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (progressing_count / started_count * 100) if started_count > 0 else 0,
        }
    )

    nearing_complete = df[(df["completion_rate"] >= 80) & (df["completion_rate"] < 100)]
    nearing_complete_count = len(nearing_complete)
    prev_count = progressing_count if progressing_count > 0 else started_count
    funnel_stages_data.append(
        {
            "stage": "nearing_complete",
            "name": "即将完成",
            "count": nearing_complete_count,
            "rate": (nearing_complete_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (nearing_complete_count / prev_count * 100) if prev_count > 0 else 0,
        }
    )

    completed = df[df["completion_rate"] >= 100]
    completed_count = len(completed)
    funnel_stages_data.append(
        {
            "stage": "completed",
            "name": "课程完成",
            "count": completed_count,
            "rate": (completed_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (completed_count / nearing_complete_count * 100)
            if nearing_complete_count > 0
            else (completed_count / prev_count * 100) if prev_count > 0 else 0,
        }
    )

    passed = df[df["is_pass"] == True]
    passed_count = len(passed)
    funnel_stages_data.append(
        {
            "stage": "passed",
            "name": "成绩合格",
            "count": passed_count,
            "rate": (passed_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (passed_count / completed_count * 100) if completed_count > 0 else 0,
        }
    )

    employment_conditions = [Employment.employment_status == "已就业"]
    employed_query = (
        db.session.query(Grade.id.label("grade_id"))
        .join(Employment, Grade.student_id == Employment.student_id)
        .filter(and_(*conditions + employment_conditions))
    )
    employed_ids = {row.grade_id for row in employed_query.all()}
    employed_count = len(employed_ids)

    funnel_stages_data.append(
        {
            "stage": "employed",
            "name": "成功就业",
            "count": employed_count,
            "rate": (employed_count / total_enrolled * 100) if total_enrolled > 0 else 0,
            "conversion_from_prev": (employed_count / passed_count * 100) if passed_count > 0 else 0,
        }
    )

    return df, funnel_stages_data


def get_completion_metrics(filters: FilterParams) -> Dict[str, Any]:
    df, funnel_data = get_funnel_data(filters)

    if df.empty:
        return {
            "total_enrolled": 0,
            "completion_rate": 0,
            "pass_rate": 0,
            "employment_rate": 0,
            "avg_study_duration": 0,
            "progress_warning_count": 0,
            "progress_warning_rate": 0,
            "avg_completion_rate": 0,
            "funnel_data": funnel_data,
        }

    total_enrolled = len(df)
    completed = df[df["completion_rate"] >= 100]
    passed = completed[completed["is_pass"] == True]

    progress_warning = df[df["progress_warning"] == True]
    in_progress = df[df["status"] == "in_progress"]

    avg_study_duration_query = (
        db.session.query(func.avg(Grade.study_duration_minutes))
        .join(Student, Grade.student_id == Student.id)
    )
    conditions = _build_query_conditions(filters)
    if conditions:
        avg_study_duration_query = avg_study_duration_query.filter(and_(*conditions))
    avg_duration = avg_study_duration_query.scalar() or 0

    employment_conditions = [Employment.employment_status == "已就业"]
    employment_query = (
        db.session.query(func.count(Employment.id.distinct()))
        .join(Grade, Grade.student_id == Employment.student_id)
        .join(Student, Grade.student_id == Student.id)
    )
    if filters.course_ids:
        employment_query = employment_query.filter(Grade.course_id.in_(filters.course_ids))
    if filters.major:
        employment_query = employment_query.filter(Student.major == filters.major)
    employed_count = employment_query.scalar() or 0

    metrics = {
        "total_enrolled": total_enrolled,
        "completion_rate": (len(completed) / total_enrolled * 100) if total_enrolled > 0 else 0,
        "pass_rate": (len(passed) / len(completed) * 100) if len(completed) > 0 else 0,
        "employment_rate": (employed_count / len(completed) * 100) if len(completed) > 0 else 0,
        "avg_study_duration": float(avg_duration),
        "progress_warning_count": len(progress_warning),
        "progress_warning_rate": (len(progress_warning) / len(in_progress) * 100)
        if len(in_progress) > 0
        else 0,
        "avg_completion_rate": float(df["completion_rate"].mean()),
        "funnel_data": funnel_data,
    }

    return metrics


def get_student_grade_detail(grade_id: int) -> Optional[Dict[str, Any]]:
    grade = Grade.query.get(grade_id)
    if not grade:
        return None

    student = Student.query.get(grade.student_id)
    course = Course.query.get(grade.course_id)

    if not student or not course:
        return None

    return {
        "grade_id": grade.id,
        "student_id": student.id,
        "student_code": student.student_id,
        "student_name": student.name,
        "major": student.major,
        "grade_class": student.grade_class,
        "course_id": course.id,
        "course_code": course.course_code,
        "course_name": course.course_name,
        "enroll_date": grade.enroll_date,
        "expected_complete_date": grade.expected_complete_date,
        "actual_complete_date": grade.actual_complete_date,
        "total_score": grade.total_score,
        "grade_level": grade.grade_level,
        "completion_rate": grade.completion_rate,
        "study_duration_minutes": grade.study_duration_minutes,
        "is_pass": grade.is_pass,
        "status": grade.status,
        "progress_warning": grade.progress_warning,
    }


def get_chapter_progress(grade_id: int) -> pd.DataFrame:
    grade = Grade.query.get(grade_id)
    if not grade:
        return pd.DataFrame()

    query = (
        db.session.query(
            CourseChapter.chapter_number,
            CourseChapter.chapter_name,
            CourseChapter.duration_minutes,
            CourseChapter.is_required,
            CourseChapter.pass_score,
            LMSRecord.progress_percent,
            LMSRecord.completion_status,
            LMSRecord.study_duration_minutes.label("actual_duration"),
            LMSRecord.quiz_score,
            LMSRecord.first_access_time,
            LMSRecord.last_access_time,
        )
        .outerjoin(
            LMSRecord,
            and_(
                LMSRecord.chapter_id == CourseChapter.id,
                LMSRecord.student_id == grade.student_id,
                LMSRecord.grade_id == grade.id,
            ),
        )
        .filter(CourseChapter.course_id == grade.course_id)
        .order_by(CourseChapter.chapter_number)
    )

    df = pd.read_sql(query.statement, db.session.connection())
    df["progress_percent"] = df["progress_percent"].fillna(0)
    df["actual_duration"] = df["actual_duration"].fillna(0)
    df["completion_status"] = df["completion_status"].fillna("not_started")

    return df


def get_original_samples(grade_id: int, sample_type: str = "all") -> Dict[str, pd.DataFrame]:
    grade = Grade.query.get(grade_id)
    if not grade:
        return {}

    result = {}

    if sample_type in ["all", "lms"]:
        lms_query = LMSRecord.query.filter_by(student_id=grade.student_id, grade_id=grade.id).order_by(
            LMSRecord.last_access_time.desc()
        )
        lms_df = pd.read_sql(lms_query.statement, db.session.connection())
        result["lms_records"] = lms_df

    if sample_type in ["all", "live"]:
        live_query = LiveSession.query.filter_by(student_id=grade.student_id).order_by(
            LiveSession.join_time.desc()
        )
        live_df = pd.read_sql(live_query.statement, db.session.connection())
        result["live_sessions"] = live_df

    if sample_type in ["all", "employment"]:
        emp_query = Employment.query.filter_by(student_id=grade.student_id).order_by(
            Employment.employment_date.desc()
        )
        emp_df = pd.read_sql(emp_query.statement, db.session.connection())
        result["employment"] = emp_df

    return result


def get_reminder_rules(active_only: bool = True) -> List[Dict[str, Any]]:
    query = ReminderRule.query
    if active_only:
        query = query.filter_by(is_active=True)
    rules = query.order_by(ReminderRule.priority).all()

    return [
        {
            "id": rule.id,
            "rule_name": rule.rule_name,
            "rule_type": rule.rule_type,
            "threshold_type": rule.threshold_type,
            "threshold_value": rule.threshold_value,
            "comparison": rule.comparison,
            "comparison_text": {
                "lt": "小于",
                "lte": "小于等于",
                "gt": "大于",
                "gte": "大于等于",
                "eq": "等于",
                "ne": "不等于",
            }.get(rule.comparison, rule.comparison),
            "time_window_days": rule.time_window_days,
            "reminder_message": rule.reminder_message,
            "priority": rule.priority,
        }
        for rule in rules
    ]


def get_students_matching_rule(rule_id: int, filters: FilterParams) -> pd.DataFrame:
    rule = ReminderRule.query.get(rule_id)
    if not rule:
        return pd.DataFrame()

    df, _ = get_funnel_data(filters)
    if df.empty:
        return df

    threshold_field = rule.threshold_type
    threshold = rule.threshold_value

    if rule.comparison == "lt":
        matched = df[df[threshold_field] < threshold]
    elif rule.comparison == "lte":
        matched = df[df[threshold_field] <= threshold]
    elif rule.comparison == "gt":
        matched = df[df[threshold_field] > threshold]
    elif rule.comparison == "gte":
        matched = df[df[threshold_field] >= threshold]
    elif rule.comparison == "eq":
        matched = df[df[threshold_field] == threshold]
    elif rule.comparison == "ne":
        matched = df[df[threshold_field] != threshold]
    else:
        matched = pd.DataFrame()

    return matched


def update_progress_warnings() -> Dict[str, Any]:
    today = datetime.utcnow().date()
    updated_count = 0
    warning_count = 0

    grades = Grade.query.filter(Grade.status == "in_progress").all()

    for grade in grades:
        course = Course.query.get(grade.course_id)
        if not course:
            continue

        expected_complete = grade.expected_complete_date
        if not expected_complete and grade.enroll_date:
            expected_complete = grade.enroll_date + timedelta(days=course.target_completion_days)

        if expected_complete:
            days_remaining = (expected_complete - today).days
            expected_progress = max(
                0, min(100, ((course.target_completion_days - days_remaining) / course.target_completion_days) * 100)
            )
            actual_progress = grade.completion_rate or 0
            gap = expected_progress - actual_progress

            should_warn = gap > 20 or (days_remaining <= 7 and actual_progress < 80)

            if grade.progress_warning != should_warn:
                grade.progress_warning = should_warn
                updated_count += 1

            if should_warn:
                warning_count += 1

    db.session.commit()

    return {
        "status": "success",
        "total_in_progress": len(grades),
        "updated_count": updated_count,
        "warning_count": warning_count,
        "calculated_at": today.isoformat(),
    }


def save_note(
    student_id: int,
    content: str,
    created_by: str = "system",
    note_type: str = "general",
    grade_id: Optional[int] = None,
) -> Dict[str, Any]:
    if not content.strip():
        return {"status": "error", "message": "备注内容不能为空"}

    note = Note(
        student_id=student_id,
        grade_id=grade_id,
        note_type=note_type,
        content=content.strip(),
        created_by=created_by,
    )
    db.session.add(note)
    db.session.commit()

    return {
        "status": "success",
        "note_id": note.id,
        "created_at": note.created_at.isoformat(),
    }


def get_notes(student_id: Optional[int] = None, grade_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = Note.query
    if student_id:
        query = query.filter_by(student_id=student_id)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)

    notes = query.order_by(Note.created_at.desc()).all()

    return [
        {
            "id": note.id,
            "student_id": note.student_id,
            "grade_id": note.grade_id,
            "note_type": note.note_type,
            "content": note.content,
            "created_by": note.created_by,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat(),
        }
        for note in notes
    ]


def export_report_data(filters: FilterParams, export_format: str = "xlsx") -> bytes:
    metrics = get_completion_metrics(filters)
    df, funnel_data = get_funnel_data(filters)

    output = io.BytesIO()

    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        info_df = pd.DataFrame(
            [
                {"项目": "报告生成时间", "值": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
                {"项目": "筛选范围", "值": filters.get_filter_description()},
                {"项目": "报告说明", "值": "职业教育在线课程漏斗分析报表"},
            ]
        )
        info_df.to_excel(writer, sheet_name="报告说明", index=False)

        metrics_data = []
        for key, value in metrics.items():
            if key == "funnel_data":
                continue
            caliber = METRICS_CALIBER.get(key, {})
            metrics_data.append(
                {
                    "指标名称": caliber.get("name", key),
                    "指标值": value,
                    "计算口径": caliber.get("calculation", ""),
                    "数据来源": caliber.get("data_source", ""),
                    "更新频率": caliber.get("update_frequency", ""),
                }
            )
        metrics_df = pd.DataFrame(metrics_data)
        metrics_df.to_excel(writer, sheet_name="核心指标", index=False)

        funnel_df = pd.DataFrame(
            [
                {
                    "阶段": stage["name"],
                    "人数": stage["count"],
                    "占报名比例(%)": round(stage["rate"], 2),
                    "阶段转化率(%)": round(stage["conversion_from_prev"], 2),
                }
                for stage in funnel_data
            ]
        )
        funnel_df.to_excel(writer, sheet_name="漏斗分析", index=False)

        if not df.empty:
            detail_df = df[
                [
                    "student_code",
                    "name",
                    "major",
                    "course_code",
                    "course_name",
                    "enroll_date",
                    "status",
                    "completion_rate",
                    "total_score",
                    "is_pass",
                    "progress_warning",
                ]
            ].copy()
            detail_df.columns = [
                "学号",
                "姓名",
                "专业",
                "课程代码",
                "课程名称",
                "报名日期",
                "学习状态",
                "完成率(%)",
                "总成绩",
                "是否合格",
                "进度预警",
            ]
            detail_df.to_excel(writer, sheet_name="学生明细", index=False)

        rules = get_reminder_rules()
        if rules:
            rules_df = pd.DataFrame(rules)
            rules_df = rules_df[
                ["rule_name", "rule_type", "threshold_type", "threshold_value", "comparison_text", "time_window_days"]
            ]
            rules_df.columns = [
                "规则名称",
                "规则类型",
                "指标类型",
                "阈值",
                "比较方式",
                "时间窗口(天)",
            ]
            rules_df.to_excel(writer, sheet_name="提醒规则", index=False)

        workbook = writer.book
        header_format = workbook.add_format(
            {"bold": True, "bg_color": "#4472C4", "font_color": "white", "border": 1}
        )

        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            if worksheet.dim_rowmax is not None:
                for col_num in range(worksheet.dim_colmax + 1):
                    worksheet.set_column(col_num, col_num, 20)
                for row_num in range(worksheet.dim_rowmax + 1):
                    if row_num == 0:
                        worksheet.set_row(row_num, None, header_format)

    output.seek(0)
    return output.getvalue()
