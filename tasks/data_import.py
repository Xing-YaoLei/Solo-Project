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
    batch = None
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
    batch = None
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
    batch = None
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
                reservation_id=rec.get("reservation_id"),
                id_card_hash=rec.get("id_card_hash"),
                amount=Decimal(str(rec.get("amount", 0))),
                passenger_count=int(rec.get("passenger_count", 1)),
                pay_method=rec.get("pay_method"),
                trans_status=rec.get("trans_status", "paid"),
                is_linked=int(rec.get("is_linked", 1 if rec.get("reservation_id") else 0)),
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
    batch = None
    try:
        batch = DataBatch(
            batch_no=batch_no,
            source="merge",
            status="processing",
            started_at=datetime.now(),
            created_by=operator,
        )
        db.add(batch)
        db.flush()

        the_date = datetime.strptime(target_date, "%Y-%m-%d").date()

        from sqlalchemy import func, and_, distinct

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

        merchant_linked = dict()
        merchant_all_visitors = dict()
        merchant_all_amount = dict()
        merchant_results = db.query(
            MerchantTransaction.zone,
            MerchantTransaction.time_slot,
            MerchantTransaction.is_linked,
            func.sum(MerchantTransaction.passenger_count).label("pcnt"),
            func.sum(MerchantTransaction.amount).label("amt"),
            func.count(func.distinct(MerchantTransaction.reservation_id)).label("resv_cnt"),
        ).filter(
            and_(
                MerchantTransaction.trans_date == the_date,
                MerchantTransaction.trans_status == "paid"
            )
        ).group_by(
            MerchantTransaction.zone,
            MerchantTransaction.time_slot,
            MerchantTransaction.is_linked,
        ).all()
        for row in merchant_results:
            key = (row.zone, row.time_slot)
            if int(row.is_linked or 0) == 1:
                cnt = int(row.resv_cnt or 0)
                merchant_linked[key] = merchant_linked.get(key, 0) + cnt
            merchant_all_visitors[key] = merchant_all_visitors.get(key, 0) + int(row.pcnt or 0)
            merchant_all_amount[key] = merchant_all_amount.get(key, 0) + float(row.amt or 0)

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
        all_zones.update(k[0] for k in merchant_linked.keys())
        all_zones.update(k[0] for k in capacity_map.keys())
        all_slots = Config.TIME_SLOTS

        processed_count = 0
        total_reservation = 0
        total_reminder_sent = 0
        total_checked_in = 0
        total_in_zone = 0
        total_consumed = 0
        total_camera_flow = 0
        total_merchant_visitors = 0
        total_merchant_amount = 0.0

        for zone in all_zones:
            for slot in all_slots:
                key = (zone, slot)

                reservations = max(gate_reservations.get(key, 0), gate_checked.get(key, 0))
                if reservations == 0 and key not in capacity_map:
                    continue

                checked_in = gate_checked.get(key, 0)
                camera_total = camera_agg.get(key, 0)

                in_zone_ratio = 0.90 if zone in ["主入口区", "东门区", "西门区"] else 0.78
                in_zone = int(min(checked_in, max(0, int(checked_in * in_zone_ratio))))

                consumed_linked = min(
                    int(merchant_linked.get(key, 0)),
                    in_zone,
                    checked_in,
                )
                merchant_total_v = merchant_all_visitors.get(key, 0)
                merchant_total_a = merchant_all_amount.get(key, 0)

                reminder_sent = int(reservations * 0.95)
                reminder_confirmed = int(reminder_sent * 0.85)
                cancelled = int(reservations * 0.03)
                no_show = max(0, reservations - checked_in - cancelled)

                checkin_rate = Decimal(str(checked_in / reservations)) if reservations > 0 else Decimal("0")
                in_zone_rate = Decimal(str(in_zone / reservations)) if reservations > 0 else Decimal("0")
                conversion_rate = Decimal(str(consumed_linked / checked_in)) if checked_in > 0 else Decimal("0")

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
                    prev_in = gate_checked.get(prev_key, 0)
                    if prev_in > 0 and checked_in > prev_in * 1.8:
                        remark_parts.append("检票人数突增,需关注")

                if merchant_total_v > consumed_linked * 2 and merchant_total_v > 10:
                    remark_parts.append(
                        f"商户客流含散客:{merchant_total_v}(关联预约仅{consumed_linked})"
                    )

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
                    consumed=consumed_linked,
                    cancelled=cancelled,
                    no_show=no_show,
                    checkin_rate=checkin_rate,
                    in_zone_rate=in_zone_rate,
                    conversion_rate=conversion_rate,
                    arrival_status=arrival_status,
                    reminder_list=json.dumps(reminder_list_data, ensure_ascii=False),
                    remark="; ".join(remark_parts) if remark_parts else None,
                    camera_total_flow=camera_total,
                    merchant_total_visitors=merchant_total_v,
                    merchant_total_amount=Decimal(str(round(merchant_total_a, 2))),
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                db.add(funnel)
                processed_count += 1
                total_reservation += reservations
                total_reminder_sent += reminder_sent
                total_checked_in += checked_in
                total_in_zone += in_zone
                total_consumed += consumed_linked
                total_camera_flow += camera_total
                total_merchant_visitors += merchant_total_v
                total_merchant_amount += merchant_total_a

        batch.record_count = processed_count
        batch.status = "completed"
        batch.completed_at = datetime.now()
        batch.remark = (
            f"预约:{total_reservation} 提醒:{total_reminder_sent} "
            f"检票:{total_checked_in} 到区域:{total_in_zone} 关联消费:{total_consumed} | "
            f"独立指标-摄像头总客流:{total_camera_flow} 商户总客流:{total_merchant_visitors} 商户总营业额:{round(total_merchant_amount,2)}"
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
                "consumed_linked": total_consumed,
                "camera_total_flow": total_camera_flow,
                "merchant_total_visitors": total_merchant_visitors,
                "merchant_total_amount": round(total_merchant_amount, 2),
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


def run_full_pipeline_sync(
    camera_records: List[Dict[str, Any]],
    gate_records: List[Dict[str, Any]],
    merchant_records: List[Dict[str, Any]],
    target_date: Optional[str] = None,
    operator: str = "system",
) -> Dict[str, Any]:
    r1 = import_camera_data.apply(args=[camera_records, operator], throw=True).get()
    r2 = import_gate_data.apply(args=[gate_records, operator], throw=True).get()
    r3 = import_merchant_data.apply(args=[merchant_records, operator], throw=True).get()
    r4 = merge_to_funnel.apply(args=[target_date, operator], throw=True).get()
    return {
        "camera": r1,
        "gate": r2,
        "merchant": r3,
        "merge": r4,
        "status": "success",
    }


def merge_to_funnel_sync(target_date: Optional[str] = None, operator: str = "system") -> Dict[str, Any]:
    return merge_to_funnel.apply(args=[target_date, operator], throw=True).get()
