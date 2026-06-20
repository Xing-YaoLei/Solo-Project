import pandas as pd
from datetime import datetime
from sqlalchemy import and_, func
from app.database import SessionLocal
from app.models import (
    Activity, TicketType, Sponsor, Registration,
    Payment, GateRecord, AnomalyRecord, Remark
)


def _parse_date_str(date_str):
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        if isinstance(date_str, str):
            if len(date_str) == 10:
                return datetime.strptime(date_str, "%Y-%m-%d")
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        pass
    return None


class DataService:
    def __init__(self):
        self.db = SessionLocal()

    def close(self):
        self.db.close()

    def _build_registration_filters(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
    ):
        filters = []
        if activity_id:
            filters.append(Registration.activity_id == activity_id)

        start_dt = _parse_date_str(start_date)
        if start_dt:
            filters.append(Registration.register_time >= start_dt)

        end_dt = _parse_date_str(end_date)
        if end_dt:
            filters.append(Registration.register_time <= end_dt)

        if ticket_type_ids:
            filters.append(Registration.ticket_type_id.in_(ticket_type_ids))

        if sponsor_levels:
            filters.append(
                Registration.sponsor_id.in_(
                    self.db.query(Sponsor.id).filter(
                        Sponsor.sponsor_level.in_(sponsor_levels)
                    )
                )
            )

        return filters

    def _build_gate_filters(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
    ):
        filters = [GateRecord.is_valid == True]
        join_conds = [GateRecord.registration_id == Registration.id]

        if activity_id:
            filters.append(Registration.activity_id == activity_id)

        start_dt = _parse_date_str(start_date)
        if start_dt:
            filters.append(Registration.register_time >= start_dt)

        end_dt = _parse_date_str(end_date)
        if end_dt:
            filters.append(Registration.register_time <= end_dt)

        if ticket_type_ids:
            filters.append(Registration.ticket_type_id.in_(ticket_type_ids))

        if sponsor_levels:
            filters.append(
                Registration.sponsor_id.in_(
                    self.db.query(Sponsor.id).filter(
                        Sponsor.sponsor_level.in_(sponsor_levels)
                    )
                )
            )

        return filters, join_conds

    def get_activities(self):
        activities = self.db.query(Activity).all()
        return [{"id": a.id, "name": a.name, "type": a.activity_type} for a in activities]

    def get_funnel_data(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
    ):
        reg_filters = self._build_registration_filters(
            activity_id, start_date, end_date, ticket_type_ids, sponsor_levels
        )

        reg_query = self.db.query(Registration)
        if reg_filters:
            reg_query = reg_query.filter(and_(*reg_filters))
        registrations = reg_query.all()

        reg_columns = [
            "id", "activity_id", "sponsor_id", "ticket_type_id",
            "order_no", "quantity", "total_amount", "status",
            "is_disputed", "register_time",
        ]
        reg_rows = [
            {
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
            }
            for r in registrations
        ]
        reg_df = pd.DataFrame(reg_rows, columns=reg_columns)

        sponsor_query = self.db.query(func.sum(Sponsor.allocated_tickets))
        if activity_id:
            sponsor_query = sponsor_query.filter(Sponsor.activity_id == activity_id)
        if sponsor_levels:
            sponsor_query = sponsor_query.filter(Sponsor.sponsor_level.in_(sponsor_levels))
        sponsor_count = sponsor_query.scalar() or 0

        if reg_df.empty:
            gate_count = 0
        else:
            gate_filters, gate_join = self._build_gate_filters(
                activity_id, start_date, end_date, ticket_type_ids, sponsor_levels
            )
            gate_query = self.db.query(GateRecord).join(
                Registration, and_(*gate_join)
            ).filter(and_(*gate_filters))
            gate_count = gate_query.count()

        registration_count = int(reg_df["quantity"].sum()) if not reg_df.empty else 0

        paid_df = reg_df[reg_df["status"].isin(["paid", "refunded", "disputed"])]
        paid_count = int(paid_df["quantity"].sum()) if not paid_df.empty else 0

        funnel_data = pd.DataFrame({
            "stage": ["赞助分配", "报名", "支付完成", "核销入场"],
            "count": [sponsor_count, registration_count, paid_count, gate_count],
            "color": ["#636EFA", "#00CC96", "#AB63FA", "#FFA15A"],
        })

        conversion = funnel_data["count"].pct_change() + 1
        conversion.iloc[0] = 1.0
        funnel_data.loc[:, "conversion_rate"] = conversion

        return funnel_data

    def get_sponsor_list(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
    ):
        query = self.db.query(Sponsor)
        if activity_id:
            query = query.filter(Sponsor.activity_id == activity_id)
        if sponsor_levels:
            query = query.filter(Sponsor.sponsor_level.in_(sponsor_levels))

        sponsors = query.all()
        data = []
        for s in sponsors:
            used_filters = [Registration.sponsor_id == s.id]
            if activity_id:
                used_filters.append(Registration.activity_id == activity_id)
            start_dt = _parse_date_str(start_date)
            if start_dt:
                used_filters.append(Registration.register_time >= start_dt)
            end_dt = _parse_date_str(end_date)
            if end_dt:
                used_filters.append(Registration.register_time <= end_dt)
            if ticket_type_ids:
                used_filters.append(Registration.ticket_type_id.in_(ticket_type_ids))

            used_count = self.db.query(func.sum(Registration.quantity)).filter(
                and_(*used_filters)
            ).scalar() or 0

            checked_filters = [
                Registration.sponsor_id == s.id,
                GateRecord.is_valid == True,
            ]
            if activity_id:
                checked_filters.append(Registration.activity_id == activity_id)
            start_dt2 = _parse_date_str(start_date)
            if start_dt2:
                checked_filters.append(Registration.register_time >= start_dt2)
            end_dt2 = _parse_date_str(end_date)
            if end_dt2:
                checked_filters.append(Registration.register_time <= end_dt2)
            if ticket_type_ids:
                checked_filters.append(Registration.ticket_type_id.in_(ticket_type_ids))

            checked_count = self.db.query(GateRecord).join(
                Registration, GateRecord.registration_id == Registration.id
            ).filter(and_(*checked_filters)).count()

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

    def get_gate_records_by_sponsor(
        self,
        sponsor_id,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
    ):
        filters = [
            Registration.sponsor_id == sponsor_id,
            GateRecord.is_valid == True,
        ]
        start_dt = _parse_date_str(start_date)
        if start_dt:
            filters.append(Registration.register_time >= start_dt)
        end_dt = _parse_date_str(end_date)
        if end_dt:
            filters.append(Registration.register_time <= end_dt)
        if ticket_type_ids:
            filters.append(Registration.ticket_type_id.in_(ticket_type_ids))

        gate_records = self.db.query(GateRecord).join(
            Registration, GateRecord.registration_id == Registration.id
        ).filter(and_(*filters)).all()

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

    def get_ticket_types(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        sponsor_levels=None,
        ticket_type_ids=None,
    ):
        query = self.db.query(TicketType)
        if activity_id:
            query = query.filter(TicketType.activity_id == activity_id)
        if ticket_type_ids:
            query = query.filter(TicketType.id.in_(ticket_type_ids))

        ticket_types = query.all()
        data = []
        for t in ticket_types:
            sold_filters = [
                Registration.ticket_type_id == t.id,
                Registration.status.in_(["paid", "refunded", "disputed"]),
            ]
            if activity_id:
                sold_filters.append(Registration.activity_id == activity_id)
            start_dt = _parse_date_str(start_date)
            if start_dt:
                sold_filters.append(Registration.register_time >= start_dt)
            end_dt = _parse_date_str(end_date)
            if end_dt:
                sold_filters.append(Registration.register_time <= end_dt)
            if sponsor_levels:
                sold_filters.append(
                    Registration.sponsor_id.in_(
                        self.db.query(Sponsor.id).filter(
                            Sponsor.sponsor_level.in_(sponsor_levels)
                        )
                    )
                )

            sold_count = self.db.query(func.sum(Registration.quantity)).filter(
                and_(*sold_filters)
            ).scalar() or 0

            checked_filters = [
                Registration.ticket_type_id == t.id,
                GateRecord.is_valid == True,
            ]
            if activity_id:
                checked_filters.append(Registration.activity_id == activity_id)
            start_dt2 = _parse_date_str(start_date)
            if start_dt2:
                checked_filters.append(Registration.register_time >= start_dt2)
            end_dt2 = _parse_date_str(end_date)
            if end_dt2:
                checked_filters.append(Registration.register_time <= end_dt2)
            if sponsor_levels:
                checked_filters.append(
                    Registration.sponsor_id.in_(
                        self.db.query(Sponsor.id).filter(
                            Sponsor.sponsor_level.in_(sponsor_levels)
                        )
                    )
                )

            checked_count = self.db.query(GateRecord).join(
                Registration, GateRecord.registration_id == Registration.id
            ).filter(and_(*checked_filters)).count()

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

    def get_raw_samples(
        self,
        activity_id=None,
        sponsor_id=None,
        ticket_type_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
        limit=100,
    ):
        query = self.db.query(Registration)
        filters = []
        if activity_id:
            filters.append(Registration.activity_id == activity_id)
        if sponsor_id:
            filters.append(Registration.sponsor_id == sponsor_id)
        if ticket_type_id:
            filters.append(Registration.ticket_type_id == ticket_type_id)
        start_dt = _parse_date_str(start_date)
        if start_dt:
            filters.append(Registration.register_time >= start_dt)
        end_dt = _parse_date_str(end_date)
        if end_dt:
            filters.append(Registration.register_time <= end_dt)
        if ticket_type_ids:
            filters.append(Registration.ticket_type_id.in_(ticket_type_ids))
        if sponsor_levels:
            filters.append(
                Registration.sponsor_id.in_(
                    self.db.query(Sponsor.id).filter(
                        Sponsor.sponsor_level.in_(sponsor_levels)
                    )
                )
            )
        if filters:
            query = query.filter(and_(*filters))

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

    def get_checkin_efficiency(
        self,
        activity_id=None,
        start_date=None,
        end_date=None,
        ticket_type_ids=None,
        sponsor_levels=None,
    ):
        gate_filters, gate_join = self._build_gate_filters(
            activity_id, start_date, end_date, ticket_type_ids, sponsor_levels
        )
        gate_query = self.db.query(GateRecord).join(
            Registration, and_(*gate_join)
        ).filter(and_(*gate_filters))

        gate_records = gate_query.all()

        if not gate_records:
            return pd.DataFrame()

        gate_cols = ["id", "check_in_time", "gate_no", "registration_id"]
        gate_rows = [
            {
                "id": g.id,
                "check_in_time": g.check_in_time,
                "gate_no": g.gate_no,
                "registration_id": g.registration_id,
            }
            for g in gate_records
        ]
        df = pd.DataFrame(gate_rows, columns=gate_cols)

        check_in_hour = pd.to_datetime(df["check_in_time"]).dt.hour
        df = df.assign(check_in_hour=check_in_hour)
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
