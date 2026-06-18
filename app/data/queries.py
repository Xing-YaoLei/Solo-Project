from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
import json

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database import SessionLocal
from app.models import (
    Project, Quotation, QuotationItem, Contract, ContractAttachment,
    PurchaseOrder, PurchaseItem, Approval, Payment, RefreshLog,
    ProjectStatus, ApprovalStatus, RoleEnum, User
)


def _to_float(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal):
        return float(val)
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def get_last_refresh_time(refresh_type: str = "full_refresh") -> Optional[datetime]:
    db = SessionLocal()
    try:
        log = (
            db.query(RefreshLog)
            .filter(RefreshLog.refresh_type == refresh_type, RefreshLog.status == "success")
            .order_by(RefreshLog.end_time.desc())
            .first()
        )
        return log.end_time if log else None
    finally:
        db.close()


def get_refresh_history(limit: int = 10) -> List[Dict]:
    db = SessionLocal()
    try:
        logs = (
            db.query(RefreshLog)
            .order_by(RefreshLog.start_time.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": l.id,
                "type": l.refresh_type,
                "start": l.start_time,
                "end": l.end_time,
                "status": l.status,
                "records": l.records_processed,
                "error": l.error_message,
                "task_id": l.celery_task_id
            }
            for l in logs
        ]
    finally:
        db.close()


def get_project_funnel() -> pd.DataFrame:
    db = SessionLocal()
    try:
        funnel_order = [
            ProjectStatus.MEASURED, ProjectStatus.QUOTED,
            ProjectStatus.CONTRACTED, ProjectStatus.IN_PROGRESS,
            ProjectStatus.COMPLETED, ProjectStatus.CLOSED
        ]
        data = []
        for status in funnel_order:
            count = db.query(Project).filter(Project.status == status).count()
            total_amount = (
                db.query(func.coalesce(func.sum(Quotation.final_amount), 0))
                .join(Project, Project.id == Quotation.project_id)
                .filter(Project.status == status)
                .scalar()
            )
            data.append({
                "阶段": status.value,
                "项目数": count,
                "报价金额(万)": round(_to_float(total_amount) / 10000, 2)
            })
        df = pd.DataFrame(data)
        total = df["项目数"].sum()
        df["转化率"] = df["项目数"] / total if total > 0 else 0
        df["阶段留存率"] = df["项目数"] / df["项目数"].iloc[0] if not df.empty and df["项目数"].iloc[0] > 0 else 0
        return df
    finally:
        db.close()


def get_reconciliation_trend(start_date: Optional[date] = None,
                              end_date: Optional[date] = None) -> pd.DataFrame:
    db = SessionLocal()
    try:
        query = db.query(PurchaseOrder)
        if start_date:
            query = query.filter(PurchaseOrder.order_date >= start_date)
        if end_date:
            query = query.filter(PurchaseOrder.order_date <= end_date)

        orders = query.order_by(PurchaseOrder.order_date).all()

        data = []
        for order in orders:
            diff = _to_float(order.total_amount) - _to_float(order.actual_amount)
            diff_rate = (diff / _to_float(order.total_amount) * 100) if _to_float(order.total_amount) > 0 else 0
            data.append({
                "日期": order.order_date,
                "采购单号": order.po_no,
                "项目ID": order.project_id,
                "供应商": order.supplier or "",
                "分类": order.category or "",
                "预算金额": _to_float(order.total_amount),
                "实际金额": _to_float(order.actual_amount),
                "差异金额": round(diff, 2),
                "差异率(%)": round(diff_rate, 2),
                "状态": order.status or ""
            })
        df = pd.DataFrame(data)
        if not df.empty:
            df["日期"] = pd.to_datetime(df["日期"])
            df["月份"] = df["日期"].dt.to_period("M").astype(str)
        return df
    finally:
        db.close()


def get_contract_attachments() -> pd.DataFrame:
    db = SessionLocal()
    try:
        attachments = (
            db.query(
                ContractAttachment,
                Contract.contract_no,
                Project.project_no,
                Project.project_name
            )
            .join(Contract, Contract.id == ContractAttachment.contract_id)
            .join(Project, Project.id == Contract.project_id)
            .all()
        )

        data = []
        for att, contract_no, project_no, project_name in attachments:
            data.append({
                "合同编号": contract_no,
                "项目编号": project_no,
                "项目名称": project_name or "",
                "附件类型": att.attachment_type,
                "文件名": att.file_name,
                "文件大小(KB)": round((att.file_size or 0) / 1024, 2),
                "上传时间": att.uploaded_at
            })
        return pd.DataFrame(data)
    finally:
        db.close()


def get_attachment_type_stats() -> pd.DataFrame:
    db = SessionLocal()
    try:
        result = (
            db.query(
                ContractAttachment.attachment_type,
                func.count(ContractAttachment.id).label("count"),
                func.coalesce(func.sum(ContractAttachment.file_size), 0).label("total_size")
            )
            .group_by(ContractAttachment.attachment_type)
            .all()
        )
        data = [
            {
                "附件类型": r.attachment_type,
                "数量": r.count,
                "总大小(MB)": round(_to_float(r.total_size) / 1024 / 1024, 2)
            }
            for r in result
        ]
        return pd.DataFrame(data)
    finally:
        db.close()


def get_document_details(
    doc_type: str = "quotation",
    project_id: Optional[int] = None
) -> pd.DataFrame:
    db = SessionLocal()
    try:
        if doc_type == "quotation":
            query = (
                db.query(
                    Quotation.quotation_no,
                    Quotation.version,
                    Project.project_no,
                    Project.project_name,
                    QuotationItem.category,
                    QuotationItem.item_name,
                    QuotationItem.specification,
                    QuotationItem.unit,
                    QuotationItem.quantity,
                    QuotationItem.unit_price,
                    QuotationItem.subtotal,
                    QuotationItem.remark
                )
                .join(Quotation, Quotation.id == QuotationItem.quotation_id)
                .join(Project, Project.id == Quotation.project_id)
            )
            if project_id:
                query = query.filter(Project.id == project_id)
            items = query.all()
            columns = ["报价单号", "版本", "项目编号", "项目名称",
                       "分类", "项目名称", "规格", "单位",
                       "数量", "单价", "小计", "备注"]

        elif doc_type == "purchase":
            query = (
                db.query(
                    PurchaseOrder.po_no,
                    Project.project_no,
                    Project.project_name,
                    PurchaseOrder.supplier,
                    PurchaseOrder.category,
                    PurchaseItem.item_name,
                    PurchaseItem.specification,
                    PurchaseItem.brand,
                    PurchaseItem.unit,
                    PurchaseItem.quantity,
                    PurchaseItem.unit_price,
                    PurchaseItem.subtotal,
                    PurchaseItem.quotation_ref,
                    PurchaseItem.remark
                )
                .join(PurchaseOrder, PurchaseOrder.id == PurchaseItem.purchase_order_id)
                .join(Project, Project.id == PurchaseOrder.project_id)
            )
            if project_id:
                query = query.filter(Project.id == project_id)
            items = query.all()
            columns = ["采购单号", "项目编号", "项目名称", "供应商",
                       "采购分类", "材料名称", "规格", "品牌",
                       "单位", "数量", "单价", "小计",
                       "报价关联", "备注"]

        else:
            return pd.DataFrame()

        data = [[_to_float(v) if isinstance(v, Decimal) else v for v in row] for row in items]
        df = pd.DataFrame(data, columns=columns)
        return df
    finally:
        db.close()


def get_approval_abnormal() -> pd.DataFrame:
    db = SessionLocal()
    try:
        approvals = (
            db.query(
                Approval,
                Project.project_no,
                Project.project_name,
                User.full_name.label("approver_name")
            )
            .join(Project, Project.id == Approval.project_id)
            .outerjoin(User, User.id == Approval.approver_id)
            .order_by(Approval.submit_time.desc())
            .all()
        )

        data = []
        for ap, pno, pname, approver in approvals:
            delay_hours = 0
            if ap.submit_time and ap.approve_time and ap.expected_hours:
                expected_complete = ap.submit_time + timedelta(hours=_to_float(ap.expected_hours))
                if ap.approve_time > expected_complete:
                    delay_hours = round((ap.approve_time - expected_complete).total_seconds() / 3600, 1)
            data.append({
                "项目编号": pno,
                "项目名称": pname or "",
                "审批类型": ap.approval_type,
                "关联单据": ap.ref_no or "",
                "审批人": approver or "",
                "状态": ap.status.value,
                "是否异常": "是" if ap.is_abnormal else "否",
                "异常原因": ap.abnormal_reason or "",
                "提交时间": ap.submit_time,
                "审批时间": ap.approve_time,
                "期望时效(小时)": _to_float(ap.expected_hours),
                "实际耗时(小时)": _to_float(ap.actual_hours),
                "超时(小时)": delay_hours,
                "备注": ap.remark or ""
            })
        return pd.DataFrame(data)
    finally:
        db.close()


def get_payment_cycle_data() -> pd.DataFrame:
    db = SessionLocal()
    try:
        rows = (
            db.query(
                Project.project_no,
                Project.project_name,
                Project.contract_date,
                Project.status,
                Payment.stage,
                Payment.plan_date,
                Payment.actual_date,
                Payment.plan_amount,
                Payment.actual_amount,
                Payment.status
            )
            .join(Project, Project.id == Payment.project_id)
            .order_by(Project.contract_date)
            .all()
        )

        data = []
        for pno, pname, contract_date, pstatus, stage, plan_date, actual_date, plan_amt, actual_amt, pay_status in rows:
            cycle_days = None
            delay_days = 0
            if contract_date and actual_date:
                cycle_days = (actual_date - contract_date).days
            if plan_date and actual_date:
                delay_days = (actual_date - plan_date).days
            data.append({
                "项目编号": pno,
                "项目名称": pname or "",
                "合同签订日期": contract_date,
                "项目状态": pstatus.value if pstatus else "",
                "回款阶段": stage or "",
                "计划回款日期": plan_date,
                "实际回款日期": actual_date,
                "计划回款金额": _to_float(plan_amt),
                "实际回款金额": _to_float(actual_amt),
                "回款状态": pay_status.value if pay_status else "",
                "回款周期(天)": cycle_days,
                "逾期天数": delay_days
            })
        return pd.DataFrame(data)
    finally:
        db.close()


def get_project_list() -> pd.DataFrame:
    db = SessionLocal()
    try:
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
        data = [
            {
                "id": p.id,
                "项目编号": p.project_no,
                "项目名称": p.project_name,
                "客户姓名": p.customer_name or "",
                "户型": p.house_type or "",
                "面积(m²)": _to_float(p.area),
                "状态": p.status.value if p.status else "",
                "量房日期": p.measure_date,
                "报价日期": p.quote_date,
                "签单日期": p.contract_date
            }
            for p in projects
        ]
        return pd.DataFrame(data)
    finally:
        db.close()
