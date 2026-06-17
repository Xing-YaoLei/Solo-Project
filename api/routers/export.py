import io
import csv
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from api.database import get_db
from api.models import (
    MedicationRecord,
    VisitRecord,
    ActivityRecord,
    FallEvent,
    RiskAnnotation,
    Elder,
)
from api.schemas import (
    MedicationRecordOut,
    VisitRecordOut,
    ActivityRecordOut,
)

router = APIRouter(prefix="/export", tags=["数据导出"])

COMPLIANCE_RULES = [
    {"id": "r1", "name": "护理员配比标准", "category": "人员配置", "threshold": 4, "unit": "床/人", "description": "每名护理员最多照护4张床位"},
    {"id": "r2", "name": "用药执行达标率", "category": "用药管理", "threshold": 95, "unit": "%", "description": "按时服药率不低于95%"},
    {"id": "r3", "name": "探访记录完整率", "category": "安全管理", "threshold": 98, "unit": "%", "description": "门禁进出记录完整率不低于98%"},
    {"id": "r4", "name": "活动签到率", "category": "生活照料", "threshold": 90, "unit": "%", "description": "日常活动签到率不低于90%"},
    {"id": "r5", "name": "跌倒事件响应时间", "category": "应急处理", "threshold": 3, "unit": "分钟", "description": "跌倒事件响应时间不超过3分钟"},
    {"id": "r6", "name": "护理终端响应延迟", "category": "系统运维", "threshold": 5, "unit": "分钟", "description": "护理终端数据同步延迟不超过5分钟"},
]


class ExportRequest(BaseModel):
    start_date: date
    end_date: date
    view_type: str
    format: str = "csv"
    include_compliance_rules: bool = False


@router.post("", summary="统一数据导出")
async def export_data(
    req: ExportRequest,
    db: AsyncSession = Depends(get_db),
):
    buf = io.StringIO()
    writer = csv.writer(buf)

    end_date_plus_one = req.end_date + timedelta(days=1)

    if req.view_type == "schedule_trend":
        writer.writerow(["=== 床位排班风险监测报告 ==="])
        writer.writerow(["统计周期", f"{req.start_date} 至 {req.end_date}"])
        writer.writerow([])

        writer.writerow(["日期", "入住率(%)", "风险评分", "床位总数", "已入住数"])

        total_beds = 36

        current = req.start_date
        while current <= req.end_date:
            occupied_result = await db.execute(
                select(func.count(Elder.id)).where(Elder.admission_date <= current)
            )
            occupied = occupied_result.scalar() or 0
            occupancy = round(occupied / total_beds * 100, 1) if total_beds else 0

            ann_result = await db.execute(
                select(func.count(RiskAnnotation.id)).where(
                    and_(
                        RiskAnnotation.timestamp >= current,
                        RiskAnnotation.timestamp < current + timedelta(days=1),
                    )
                )
            )
            ann_count = ann_result.scalar() or 0
            risk_score = min(100, ann_count * 15)

            writer.writerow([
                current.isoformat(),
                occupancy,
                risk_score,
                total_beds,
                occupied,
            ])
            current += timedelta(days=1)

        writer.writerow([])
        writer.writerow(["=== 风险标注统计 ==="])
        writer.writerow(["类型", "严重程度", "数量"])

        ann_stmt = (
            select(RiskAnnotation.type, RiskAnnotation.severity, func.count(RiskAnnotation.id))
            .where(
                and_(
                    RiskAnnotation.timestamp >= req.start_date,
                    RiskAnnotation.timestamp < end_date_plus_one,
                )
            )
            .group_by(RiskAnnotation.type, RiskAnnotation.severity)
        )
        ann_result = await db.execute(ann_stmt)
        for row in ann_result.all():
            type_label = {
                "terminal_delay": "终端延迟",
                "access_missing": "门禁缺失",
                "billing_caliber_change": "口径变更",
                "fall_event": "跌倒事件",
            }.get(row[0], row[0])
            sev_label = {
                "low": "低",
                "medium": "中",
                "high": "高",
                "critical": "紧急",
            }.get(row[1], row[1])
            writer.writerow([type_label, sev_label, row[2]])

    elif req.view_type == "medication":
        stmt = (
            select(MedicationRecord)
            .where(
                and_(
                    MedicationRecord.scheduled_time >= req.start_date,
                    MedicationRecord.scheduled_time < end_date_plus_one,
                )
            )
            .order_by(MedicationRecord.scheduled_time)
        )
        result = await db.execute(stmt)
        records = [MedicationRecordOut.model_validate(r, from_attributes=True) for r in result.scalars().all()]

        writer.writerow(["ID", "老人ID", "药品名称", "计划时间", "实际时间", "状态"])
        for r in records:
            status_label = {"按时": "按时", "延迟": "延迟", "未执行": "未执行"}.get(r.status, r.status)
            writer.writerow([r.id, r.elder_id, r.medication_name, r.scheduled_time, r.actual_time, status_label])

        total = len(records)
        on_time = sum(1 for r in records if r.status == "按时")
        rate = f"{on_time / total * 100:.1f}%" if total else "N/A"
        is_compliant = (on_time / total * 100) >= 95 if total else False
        writer.writerow([])
        writer.writerow(["=== 护理达标计算 ==="])
        writer.writerow(["指标", "数值", "标准", "是否达标"])
        writer.writerow(["用药执行达标率", rate, "≥95%", "是" if is_compliant else "否"])
        writer.writerow(["总记录数", total, "-", "-"])
        writer.writerow(["按时执行数", on_time, "-", "-"])

    elif req.view_type == "visits":
        stmt = (
            select(VisitRecord)
            .where(
                and_(
                    VisitRecord.scheduled_time >= req.start_date,
                    VisitRecord.scheduled_time < end_date_plus_one,
                )
            )
            .order_by(VisitRecord.scheduled_time)
        )
        result = await db.execute(stmt)
        records = [VisitRecordOut.model_validate(r, from_attributes=True) for r in result.scalars().all()]

        writer.writerow(["ID", "老人ID", "探访人", "计划时间", "实际时间", "是否有门禁记录"])
        for r in records:
            writer.writerow([r.id, r.elder_id, r.visitor_name, r.scheduled_time, r.actual_time, r.access_record_exists])

        total = len(records)
        with_access = sum(1 for r in records if r.access_record_exists)
        rate = f"{with_access / total * 100:.1f}%" if total else "N/A"
        is_compliant = (with_access / total * 100) >= 98 if total else False
        writer.writerow([])
        writer.writerow(["=== 护理达标计算 ==="])
        writer.writerow(["指标", "数值", "标准", "是否达标"])
        writer.writerow(["探访记录完整率", rate, "≥98%", "是" if is_compliant else "否"])
        writer.writerow(["总记录数", total, "-", "-"])
        writer.writerow(["有门禁记录数", with_access, "-", "-"])

    elif req.view_type == "activities":
        stmt = (
            select(ActivityRecord, Elder.name)
            .join(Elder, ActivityRecord.elder_id == Elder.id)
            .where(
                and_(
                    ActivityRecord.scheduled_time >= req.start_date,
                    ActivityRecord.scheduled_time < end_date_plus_one,
                )
            )
            .order_by(ActivityRecord.scheduled_time)
        )
        result = await db.execute(stmt)
        all_rows = result.all()

        from collections import defaultdict
        activity_groups: dict[str, list[tuple[ActivityRecord, str]]] = defaultdict(list)
        for r, elder_name in all_rows:
            date_key = r.scheduled_time.date().isoformat()
            group_key = f"{r.activity_name}-{date_key}"
            activity_groups[group_key].append((r, elder_name))

        locations = ["1楼活动室", "2楼手工室", "3楼休闲区", "4楼多功能厅"]
        activities = []
        for idx, (group_key, records) in enumerate(activity_groups.items()):
            first_record = records[0][0]
            activity_name = first_record.activity_name
            activity_date = first_record.scheduled_time.date().isoformat()
            start_time = first_record.scheduled_time
            end_time = start_time + timedelta(hours=1)
            location = locations[idx % len(locations)]

            attendees = []
            for r, elder_name in records:
                attendees.append({
                    "elder_id": str(r.elder_id),
                    "elder_name": elder_name,
                    "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None,
                    "status": "checked_in" if r.checked_in else "absent",
                })

            activities.append({
                "id": f"act-{idx}",
                "activity_name": activity_name,
                "activity_date": activity_date,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "location": location,
                "attendees": attendees,
            })

        writer.writerow(["=== 活动签到明细 ==="])
        total_attendees_all = 0
        checked_in_all = 0

        for act in activities:
            writer.writerow([])
            writer.writerow(["活动名称", act["activity_name"]])
            writer.writerow(["活动日期", act["activity_date"]])
            writer.writerow(["开始时间", act["start_time"]])
            writer.writerow(["结束时间", act["end_time"]])
            writer.writerow(["活动地点", act["location"]])
            writer.writerow([])
            writer.writerow(["序号", "老人ID", "老人姓名", "签到状态", "签到时间"])
            for i, att in enumerate(act["attendees"], start=1):
                status_label = "已签到" if att["status"] == "checked_in" else "未签到"
                writer.writerow([
                    i,
                    att["elder_id"],
                    att["elder_name"],
                    status_label,
                    att["check_in_time"] or "-",
                ])
            act_total = len(act["attendees"])
            act_checked = sum(1 for a in act["attendees"] if a["status"] == "checked_in")
            act_rate = f"{act_checked / act_total * 100:.1f}%" if act_total else "N/A"
            writer.writerow([])
            writer.writerow(["活动统计", f"应到 {act_total} 人", f"实到 {act_checked} 人", f"签到率 {act_rate}"])
            total_attendees_all += act_total
            checked_in_all += act_checked

        writer.writerow([])
        writer.writerow(["=== 护理达标计算 ==="])
        writer.writerow(["指标", "数值", "标准", "是否达标"])
        overall_rate = f"{checked_in_all / total_attendees_all * 100:.1f}%" if total_attendees_all else "N/A"
        is_compliant = (checked_in_all / total_attendees_all * 100) >= 90 if total_attendees_all else False
        writer.writerow(["活动签到率", overall_rate, "≥90%", "是" if is_compliant else "否"])
        writer.writerow(["活动总数", len(activities), "-", "-"])
        writer.writerow(["应到总人次", total_attendees_all, "-", "-"])
        writer.writerow(["实到总人次", checked_in_all, "-", "-"])

    if req.include_compliance_rules:
        writer.writerow([])
        writer.writerow(["=== 护理达标计算规则 ==="])
        writer.writerow(["规则ID", "规则名称", "类别", "阈值", "单位", "描述"])
        for rule in COMPLIANCE_RULES:
            writer.writerow([
                rule["id"],
                rule["name"],
                rule["category"],
                rule["threshold"],
                rule["unit"],
                rule["description"],
            ])

    buf.seek(0)
    filename = f"{req.view_type}_{req.start_date}_{req.end_date}.csv"
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/compliance-rules", summary="获取合规规则列表")
async def get_compliance_rules():
    return COMPLIANCE_RULES
