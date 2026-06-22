import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from email.parser import Parser
from email.policy import default

import pandas as pd
from sqlalchemy.orm import Session

from app.models import EmailMaterial, ImportBatch, BatchStatus
from app.services.batch_service import create_batch, update_batch_progress, complete_batch


KEYWORD_CATEGORIES = {
    "审批流程": ["审批", "批准", "复核", "授权", "签字"],
    "资金管理": ["付款", "转账", "报销", "预算", "费用"],
    "人事管理": ["入职", "离职", "调岗", "晋升", "绩效"],
    "采购管理": ["采购", "招标", "供应商", "合同", "订单"],
    "合规风控": ["合规", "风险", "审计", "内控", "检查"],
}


DEPARTMENT_KEYWORDS = {
    "财务部": ["财务", "会计", "出纳", "税务", "资金"],
    "人事部": ["人事", "HR", "人力", "招聘", "薪酬"],
    "采购部": ["采购", "供应", "招标", "合同"],
    "技术部": ["技术", "研发", "IT", "系统", "开发"],
    "合规部": ["合规", "风控", "审计", "法务"],
}


def extract_keywords(text: str) -> List[str]:
    if not text:
        return []
    found = set()
    for category, keywords in KEYWORD_CATEGORIES.items():
        for kw in keywords:
            if kw in text:
                found.add(category)
                break
    return list(found)


def detect_department(text: str) -> Optional[str]:
    if not text:
        return None
    for dept, keywords in DEPARTMENT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return dept
    return None


def parse_email_file(file_content: str) -> Dict[str, Any]:
    try:
        msg = Parser(policy=default).parsestr(file_content)
        subject = msg.get("Subject", "")
        sender = msg.get("From", "")
        recipients = msg.get("To", "")
        sent_at_str = msg.get("Date", "")
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        body = part.get_content()
                    except Exception:
                        body = str(part.get_payload())
                    break
        else:
            try:
                body = msg.get_content()
            except Exception:
                body = str(msg.get_payload())

        attachments = []
        if msg.is_multipart():
            for part in msg.walk():
                filename = part.get_filename()
                if filename:
                    attachments.append(filename)

        sent_at = None
        if sent_at_str:
            try:
                from email.utils import parsedate_to_datetime
                sent_at = parsedate_to_datetime(sent_at_str).replace(tzinfo=None)
            except Exception:
                pass

        combined_text = f"{subject} {body}"
        return {
            "subject": subject,
            "sender": sender,
            "recipients": recipients,
            "sent_at": sent_at,
            "body": body,
            "attachments_count": len(attachments),
            "attachment_names": attachments,
            "keywords": extract_keywords(combined_text),
            "department": detect_department(combined_text),
            "category": extract_keywords(combined_text)[0] if extract_keywords(combined_text) else None,
        }
    except Exception:
        return {}


def parse_email_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    results = []
    for _, row in df.iterrows():
        subject = str(row.get("subject", "") or row.get("主题", ""))
        sender = str(row.get("sender", "") or row.get("发件人", ""))
        recipients = str(row.get("recipients", "") or row.get("收件人", ""))
        body = str(row.get("body", "") or row.get("正文", "") or row.get("content", ""))
        sent_at = row.get("sent_at") or row.get("发送时间") or row.get("date")
        attachments = row.get("attachments", []) or row.get("附件", [])

        if isinstance(sent_at, str):
            try:
                sent_at = pd.to_datetime(sent_at).to_pydatetime()
            except Exception:
                sent_at = None
        elif hasattr(sent_at, "to_pydatetime"):
            sent_at = sent_at.to_pydatetime()

        combined_text = f"{subject} {body}"
        results.append({
            "subject": subject,
            "sender": sender,
            "recipients": recipients,
            "sent_at": sent_at,
            "body": body,
            "attachments_count": len(attachments) if isinstance(attachments, list) else 0,
            "attachment_names": attachments if isinstance(attachments, list) else [],
            "keywords": extract_keywords(combined_text),
            "department": detect_department(combined_text),
            "category": extract_keywords(combined_text)[0] if extract_keywords(combined_text) else None,
        })
    return results


def import_emails(
    db: Session,
    email_records: List[Dict[str, Any]],
    description: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> str:
    batch = create_batch(db, "email", description, imported_by)
    batch_id = batch.id
    total = len(email_records)
    success = 0
    failed = 0

    for record in email_records:
        try:
            email = EmailMaterial(
                batch_id=batch_id,
                message_id=record.get("message_id"),
                subject=record.get("subject", ""),
                sender=record.get("sender", ""),
                recipients=record.get("recipients", ""),
                sent_at=record.get("sent_at"),
                body=record.get("body", ""),
                attachments_count=record.get("attachments_count", 0),
                attachment_names=record.get("attachment_names", []),
                keywords=record.get("keywords", []),
                department=record.get("department"),
                category=record.get("category"),
                raw_data=record,
            )
            db.add(email)
            success += 1
            if success % 100 == 0:
                db.commit()
                update_batch_progress(db, batch_id, success=success, failed=failed)
        except Exception:
            failed += 1

    try:
        db.commit()
    except Exception:
        db.rollback()

    update_batch_progress(db, batch_id, success=success, failed=failed)
    batch_obj = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if batch_obj:
        batch_obj.total_records = total
        db.commit()
    status = BatchStatus.COMPLETED if failed == 0 else BatchStatus.FAILED
    complete_batch(db, batch_id, status=status)
    return batch.batch_number
