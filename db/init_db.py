import uuid
from datetime import date, datetime, timedelta
import random

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import config
from db.models import Base, (
    SyncBatch,
    GroupBuyBatch,
    WarehouseOutbound,
    DriverTrack,
    MiniappOrder,
    ProductTag,
    Settlement,
    ArrivalChecklist,
    FunnelMetric,
)


def init_schema():
    engine = create_engine(config.DATABASE_URL)
    Base.metadata.create_all(engine)
    print("Schema created successfully.")


def seed_demo_data():
    engine = create_engine(config.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    if session.query(GroupBuyBatch).count() > 0:
        print("Demo data already exists, skipping seed.")
        session.close()
        return

    regions = [
        ("110000", "北京"),
        ("310000", "上海"),
        ("440000", "广东"),
        ("510000", "四川"),
        ("330000", "浙江"),
    ]
    communities = ["阳光花园", "翠湖小区", "金地华府", "碧水湾", "龙城国际"]
    leaders = ["张团长", "李团长", "王团长", "赵团长", "刘团长"]
    skus = [
        ("SKU001", "有机蔬菜礼盒"),
        ("SKU002", "进口牛奶6瓶装"),
        ("SKU003", "新鲜草莓1斤"),
        ("SKU004", "土鸡蛋30枚"),
        ("SKU005", "东北大米10kg"),
        ("SKU006", "新疆阿克苏苹果5斤"),
        ("SKU007", "智利车厘子2斤"),
        ("SKU008", "阳澄湖大闸蟹8只"),
    ]
    tags = ["品类", "季节", "促销", "供应商等级"]
    tag_values_map = {
        "品类": ["生鲜", "乳品", "水果", "粮油", "水产"],
        "季节": ["春季", "夏季", "秋季", "冬季"],
        "促销": ["满减", "折扣", "赠品", "秒杀"],
        "供应商等级": ["A级", "B级", "C级"],
    }
    handlers = ["陈处理", "周处理", "吴处理"]
    shortage_reasons = [
        "仓库拣货不足",
        "运输损耗",
        "供应商缺货",
        "分拣误差",
    ]

    sync_batch_id = f"SYNC-{uuid.uuid4().hex[:12]}"
    sync_batch = SyncBatch(
        batch_id=sync_batch_id,
        source="demo_seed",
        status="completed",
        record_count=0,
        started_at=datetime.now(),
        finished_at=datetime.now(),
    )
    session.add(sync_batch)

    base_date = date.today() - timedelta(days=30)
    total_records = 0

    for day_offset in range(31):
        current_date = base_date + timedelta(days=day_offset)
        for region_code, region_name in regions:
            num_batches = random.randint(1, 3)
            for _ in range(num_batches):
                batch_no = f"GB-{current_date.strftime('%Y%m%d')}-{region_code}-{uuid.uuid4().hex[:6]}"
                community = random.choice(communities)
                leader = random.choice(leaders)

                expected_arrival = datetime.combine(
                    current_date, datetime.min.time()
                ) + timedelta(hours=random.randint(8, 10))
                actual_arrival_offset = random.choice(
                    [0, 0, 0, 0, 1, 2, -1, 3, 0, 0]
                )
                actual_arrival = expected_arrival + timedelta(
                    hours=actual_arrival_offset
                )

                total_orders = random.randint(20, 200)
                total_amount = round(random.uniform(2000, 30000), 2)

                gbb = GroupBuyBatch(
                    batch_no=batch_no,
                    batch_date=current_date,
                    region_code=region_code,
                    region_name=region_name,
                    community_name=community,
                    leader_name=leader,
                    status="completed",
                    total_orders=total_orders,
                    total_amount=total_amount,
                    expected_arrival_time=expected_arrival,
                    actual_arrival_time=actual_arrival,
                )
                session.add(gbb)

                for sku_code, sku_name in random.sample(skus, random.randint(3, 6)):
                    qty_planned = random.randint(10, total_orders)
                    qty_actual = qty_planned - random.randint(0, max(1, qty_planned // 10))

                    wo = WarehouseOutbound(
                        outbound_no=f"WO-{uuid.uuid4().hex[:10]}",
                        batch_no=batch_no,
                        sku_code=sku_code,
                        sku_name=sku_name,
                        qty_planned=qty_planned,
                        qty_actual=qty_actual,
                        warehouse_code=f"WH-{region_code}",
                        warehouse_name=f"{region_name}仓",
                        outbound_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(hours=random.randint(5, 7)),
                        status="completed",
                        sync_batch_id=sync_batch_id,
                    )
                    session.add(wo)

                for stop_seq in range(random.randint(2, 5)):
                    dt = DriverTrack(
                        track_id=f"DT-{uuid.uuid4().hex[:10]}",
                        batch_no=batch_no,
                        driver_name=f"司机{random.randint(1, 10)}",
                        vehicle_no=f"京A{random.randint(10000, 99999)}",
                        departure_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(hours=6 + stop_seq),
                        arrival_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(hours=7 + stop_seq, minutes=random.randint(0, 30)),
                        route_stop_seq=stop_seq + 1,
                        stop_community=random.choice(communities),
                        stop_longitude=round(random.uniform(116.0, 121.0), 6),
                        stop_latitude=round(random.uniform(30.0, 40.0), 6),
                        stop_arrival_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(
                            hours=7 + stop_seq, minutes=random.randint(15, 45)
                        ),
                        stop_departure_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(
                            hours=7 + stop_seq, minutes=random.randint(50, 90)
                        ),
                        is_on_time=random.random() > 0.2,
                        sync_batch_id=sync_batch_id,
                    )
                    session.add(dt)

                for _ in range(random.randint(10, min(total_orders, 80))):
                    sku_code, sku_name = random.choice(skus)
                    mo = MiniappOrder(
                        order_no=f"MO-{uuid.uuid4().hex[:10]}",
                        batch_no=batch_no,
                        user_id=f"U{random.randint(10000, 99999)}",
                        sku_code=sku_code,
                        sku_name=sku_name,
                        qty=random.randint(1, 5),
                        unit_price=round(random.uniform(5, 200), 2),
                        total_amount=round(random.uniform(5, 1000), 2),
                        order_time=datetime.combine(
                            current_date - timedelta(days=1),
                            datetime.min.time(),
                        )
                        + timedelta(hours=random.randint(6, 22)),
                        pay_time=datetime.combine(
                            current_date - timedelta(days=1),
                            datetime.min.time(),
                        )
                        + timedelta(
                            hours=random.randint(6, 22), minutes=random.randint(0, 59)
                        ),
                        order_status=random.choice(["paid", "paid", "paid", "refunded"]),
                        region_code=region_code,
                        sync_batch_id=sync_batch_id,
                    )
                    session.add(mo)

                for sku_code, sku_name in random.sample(skus, random.randint(2, 5)):
                    settled_qty = random.randint(5, 50)
                    stl = Settlement(
                        settlement_no=f"STL-{uuid.uuid4().hex[:10]}",
                        batch_no=batch_no,
                        sku_code=sku_code,
                        sku_name=sku_name,
                        settled_qty=settled_qty,
                        settled_amount=round(settled_qty * random.uniform(10, 100), 2),
                        settlement_date=current_date,
                        region_code=region_code,
                        supplier_code=f"SUP-{sku_code}",
                    )
                    session.add(stl)

                for sku_code, sku_name in random.sample(skus, random.randint(2, 4)):
                    qty_expected = random.randint(10, 60)
                    shortage = random.randint(0, max(1, qty_expected // 8))
                    qty_received = qty_expected - shortage

                    acl = ArrivalChecklist(
                        checklist_no=f"ACL-{uuid.uuid4().hex[:10]}",
                        batch_no=batch_no,
                        sku_code=sku_code,
                        sku_name=sku_name,
                        qty_expected=qty_expected,
                        qty_received=qty_received,
                        qty_shortage=shortage,
                        shortage_reason=(
                            random.choice(shortage_reasons) if shortage > 0 else None
                        ),
                        handler=(random.choice(handlers) if shortage > 0 else None),
                        is_resolved=(shortage == 0 or random.random() > 0.4),
                        check_time=datetime.combine(
                            current_date, datetime.min.time()
                        )
                        + timedelta(hours=random.randint(9, 14)),
                        region_code=region_code,
                        community_name=community,
                    )
                    session.add(acl)

                outbound_count = session.query(WarehouseOutbound).filter(
                    WarehouseOutbound.batch_no == batch_no
                ).count()
                delivered_count = session.query(DriverTrack).filter(
                    DriverTrack.batch_no == batch_no
                ).count()
                received_total = session.query(ArrivalChecklist).filter(
                    ArrivalChecklist.batch_no == batch_no,
                    ArrivalChecklist.qty_shortage == 0,
                ).count()
                settled_count = session.query(Settlement).filter(
                    Settlement.batch_no == batch_no
                ).count()
                on_time_tracks = session.query(DriverTrack).filter(
                    DriverTrack.batch_no == batch_no,
                    DriverTrack.is_on_time == True,
                ).count()
                all_tracks = session.query(DriverTrack).filter(
                    DriverTrack.batch_no == batch_no
                ).count()
                on_time_rate = on_time_tracks / max(all_tracks, 1)
                shortage_records = session.query(ArrivalChecklist).filter(
                    ArrivalChecklist.batch_no == batch_no,
                    ArrivalChecklist.qty_shortage > 0,
                ).count()
                all_checklist = session.query(ArrivalChecklist).filter(
                    ArrivalChecklist.batch_no == batch_no
                ).count()
                shortage_rate = shortage_records / max(all_checklist, 1)

                fm = FunnelMetric(
                    batch_date=current_date,
                    region_code=region_code,
                    region_name=region_name,
                    batch_no=batch_no,
                    total_orders=total_orders,
                    outbound_orders=outbound_count,
                    delivered_orders=delivered_count,
                    received_orders=received_total,
                    settled_orders=settled_count,
                    fulfillment_on_time_rate=round(on_time_rate, 4),
                    shortage_rate=round(shortage_rate, 4),
                )
                session.add(fm)
                total_records += 1

    for sku_code, _ in skus:
        for tag in tags:
            pt = ProductTag(
                sku_code=sku_code,
                tag_name=tag,
                tag_value=random.choice(tag_values_map[tag]),
                effective_date=base_date,
            )
            session.add(pt)

    sync_batch.record_count = total_records
    session.commit()
    session.close()
    print(f"Demo data seeded: {total_records} funnel metrics, plus detail records.")


if __name__ == "__main__":
    init_schema()
    seed_demo_data()
