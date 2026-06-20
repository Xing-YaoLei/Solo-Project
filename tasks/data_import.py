import pandas as pd
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from decimal import Decimal

from celery import group

from tasks.celery_app import celery_app
from tasks.utils import generate_batch_no
from models.database import SessionLocal
from models import (
    DataBatch,
    CameraStats,
    GateRecord,
    MerchantTransaction,
    ReservationFunnel,
    CapacityRule,
)
from config import Config


@celery_app.task(bind=True, name="tasks.import_camera_data")
def import_camera_data(self, records: List[Dict[str, Any]], operator: str = "system") -> Dict[str, Any]:
    batch_no = generate_batch_no("camera")
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=batch_no,
            source="camera",
            record_count=len(records),
            status="processing",
            started_at=datetime.now(),
            created_by=operator,
        )
        db.add(batch)
        db.flush()

        df = pd.DataFrame(records)
        df["stat_date"] = pd.to_datetime(df["stat_date"]).dt.date
        df["time_slot"] = df["time_slot"].astype(str)
        df["zone"] = df["zone"].astype(str)
        df["camera_id"] = df["camera_id"].astype(str)
        df["pedestrian_count"] = df["pedestrian_count"].fillna(0).astype(int)
        df["estimated_visitors"] = df["estimated_visitors"].fillna(0).astype(int)
        df["peak_density"] = df["peak_density"].fillna(0).astype(int)

        inserted = 0
        for _, row in df.iterrows():
            stat = CameraStats(
                batch_id=batch.id,
                stat_date=row["stat_date"],
                time_slot=row["time_slot"],
                zone=row["zone"],
                camera_id=row["camera_id"],
                pedestrian_count=row["pedestrian_count"],
                estimated_visitors=row["estimated_visitors"],
                peak_density=row["peak_density"],
                recorded_at=datetime.now(),
            )
            db.add(stat)
            inserted += 1

        batch.record_count = inserted
        batch.status = "completed"
        batch.completed_at = datetime.now()
        db.commit()

        return {"batch_no": batch_no, "source": "camera", "count": inserted, "status": "success"}
    except Exception as exc:
        db.rollback()
        if batch:
            batch.status = "failed"
            batch.remark = str(exc)
            batch.completed_at = datetime.now()
            db.commit()
        self.retry(exc=exc, countdown=60, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.import_gate_data")
def import_gate_data(self, records: List[Dict[str, Any]], operator: str = "system") -> Dict[str, Any]:
    batch_no = generate_batch_no("gate")
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=batch_no,
            source="gate",
            record_count=len(records),
            status="processing",
            started_at=datetime.now(),
            created_by=operator,
        )
        db.add(batch)
        db.flush()

        inserted = 0
        for rec in records:
            gate = GateRecord(
                batch_id=batch.id,
                record_date=datetime.strptime(rec["record_date"], "%Y-%m-%d").date() if isinstance(rec["record_date"], str) else rec["record_date"],
                time_slot=str(rec["time_slot"]),
                zone=str(rec["zone"]),
                gate_id=str(rec["gate_id"]),
                reservation_id=rec.get("reservation_id"),
                ticket_type=rec.get("ticket_type"),
                pass_type=rec.get("pass_type", "in"),
                passenger_name=rec.get("passenger_name"),
                id_card_hash=rec.get("id_card_hash"),
                status=rec.get("status", "success"),
                swiped_at=datetime.now(),
            )
            db.add(gate)
            inserted += 1

        batch.record_count = inserted
        batch.status = "completed"
        batch.completed_at = datetime.now()
        db.commit()

        return {"batch_no": batch_no, "source": "gate", "count": inserted, "status": "success"}
    except Exception as exc:
        db.rollback()
        if batch:
            batch.status = "failed"
            batch.remark = str(exc)
            batch.completed_at = datetime.now()
            db.commit()
        self.retry(exc=exc, countdown=60, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.import_merchant_data")
def import_merchant_data(self, records: List[Dict[str, Any]], operator: str = "system") -> Dict[str, Any]:
    batch_no = generate_batch_no("merchant")
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=batch_no,
            source="merchant",
            record_count=len(records),
            status="processing",
            started_at=datetime.now(),
            created_by=operator,
        )
        db.add(batch)
        db.flush()

        inserted = 0
        for rec in records:
            txn = MerchantTransaction(
                batch_id=batch.id,
                trans_date=datetime.strptime(rec["trans_date"], "%Y-%m-%d").date() if isinstance(rec["trans_date"], str) else rec["trans_date"],
                time_slot=str(rec["time_slot"]),
                zone=str(rec["zone"]),
                merchant_id=str(rec["merchant_id"]),
                merchant_name=rec.get("merchant_name"),
                category=rec.get("category"),
                order_no=str(rec["order_no"]),
                amount=Decimal(str(rec.get("amount", 0))),
                passenger_count=int(rec.get("passenger_count", 1)),
                pay_method=rec.get("pay_method"),
                trans_status=rec.get("trans_status", "paid"),
                trans_at=datetime.now(),
            )
            db.add(txn)
            inserted += 1

        batch.record_count = inserted
        batch.status = "completed"
        batch.completed_at = datetime.now()
        db.commit()

        return {"batch_no": batch_no, "source": "merchant", "count": inserted, "status": "success"}
    except Exception as exc:
        db.rollback()
        if batch:
            batch.status = "failed"
            batch.remark = str(exc)
            batch.completed_at = datetime.now()
            db.commit()
        self.retry(exc=exc, countdown=60, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.merge_to_funnel")
def merge_to_funnel(self, target_date: Optional[str] = None, operator: str = "system") -> Dict[str, Any]:
    if target_date is None:
        target_date = date.today().isoformat()
    batch_no = generate_batch_no("merge")
    db = SessionLocal()
    try:
        batch = DataBatch(
            batch_no=batch_no,
            source="merge",
            status="processing",
            started_at=datetime.now(),
            created_by=datetime.now(),
        )
        db.add(batch)
        db.flush()

        the_date = datetime.strptime(target_date, "%Y-%m-%d").date()

        from sqlalchemy import func, and_

        camera_agg = dict()
        camera_results = db.query(
            CameraStats.zone,
            CameraStats.time_slot,
            func.sum(CameraStats.estimated_visitors).label("total_in_zone")
        ).filter(
            CameraStats.stat_date == the_date
        ).group_by(CameraStats.zone, CameraStats.time_slot).all()
        for row in camera_results:
            camera_agg[(row.zone, row.time_slot)] = int(row.total_in_zone or 0)

        gate_checked = dict()
        gate_reservations = dict()
        gate_results = db.query(
            GateRecord.zone,
            GateRecord.time_slot,
            GateRecord.pass_type,
            GateRecord.status,
            func.count().label("cnt")
        ).filter(
            and_(
                GateRecord.record_date == the_date,
                GateRecord.status == "success"
            )
        ).group_by(
            GateRecord.zone, GateRecord.time_slot, GateRecord.pass_type, GateRecord.status
        ).all()
        for row in gate_results:
            key = (row.zone, row.time_slot)
            if row.pass_type == "in":
                gate_checked[key] = gate_checked.get(key, 0) + int(row.cnt or 0)
            gate_reservations[key] = gate_reservations.get(key, 0) + int(row.cnt or 0)

        merchant_agg = dict()
        merchant_results = db.query(
            MerchantTransaction.zone,
            MerchantTransaction.time_slot,
            func.sum(MerchantTransaction.passenger_count).label("consumed_cnt")
        ).filter(
            and_(
                MerchantTransaction.trans_date == the_date,
                MerchantTransaction.trans_status == "paid"
            )
        ).group_by(MerchantTransaction.zone, MerchantTransaction.time_slot).all()
        for row in merchant_results:
            merchant_agg[(row.zone, row.time_slot)] = int(row.consumed_cnt or 0)

        capacity_map = dict()
        capacity_results = db.query(CapacityRule).filter(
            CapacityRule.effective_date == the_date
        ).all()
        for cap in capacity_results:
            capacity_map[(cap.zone, cap.time_slot)] = {
                "max": cap.max_capacity,
                "threshold": cap.warning_threshold,
                "rule_type": cap.rule_type,
            }

        all_zones = set()
        all_zones.update(k[0] for k in camera_agg.keys())
        all_zones.update(k[0] for k in gate_checked.keys())
        all_zones.update(k[0] for k in merchant_agg.keys())
        all_zones.update(k[0] for k in capacity_map.keys())
        all_slots = Config.TIME_SLOTS

        processed_count = 0
        total_reservation = 0
        total_reminder_sent = 0
        total_checked_in = 0
        total_in_zone = 0
        total_consumed = 0

        for zone in all_zones:
            for slot in all_slots:
                key = (zone, slot)
                reservations = max(gate_reservations.get(key, 0), gate_checked.get(key, 0))
                if reservations == 0 and camera_agg.get(key, 0) == 0 and merchant_agg.get(key, 0) == 0:
                    if key not in capacity_map:
                        continue

                in_zone = camera_agg.get(key, 0)
                checked_in = gate_checked.get(key, 0)
                consumed = merchant_agg.get(key, 0)

                reminder_sent = int(reservations * 0.95)
                reminder_confirmed = int(reminder_sent * 0.85)
                cancelled = int(reservations * 0.03)
                no_show = max(0, reservations - checked_in - cancelled)

                checkin_rate = Decimal(str(checked_in / reservations)) if reservations > 0 else Decimal("0")
                in_zone_rate = Decimal(str(in_zone / reservations)) if reservations > 0 else Decimal("0")
                conversion_rate = Decimal(str(consumed / checked_in)) if checked_in > 0 else Decimal("0")

                arrival_status = "normal"
                remark_parts = []
                cap_info = capacity_map.get(key)
                if cap_info:
                    if cap_info["threshold"] and in_zone >= cap_info["threshold"]:
                        if in_zone >= cap_info["max"]:
                            arrival_status = "critical"
                            remark_parts.append(f"容量预警:已达{in_zone}/{cap_info['max']}")
                        else:
                            arrival_status = "warning"
                            remark_parts.append(f"接近阈值:{in_zone}/{cap_info['threshold']}")
                    if cap_info["rule_type"] != "normal":
                        remark_parts.append(f"容量规则类型:{cap_info['rule_type']}")

                if checkin_rate < Decimal("0.5") and reservations > 20:
                    if arrival_status == "normal":
                        arrival_status = "warning"
                    remark_parts.append("到场率偏低")

                slot_idx = all_slots.index(slot)
                if slot_idx > 0:
                    prev_key = (zone, all_slots[slot_idx - 1])
                    prev_in = camera_agg.get(prev_key, 0)
                    if prev_in > 0 and in_zone > prev_in * 1.8:
                        remark_parts.append("人数突增,需关注")

                reminder_list_data = []
                if reminder_sent - checked_in > 20:
                    reminder_list_data = []

                funnel = ReservationFunnel(
                    batch_id=batch.id,
                    funnel_date=the_date,
                    time_slot=slot,
                    zone=zone,
                    reservation_count=reservations,
                    reminder_sent=reminder_sent,
                    reminder_confirmed=reminder_confirmed,
                    checked_in=checked_in,
                    in_zone=in_zone,
                    consumed=consumed,
                    cancelled=cancelled,
                    no_show=no_show,
                    checkin_rate=checkin_rate,
                    in_zone_rate=in_zone_rate,
                    conversion_rate=conversion_rate,
                    arrival_status=arrival_status,
                    reminder_list=json.dumps(reminder_list_data, ensure_ascii=False),
                    remark="; ".join(remark_parts) if remark_parts else None,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                db.add(funnel)
                processed_count += 1
                total_reservation += reservations
                total_reminder_sent += reminder_sent
                total_checked_in += checked_in
                total_in_zone += in_zone
                total_consumed += consumed

        batch.record_count = processed_count
        batch.status = "completed"
        batch.completed_at = datetime.now()
        batch.remark = (
            f"预约:{total_reservation} 提醒:{total_reminder_sent} "
            f"检票:{total_checked_in} 到区域:{total_in_zone} 消费:{total_consumed"
        )
        db.commit()

        return {
            "batch_no": batch_no,
            "source": "merge",
            "count": processed_count,
            "date": target_date,
            "totals": {
                "reservation": total_reservation,
                "checked_in": total_checked_in,
                "in_zone": total_in_zone,
                "consumed": total_consumed,
            },
            "status": "success",
        }
    except Exception as exc:
        db.rollback()
        if batch:
            batch.status = "failed"
            batch.remark = str(exc)
            batch.completed_at = datetime.now()
            db.commit()
        self.retry(exc=exc, countdown=120, max_retries=2)
    finally:
        db.close()


@celery_app.task(name="tasks.run_full_pipeline")
def run_full_pipeline(
    camera_records: List[Dict[str, Any]],
    gate_records: List[Dict[str, Any]],
    merchant_records: List[Dict[str, Any]],
    target_date: Optional[str] = None,
    operator: str = "system",
) -> Dict[str, Any]:
    workflow = group(
        import_camera_data.s(camera_records, operator),
        import_gate_data.s(gate_records, operator),
        import_merchant_data.s(merchant_records, operator),
    ) | merge_to_funnel.s(target_date=target_date, operator=operator)

    result = workflow.apply_async()
    return {"workflow_id": result.id, "status": "submitted"}
