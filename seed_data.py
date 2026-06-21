from models import get_db, Order, FunnelEvent, RiderTrack, Anomaly, ReviewNote, TrackAnomalyNote
from datetime import datetime, timedelta
import random
import pandas as pd
import json
from config import Config
from tasks.compensation_tasks import calculate_compensation
import sys


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


def generate_mock_orders(start_date, end_date, count=500):
    db = next(get_db())
    try:
        existing_count = db.query(Order).filter(Order.order_type == "instant").count()
        if existing_count > 0:
            print(f"已存在 {existing_count} 条订单，跳过生成")
            return

        date_range = (end_date - start_date).total_seconds()
        orders_created = 0

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

            order = Order(
                order_no=order_no,
                order_type="instant",
                status="completed" if len(funnel_events) >= 10 else ("rejected" if rider_rejected else "in_progress"),
                user_id=f"USER{random.randint(10000, 99999)}",
                rider_id=random.randint(1, 50),
                pickup_address=f"上海市浦东新区Pickup Street {random.randint(1, 999)}号",
                pickup_lat=round(base_lat + random.uniform(-0.05, 0.05), 6),
                pickup_lng=round(base_lng + random.uniform(-0.05, 0.05), 6),
                delivery_address=f"上海市静安区Delivery Road {random.randint(1, 999)}号",
                delivery_lat=round(base_lat + random.uniform(-0.05, 0.05), 6),
                delivery_lng=round(base_lng + random.uniform(-0.05, 0.05), 6),
                distance_km=distance,
                map_calibration_version=map_version,
                amount=amount,
                subsidy_amount=subsidy,
                compensation_amount=0,
                payment_status=payment_status,
                payment_transaction_id=f"TXN{random.randint(1000000, 9999999)}" if not payment_missing else None,
                rider_rejected=rider_rejected,
                reject_count=reject_count,
                system_delay_seconds=system_delay,
                created_at=created_ts,
                paid_at=created_ts + timedelta(seconds=random.randint(5, 120)) if payment_status == "completed" else None,
                assigned_at=created_ts + timedelta(seconds=random.randint(60, 300) + system_delay) if not rider_rejected else None,
                picked_at=created_ts + timedelta(minutes=random.randint(15, 45) + system_delay // 60) if not rider_rejected and len(funnel_events) >= 7 else None,
                delivered_at=created_ts + timedelta(minutes=random.randint(30, 90) + system_delay // 60) if not rider_rejected and len(funnel_events) >= 9 else None,
                completed_at=created_ts + timedelta(minutes=random.randint(35, 100) + system_delay // 60) if len(funnel_events) >= 10 else None,
            )
            db.add(order)
            db.flush()

            for event_data in funnel_events:
                event = FunnelEvent(order_id=order.id, **event_data)
                db.add(event)

            orders_created += 1
            if orders_created % 100 == 0:
                db.commit()
                print(f"已生成 {orders_created} 条订单...")

        db.commit()
        print(f"共生成 {orders_created} 条订单")
    except Exception as e:
        db.rollback()
        print(f"生成订单失败: {e}")
        raise
    finally:
        db.close()


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


def generate_mock_tracks():
    db = next(get_db())
    try:
        existing_count = db.query(RiderTrack).count()
        if existing_count > 0:
            print(f"已存在 {existing_count} 条轨迹，跳过生成")
            return

        orders = db.query(Order).filter(Order.rider_id.isnot(None)).limit(100).all()
        track_count = 0

        for order in orders:
            if not order.pickup_lat or not order.delivery_lat:
                continue

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

                track = RiderTrack(
                    rider_id=order.rider_id,
                    order_id=order.id,
                    lat=round(lat, 6),
                    lng=round(lng, 6),
                    speed=round(random.uniform(5, 35), 1),
                    timestamp=ts,
                    is_anomaly=is_anomaly,
                    anomaly_type=random.choice(["deviation", "stopped", "speed"]) if is_anomaly else None,
                )
                db.add(track)
                track_count += 1

            if track_count % 500 == 0:
                db.commit()
                print(f"已生成 {track_count} 条轨迹点...")

        db.commit()
        print(f"共生成 {track_count} 条轨迹点")
    except Exception as e:
        db.rollback()
        print(f"生成轨迹失败: {e}")
        raise
    finally:
        db.close()


def detect_anomalies():
    db = next(get_db())
    try:
        existing_count = db.query(Anomaly).count()
        if existing_count > 0:
            print(f"已存在 {existing_count} 条异常记录，跳过生成")
            return

        threshold = Config.ANOMALY_THRESHOLDS["system_delay_seconds"]
        delay_orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.system_delay_seconds > threshold,
        ).limit(20).all()

        anomaly_count = 0
        for order in delay_orders:
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

        missing_payment_orders = db.query(Order).filter(
            Order.order_type == "instant",
            Order.payment_status == "missing",
        ).limit(10).all()

        for order in missing_payment_orders:
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

        map_versions = db.query(Order.map_calibration_version).distinct().all()
        if len(map_versions) > 1:
            orders = db.query(Order).filter(Order.order_type == "instant").all()
            df = pd.DataFrame([{
                "created_at": o.created_at,
                "map_version": o.map_calibration_version,
                "distance_km": o.distance_km,
            } for o in orders])

            version_stats = df.groupby("map_version")["distance_km"].mean()
            versions = version_stats.index.tolist()

            for i in range(1, len(versions)):
                prev_v = versions[i - 1]
                curr_v = versions[i]
                diff_pct = abs(version_stats[curr_v] - version_stats[prev_v]) / version_stats[prev_v]
                if diff_pct > 0.05:
                    version_orders = df[df["map_version"] == curr_v]
                    anomaly = Anomaly(
                        anomaly_type="map_calibration_change",
                        detected_at=datetime.utcnow(),
                        affected_from=version_orders["created_at"].min(),
                        affected_to=version_orders["created_at"].max(),
                        severity="medium",
                        description=f"地图接口口径变化: {prev_v} -> {curr_v}, 距离均值变化 {diff_pct:.1%}",
                        is_resolved=False,
                        extra={"prev_version": prev_v, "curr_version": curr_v, "diff_pct": float(diff_pct)},
                    )
                    db.add(anomaly)
                    anomaly_count += 1
                    break

        df = pd.DataFrame([{
            "hour": o.created_at.replace(minute=0, second=0, microsecond=0),
            "rejected": 1 if o.rider_rejected else 0,
            "total": 1,
        } for o in orders])

        if not df.empty:
            hourly = df.groupby("hour").agg({"rejected": "sum", "total": "sum"}).reset_index()
            hourly["reject_rate"] = hourly["rejected"] / hourly["total"]

            baseline = hourly["reject_rate"].mean()
            spike_threshold = baseline + Config.ANOMALY_THRESHOLDS["reject_rate_spike"]

            spike_hours = hourly[hourly["reject_rate"] > spike_threshold]
            if len(spike_hours) >= 2:
                spike_hours = spike_hours.sort_values("hour")
                anomaly = Anomaly(
                    anomaly_type="rider_reject_spike",
                    detected_at=datetime.utcnow(),
                    affected_from=spike_hours["hour"].iloc[0],
                    affected_to=spike_hours["hour"].iloc[-1] + timedelta(hours=1),
                    severity="high",
                    description=f"骑手拒单率异常升高，基线 {baseline:.1%}，峰值 {spike_hours['reject_rate'].max():.1%}",
                    is_resolved=False,
                    extra={
                        "baseline_rate": float(baseline),
                        "peak_rate": float(spike_hours["reject_rate"].max()),
                    },
                )
                db.add(anomaly)
                anomaly_count += 1

        db.commit()
        print(f"共生成 {anomaly_count} 条异常记录")
    except Exception as e:
        db.rollback()
        print(f"检测异常失败: {e}")
        raise
    finally:
        db.close()


def calculate_all_compensation():
    db = next(get_db())
    try:
        orders = db.query(Order).filter(Order.order_type == "instant").all()
        total_comp = 0.0

        for order in orders:
            anomalies = db.query(Anomaly).filter(Anomaly.order_id == order.id).all()
            comp_sum = 0.0

            if anomalies:
                for anomaly in anomalies:
                    comp, _ = calculate_compensation(order, anomaly.anomaly_type)
                    comp_sum += comp
                    anomaly.compensation_applied = comp
            else:
                comp, _ = calculate_compensation(order)
                comp_sum = comp

            order.compensation_amount = round(comp_sum, 2)
            total_comp += comp_sum

        db.commit()
        print(f"已计算 {len(orders)} 笔订单赔付，总金额: ¥{total_comp:.2f}")
    except Exception as e:
        db.rollback()
        print(f"计算赔付失败: {e}")
        raise
    finally:
        db.close()


def seed_sample_review_notes():
    db = next(get_db())
    try:
        existing = db.query(ReviewNote).count()
        if existing > 0:
            print(f"已存在 {existing} 条复盘备注，跳过生成")
            return

        anomaly = db.query(Anomaly).filter(Anomaly.anomaly_type == "system_delay").first()
        if anomaly and anomaly.order_id:
            note = ReviewNote(
                order_id=anomaly.order_id,
                anomaly_id=anomaly.id,
                author="analyst_01",
                content="系统延迟导致用户体验下降，建议排查派单系统队列拥堵原因。该订单骑手端接收延迟了约6分钟，属于系统问题。",
                review_type="anomaly_analysis",
                judgment_tag="system_issue",
            )
            db.add(note)

        anomaly2 = db.query(Anomaly).filter(Anomaly.anomaly_type == "rider_reject_spike").first()
        if anomaly2:
            note2 = ReviewNote(
                order_id=None,
                anomaly_id=anomaly2.id,
                author="team_lead",
                content="午高峰12点出现拒单率飙升，结合天气数据判断为突发降雨导致骑手供应不足。建议优化恶劣天气补贴策略。",
                review_type="improvement",
                judgment_tag="external",
            )
            db.add(note2)

        order = db.query(Order).filter(Order.rider_rejected == True).first()
        if order:
            note3 = ReviewNote(
                order_id=order.id,
                author="ops_specialist",
                content="该订单被拒3次，原因是配送距离过远且位于郊区，骑手接单意愿低。建议调整郊区订单补贴比例。",
                review_type="general",
                judgment_tag="mixed",
            )
            db.add(note3)

        db.commit()
        print("已生成示例复盘备注")
    except Exception as e:
        db.rollback()
        print(f"生成复盘备注失败: {e}")
        raise
    finally:
        db.close()


def seed_sample_track_notes():
    db = next(get_db())
    try:
        existing = db.query(TrackAnomalyNote).count()
        if existing > 0:
            print(f"已存在 {existing} 条轨迹异常备注，跳过生成")
            return

        anomaly_tracks = db.query(RiderTrack).filter(RiderTrack.is_anomaly == True).limit(5).all()

        sample_notes = [
            {
                "judgment": "gps_drift",
                "content": "该点为GPS定位漂移，前后点轨迹连续，速度变化正常，判定为信号波动导致的定位误差，不影响订单配送。",
                "author": "qa_analyst",
            },
            {
                "judgment": "stopped",
                "content": "骑手在此处停留约8分钟，经核对为等红灯+取餐等待，属于正常配送行为。",
                "author": "ops_specialist",
            },
            {
                "judgment": "detour",
                "content": "骑手偏离预计路线约200米，经核实为临时道路封闭绕行，属于合理情况。",
                "author": "qa_analyst",
            },
            {
                "judgment": "signal_error",
                "content": "连续3个点坐标跳跃，判断为地下通道信号丢失导致，恢复后轨迹正常。",
                "author": "tech_lead",
            },
            {
                "judgment": "pending",
                "content": "异常原因待确认，需要结合订单详情和骑手反馈进一步分析。",
                "author": "analyst_01",
            },
        ]

        for i, track in enumerate(anomaly_tracks):
            if i < len(sample_notes):
                note_data = sample_notes[i]
                note = TrackAnomalyNote(
                    author=note_data["author"],
                    content=note_data["content"],
                    judgment_tag=note_data["judgment"],
                    created_at=track.timestamp + timedelta(hours=random.randint(1, 24)),
                )
                db.add(note)
                db.flush()
                track.anomaly_note_id = note.id
                db.add(track)

        db.commit()
        print(f"已生成 {len(anomaly_tracks[:5])} 条轨迹异常备注（当时判断）")
    except Exception as e:
        db.rollback()
        print(f"生成轨迹异常备注失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import os
    os.environ.setdefault("PYTHONPATH", os.getcwd())

    print("=== 生成模拟数据 ===")

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    print(f"\n1. 生成订单数据 ({start_date.date()} ~ {end_date.date()})...")
    generate_mock_orders(start_date, end_date, 500)

    print("\n2. 生成骑手轨迹数据...")
    generate_mock_tracks()

    print("\n3. 检测异常...")
    detect_anomalies()

    print("\n4. 计算赔付金额...")
    calculate_all_compensation()

    print("\n5. 生成示例复盘备注...")
    seed_sample_review_notes()

    print("\n6. 生成轨迹异常备注（当时判断）...")
    seed_sample_track_notes()

    print("\n=== 数据生成完成 ===")
