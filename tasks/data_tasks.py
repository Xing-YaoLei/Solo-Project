from datetime import datetime, timedelta
from celery_app import celery_app
from models import get_db, Order, FunnelEvent, Rider, RiderTrack, Anomaly, ReviewNote, SubsidyRule, SavedView, TrackAnomalyNote
from tasks.compensation_tasks import calculate_compensation, get_compensation_rules_explanation
import pandas as pd
import io
import logging
import json

logger = logging.getLogger(__name__)


def get_funnel_data(start_date=None, end_date=None, order_type="instant"):
    db = next(get_db())
    try:
        query = db.query(FunnelEvent).join(Order).filter(Order.order_type == order_type)

        if start_date:
            query = query.filter(FunnelEvent.event_timestamp >= start_date)
        if end_date:
            query = query.filter(FunnelEvent.event_timestamp <= end_date)

        events = query.all()

        if not events:
            return pd.DataFrame()

        data = []
        for ev in events:
            data.append({
                "order_id": ev.order_id,
                "event_name": ev.event_name,
                "event_timestamp": ev.event_timestamp,
                "duration_seconds": ev.duration_seconds,
                "is_drop_off": ev.is_drop_off,
                "drop_off_reason": ev.drop_off_reason,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_orders_data(start_date=None, end_date=None, status=None, payment_status=None):
    db = next(get_db())
    try:
        query = db.query(Order).filter(Order.order_type == "instant")

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)
        if status:
            query = query.filter(Order.status == status)
        if payment_status:
            query = query.filter(Order.payment_status == payment_status)

        orders = query.all()

        if not orders:
            return pd.DataFrame()

        data = []
        for o in orders:
            data.append({
                "id": o.id,
                "order_no": o.order_no,
                "status": o.status,
                "pickup_address": o.pickup_address,
                "pickup_lat": o.pickup_lat,
                "pickup_lng": o.pickup_lng,
                "delivery_address": o.delivery_address,
                "delivery_lat": o.delivery_lat,
                "delivery_lng": o.delivery_lng,
                "distance_km": o.distance_km,
                "map_calibration_version": o.map_calibration_version,
                "amount": o.amount,
                "subsidy_amount": o.subsidy_amount,
                "compensation_amount": o.compensation_amount,
                "payment_status": o.payment_status,
                "rider_rejected": o.rider_rejected,
                "reject_count": o.reject_count,
                "system_delay_seconds": o.system_delay_seconds,
                "created_at": o.created_at,
                "paid_at": o.paid_at,
                "assigned_at": o.assigned_at,
                "picked_at": o.picked_at,
                "delivered_at": o.delivered_at,
                "completed_at": o.completed_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_rider_tracks(rider_id=None, order_id=None, start_date=None, end_date=None):
    db = next(get_db())
    try:
        query = db.query(RiderTrack)

        if rider_id:
            query = query.filter(RiderTrack.rider_id == rider_id)
        if order_id:
            query = query.filter(RiderTrack.order_id == order_id)
        if start_date:
            query = query.filter(RiderTrack.timestamp >= start_date)
        if end_date:
            query = query.filter(RiderTrack.timestamp <= end_date)

        tracks = query.order_by(RiderTrack.timestamp).all()

        if not tracks:
            return pd.DataFrame()

        data = []
        for t in tracks:
            note_content = None
            if t.anomaly_note:
                note_content = t.anomaly_note.content
            data.append({
                "id": t.id,
                "rider_id": t.rider_id,
                "order_id": t.order_id,
                "lat": t.lat,
                "lng": t.lng,
                "speed": t.speed,
                "timestamp": t.timestamp,
                "is_anomaly": t.is_anomaly,
                "anomaly_type": t.anomaly_type,
                "anomaly_note": note_content,
                "anomaly_note_id": t.anomaly_note_id,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_anomalies(anomaly_type=None, start_date=None, end_date=None, is_resolved=None):
    db = next(get_db())
    try:
        query = db.query(Anomaly)

        if anomaly_type:
            query = query.filter(Anomaly.anomaly_type == anomaly_type)
        if start_date:
            query = query.filter(Anomaly.detected_at >= start_date)
        if end_date:
            query = query.filter(Anomaly.detected_at <= end_date)
        if is_resolved is not None:
            query = query.filter(Anomaly.is_resolved == is_resolved)

        anomalies = query.order_by(Anomaly.detected_at.desc()).all()

        if not anomalies:
            return pd.DataFrame()

        data = []
        for a in anomalies:
            data.append({
                "id": a.id,
                "anomaly_type": a.anomaly_type,
                "order_id": a.order_id,
                "rider_id": a.rider_id,
                "detected_at": a.detected_at,
                "affected_from": a.affected_from,
                "affected_to": a.affected_to,
                "severity": a.severity,
                "description": a.description,
                "is_resolved": a.is_resolved,
                "compensation_applied": a.compensation_applied,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_subsidy_rules(is_active=None):
    db = next(get_db())
    try:
        query = db.query(SubsidyRule)
        if is_active is not None:
            query = query.filter(SubsidyRule.is_active == is_active)

        rules = query.order_by(SubsidyRule.created_at.desc()).all()

        if not rules:
            return pd.DataFrame()

        data = []
        for r in rules:
            data.append({
                "id": r.id,
                "rule_name": r.rule_name,
                "rule_type": r.rule_type,
                "conditions": json.dumps(r.conditions, ensure_ascii=False) if r.conditions else None,
                "subsidy_amount": r.subsidy_amount,
                "subsidy_percentage": r.subsidy_percentage,
                "is_active": r.is_active,
                "effective_from": r.effective_from,
                "effective_to": r.effective_to,
                "saved_view_name": r.saved_view_name,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_review_notes(order_id=None, anomaly_id=None):
    db = next(get_db())
    try:
        query = db.query(ReviewNote)
        if order_id:
            query = query.filter(ReviewNote.order_id == order_id)
        if anomaly_id:
            query = query.filter(ReviewNote.anomaly_id == anomaly_id)

        notes = query.order_by(ReviewNote.created_at.desc()).all()

        if not notes:
            return pd.DataFrame()

        data = []
        for n in notes:
            data.append({
                "id": n.id,
                "order_id": n.order_id,
                "anomaly_id": n.anomaly_id,
                "author": n.author,
                "content": n.content,
                "review_type": n.review_type,
                "judgment_tag": n.judgment_tag,
                "created_at": n.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_track_anomaly_notes(start_date=None, end_date=None):
    db = next(get_db())
    try:
        from models import TrackAnomalyNote, RiderTrack

        query = db.query(
            TrackAnomalyNote.id,
            TrackAnomalyNote.author,
            TrackAnomalyNote.content,
            TrackAnomalyNote.judgment_tag,
            TrackAnomalyNote.created_at,
            TrackAnomalyNote.updated_at,
            RiderTrack.id.label("track_id"),
            RiderTrack.rider_id,
            RiderTrack.order_id,
            RiderTrack.anomaly_type,
        ).join(RiderTrack, RiderTrack.anomaly_note_id == TrackAnomalyNote.id)

        if start_date:
            query = query.filter(TrackAnomalyNote.created_at >= start_date)
        if end_date:
            query = query.filter(TrackAnomalyNote.created_at <= end_date)

        results = query.order_by(TrackAnomalyNote.created_at.desc()).all()

        if not results:
            return pd.DataFrame()

        data = []
        for r in results:
            data.append({
                "id": r.id,
                "type": "track_anomaly",
                "track_id": r.track_id,
                "rider_id": r.rider_id,
                "order_id": r.order_id,
                "author": r.author,
                "content": r.content,
                "judgment_tag": r.judgment_tag,
                "anomaly_type": r.anomaly_type,
                "created_at": r.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def get_all_review_notes(start_date=None, end_date=None):
    review_df = get_review_notes()
    track_notes_df = get_track_anomaly_notes(start_date=start_date, end_date=end_date)

    dfs = []
    if not review_df.empty:
        review_df["type"] = "review"
        review_df["title"] = review_df["review_type"].apply(lambda x: f"订单备注 - {x}")
        dfs.append(review_df)

    if not track_notes_df.empty:
        track_notes_df["title"] = track_notes_df["anomaly_type"].apply(
            lambda x: f"轨迹异常备注 - {x}" if x else "轨迹异常备注"
        )
        track_notes_df["review_type"] = "track_anomaly"
        dfs.append(track_notes_df)

    if not dfs:
        return pd.DataFrame()

    combined = pd.concat(dfs, ignore_index=True)
    if "created_at" in combined.columns:
        combined = combined.sort_values("created_at", ascending=False).reset_index(drop=True)

    return combined


def get_saved_views(view_type=None):
    db = next(get_db())
    try:
        query = db.query(SavedView)
        if view_type:
            query = query.filter(SavedView.view_type == view_type)

        views = query.order_by(SavedView.updated_at.desc()).all()

        if not views:
            return pd.DataFrame()

        data = []
        for v in views:
            data.append({
                "id": v.id,
                "view_name": v.view_name,
                "view_type": v.view_type,
                "filters": json.dumps(v.filters, ensure_ascii=False) if v.filters else None,
                "columns": json.dumps(v.columns, ensure_ascii=False) if v.columns else None,
                "author": v.author,
                "is_shared": v.is_shared,
                "created_at": v.created_at,
            })

        return pd.DataFrame(data)
    finally:
        db.close()


def add_review_note(order_id, content, author="system", review_type="general", anomaly_id=None, judgment_tag=None):
    db = next(get_db())
    try:
        note = ReviewNote(
            order_id=order_id,
            anomaly_id=anomaly_id,
            author=author,
            content=content,
            review_type=review_type,
            judgment_tag=judgment_tag,
        )
        db.add(note)
        db.commit()
        return note.id
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding review note: {e}")
        raise
    finally:
        db.close()


def add_track_anomaly_note(track_id, content, author="system", judgment_tag=None):
    db = next(get_db())
    try:
        track = db.query(RiderTrack).filter(RiderTrack.id == track_id).first()
        if not track:
            return None

        note = TrackAnomalyNote(
            author=author,
            content=content,
            judgment_tag=judgment_tag,
        )
        db.add(note)
        db.flush()

        track.anomaly_note_id = note.id
        track.is_anomaly = True
        db.commit()
        return note.id
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding track anomaly note: {e}")
        raise
    finally:
        db.close()


def save_view(view_name, view_type, filters, columns, author="system"):
    db = next(get_db())
    try:
        view = SavedView(
            view_name=view_name,
            view_type=view_type,
            filters=filters,
            columns=columns,
            author=author,
        )
        db.add(view)
        db.commit()
        return view.id
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving view: {e}")
        raise
    finally:
        db.close()


def resolve_anomaly(anomaly_id, resolution_note):
    db = next(get_db())
    try:
        anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
        if not anomaly:
            return None

        anomaly.is_resolved = True
        anomaly.resolved_at = datetime.utcnow()
        anomaly.resolution_note = resolution_note
        db.commit()
        return anomaly.id
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving anomaly: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.export_report_excel")
def export_report_excel(start_date=None, end_date=None, include_compensation_rules=True):
    db = next(get_db())
    try:
        output = io.BytesIO()

        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            orders_df = get_orders_data(start_date, end_date)
            if not orders_df.empty:
                orders_df.to_excel(writer, sheet_name="订单明细", index=False)

            funnel_df = get_funnel_data(start_date, end_date)
            if not funnel_df.empty:
                funnel_summary = funnel_df.groupby("event_name").agg({
                    "order_id": "nunique",
                    "duration_seconds": "mean",
                    "is_drop_off": "sum",
                }).reset_index()
                funnel_summary.columns = ["漏斗阶段", "订单数", "平均耗时(秒)", "流失数"]
                funnel_summary.to_excel(writer, sheet_name="漏斗分析", index=False)

            anomalies_df = get_anomalies(start_date=start_date, end_date=end_date)
            if not anomalies_df.empty:
                anomalies_df.to_excel(writer, sheet_name="异常记录", index=False)

            if include_compensation_rules:
                comp_rules = get_compensation_rules_explanation()
                rules_data = []
                for key, rule in comp_rules.items():
                    rules_data.append({
                        "规则项": rule.get("description", key),
                        "计算公式": rule.get("formula", ""),
                        "参数值": str({k: v for k, v in rule.items() if k not in ["description", "formula"]}),
                    })
                pd.DataFrame(rules_data).to_excel(writer, sheet_name="赔付规则", index=False)

                if not orders_df.empty:
                    comp_details = []
                    for _, row in orders_df.head(100).iterrows():
                        order = db.query(Order).filter(Order.id == row["id"]).first()
                        if order:
                            anomalies = db.query(Anomaly).filter(Anomaly.order_id == order.id).all()
                            anomaly_types = [a.anomaly_type for a in anomalies] if anomalies else [None]
                            for at in anomaly_types:
                                comp, breakdown = calculate_compensation(order, at)
                                comp_details.append({
                                    "订单号": order.order_no,
                                    "异常类型": at or "正常",
                                    "赔付金额": comp,
                                    "明细": json.dumps(breakdown, ensure_ascii=False),
                                })
                    if comp_details:
                        pd.DataFrame(comp_details).to_excel(writer, sheet_name="赔付计算明细", index=False)

            rules_df = get_subsidy_rules()
            if not rules_df.empty:
                rules_df.to_excel(writer, sheet_name="补贴规则", index=False)

        output.seek(0)
        return output.getvalue()
    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        raise
    finally:
        db.close()
