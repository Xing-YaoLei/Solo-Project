from datetime import datetime, timedelta
from celery_app import celery_app
from models import get_db, Order, FunnelEvent, Rider, RiderTrack
import random
import logging

logger = logging.getLogger(__name__)

FUNNEL_STAGES = [
    "order_created",
    "payment_initiated",
    "payment_completed",
    "order_dispatched",
    "rider_assigned",
    "rider_arrived",
    "order_picked",
    "in_delivery",
    "order_delivered",
    "order_completed",
]


@celery_app.task(bind=True, name="tasks.sync_instant_orders")
def sync_instant_orders(self, start_date=None, end_date=None):
    db = next(get_db())
    try:
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=7)
        if not end_date:
            end_date = datetime.utcnow()

        logger.info(f"Syncing instant orders from {start_date} to {end_date}")

        orders = generate_mock_orders(start_date, end_date, 500)

        for order_data in orders:
            existing = db.query(Order).filter(Order.order_no == order_data["order_no"]).first()
            if not existing:
                order = Order(**{k: v for k, v in order_data.items() if k != "funnel_events" and k != "tracks"})
                db.add(order)
                db.flush()

                for event_data in order_data.get("funnel_events", []):
                    event = FunnelEvent(order_id=order.id, **event_data)
                    db.add(event)

        db.commit()
        return {"status": "success", "synced_count": len(orders)}
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing instant orders: {e}")
        self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        db.close()


def generate_mock_orders(start_date, end_date, count):
    orders = []
    date_range = (end_date - start_date).total_seconds()

    for i in range(count):
        created_ts = start_date + timedelta(seconds=random.uniform(0, date_range))
        order_no = f"INST{created_ts.strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"

        rider_rejected = random.random() < 0.12
        reject_count = random.randint(0, 3) if rider_rejected else 0

        system_delay = random.randint(0, 600) if random.random() < 0.15 else random.randint(0, 60)

        payment_missing = random.random() < 0.05
        payment_status = "missing" if payment_missing else ("completed" if random.random() < 0.85 else "pending")

        distance = round(random.uniform(0.5, 8.0), 2)
        amount = round(8 + distance * 2 + random.uniform(0, 10), 2)
        subsidy = round(amount * random.uniform(0, 0.3), 2) if random.random() < 0.4 else 0

        map_version = random.choice(["v1", "v1.1", "v2.0"])

        base_lat = 31.23
        base_lng = 121.47

        funnel_events = generate_funnel_events(created_ts, rider_rejected, system_delay, payment_missing)

        orders.append({
            "order_no": order_no,
            "order_type": "instant",
            "status": "completed" if len(funnel_events) >= 10 else ("rejected" if rider_rejected else "in_progress"),
            "user_id": f"USER{random.randint(10000, 99999)}",
            "rider_id": random.randint(1, 50),
            "pickup_address": f"上海市浦东新区Pickup Street {random.randint(1, 999)}号",
            "pickup_lat": round(base_lat + random.uniform(-0.05, 0.05), 6),
            "pickup_lng": round(base_lng + random.uniform(-0.05, 0.05), 6),
            "delivery_address": f"上海市静安区Delivery Road {random.randint(1, 999)}号",
            "delivery_lat": round(base_lat + random.uniform(-0.05, 0.05), 6),
            "delivery_lng": round(base_lng + random.uniform(-0.05, 0.05), 6),
            "distance_km": distance,
            "map_calibration_version": map_version,
            "amount": amount,
            "subsidy_amount": subsidy,
            "compensation_amount": 0,
            "payment_status": payment_status,
            "payment_transaction_id": f"TXN{random.randint(1000000, 9999999)}" if not payment_missing else None,
            "rider_rejected": rider_rejected,
            "reject_count": reject_count,
            "system_delay_seconds": system_delay,
            "created_at": created_ts,
            "paid_at": created_ts + timedelta(seconds=random.randint(5, 120)) if payment_status == "completed" else None,
            "assigned_at": created_ts + timedelta(seconds=random.randint(60, 300) + system_delay) if not rider_rejected else None,
            "picked_at": created_ts + timedelta(minutes=random.randint(15, 45) + system_delay // 60) if not rider_rejected and len(funnel_events) >= 7 else None,
            "delivered_at": created_ts + timedelta(minutes=random.randint(30, 90) + system_delay // 60) if not rider_rejected and len(funnel_events) >= 9 else None,
            "completed_at": created_ts + timedelta(minutes=random.randint(35, 100) + system_delay // 60) if len(funnel_events) >= 10 else None,
            "funnel_events": funnel_events,
        })

    return orders


def generate_funnel_events(created_ts, rider_rejected, system_delay, payment_missing):
    events = []
    current_ts = created_ts

    drop_stage = None
    if rider_rejected:
        drop_stage = random.randint(4, 5)
    elif payment_missing:
        drop_stage = 2

    for i, stage in enumerate(FUNNEL_STAGES):
        if drop_stage and i >= drop_stage:
            break

        duration = random.randint(5, 300)
        if i == 3:
            duration += system_delay

        events.append({
            "event_name": stage,
            "event_timestamp": current_ts,
            "event_source": random.choice(["app", "web", "api"]),
            "duration_seconds": duration,
            "is_drop_off": False,
            "drop_off_reason": None,
        })
        current_ts = current_ts + timedelta(seconds=duration)

    if drop_stage and events:
        events[-1]["is_drop_off"] = True
        if rider_rejected:
            events[-1]["drop_off_reason"] = "rider_rejected"
        elif payment_missing:
            events[-1]["drop_off_reason"] = "payment_timeout"

    return events


@celery_app.task(name="tasks.sync_rider_tracks")
def sync_rider_tracks(order_id=None):
    db = next(get_db())
    try:
        if order_id:
            orders = db.query(Order).filter(Order.id == order_id).all()
        else:
            orders = db.query(Order).filter(Order.rider_id.isnot(None)).limit(100).all()

        track_count = 0
        for order in orders:
            tracks = generate_mock_tracks(order)
            for track_data in tracks:
                track = RiderTrack(**track_data)
                db.add(track)
                track_count += 1

        db.commit()
        return {"status": "success", "tracks_synced": track_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing rider tracks: {e}")
        raise
    finally:
        db.close()


def generate_mock_tracks(order):
    tracks = []
    if not order.pickup_lat or not order.delivery_lat:
        return tracks

    start_lat, start_lng = order.pickup_lat, order.pickup_lng
    end_lat, end_lng = order.delivery_lat, order.delivery_lng

    num_points = random.randint(20, 50)
    anomaly_point_idx = random.randint(5, num_points - 5) if random.random() < 0.2 else -1

    for i in range(num_points):
        ratio = i / num_points
        lat = start_lat + (end_lat - start_lat) * ratio + random.uniform(-0.0005, 0.0005)
        lng = start_lng + (end_lng - start_lng) * ratio + random.uniform(-0.0005, 0.0005)

        is_anomaly = i == anomaly_point_idx
        if is_anomaly:
            lat += random.uniform(-0.002, 0.002)
            lng += random.uniform(-0.002, 0.002)

        ts = (order.assigned_at or order.created_at) + timedelta(minutes=i * 1.5)

        tracks.append({
            "rider_id": order.rider_id,
            "order_id": order.id,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "speed": round(random.uniform(5, 35), 1),
            "timestamp": ts,
            "is_anomaly": is_anomaly,
            "anomaly_type": random.choice(["deviation", "stopped", "speed"]) if is_anomaly else None,
        })

    return tracks


@celery_app.task(name="tasks.ensure_riders_exist")
def ensure_riders_exist():
    db = next(get_db())
    try:
        existing_count = db.query(Rider).count()
        if existing_count >= 50:
            return {"status": "exists", "count": existing_count}

        for i in range(1, 51):
            existing = db.query(Rider).filter(Rider.rider_no == f"R{i:04d}").first()
            if not existing:
                rider = Rider(
                    rider_no=f"R{i:04d}",
                    name=f"骑手{i:03d}",
                    phone=f"138{random.randint(10000000, 99999999)}",
                    status="active",
                    level=random.choice(["normal", "silver", "gold", "diamond"]),
                    total_orders=random.randint(100, 5000),
                    reject_rate=round(random.uniform(0.02, 0.2), 3),
                    on_time_rate=round(random.uniform(0.75, 0.99), 3),
                )
                db.add(rider)

        db.commit()
        return {"status": "created", "count": 50}
    except Exception as e:
        db.rollback()
        logger.error(f"Error ensuring riders exist: {e}")
        raise
    finally:
        db.close()
