from datetime import datetime
from sqlalchemy import and_
from app.models import (
    Payment, GateRecord, Registration, AnomalyRecord,
    TicketType, Sponsor
)


class AnomalyDetector:
    def __init__(self, db_session):
        self.db = db_session

    def _create_anomaly(self, anomaly_type, source_table, source_id, description, severity="warning"):
        existing = self.db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == anomaly_type,
                AnomalyRecord.source_table == source_table,
                AnomalyRecord.source_id == source_id,
                AnomalyRecord.is_resolved == False,
            )
        ).first()

        if existing:
            return existing

        anomaly = AnomalyRecord(
            anomaly_type=anomaly_type,
            source_table=source_table,
            source_id=source_id,
            description=description,
            severity=severity,
            detected_time=datetime.now(),
        )
        self.db.add(anomaly)
        self.db.commit()
        self.db.refresh(anomaly)
        return anomaly

    def detect_payment_anomalies(self, since_time=None):
        anomalies = []

        query = self.db.query(Payment).filter(Payment.payment_status == "success")
        if since_time:
            query = query.filter(Payment.sync_time >= since_time)

        payments = query.all()

        for payment in payments:
            if payment.registration_id:
                registration = self.db.query(Registration).filter(
                    Registration.id == payment.registration_id
                ).first()

                if registration:
                    if abs(payment.amount - registration.total_amount) > 0.01:
                        anomaly = self._create_anomaly(
                            anomaly_type="data_mismatch",
                            source_table="payments",
                            source_id=payment.id,
                            description=f"支付金额{payment.amount}与订单金额{registration.total_amount}不匹配，订单号：{registration.order_no}",
                            severity="warning",
                        )
                        anomalies.append(anomaly)

            if payment.amount <= 0:
                anomaly = self._create_anomaly(
                    anomaly_type="payment",
                    source_table="payments",
                    source_id=payment.id,
                    description=f"支付金额异常（{payment.amount}），支付流水号：{payment.payment_no}",
                    severity="error",
                )
                anomalies.append(anomaly)

        return anomalies

    def detect_gate_anomalies(self, since_time=None):
        anomalies = []

        query = self.db.query(GateRecord)
        if since_time:
            query = query.filter(GateRecord.sync_time >= since_time)

        gate_records = query.all()

        for record in gate_records:
            if not record.is_valid:
                anomaly = self._create_anomaly(
                    anomaly_type="gate",
                    source_table="gate_records",
                    source_id=record.id,
                    description=f"无效闸机记录：{record.invalid_reason}，票号：{record.ticket_code}",
                    severity="warning",
                )
                anomalies.append(anomaly)

            if record.registration_id:
                registration = self.db.query(Registration).filter(
                    Registration.id == record.registration_id
                ).first()
                if registration and registration.status not in ["paid"]:
                    anomaly = self._create_anomaly(
                        anomaly_type="data_mismatch",
                        source_table="gate_records",
                        source_id=record.id,
                        description=f"已核销订单状态异常（{registration.status}），订单号：{registration.order_no}",
                        severity="error",
                    )
                    anomalies.append(anomaly)

        return anomalies

    def detect_registration_anomalies(self, since_time=None):
        anomalies = []

        query = self.db.query(Registration)
        if since_time:
            query = query.filter(Registration.created_at >= since_time)

        registrations = query.all()

        for reg in registrations:
            if reg.is_disputed:
                anomaly = self._create_anomaly(
                    anomaly_type="registration",
                    source_table="registrations",
                    source_id=reg.id,
                    description=f"退票争议订单：{reg.order_no}，原因：{reg.dispute_reason}",
                    severity="error",
                )
                anomalies.append(anomaly)

            if reg.total_amount < 0:
                anomaly = self._create_anomaly(
                    anomaly_type="registration",
                    source_table="registrations",
                    source_id=reg.id,
                    description=f"订单金额异常（{reg.total_amount}），订单号：{reg.order_no}",
                    severity="error",
                )
                anomalies.append(anomaly)

            if reg.quantity <= 0:
                anomaly = self._create_anomaly(
                    anomaly_type="registration",
                    source_table="registrations",
                    source_id=reg.id,
                    description=f"购票数量异常（{reg.quantity}），订单号：{reg.order_no}",
                    severity="warning",
                )
                anomalies.append(anomaly)

            if reg.ticket_type_id:
                ticket_type = self.db.query(TicketType).filter(
                    TicketType.id == reg.ticket_type_id
                ).first()
                if ticket_type and ticket_type.price * reg.quantity != reg.total_amount:
                    if abs(ticket_type.price * reg.quantity - reg.total_amount) > 0.01:
                        anomaly = self._create_anomaly(
                            anomaly_type="data_mismatch",
                            source_table="registrations",
                            source_id=reg.id,
                            description=f"订单金额{reg.total_amount}与票种单价{ticket_type.price}×数量{reg.quantity}不匹配，订单号：{reg.order_no}",
                            severity="warning",
                        )
                        anomalies.append(anomaly)

        return anomalies

    def detect_sponsor_ticket_anomalies(self):
        anomalies = []

        sponsors = self.db.query(Sponsor).all()

        for sponsor in sponsors:
            if sponsor.used_tickets > sponsor.allocated_tickets:
                anomaly = self._create_anomaly(
                    anomaly_type="registration",
                    source_table="sponsors",
                    source_id=sponsor.id,
                    description=f"赞助商{sponsor.name}已使用票数（{sponsor.used_tickets}）超过分配票数（{sponsor.allocated_tickets}）",
                    severity="error",
                )
                anomalies.append(anomaly)

        return anomalies

    def run_all_detections(self, since_time=None):
        all_anomalies = []
        all_anomalies.extend(self.detect_payment_anomalies(since_time))
        all_anomalies.extend(self.detect_gate_anomalies(since_time))
        all_anomalies.extend(self.detect_registration_anomalies(since_time))
        all_anomalies.extend(self.detect_sponsor_ticket_anomalies())
        return all_anomalies
