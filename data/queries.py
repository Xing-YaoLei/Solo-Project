from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
import pandas as pd
from sqlalchemy import and_, or_, func, cast, Date as SA_Date, Integer as SA_Integer
from utils.database import get_db_session
from .models import (
    Property, RoomStatus, OTAOrder, PaymentTransaction,
    DoorLockRecord, CleaningTask, Note, DataAnomaly
)


def get_all_properties() -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(Property).filter(Property.status == "active")
        return pd.read_sql(query.statement, db.bind)


def get_room_status_calendar(
    start_date: date,
    end_date: date,
    property_ids: Optional[List[str]] = None
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            RoomStatus,
            Property.property_code,
            Property.property_name
        ).join(Property, RoomStatus.property_id == Property.id).filter(
            and_(
                RoomStatus.status_date >= start_date,
                RoomStatus.status_date <= end_date
            )
        )
        if property_ids:
            query = query.filter(RoomStatus.property_id.in_(property_ids))
        return pd.read_sql(query.statement, db.bind)


def get_ota_orders(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    property_ids: Optional[List[str]] = None,
    channels: Optional[List[str]] = None,
    include_anomaly: bool = True
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            OTAOrder,
            Property.property_code,
            Property.property_name
        ).join(Property, OTAOrder.property_id == Property.id)

        conditions = []
        if start_date:
            conditions.append(OTAOrder.check_in_date >= start_date)
        if end_date:
            conditions.append(OTAOrder.check_out_date <= end_date)
        if property_ids:
            conditions.append(OTAOrder.property_id.in_(property_ids))
        if channels:
            conditions.append(OTAOrder.channel.in_(channels))
        if not include_anomaly:
            conditions.append(OTAOrder.is_anomaly == False)

        if conditions:
            query = query.filter(and_(*conditions))

        df = pd.read_sql(query.statement, db.bind)
        return df


def get_payment_transactions(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    property_ids: Optional[List[str]] = None,
    include_anomaly: bool = True
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            PaymentTransaction,
            Property.property_code,
            Property.property_name
        ).join(Property, PaymentTransaction.property_id == Property.id)

        conditions = []
        if start_date:
            conditions.append(PaymentTransaction.transaction_time >= start_date)
        if end_date:
            conditions.append(PaymentTransaction.transaction_time <= end_date)
        if property_ids:
            conditions.append(PaymentTransaction.property_id.in_(property_ids))
        if not include_anomaly:
            conditions.append(PaymentTransaction.is_anomaly == False)

        if conditions:
            query = query.filter(and_(*conditions))

        return pd.read_sql(query.statement, db.bind)


def get_door_lock_records(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    property_ids: Optional[List[str]] = None,
    include_anomaly: bool = True
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            DoorLockRecord,
            Property.property_code,
            Property.property_name
        ).join(Property, DoorLockRecord.property_id == Property.id)

        conditions = []
        if start_date:
            conditions.append(DoorLockRecord.action_time >= start_date)
        if end_date:
            conditions.append(DoorLockRecord.action_time <= end_date)
        if property_ids:
            conditions.append(DoorLockRecord.property_id.in_(property_ids))
        if not include_anomaly:
            conditions.append(DoorLockRecord.is_anomaly == False)

        if conditions:
            query = query.filter(and_(*conditions))

        return pd.read_sql(query.statement, db.bind)


def get_cleaning_tasks(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    property_ids: Optional[List[str]] = None,
    statuses: Optional[List[str]] = None
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            CleaningTask,
            Property.property_code,
            Property.property_name
        ).join(Property, CleaningTask.property_id == Property.id)

        conditions = []
        if start_date:
            conditions.append(CleaningTask.scheduled_date >= start_date)
        if end_date:
            conditions.append(CleaningTask.scheduled_date <= end_date)
        if property_ids:
            conditions.append(CleaningTask.property_id.in_(property_ids))
        if statuses:
            conditions.append(CleaningTask.task_status.in_(statuses))

        if conditions:
            query = query.filter(and_(*conditions))

        return pd.read_sql(query.statement, db.bind)


def get_notes(entity_type: str, entity_id: str) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(Note).filter(
            and_(
                Note.entity_type == entity_type,
                Note.entity_id == entity_id
            )
        ).order_by(Note.created_at.desc())
        return pd.read_sql(query.statement, db.bind)


def add_note(entity_type: str, entity_id: str, content: str, created_by: str = "system") -> Dict[str, Any]:
    with get_db_session() as db:
        note = Note(
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            created_by=created_by
        )
        db.add(note)
        db.flush()
        return {
            "id": str(note.id),
            "content": note.content,
            "created_by": note.created_by,
            "created_at": note.created_at
        }


def get_data_anomalies(
    source_table: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    severity: Optional[str] = None
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(DataAnomaly)
        conditions = []
        if source_table:
            conditions.append(DataAnomaly.source_table == source_table)
        if is_resolved is not None:
            conditions.append(DataAnomaly.is_resolved == is_resolved)
        if severity:
            conditions.append(DataAnomaly.severity == severity)
        if conditions:
            query = query.filter(and_(*conditions))
        query = query.order_by(DataAnomaly.detected_at.desc())
        return pd.read_sql(query.statement, db.bind)


def calculate_occupancy_rate(
    start_date: date,
    end_date: date,
    property_ids: Optional[List[str]] = None,
    group_by: str = "day"
) -> pd.DataFrame:
    with get_db_session() as db:
        query = db.query(
            RoomStatus.status_date,
            Property.property_code,
            Property.property_name,
            Property.room_count,
            func.count(RoomStatus.id).label("total_records"),
            func.sum(
                func.cast(
                    func.coalesce(
                        func.cast(RoomStatus.occupancy_status == "occupied", SA_Integer),
                        0
                    ),
                    SA_Integer
                )
            ).label("occupied_count"),
            func.sum(
                func.cast(
                    func.coalesce(
                        func.cast(RoomStatus.has_conflict == True, SA_Integer),
                        0
                    ),
                    SA_Integer
                )
            ).label("conflict_count")
        ).join(Property, RoomStatus.property_id == Property.id).filter(
            and_(
                RoomStatus.status_date >= start_date,
                RoomStatus.status_date <= end_date
            )
        )
        if property_ids:
            query = query.filter(RoomStatus.property_id.in_(property_ids))

        query = query.group_by(
            RoomStatus.status_date,
            Property.property_code,
            Property.property_name,
            Property.room_count
        ).order_by(RoomStatus.status_date)

        df = pd.read_sql(query.statement, db.bind)

        if not df.empty:
            df["occupancy_rate"] = df.apply(
                lambda x: round(float(x["occupied_count"]) / max(float(x["room_count"]), 1) * 100, 2),
                axis=1
            )

        if group_by == "week":
            df["week"] = pd.to_datetime(df["status_date"]).dt.isocalendar().week
            df = df.groupby(["property_code", "property_name", "week"]).agg({
                "room_count": "mean",
                "occupied_count": "sum",
                "conflict_count": "sum",
                "occupancy_rate": "mean"
            }).reset_index()
        elif group_by == "month":
            df["month"] = pd.to_datetime(df["status_date"]).dt.to_period("M").astype(str)
            df = df.groupby(["property_code", "property_name", "month"]).agg({
                "room_count": "mean",
                "occupied_count": "sum",
                "conflict_count": "sum",
                "occupancy_rate": "mean"
            }).reset_index()

        return df


def get_conflict_room_status(
    start_date: date,
    end_date: date,
    property_ids: Optional[List[str]] = None
) -> pd.DataFrame:
    df = get_room_status_calendar(start_date, end_date, property_ids)
    if df.empty:
        return df
    return df[df["has_conflict"] == True]


def get_available_channels() -> List[str]:
    with get_db_session() as db:
        result = db.query(OTAOrder.channel).distinct().all()
        return [r[0] for r in result if r[0]]


def get_room_types(property_ids: Optional[List[str]] = None) -> List[str]:
    with get_db_session() as db:
        query = db.query(RoomStatus.room_type).distinct()
        if property_ids:
            query = query.filter(RoomStatus.property_id.in_(property_ids))
        result = query.all()
        return [r[0] for r in result if r[0]]
