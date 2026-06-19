import random
import json
from datetime import datetime, timedelta, date

from sqlalchemy import and_

from tasks.celery_app import celery_app
from tasks.utils import sync_task_decorator
from models import InsuranceDocument, AnomalyRecord


@celery_app.task(bind=True, name="tasks.sync_insurance_documents")
@sync_task_decorator("保险材料同步", "insurance_system")
def sync_insurance_documents(self, sync_type="incremental", db=None):
    records_count = 0
    error_count = 0

    docs_data = _fetch_insurance_from_source(sync_type)

    for doc_data in docs_data:
        try:
            doc = db.query(InsuranceDocument).filter(
                InsuranceDocument.document_no == doc_data["document_no"]
            ).first()

            if doc:
                doc.status = doc_data["status"]
                doc.claim_amount = doc_data["claim_amount"]
                doc.reviewer = doc_data.get("reviewer")
                doc.review_time = doc_data.get("review_time")
                doc.remark = doc_data.get("remark")
                doc.updated_at = datetime.now()

                if doc_data["status"] == "rejected":
                    _create_insurance_issue_anomaly(db, doc)
            else:
                doc = InsuranceDocument(
                    document_no=doc_data["document_no"],
                    work_order_id=doc_data.get("work_order_id"),
                    appointment_id=doc_data.get("appointment_id"),
                    insurance_company=doc_data["insurance_company"],
                    policy_no=doc_data["policy_no"],
                    claim_no=doc_data.get("claim_no"),
                    license_plate=doc_data["license_plate"],
                    insured_name=doc_data["insured_name"],
                    accident_type=doc_data["accident_type"],
                    accident_date=doc_data["accident_date"],
                    estimated_amount=doc_data["estimated_amount"],
                    claim_amount=doc_data["claim_amount"],
                    deductible=doc_data.get("deductible", 0),
                    status=doc_data["status"],
                    materials=json.dumps(doc_data.get("materials", []), ensure_ascii=False),
                    reviewer=doc_data.get("reviewer"),
                    review_time=doc_data.get("review_time"),
                    remark=doc_data.get("remark"),
                )
                db.add(doc)

                if doc_data["status"] == "rejected":
                    _create_insurance_issue_anomaly(db, doc)

                if doc_data["status"] == "pending" and doc_data["estimated_amount"] > 5000:
                    _create_high_value_insurance_anomaly(db, doc)

            records_count += 1
        except Exception:
            error_count += 1
            continue

    db.commit()
    return {"records_count": records_count, "error_count": error_count}


def _fetch_insurance_from_source(sync_type):
    insurance_companies = ["中国人保", "平安保险", "太平洋保险", "中国人寿", "阳光保险", "大地保险"]
    accident_types = ["单方事故", "双方事故", "多方事故", "划痕险", "玻璃单独破碎", "涉水险", "自燃险"]
    statuses = ["pending", "submitted", "approved", "rejected", "paid"]

    docs = []
    today = date.today()

    for i in range(1, 11):
        doc_no = f"INS{today.strftime('%Y%m')}{i:04d}"
        status = random.choice(statuses)
        estimated = round(random.uniform(500, 15000), 2)
        claim = round(estimated * random.uniform(0.6, 1.0), 2) if status in ["approved", "paid"] else 0

        review_time = None
        reviewer = None
        if status in ["approved", "rejected"]:
            review_time = datetime.combine(today - timedelta(days=random.randint(0, 5)), datetime.min.time()) + timedelta(hours=14)
            reviewer = random.choice(["审核员A", "审核员B", "审核员C"])

        materials = [
            {"name": "行驶证", "status": "received"},
            {"name": "驾驶证", "status": "received"},
            {"name": "身份证", "status": "received"},
            {"name": "事故认定书", "status": random.choice(["received", "pending"])},
            {"name": "维修发票", "status": random.choice(["received", "pending"])},
            {"name": "现场照片", "status": "received"},
        ]

        docs.append({
            "document_no": doc_no,
            "work_order_id": random.randint(1, 15),
            "appointment_id": None,
            "insurance_company": random.choice(insurance_companies),
            "policy_no": f"POL{random.randint(100000, 999999)}",
            "claim_no": f"CLM{random.randint(100000, 999999)}" if status != "pending" else None,
            "license_plate": f"京A{random.randint(10000, 99999)}",
            "insured_name": random.choice(["王先生", "李先生", "张女士", "刘先生", "陈女士"]),
            "accident_type": random.choice(accident_types),
            "accident_date": today - timedelta(days=random.randint(1, 30)),
            "estimated_amount": estimated,
            "claim_amount": claim,
            "deductible": round(estimated * random.uniform(0.05, 0.1), 2),
            "status": status,
            "materials": materials,
            "reviewer": reviewer,
            "review_time": review_time,
            "remark": None if status != "rejected" else "材料不全，请补充事故现场照片",
        })

    if sync_type == "incremental":
        random.shuffle(docs)
        return docs[:random.randint(2, len(docs))]

    return docs


def _create_insurance_issue_anomaly(db, doc):
    existing = db.query(AnomalyRecord).filter(
        and_(
            AnomalyRecord.anomaly_type == "insurance_issue",
            AnomalyRecord.related_table == "insurance_documents",
            AnomalyRecord.related_id == doc.id,
            AnomalyRecord.status.in_(["open", "in_progress"]),
        )
    ).first()

    if not existing:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
            anomaly_type="insurance_issue",
            severity="high",
            status="open",
            source="sync",
            related_table="insurance_documents",
            related_id=doc.id,
            related_no=doc.document_no,
            title=f"保险理赔异常: {doc.document_no}",
            description=f"保险单据 {doc.document_no} 状态为 {doc.status}，{doc.remark or '请及时跟进'}",
            detected_at=datetime.now(),
        )
        db.add(anomaly)


def _create_high_value_insurance_anomaly(db, doc):
    existing = db.query(AnomalyRecord).filter(
        and_(
            AnomalyRecord.anomaly_type == "review_flag",
            AnomalyRecord.related_table == "insurance_documents",
            AnomalyRecord.related_id == doc.id,
            AnomalyRecord.status.in_(["open", "in_progress"]),
        )
    ).first()

    if not existing:
        anomaly = AnomalyRecord(
            anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
            anomaly_type="review_flag",
            severity="medium",
            status="open",
            source="sync",
            related_table="insurance_documents",
            related_id=doc.id,
            related_no=doc.document_no,
            title=f"高额理赔审核提示: {doc.document_no}",
            description=f"保险单据 {doc.document_no} 预估金额 {doc.estimated_amount} 元，超过5000元需重点审核",
            detected_at=datetime.now(),
        )
        db.add(anomaly)
