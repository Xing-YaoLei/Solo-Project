from datetime import datetime, timedelta
from typing import Optional, List, Dict, Tuple
import pandas as pd
from sqlalchemy import func, and_, or_

from database import (
    SessionLocal,
    Patient,
    Appointment,
    PaymentDetail,
    ImageAttachment,
    AnomalyMarker,
    Remark,
    HisCaliberChange,
    AppointmentStatus,
    AnomalyType,
)


class DataQuerier:
    def __init__(self, db_session=None):
        self.db = db_session or SessionLocal()

    def close(self):
        self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def get_cleaning_appointments(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> pd.DataFrame:
        query = self.db.query(Appointment).filter(Appointment.is_cleaning == True)

        if start_date:
            query = query.filter(Appointment.appointment_date >= start_date.date())
        if end_date:
            query = query.filter(Appointment.appointment_date <= end_date.date())

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_payments_by_appointments(
        self, appointment_nos: List[str]
    ) -> pd.DataFrame:
        if not appointment_nos:
            return pd.DataFrame()

        query = self.db.query(PaymentDetail).filter(
            PaymentDetail.appointment_no.in_(appointment_nos)
        )
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_patient_details(self, patient_ids: List[str]) -> pd.DataFrame:
        if not patient_ids:
            return pd.DataFrame()

        query = self.db.query(Patient).filter(Patient.patient_id.in_(patient_ids))
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_image_attachments(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        cleaning_only: bool = True,
    ) -> pd.DataFrame:
        query = self.db.query(ImageAttachment)

        if cleaning_only:
            query = query.filter(ImageAttachment.is_cleaning_related == True)
        if start_date:
            query = query.filter(func.date(ImageAttachment.upload_date) >= start_date.date())
        if end_date:
            query = query.filter(func.date(ImageAttachment.upload_date) <= end_date.date())

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_payment_details(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        cleaning_only: bool = True,
    ) -> pd.DataFrame:
        query = self.db.query(PaymentDetail)

        if cleaning_only:
            query = query.filter(PaymentDetail.is_cleaning_related == True)
        if start_date:
            query = query.filter(PaymentDetail.payment_date >= start_date.date())
        if end_date:
            query = query.filter(PaymentDetail.payment_date <= end_date.date())

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_anomalies(
        self,
        anomaly_type: Optional[AnomalyType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        unresolved_only: bool = False,
    ) -> pd.DataFrame:
        query = self.db.query(AnomalyMarker)

        if anomaly_type:
            query = query.filter(AnomalyMarker.anomaly_type == anomaly_type)
        if start_date:
            query = query.filter(AnomalyMarker.detected_at >= start_date)
        if end_date:
            query = query.filter(AnomalyMarker.detected_at <= end_date)
        if unresolved_only:
            query = query.filter(AnomalyMarker.is_resolved == False)

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_remarks_for_anomaly(self, anomaly_id: int) -> pd.DataFrame:
        anomaly = self.db.query(AnomalyMarker).filter(AnomalyMarker.id == anomaly_id).first()

        if anomaly and anomaly.payment_id:
            query = self.db.query(Remark).filter(
                (Remark.anomaly_id == anomaly_id)
                | (Remark.payment_id == anomaly.payment_id)
            )
        else:
            query = self.db.query(Remark).filter(Remark.anomaly_id == anomaly_id)

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_remarks_for_anomalies(self, anomaly_ids: List[int]) -> pd.DataFrame:
        if not anomaly_ids:
            return pd.DataFrame()

        query = self.db.query(Remark).filter(Remark.anomaly_id.in_(anomaly_ids))
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_his_caliber_changes(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> pd.DataFrame:
        query = self.db.query(HisCaliberChange)

        if start_date:
            query = query.filter(HisCaliberChange.change_date >= start_date.date())
        if end_date:
            query = query.filter(HisCaliberChange.change_date <= end_date.date())

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_delayed_appointments(
        self, threshold_hours: int = 24
    ) -> pd.DataFrame:
        threshold_time = datetime.now() - timedelta(hours=threshold_hours)

        query = self.db.query(Appointment).filter(
            and_(
                Appointment.is_cleaning == True,
                Appointment.his_sync_time < threshold_time,
                or_(
                    Appointment.status == AppointmentStatus.BOOKED,
                    Appointment.status == AppointmentStatus.CONFIRMED,
                ),
                Appointment.appointment_date <= datetime.now().date(),
            )
        )

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_missing_payments(
        self, window_days: int = 7
    ) -> pd.DataFrame:
        cutoff_date = datetime.now().date() - timedelta(days=window_days)

        subquery = (
            self.db.query(PaymentDetail.appointment_no)
            .filter(PaymentDetail.is_cleaning_related == True)
            .distinct()
            .subquery()
        )

        query = (
            self.db.query(Appointment)
            .filter(
                and_(
                    Appointment.is_cleaning == True,
                    Appointment.status.in_(
                        [AppointmentStatus.COMPLETED, AppointmentStatus.ARRIVED]
                    ),
                    Appointment.appointment_date <= cutoff_date,
                    Appointment.appointment_no.notin_(subquery),
                )
            )
        )

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_patient_visit_history(self, patient_id: str) -> pd.DataFrame:
        query = (
            self.db.query(Appointment)
            .filter(Appointment.patient_id == patient_id)
            .order_by(Appointment.appointment_date.desc())
        )
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_no_show_trend(
        self,
        start_date: datetime,
        end_date: datetime,
        group_by: str = "week",
    ) -> pd.DataFrame:
        query = (
            self.db.query(
                func.date_trunc(group_by, Appointment.appointment_date).label("period"),
                func.count().label("total_appointments"),
                func.sum(
                    func.case(
                        [(Appointment.status == AppointmentStatus.NO_SHOW, 1)],
                        else_=0,
                    )
                ).label("no_show_count"),
            )
            .filter(
                and_(
                    Appointment.is_cleaning == True,
                    Appointment.appointment_date >= start_date.date(),
                    Appointment.appointment_date <= end_date.date(),
                )
            )
            .group_by("period")
            .order_by("period")
        )

        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_funnel_data(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> Dict[str, int]:
        base_filter = and_(
            Appointment.is_cleaning == True,
            Appointment.appointment_date >= start_date.date(),
            Appointment.appointment_date <= end_date.date(),
        )

        total_booked = (
            self.db.query(func.count(Appointment.id))
            .filter(base_filter)
            .scalar()
            or 0
        )

        confirmed = (
            self.db.query(func.count(Appointment.id))
            .filter(
                and_(
                    base_filter,
                    Appointment.status.in_(
                        [
                            AppointmentStatus.CONFIRMED,
                            AppointmentStatus.ARRIVED,
                            AppointmentStatus.COMPLETED,
                        ]
                    ),
                )
            )
            .scalar()
            or 0
        )

        arrived = (
            self.db.query(func.count(Appointment.id))
            .filter(
                and_(
                    base_filter,
                    Appointment.status.in_(
                        [AppointmentStatus.ARRIVED, AppointmentStatus.COMPLETED]
                    ),
                )
            )
            .scalar()
            or 0
        )

        completed = (
            self.db.query(func.count(Appointment.id))
            .filter(
                and_(
                    base_filter,
                    Appointment.status == AppointmentStatus.COMPLETED,
                )
            )
            .scalar()
            or 0
        )

        return {
            "预约登记": total_booked,
            "预约确认": confirmed,
            "患者到院": arrived,
            "服务完成": completed,
        }

    def save_anomaly_remark(
        self,
        anomaly_id: int,
        author: str,
        content: str,
        is_review_note: bool = False,
        payment_id: Optional[int] = None,
    ) -> Remark:
        remark = Remark(
            anomaly_id=anomaly_id,
            payment_id=payment_id,
            author=author,
            content=content,
            is_review_note=is_review_note,
        )
        self.db.add(remark)
        self.db.commit()
        self.db.refresh(remark)
        return remark

    def save_payment_remark(
        self,
        payment_id: int,
        author: str,
        content: str,
    ) -> Remark:
        anomaly_id = None
        anomaly = (
            self.db.query(AnomalyMarker.id)
            .filter(AnomalyMarker.payment_id == payment_id)
            .first()
        )
        if anomaly:
            anomaly_id = anomaly.id

        remark = Remark(
            anomaly_id=anomaly_id,
            payment_id=payment_id,
            author=author,
            content=content,
            is_review_note=False,
        )
        self.db.add(remark)
        self.db.commit()
        self.db.refresh(remark)
        return remark

    def get_remarks_for_payment(self, payment_id: int) -> pd.DataFrame:
        query = self.db.query(Remark).filter(Remark.payment_id == payment_id)
        df = pd.read_sql(query.statement, self.db.bind)
        return df

    def get_anomalies_with_remarks(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> pd.DataFrame:
        anomalies = self.get_anomalies(start_date=start_date, end_date=end_date)

        if anomalies.empty:
            return pd.DataFrame()

        anomaly_ids = anomalies["id"].tolist()
        remarks = self.get_remarks_for_anomalies(anomaly_ids)

        payment_ids = anomalies["payment_id"].dropna().unique().tolist()
        if payment_ids:
            payment_remarks = self.db.query(Remark).filter(
                Remark.payment_id.in_([int(pid) for pid in payment_ids])
            )
            payment_remarks_df = pd.read_sql(payment_remarks.statement, self.db.bind)
            if not payment_remarks_df.empty:
                existing_ids = set(remarks["id"].tolist()) if not remarks.empty else set()
                new_remarks = payment_remarks_df[~payment_remarks_df["id"].isin(existing_ids)]
                if not new_remarks.empty:
                    pid_to_anomaly = {}
                    for _, arow in anomalies.iterrows():
                        pid = arow.get("payment_id")
                        if pd.notna(pid):
                            pid_to_anomaly[int(pid)] = arow["id"]
                    new_remarks = new_remarks.copy()
                    new_remarks["anomaly_id"] = new_remarks["payment_id"].map(pid_to_anomaly)
                    valid_remarks = new_remarks[new_remarks["anomaly_id"].notna()]
                    if not valid_remarks.empty:
                        remarks = pd.concat([remarks, valid_remarks], ignore_index=True) if not remarks.empty else valid_remarks

        if not remarks.empty:
            remarks_grouped = (
                remarks.groupby("anomaly_id")
                .agg(
                    {
                        "content": lambda x: " | ".join(x.astype(str)),
                        "author": lambda x: " | ".join(x.astype(str)),
                        "created_at": "max",
                    }
                )
                .reset_index()
                .rename(
                    columns={
                        "content": "remark_content",
                        "author": "remark_author",
                        "created_at": "remark_time",
                    }
                )
            )
            anomalies = anomalies.merge(
                remarks_grouped, left_on="id", right_on="anomaly_id", how="left"
            )

        return anomalies

    def save_anomaly(
        self,
        anomaly_type: AnomalyType,
        description: str,
        severity: str = "warning",
        appointment_no: Optional[str] = None,
        payment_id: Optional[int] = None,
        data_snapshot: Optional[Dict] = None,
    ) -> AnomalyMarker:
        anomaly = AnomalyMarker(
            anomaly_type=anomaly_type,
            severity=severity,
            appointment_no=appointment_no,
            payment_id=payment_id,
            description=description,
            data_snapshot=data_snapshot,
        )
        self.db.add(anomaly)
        self.db.commit()
        self.db.refresh(anomaly)
        return anomaly
