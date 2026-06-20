import pandas as pd
from datetime import datetime
from sqlalchemy import and_, func
from app.database import SessionLocal
from app.models import (
    Activity, TicketType, Sponsor, Registration,
    Payment, GateRecord, AnomalyRecord, Remark
)


class DataService:
    def __init__(self):
        self.db = SessionLocal()

    def close(self):
        self.db.close()

    def get_activities(self):
        activities = self.db.query(Activity).all()
        return [{"id": a.id, "name": a.name, "type": a.activity_type} for a in activities]

    def get_funnel_data(self, activity_id=None, start_date=None, end_date=None):
        query = self.db.query(Registration)
        if activity_id:
            query = query.filter(Registration.activity_id == activity_id)
        if start_date:
            query = query.filter(Registration.register_time >= start_date)
        if end_date:
            query = query.filter(Registration.register_time <= end_date)

        registrations = query.all()
        reg_df = pd.DataFrame([{
            "id": r.id,
            "activity_id": r.activity_id,
            "sponsor_id": r.sponsor_id,
            "ticket_type_id": r.ticket_type_id,
            "order_no": r.order_no,
            "quantity": r.quantity,
            "total_amount": r.total_amount,
            "status": r.status,
            "is_disputed": r.is_disputed,
            "register_time": r.register_time,
        } for r in registrations])

        if reg_df.empty:
            return pd.DataFrame()

        sponsor_count = self.db.query(func.sum(Sponsor.allocated_tickets))
        if activity_id:
            sponsor_count = sponsor_count.filter(Sponsor.activity_id == activity_id)
        sponsor_count = sponsor_count.scalar() or 0

        registration_count = int(reg_df["quantity"].sum())

        paid_df = reg_df[reg_df["status"].isin(["paid", "refunded", "disputed"])]
        paid_count = int(paid_df["quantity"].sum()) if not paid_df.empty else 0

        gate_query = self.db.query(GateRecord).filter(GateRecord.is_valid == True)
        if activity_id:
            gate_query = gate_query.join(Registration).filter(Registration.activity_id == activity_id)
        gate_count = gate_query.count()

        funnel_data = pd.DataFrame({
            "stage": ["赞助分配", "报名", "支付完成", "核销入场"],
            "count": [sponsor_count, registration_count, paid_count, gate_count],
            "color": ["#636EFA", "#00CC96", "#AB63FA", "#FFA15A"],
        })

        funnel_data["conversion_rate"] = funnel_data["count"].pct_change() + 1
        funnel_data.loc[0, "conversion_rate"] = 1.0

        return funnel_data

    def get_sponsor_list(self, activity_id=None):
        query = self.db.query(Sponsor)
        if activity_id:
            query = query.filter(Sponsor.activity_id == activity_id)

        sponsors = query.all()
        data = []
        for s in sponsors:
            used_count = self.db.query(func.sum(Registration.quantity)).filter(
                Registration.sponsor_id == s.id
            ).scalar() or 0

            checked_count = self.db.query(GateRecord).join(
                Registration, GateRecord.registration_id == Registration.id
            ).filter(
                Registration.sponsor_id == s.id,
                GateRecord.is_valid == True,
            ).count()

            data.append({
                "id": s.id,
                "name": s.name,
                "sponsor_level": s.sponsor_level,
                "allocated_tickets": s.allocated_tickets,
                "used_tickets": used_count,
                "checked_tickets": checked_count,
                "usage_rate": used_count / s.allocated_tickets if s.allocated_tickets > 0 else 0,
                "checkin_rate": checked_count / used_count if used_count > 0 else 0,
            })

        return pd.DataFrame(data)

    def get_gate_records_by_sponsor(self, sponsor_id):
        gate_records = self.db.query(GateRecord).join(
            Registration, GateRecord.registration_id == Registration.id
        ).filter(
            Registration.sponsor_id == sponsor_id,
            GateRecord.is_valid == True,
        ).all()

        data = []
        for g in gate_records:
            data.append({
                "id": g.id,
                "ticket_code": g.ticket_code,
                "order_no": g.registration.order_no,
                "customer_name": g.registration.customer_name,
                "ticket_type": g.registration.ticket_type.name if g.registration.ticket_type else "",
                "gate_no": g.gate_no,
                "check_in_time": g.check_in_time,
                "check_in_type": g.check_in_type,
                "is_disputed": g.registration.is_disputed,
            })

        return pd.DataFrame(data)

    def get_ticket_types(self, activity_id=None):
        query = self.db.query(TicketType)
        if activity_id:
            query = query.filter(TicketType.activity_id == activity_id)

        ticket_types = query.all()
        data = []
        for t in ticket_types:
            sold_count = self.db.query(func.sum(Registration.quantity)).filter(
                Registration.ticket_type_id == t.id,
                Registration.status.in_(["paid", "refunded", "disputed"]),
            ).scalar() or 0

            checked_count = self.db.query(GateRecord).join(
                Registration, GateRecord.registration_id == Registration.id
            ).filter(
                Registration.ticket_type_id == t.id,
                GateRecord.is_valid == True,
            ).count()

            data.append({
                "id": t.id,
                "name": t.name,
                "price": t.price,
                "category": t.ticket_category,
                "total_quantity": t.total_quantity,
                "sold_quantity": sold_count,
                "checked_quantity": checked_count,
                "sell_rate": sold_count / t.total_quantity if t.total_quantity > 0 else 0,
                "checkin_rate": checked_count / sold_count if sold_count > 0 else 0,
                "is_refundable": t.is_refundable,
                "description": t.description,
            })

        return pd.DataFrame(data)

    def get_raw_samples(self, activity_id=None, sponsor_id=None, ticket_type_id=None, limit=100):
        query = self.db.query(Registration)
        if activity_id:
            query = query.filter(Registration.activity_id == activity_id)
        if sponsor_id:
            query = query.filter(Registration.sponsor_id == sponsor_id)
        if ticket_type_id:
            query = query.filter(Registration.ticket_type_id == ticket_type_id)

        registrations = query.limit(limit).all()
        data = []
        for r in registrations:
            has_gate = self.db.query(GateRecord).filter(
                GateRecord.registration_id == r.id,
                GateRecord.is_valid == True,
            ).first() is not None

            data.append({
                "id": r.id,
                "order_no": r.order_no,
                "customer_name": r.customer_name,
                "customer_phone": r.customer_phone,
                "ticket_type": r.ticket_type.name if r.ticket_type else "",
                "sponsor": r.sponsor.name if r.sponsor else "",
                "quantity": r.quantity,
                "total_amount": r.total_amount,
                "status": r.status,
                "is_disputed": r.is_disputed,
                "has_checked": has_gate,
                "register_time": r.register_time,
            })

        return pd.DataFrame(data)

    def get_anomaly_records(self, activity_id=None, is_resolved=None, anomaly_type=None):
        query = self.db.query(AnomalyRecord)
        if is_resolved is not None:
            query = query.filter(AnomalyRecord.is_resolved == is_resolved)
        if anomaly_type:
            query = query.filter(AnomalyRecord.anomaly_type == anomaly_type)

        records = query.order_by(AnomalyRecord.detected_time.desc()).all()
        return pd.DataFrame([{
            "id": r.id,
            "anomaly_type": r.anomaly_type,
            "source_table": r.source_table,
            "description": r.description,
            "severity": r.severity,
            "is_resolved": r.is_resolved,
            "detected_time": r.detected_time,
        } for r in records])

    def get_remarks(self, target_type, target_id):
        remarks = self.db.query(Remark).filter(
            Remark.target_type == target_type,
            Remark.target_id == str(target_id),
        ).order_by(Remark.created_at.desc()).all()

        return pd.DataFrame([{
            "id": r.id,
            "content": r.content,
            "created_by": r.created_by,
            "created_at": r.created_at,
        } for r in remarks])

    def add_remark(self, target_type, target_id, content, created_by="system"):
        remark = Remark(
            target_type=target_type,
            target_id=str(target_id),
            content=content,
            created_by=created_by,
        )
        self.db.add(remark)
        self.db.commit()
        self.db.refresh(remark)
        return remark

    def get_checkin_efficiency(self, activity_id=None):
        gate_query = self.db.query(GateRecord).filter(GateRecord.is_valid == True)
        if activity_id:
            gate_query = gate_query.join(Registration).filter(
                Registration.activity_id == activity_id
            )

        gate_records = gate_query.all()

        if not gate_records:
            return pd.DataFrame()

        df = pd.DataFrame([{
            "id": g.id,
            "check_in_time": g.check_in_time,
            "gate_no": g.gate_no,
            "registration_id": g.registration_id,
        } for g in gate_records])

        df["check_in_hour"] = pd.to_datetime(df["check_in_time"]).dt.hour
        hourly_stats = df.groupby("check_in_hour").size().reset_index(name="count")

        return hourly_stats

    def get_disputed_orders(self, activity_id=None):
        query = self.db.query(Registration).filter(Registration.is_disputed == True)
        if activity_id:
            query = query.filter(Registration.activity_id == activity_id)

        orders = query.all()
        return pd.DataFrame([{
            "id": o.id,
            "order_no": o.order_no,
            "customer_name": o.customer_name,
            "total_amount": o.total_amount,
            "dispute_reason": o.dispute_reason,
            "status": o.status,
            "register_time": o.register_time,
        } for o in orders])
