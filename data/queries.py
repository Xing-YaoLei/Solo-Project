import pandas as pd
from sqlalchemy import func, and_, cast, Date
from datetime import datetime, timedelta

from models import (
    SessionLocal,
    Appointment,
    WorkOrder,
    WorkOrderItem,
    Part,
    InsuranceDocument,
    Quote,
    AnomalyRecord,
    Remark,
)


def get_appointments_df(start_date=None, end_date=None, status=None, risk_level=None):
    db = SessionLocal()
    try:
        query = db.query(Appointment)

        filters = []
        if start_date:
            filters.append(Appointment.appointment_time >= start_date)
        if end_date:
            filters.append(Appointment.appointment_time <= end_date)
        if status:
            filters.append(Appointment.status == status)
        if risk_level:
            filters.append(Appointment.risk_level == risk_level)

        if filters:
            query = query.filter(and_(*filters))

        results = query.order_by(Appointment.appointment_time.desc()).all()

        data = []
        for apt in results:
            data.append({
                "id": apt.id,
                "appointment_no": apt.appointment_no,
                "customer_name": apt.customer_name,
                "phone": apt.phone,
                "license_plate": apt.license_plate,
                "vehicle_model": apt.vehicle_model,
                "appointment_time": apt.appointment_time,
                "actual_arrival_time": apt.actual_arrival_time,
                "service_type": apt.service_type,
                "description": apt.description,
                "status": apt.status,
                "risk_level": apt.risk_level,
                "created_at": apt.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_work_orders_df(start_date=None, end_date=None, status=None, repair_type=None, is_rework=None, has_parts_shortage=None, risk_level=None):
    db = SessionLocal()
    try:
        query = db.query(WorkOrder)

        filters = []
        if start_date:
            filters.append(WorkOrder.created_at >= start_date)
        if end_date:
            filters.append(WorkOrder.created_at <= end_date)
        if status:
            filters.append(WorkOrder.status == status)
        if repair_type:
            filters.append(WorkOrder.repair_type == repair_type)
        if is_rework is not None:
            filters.append(WorkOrder.is_rework == is_rework)
        if has_parts_shortage is not None:
            filters.append(WorkOrder.has_parts_shortage == has_parts_shortage)

        if risk_level and risk_level != "all":
            query = query.outerjoin(Appointment, WorkOrder.appointment_id == Appointment.id)
            filters.append(Appointment.risk_level == risk_level)

        if filters:
            query = query.filter(and_(*filters))

        results = query.order_by(WorkOrder.created_at.desc()).all()

        data = []
        for order in results:
            data.append({
                "id": order.id,
                "order_no": order.order_no,
                "appointment_id": order.appointment_id,
                "license_plate": order.license_plate,
                "vehicle_model": order.vehicle_model,
                "customer_name": order.customer_name,
                "phone": order.phone,
                "mileage": order.mileage,
                "repair_type": order.repair_type,
                "fault_description": order.fault_description,
                "status": order.status,
                "priority": order.priority,
                "technician": order.technician,
                "advisor": order.advisor,
                "start_time": order.start_time,
                "complete_time": order.complete_time,
                "total_amount": order.total_amount,
                "is_rework": order.is_rework,
                "rework_count": order.rework_count,
                "has_parts_shortage": order.has_parts_shortage,
                "created_at": order.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_work_order_items(order_id):
    db = SessionLocal()
    try:
        items = db.query(WorkOrderItem).filter(WorkOrderItem.work_order_id == order_id).all()

        data = []
        for item in items:
            data.append({
                "id": item.id,
                "work_order_id": item.work_order_id,
                "item_type": item.item_type,
                "item_code": item.item_code,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "amount": item.amount,
                "technician": item.technician,
                "status": item.status,
                "part_id": item.part_id,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_parts_df(category=None, is_shortage=None):
    db = SessionLocal()
    try:
        query = db.query(Part)

        filters = []
        if category:
            filters.append(Part.category == category)
        if is_shortage is not None:
            filters.append(Part.is_shortage == is_shortage)

        if filters:
            query = query.filter(and_(*filters))

        results = query.order_by(Part.part_code).all()

        data = []
        for part in results:
            data.append({
                "id": part.id,
                "part_code": part.part_code,
                "part_name": part.part_name,
                "category": part.category,
                "brand": part.brand,
                "spec": part.spec,
                "unit": part.unit,
                "unit_price": part.unit_price,
                "stock_quantity": part.stock_quantity,
                "safe_stock": part.safe_stock,
                "warehouse": part.warehouse,
                "location": part.location,
                "supplier": part.supplier,
                "is_shortage": part.is_shortage,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_part_stock_records(part_id, limit=50):
    db = SessionLocal()
    try:
        from models import PartsStockRecord
        records = db.query(PartsStockRecord).filter(
            PartsStockRecord.part_id == part_id
        ).order_by(PartsStockRecord.created_at.desc()).limit(limit).all()

        data = []
        for record in records:
            data.append({
                "id": record.id,
                "part_id": record.part_id,
                "part_code": record.part_code,
                "change_type": record.change_type,
                "quantity": record.quantity,
                "balance_before": record.balance_before,
                "balance_after": record.balance_after,
                "related_order_no": record.related_order_no,
                "remark": record.remark,
                "operator": record.operator,
                "created_at": record.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_insurance_documents_df(status=None, insurance_company=None):
    db = SessionLocal()
    try:
        query = db.query(InsuranceDocument)

        filters = []
        if status:
            filters.append(InsuranceDocument.status == status)
        if insurance_company:
            filters.append(InsuranceDocument.insurance_company == insurance_company)

        if filters:
            query = query.filter(and_(*filters))

        results = query.order_by(InsuranceDocument.created_at.desc()).all()

        data = []
        for doc in results:
            data.append({
                "id": doc.id,
                "document_no": doc.document_no,
                "work_order_id": doc.work_order_id,
                "insurance_company": doc.insurance_company,
                "policy_no": doc.policy_no,
                "claim_no": doc.claim_no,
                "license_plate": doc.license_plate,
                "insured_name": doc.insured_name,
                "accident_type": doc.accident_type,
                "accident_date": doc.accident_date,
                "estimated_amount": doc.estimated_amount,
                "claim_amount": doc.claim_amount,
                "deductible": doc.deductible,
                "status": doc.status,
                "reviewer": doc.reviewer,
                "review_time": doc.review_time,
                "remark": doc.remark,
                "created_at": doc.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_quotes_df(work_order_id=None):
    db = SessionLocal()
    try:
        query = db.query(Quote)

        if work_order_id:
            query = query.filter(Quote.work_order_id == work_order_id)

        results = query.order_by(Quote.created_at.desc()).all()

        data = []
        for quote in results:
            data.append({
                "id": quote.id,
                "quote_no": quote.quote_no,
                "work_order_id": quote.work_order_id,
                "license_plate": quote.license_plate,
                "customer_name": quote.customer_name,
                "total_amount": quote.total_amount,
                "parts_amount": quote.parts_amount,
                "labor_amount": quote.labor_amount,
                "discount": quote.discount,
                "status": quote.status,
                "valid_until": quote.valid_until,
                "created_by": quote.created_by,
                "confirmed_by": quote.confirmed_by,
                "confirmed_at": quote.confirmed_at,
                "created_at": quote.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_anomalies_df(anomaly_type=None, severity=None, status=None):
    db = SessionLocal()
    try:
        query = db.query(AnomalyRecord)

        filters = []
        if anomaly_type:
            filters.append(AnomalyRecord.anomaly_type == anomaly_type)
        if severity:
            filters.append(AnomalyRecord.severity == severity)
        if status:
            filters.append(AnomalyRecord.status == status)

        if filters:
            query = query.filter(and_(*filters))

        results = query.order_by(AnomalyRecord.created_at.desc()).all()

        data = []
        for anomaly in results:
            data.append({
                "id": anomaly.id,
                "anomaly_no": anomaly.anomaly_no,
                "anomaly_type": anomaly.anomaly_type,
                "severity": anomaly.severity,
                "status": anomaly.status,
                "source": anomaly.source,
                "related_table": anomaly.related_table,
                "related_id": anomaly.related_id,
                "related_no": anomaly.related_no,
                "title": anomaly.title,
                "description": anomaly.description,
                "detected_at": anomaly.detected_at,
                "handled_by": anomaly.handled_by,
                "handled_at": anomaly.handled_at,
                "handle_result": anomaly.handle_result,
                "created_at": anomaly.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_remarks(related_type, related_id):
    db = SessionLocal()
    try:
        remarks = db.query(Remark).filter(
            and_(
                Remark.related_type == related_type,
                Remark.related_id == related_id,
            )
        ).order_by(Remark.is_pinned.desc(), Remark.created_at.desc()).all()

        data = []
        for remark in remarks:
            data.append({
                "id": remark.id,
                "related_type": remark.related_type,
                "related_id": remark.related_id,
                "related_no": remark.related_no,
                "content": remark.content,
                "author": remark.author,
                "is_pinned": remark.is_pinned,
                "created_at": remark.created_at,
                "updated_at": remark.updated_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def add_remark(related_type, related_id, related_no, content, author):
    db = SessionLocal()
    try:
        remark = Remark(
            related_type=related_type,
            related_id=related_id,
            related_no=related_no,
            content=content,
            author=author,
        )
        db.add(remark)
        db.commit()
        db.refresh(remark)
        return remark.id
    finally:
        db.close()


def update_anomaly_status(anomaly_id, status, handled_by=None, handle_result=None):
    db = SessionLocal()
    try:
        anomaly = db.query(AnomalyRecord).filter(AnomalyRecord.id == anomaly_id).first()
        if anomaly:
            anomaly.status = status
            if handled_by:
                anomaly.handled_by = handled_by
            if handle_result:
                anomaly.handle_result = handle_result
            if status in ["resolved", "closed"]:
                anomaly.handled_at = datetime.now()
            db.commit()
            return True
        return False
    finally:
        db.close()


def get_rework_rate_stats(start_date=None, end_date=None, status=None, repair_type=None, has_parts_shortage=None, risk_level=None):
    db = SessionLocal()
    try:
        query = db.query(
            func.date(WorkOrder.created_at).label("date"),
            func.count(WorkOrder.id).label("total_orders"),
            func.sum(WorkOrder.is_rework.cast("int")).label("rework_count"),
        )

        filters = []
        if status and status != "all":
            filters.append(WorkOrder.status == status)
        else:
            filters.append(WorkOrder.status == "completed")

        if start_date:
            filters.append(WorkOrder.created_at >= start_date)
        if end_date:
            filters.append(WorkOrder.created_at <= end_date)
        if repair_type and repair_type != "all":
            filters.append(WorkOrder.repair_type == repair_type)
        if has_parts_shortage is not None:
            filters.append(WorkOrder.has_parts_shortage == has_parts_shortage)

        if risk_level and risk_level != "all":
            query = query.outerjoin(Appointment, WorkOrder.appointment_id == Appointment.id)
            filters.append(Appointment.risk_level == risk_level)

        if filters:
            query = query.filter(and_(*filters))

        query = query.group_by(func.date(WorkOrder.created_at)).order_by("date")
        results = query.all()

        data = []
        for row in results:
            total = row.total_orders
            rework = row.rework_count or 0
            rate = rework / total if total > 0 else 0
            data.append({
                "date": row.date,
                "total_orders": total,
                "rework_count": rework,
                "rework_rate": rate,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_daily_appointments_stats(days=30):
    db = SessionLocal()
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        results = db.query(
            func.date(Appointment.appointment_time).label("date"),
            func.count(Appointment.id).label("total_count"),
            func.sum((Appointment.status == "arrived").cast("int")).label("arrived_count"),
            func.sum((Appointment.status == "cancelled").cast("int")).label("cancelled_count"),
            func.sum((Appointment.risk_level == "high").cast("int")).label("high_risk_count"),
            func.sum((Appointment.risk_level == "medium").cast("int")).label("medium_risk_count"),
            func.sum((Appointment.risk_level == "low").cast("int")).label("low_risk_count"),
        ).filter(
            Appointment.appointment_time >= start_date
        ).group_by(
            func.date(Appointment.appointment_time)
        ).order_by("date").all()

        data = []
        for row in results:
            data.append({
                "date": row.date,
                "total_count": row.total_count,
                "arrived_count": row.arrived_count or 0,
                "cancelled_count": row.cancelled_count or 0,
                "high_risk_count": row.high_risk_count or 0,
                "medium_risk_count": row.medium_risk_count or 0,
                "low_risk_count": row.low_risk_count or 0,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_work_order_by_id(order_id):
    db = SessionLocal()
    try:
        order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
        if order:
            return {
                "id": order.id,
                "order_no": order.order_no,
                "license_plate": order.license_plate,
                "vehicle_model": order.vehicle_model,
                "customer_name": order.customer_name,
                "phone": order.phone,
                "mileage": order.mileage,
                "repair_type": order.repair_type,
                "fault_description": order.fault_description,
                "status": order.status,
                "priority": order.priority,
                "technician": order.technician,
                "advisor": order.advisor,
                "start_time": order.start_time,
                "complete_time": order.complete_time,
                "total_amount": order.total_amount,
                "is_rework": order.is_rework,
                "rework_count": order.rework_count,
                "has_parts_shortage": order.has_parts_shortage,
            }
        return None
    finally:
        db.close()


def get_repair_type_distribution(start_date=None, end_date=None, status=None, repair_type=None, has_parts_shortage=None, risk_level=None):
    db = SessionLocal()
    try:
        query = db.query(
            WorkOrder.repair_type,
            func.count(WorkOrder.id).label("count"),
            func.sum(WorkOrder.total_amount).label("total_amount"),
        )

        filters = []
        if start_date:
            filters.append(WorkOrder.created_at >= start_date)
        if end_date:
            filters.append(WorkOrder.created_at <= end_date)
        if status and status != "all":
            filters.append(WorkOrder.status == status)
        if repair_type and repair_type != "all":
            filters.append(WorkOrder.repair_type == repair_type)
        if has_parts_shortage is not None:
            filters.append(WorkOrder.has_parts_shortage == has_parts_shortage)

        if risk_level and risk_level != "all":
            query = query.outerjoin(Appointment, WorkOrder.appointment_id == Appointment.id)
            filters.append(Appointment.risk_level == risk_level)

        if filters:
            query = query.filter(and_(*filters))

        results = query.group_by(WorkOrder.repair_type).all()

        data = []
        for row in results:
            data.append({
                "repair_type": row.repair_type or "未知",
                "count": row.count,
                "total_amount": row.total_amount or 0,
            })

        return pd.DataFrame(data)
    finally:
        db.close()
