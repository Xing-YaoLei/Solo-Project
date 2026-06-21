from datetime import datetime, timedelta
from celery_app import celery_app
from models import get_db, Order, Anomaly, Rider
from config import Config
import logging
import pandas as pd

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.detect_system_delays")
def detect_system_delays(self, hours=24):
    db = next(get_db())
    try:
        threshold = Config.ANOMALY_THRESHOLDS["system_delay_seconds"]
        since = datetime.utcnow() - timedelta(hours=hours)

        orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.created_at >= since,
            Order.system_delay_seconds > threshold,
        ).all()

        anomaly_count = 0
        for order in orders:
            existing = db.query(Anomaly).filter(
                Anomaly.order_id == order.id,
                Anomaly.anomaly_type == "system_delay",
            ).first()

            if not existing:
                anomaly = Anomaly(
                    anomaly_type="system_delay",
                    order_id=order.id,
                    rider_id=order.rider_id,
                    detected_at=datetime.utcnow(),
                    affected_from=order.created_at,
                    affected_to=order.created_at + timedelta(seconds=order.system_delay_seconds),
                    severity="high" if order.system_delay_seconds > threshold * 2 else "medium",
                    description=f"订单系统延迟 {order.system_delay_seconds}秒，超过阈值 {threshold}秒",
                    is_resolved=False,
                )
                db.add(anomaly)
                anomaly_count += 1

        db.commit()
        return {"status": "success", "detected": anomaly_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error detecting system delays: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.detect_payment_missing")
def detect_payment_missing(self, hours=48):
    db = next(get_db())
    try:
        threshold_hours = Config.ANOMALY_THRESHOLDS["payment_missing_hours"]
        since = datetime.utcnow() - timedelta(hours=hours)
        cutoff = datetime.utcnow() - timedelta(hours=threshold_hours)

        orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.created_at >= since,
            Order.created_at <= cutoff,
            Order.payment_status != "completed",
        ).all()

        anomaly_count = 0
        for order in orders:
            existing = db.query(Anomaly).filter(
                Anomaly.order_id == order.id,
                Anomaly.anomaly_type == "payment_missing",
            ).first()

            if not existing:
                anomaly = Anomaly(
                    anomaly_type="payment_missing",
                    order_id=order.id,
                    rider_id=order.rider_id,
                    detected_at=datetime.utcnow(),
                    affected_from=order.created_at,
                    affected_to=datetime.utcnow(),
                    severity="high",
                    description=f"支付流水缺失，订单状态: {order.payment_status}",
                    is_resolved=False,
                )
                db.add(anomaly)
                anomaly_count += 1

        db.commit()
        return {"status": "success", "detected": anomaly_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error detecting payment missing: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.detect_map_calibration_changes")
def detect_map_calibration_changes(self, hours=72):
    db = next(get_db())
    try:
        since = datetime.utcnow() - timedelta(hours=hours)

        orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.created_at >= since,
        ).all()

        if not orders:
            return {"status": "success", "detected": 0}

        df = pd.DataFrame([{
            "created_at": o.created_at,
            "map_version": o.map_calibration_version,
            "distance_km": o.distance_km,
        } for o in orders])

        version_stats = df.groupby("map_version").agg({
            "distance_km": ["mean", "std", "count"],
            "created_at": ["min", "max"],
        }).reset_index()

        anomaly_count = 0
        versions = version_stats["map_version"].tolist()

        for i in range(1, len(versions)):
            prev_version = versions[i - 1]
            curr_version = versions[i]

            prev_mean = version_stats[version_stats["map_version"] == prev_version][("distance_km", "mean")].values[0]
            curr_mean = version_stats[version_stats["map_version"] == curr_version][("distance_km", "mean")].values[0]

            if prev_mean > 0:
                diff_pct = abs(curr_mean - prev_mean) / prev_mean
                if diff_pct > 0.1:
                    curr_min_time = version_stats[version_stats["map_version"] == curr_version][("created_at", "min")].values[0]
                    curr_max_time = version_stats[version_stats["map_version"] == curr_version][("created_at", "max")].values[0]

                    existing = db.query(Anomaly).filter(
                        Anomaly.anomaly_type == "map_calibration_change",
                        Anomaly.description.contains(curr_version),
                    ).first()

                    if not existing:
                        if isinstance(curr_min_time, pd.Timestamp):
                            curr_min_time = curr_min_time.to_pydatetime()
                        if isinstance(curr_max_time, pd.Timestamp):
                            curr_max_time = curr_max_time.to_pydatetime()

                        anomaly = Anomaly(
                            anomaly_type="map_calibration_change",
                            detected_at=datetime.utcnow(),
                            affected_from=curr_min_time,
                            affected_to=curr_max_time,
                            severity="medium",
                            description=f"地图接口口径变化: {prev_version} -> {curr_version}, 距离均值变化 {diff_pct:.1%}",
                            is_resolved=False,
                            extra={"prev_version": prev_version, "curr_version": curr_version, "diff_pct": float(diff_pct)},
                        )
                        db.add(anomaly)
                        anomaly_count += 1

        db.commit()
        return {"status": "success", "detected": anomaly_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error detecting map calibration changes: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.detect_rider_reject_trend")
def detect_rider_reject_trend(self, hours=168):
    db = next(get_db())
    try:
        since = datetime.utcnow() - timedelta(hours=hours)
        threshold_spike = Config.ANOMALY_THRESHOLDS["reject_rate_spike"]

        orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.created_at >= since,
        ).all()

        if not orders:
            return {"status": "success", "detected": 0}

        df = pd.DataFrame([{
            "hour": o.created_at.replace(minute=0, second=0, microsecond=0),
            "rejected": 1 if o.rider_rejected else 0,
            "total": 1,
        } for o in orders])

        hourly = df.groupby("hour").agg({
            "rejected": "sum",
            "total": "sum",
        }).reset_index()
        hourly["reject_rate"] = hourly["rejected"] / hourly["total"]

        baseline_rate = hourly["reject_rate"].mean()

        spike_hours = hourly[hourly["reject_rate"] > baseline_rate + threshold_spike]

        anomaly_count = 0
        if len(spike_hours) >= 2:
            spike_hours_sorted = spike_hours.sort_values("hour")
            affected_from = spike_hours_sorted["hour"].iloc[0].to_pydatetime()
            affected_to = spike_hours_sorted["hour"].iloc[-1].to_pydatetime() + timedelta(hours=1)

            existing = db.query(Anomaly).filter(
                Anomaly.anomaly_type == "rider_reject_spike",
                Anomaly.affected_from == affected_from,
            ).first()

            if not existing:
                max_rate = spike_hours_sorted["reject_rate"].max()
                anomaly = Anomaly(
                    anomaly_type="rider_reject_spike",
                    detected_at=datetime.utcnow(),
                    affected_from=affected_from,
                    affected_to=affected_to,
                    severity="high",
                    description=f"骑手拒单率异常升高，基线 {baseline_rate:.1%}，峰值 {max_rate:.1%}，影响区间 {affected_from} 至 {affected_to}",
                    is_resolved=False,
                    extra={
                        "baseline_rate": float(baseline_rate),
                        "peak_rate": float(max_rate),
                        "spike_hours": spike_hours_sorted["hour"].astype(str).tolist(),
                    },
                )
                db.add(anomaly)
                anomaly_count += 1

        db.commit()
        return {"status": "success", "detected": anomaly_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error detecting rider reject trend: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)
    finally:
        db.close()


@celery_app.task(name="tasks.run_all_anomaly_detection")
def run_all_anomaly_detection():
    results = {}
    results["system_delays"] = detect_system_delays.delay().get()
    results["payment_missing"] = detect_payment_missing.delay().get()
    results["map_calibration"] = detect_map_calibration_changes.delay().get()
    results["reject_trend"] = detect_rider_reject_trend.delay().get()
    return results
