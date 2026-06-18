from datetime import datetime, timedelta
from celery import shared_task
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import (
    RefreshLog, Project, Quotation, PurchaseOrder, Approval,
    ProjectStatus, ApprovalStatus
)
from app.tasks.utils import log_task_result


@celery_app.task(bind=True, name="tasks.full_refresh")
def full_refresh_task(self, triggered_by=None):
    task_id = self.request.id
    db = SessionLocal()
    log = RefreshLog(
        refresh_type="full_refresh",
        status="running",
        triggered_by=triggered_by,
        celery_task_id=task_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        total_records = 0

        total_records += _refresh_project_funnel(db)
        total_records += _refresh_quotation_stats(db)
        total_records += _refresh_purchase_reconciliation(db)
        total_records += _refresh_approval_abnormal(db)
        total_records += _refresh_payment_cycle(db)

        log.status = "success"
        log.end_time = datetime.now()
        log.records_processed = total_records
        db.commit()
        return {"status": "success", "records_processed": total_records, "task_id": task_id}

    except Exception as e:
        db.rollback()
        log.status = "failed"
        log.end_time = datetime.now()
        log.error_message = str(e)
        db.commit()
        raise
    finally:
        db.close()


def _refresh_project_funnel(db: Session) -> int:
    statuses = [e.value for e in ProjectStatus]
    count = 0
    for status in statuses:
        cnt = db.query(Project).filter(Project.status == status).count()
        count += cnt
    return count


def _refresh_quotation_stats(db: Session) -> int:
    return db.query(Quotation).count()


def _refresh_purchase_reconciliation(db: Session) -> int:
    orders = db.query(PurchaseOrder).all()
    for order in orders:
        diff = float(order.total_amount or 0) - float(order.actual_amount or 0)
        order.purchase_no = order.po_no
    db.commit()
    return len(orders)


def _refresh_approval_abnormal(db: Session) -> int:
    approvals = db.query(Approval).all()
    updated = 0
    for ap in approvals:
        abnormal = False
        reason = []
        if ap.submit_time and ap.expected_hours:
            deadline = ap.submit_time + timedelta(hours=float(ap.expected_hours or 0))
            if ap.approve_time and ap.approve_time > deadline:
                abnormal = True
                reason.append(f"审批超时{round((ap.approve_time - deadline).total_seconds() / 3600, 1)}小时")
        if ap.status == ApprovalStatus.REJECTED:
            abnormal = True
            reason.append("审批被驳回")
        if abnormal:
            ap.is_abnormal = True
            ap.abnormal_reason = "; ".join(reason)
            updated += 1
    db.commit()
    return updated


def _refresh_payment_cycle(db: Session) -> int:
    return db.query(Project).count()


@celery_app.task(name="tasks.incremental_refresh")
def incremental_refresh_task(triggered_by=None):
    return full_refresh_task(triggered_by=triggered_by)


@celery_app.task(name="tasks.compute_reconciliation_diff")
def compute_reconciliation_diff_task(po_ids=None):
    db = SessionLocal()
    try:
        query = db.query(PurchaseOrder)
        if po_ids:
            query = query.filter(PurchaseOrder.id.in_(po_ids))
        orders = query.all()
        results = []
        for order in orders:
            diff = float(order.total_amount or 0) - float(order.actual_amount or 0)
            diff_rate = (diff / float(order.total_amount or 1)) * 100
            results.append({
                "po_id": order.id,
                "po_no": order.po_no,
                "diff": round(diff, 2),
                "diff_rate": round(diff_rate, 2)
            })
        return results
    finally:
        db.close()
