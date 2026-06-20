import io
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.models import (
    PerformanceSchedule, Order, CheckinRecord, Sponsor, SignCode,
    SeatAllocation, MetricDefinition
)
from fastapi.responses import StreamingResponse
from decimal import Decimal


class ExportService:
    CALIBRATION_NOTES = {
        "checkin_efficiency": (
            "核销效率口径说明：核销效率 = 实际核销人数 / 应核销人数 × 100%。"
            "应核销人数为已支付订单中的票务总数；实际核销人数为通过签到码、NFC或人工核验的入场人数。"
            "数据统计范围：演出开始前2小时至演出结束后1小时内的核销记录。"
            "异常核销（重复核销、无效码等）不计入有效核销。"
        ),
        "occupancy_rate": (
            "上座率口径说明：上座率 = 已售座位数 / 总可用座位数 × 100%。"
            "已售座位数包含正常销售、赞助赠票及商户渠道售出座位；总可用座位数不包含技术隔离及维护座位。"
        ),
        "revenue": (
            "收入口径说明：统计范围为已支付订单的实付金额，包含票款及服务费用，不含退款订单。"
            "商户渠道收入按结算金额计算，赞助实物折算不计入现金收入。"
        ),
    }

    METRIC_CODES = {
        "checkin_efficiency": "核销效率",
        "occupancy_rate": "上座率",
        "revenue": "收入金额",
        "ticket_sold": "售票数量",
        "anomaly_rate": "异常核销率",
    }

    @staticmethod
    def _get_metric_definitions_text(db: Session, metric_codes: list = None) -> str:
        query = db.query(MetricDefinition).filter(MetricDefinition.is_active == True)
        if metric_codes:
            query = query.filter(MetricDefinition.metric_code.in_(metric_codes))
        metrics = query.all()

        lines = ["\n\n===== 指标定义 ====="]
        for m in metrics:
            lines.append(f"[{m.metric_code}] {m.metric_name}")
            lines.append(f"  定义: {m.definition}")
            if m.calculation_formula:
                lines.append(f"  计算公式: {m.calculation_formula}")
            if m.unit:
                lines.append(f"  单位: {m.unit}")
            if m.data_source:
                lines.append(f"  数据来源: {m.data_source}")
            lines.append("")
        return "\n".join(lines)

    @staticmethod
    def export_checkin_records_csv(db: Session, schedule_id: int = None):
        query = db.query(CheckinRecord)
        if schedule_id:
            query = query.filter(CheckinRecord.schedule_id == schedule_id)
        records = query.order_by(CheckinRecord.checkin_time.desc()).all()

        buffer = io.StringIO()
        writer = csv.writer(buffer)

        writer.writerow([ExportService.CALIBRATION_NOTES["checkin_efficiency"]])
        writer.writerow([])

        headers = [
            "核销ID", "演出排期ID", "订单ID", "签到码ID", "用户标识",
            "核销时间", "核销渠道", "摄像头核验", "快照ID",
            "是否异常", "异常类型", "异常描述", "操作员工ID", "操作员工"
        ]
        writer.writerow(headers)

        for r in records:
            writer.writerow([
                r.id, r.schedule_id, r.order_id, r.sign_code_id, r.user_identifier,
                r.checkin_time.strftime("%Y-%m-%d %H:%M:%S") if r.checkin_time else "",
                r.checkin_channel, "是" if r.camera_verified else "否", r.camera_snapshot_id or "",
                "是" if r.is_anomaly else "否", r.anomaly_type or "", r.anomaly_description or "",
                r.staff_id or "", r.staff_name or ""
            ])

        buffer.write(ExportService._get_metric_definitions_text(db, ["checkin_efficiency", "anomaly_rate"]))
        buffer.seek(0)

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv; charset=utf-8-sig",
            headers={"Content-Disposition": f"attachment; filename=checkin_records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )

    @staticmethod
    def export_sponsor_list_csv(db: Session, schedule_id: int = None):
        query = db.query(Sponsor)
        if schedule_id:
            query = query.filter(Sponsor.schedule_id == schedule_id)
        sponsors = query.order_by(Sponsor.contribution_amount.desc()).all()

        buffer = io.StringIO()
        writer = csv.writer(buffer)

        writer.writerow([ExportService.CALIBRATION_NOTES["revenue"]])
        writer.writerow([])

        headers = [
            "赞助ID", "演出排期ID", "赞助商名称", "赞助类型", "赞助级别",
            "赞助金额", "实物赞助", "分配票数", "联系人", "联系电话",
            "合同编号", "状态", "备注"
        ]
        writer.writerow(headers)

        for s in sponsors:
            writer.writerow([
                s.id, s.schedule_id, s.sponsor_name, s.sponsor_type or "", s.sponsorship_level or "",
                str(s.contribution_amount), s.in_kind_items or "", s.ticket_allocation,
                s.contact_person or "", s.contact_phone or "", s.contract_no or "",
                s.status, s.notes or ""
            ])

        buffer.write(ExportService._get_metric_definitions_text(db, ["revenue"]))
        buffer.seek(0)

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv; charset=utf-8-sig",
            headers={"Content-Disposition": f"attachment; filename=sponsor_list_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )

    @staticmethod
    def export_performance_summary_csv(db: Session):
        schedules = db.query(PerformanceSchedule).order_by(PerformanceSchedule.performance_date.desc()).all()

        buffer = io.StringIO()
        writer = csv.writer(buffer)

        writer.writerow(["导出时间: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])
        writer.writerow([ExportService.CALIBRATION_NOTES["occupancy_rate"]])
        writer.writerow([ExportService.CALIBRATION_NOTES["checkin_efficiency"]])
        writer.writerow([ExportService.CALIBRATION_NOTES["revenue"]])
        writer.writerow([])

        headers = [
            "排期ID", "演出名称", "场地", "演出日期", "开始时间", "结束时间",
            "总座位数", "已售票数", "上座率(%)", "已核销数", "核销效率(%)",
            "收入金额", "异常核销数", "风险等级", "状态"
        ]
        writer.writerow(headers)

        for s in schedules:
            orders = db.query(Order).filter(Order.schedule_id == s.id, Order.status == "paid").all()
            tickets_sold = sum(o.ticket_count for o in orders)
            revenue = sum((o.total_amount or Decimal("0")) for o in orders)
            checkins = db.query(CheckinRecord).filter(
                CheckinRecord.schedule_id == s.id,
                CheckinRecord.is_anomaly == False
            ).count()
            anomalies = db.query(CheckinRecord).filter(
                CheckinRecord.schedule_id == s.id,
                CheckinRecord.is_anomaly == True
            ).count()

            occupancy = round(tickets_sold / s.total_seats * 100, 2) if s.total_seats > 0 else 0
            efficiency = round(checkins / tickets_sold * 100, 2) if tickets_sold > 0 else 0

            writer.writerow([
                s.id, s.performance_name, s.venue or "",
                s.performance_date.strftime("%Y-%m-%d") if s.performance_date else "",
                s.start_time.strftime("%H:%M") if s.start_time else "",
                s.end_time.strftime("%H:%M") if s.end_time else "",
                s.total_seats, tickets_sold, occupancy, checkins, efficiency,
                str(revenue), anomalies, s.risk_level, s.status
            ])

        buffer.write(ExportService._get_metric_definitions_text(
            db, ["occupancy_rate", "checkin_efficiency", "revenue", "ticket_sold", "anomaly_rate"]
        ))
        buffer.seek(0)

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv; charset=utf-8-sig",
            headers={"Content-Disposition": f"attachment; filename=performance_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
