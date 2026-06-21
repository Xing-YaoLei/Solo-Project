import logging
from datetime import datetime
import sys
from pathlib import Path

_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.send_payment_reminder")
def send_payment_reminder(quote_id: str, quote_no: str, client_name: str, due_date: str):
    logger.info(f"发送付款提醒: 报价单 {quote_no} ({client_name}), 到期日 {due_date}")
    return {"status": "sent", "quote_id": quote_id, "timestamp": datetime.utcnow().isoformat()}


@celery_app.task(name="tasks.notify_approval_pending")
def notify_approval_pending(node_id: str, approver_id: str, quote_title: str):
    logger.info(f"审批待处理通知: 节点 {node_id}, 审批人 {approver_id}, 报价单 {quote_title}")
    return {"status": "notified", "node_id": node_id, "timestamp": datetime.utcnow().isoformat()}


@celery_app.task(name="tasks.check_amount_consistency")
def check_amount_consistency(quote_id: str):
    logger.info(f"校验报价单金额一致性: {quote_id}")
    return {"status": "checked", "quote_id": quote_id, "timestamp": datetime.utcnow().isoformat()}


@celery_app.task(name="tasks.generate_daily_report")
def generate_daily_report(date_str: str = None):
    if not date_str:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
    logger.info(f"生成日报: {date_str}")
    return {"status": "generated", "date": date_str, "timestamp": datetime.utcnow().isoformat()}


@celery_app.task(name="tasks.export_quotes_to_excel")
def export_quotes_to_excel(quote_ids: list, export_user: str):
    logger.info(f"导出报价单到 Excel: {len(quote_ids)} 条, 操作人 {export_user}")
    return {"status": "exported", "count": len(quote_ids), "timestamp": datetime.utcnow().isoformat()}


@celery_app.task(name="tasks.check_overdue_payments")
def check_overdue_payments():
    logger.info("检查逾期付款...")
    return {"status": "checked", "timestamp": datetime.utcnow().isoformat()}
