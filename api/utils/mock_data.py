import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import text
from api.utils.database import async_session


EVENT_ID = "event-001"


def generate_id():
    return str(uuid.uuid4())


def get_row_label(index):
    label = ''
    n = index
    while n >= 0:
        remainder = n % 26
        label = chr(65 + remainder) + label
        n = n // 26 - 1
        if n < 0:
            break
    return label


async def seed_mock_data():
    async with async_session() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM events"))
        count = result.scalar()
        if count > 0:
            return

        event_id = EVENT_ID
        await session.execute(text(f"""
            INSERT INTO events (id, name, start_date, end_date, venue)
            VALUES ('{event_id}', '2024夏季音乐节', '2024-06-01', '2024-06-30', '国家体育场')
        """))

        sponsors = [
            ("sponsor-001", "阿里巴巴集团", "VIP休息室、专属礼品"),
            ("sponsor-002", "腾讯科技", "饮料、明星合影"),
            ("sponsor-003", "字节跳动", "优先入场、后台访问"),
        ]
        for sid, name, benefits in sponsors:
            await session.execute(text(f"""
                INSERT INTO sponsors (id, name, benefits)
                VALUES ('{sid}', '{name}', '{{\"benefits\": \"{benefits}\"}}')
            """))

        ticket_types = [
            ("tt-001", event_id, "VIP票", 1280, 1280.00, 500),
            ("tt-002", event_id, "普通票A区", 680, 680.00, 2000),
            ("tt-003", event_id, "普通票B区", 480, 480.00, 3000),
            ("tt-004", event_id, "学生票", 280, 280.00, 1500),
        ]
        for tid, eid, name, price, desc, qty in ticket_types:
            await session.execute(text(f"""
                INSERT INTO ticket_types (id, event_id, name, price, total_quantity, description)
                VALUES ('{tid}', '{eid}', '{name}', {price}, {qty}, '{desc}元门票')
            """))

        benefits = [
            ("b-001", "tt-001", "sponsor-001", "VIP休息室", "service"),
            ("b-002", "tt-001", "sponsor-002", "专属礼品包", "gift"),
            ("b-003", "tt-001", "sponsor-003", "优先入场", "service"),
            ("b-004", "tt-002", "sponsor-002", "饮料兑换券", "gift"),
        ]
        for bid, ttid, sid, name, cat in benefits:
            await session.execute(text(f"""
                INSERT INTO ticket_benefits (id, ticket_type_id, sponsor_id, name, category)
                VALUES ('{bid}', '{ttid}', '{sid}', '{name}', '{cat}')
            """))

        areas = [
            ("area-001", event_id, "VIP区", 500),
            ("area-002", event_id, "A区", 2000),
            ("area-003", event_id, "B区", 3000),
        ]
        for aid, eid, name, seats in areas:
            await session.execute(text(f"""
                INSERT INTO areas (id, event_id, name, total_seats)
                VALUES ('{aid}', '{eid}', '{name}', {seats})
            """))

        for aid, area_name, row_count, col_count in [
            ("area-001", "VIP区", 10, 50),
            ("area-002", "A区", 20, 100),
            ("area-003", "B区", 30, 100),
        ]:
            price_map = {"VIP区": 1280, "A区": 680, "B区": 480}
            for ri in range(row_count):
                for ci in range(1, col_count + 1):
                    seat_id = f"seat-{aid}-{ri}-{ci}"
                    status = random.choice(["available", "sold", "used"])
                    price = price_map[area_name]
                    await session.execute(text(f"""
                        INSERT INTO seats (id, event_id, area_id, seat_code, row_label, col_number, price, status)
                        VALUES ('{seat_id}', '{event_id}', '{aid}', '{get_row_label(ri)}{ci}', '{get_row_label(ri)}', {ci}, {price}, '{status}')
                    """))

        calibers = [
            ("v1.0", "初始版本", "核销率=已核销票数/总出票数", "基础版本，不包含补录数据", "2024-01-01", "系统上线初始版本"),
            ("v1.1", "优化版本", "核销率=(已核销票数+闸机通过人数)/总出票数", "增加闸机数据联动", "2024-04-01", "发现签到码存在代签问题，增加闸机数据验证"),
            ("v2.0", "精确版本", "核销率=(已核销票数 AND 闸机通过人数)/总出票数", "取交集计算", "2024-05-15", "优化核销数据冲突，取严格交集计算"),
        ]
        for ver, name, formula, desc, eff_date, reason in calibers:
            await session.execute(text(f"""
                INSERT INTO caliber_versions (version, name, formula, description, change_reason, effective_date)
                VALUES ('{ver}', '{name}', '{formula}', '{desc}', '{reason}', '{eff_date}')
            """))

        base_date = datetime(2024, 6, 1)

        tasks = [
            ("task-001", "票务数据同步", "ticket_platform", "0 */30 * * *"),
            ("task-002", "闸机记录同步", "gate_system", "0 */15 * * *"),
            ("task-003", "支付流水同步", "payment_system", "0 * * * *"),
        ]
        now = datetime.now()
        for tid, name, source, cron in tasks:
            next_run = (now + timedelta(hours=1)).isoformat()
            last_run = (now - timedelta(hours=1)).isoformat()
            await session.execute(text(f"""
                INSERT INTO sync_tasks (id, name, source, cron_expression, status, last_run_time, next_run_time)
                VALUES ('{tid}', '{name}', '{source}', '{cron}', 'active', '{last_run}', '{next_run}')
            """))

        ticket_batch_id = "batch-ticket-platform-001"
        gate_batch_id = "batch-gate-system-001"
        payment_batch_id = "batch-payment-system-001"
        sync_date_str = base_date.isoformat()
        now_str = now.isoformat()
        end_str = (now + timedelta(minutes=5)).isoformat()

        await session.execute(text(f"""
            INSERT INTO sync_batches (id, task_id, source, status, total_records, processed_records, start_time, end_time, error_message, sync_date)
            VALUES ('{ticket_batch_id}', 'task-001', 'ticket_platform', 'success', 200, 200, '{now_str}', '{end_str}', NULL, '{sync_date_str}')
        """))
        await session.execute(text(f"""
            INSERT INTO sync_batches (id, task_id, source, status, total_records, processed_records, start_time, end_time, error_message, sync_date)
            VALUES ('{gate_batch_id}', 'task-002', 'gate_system', 'success', 40, 40, '{now_str}', '{end_str}', NULL, '{sync_date_str}')
        """))
        await session.execute(text(f"""
            INSERT INTO sync_batches (id, task_id, source, status, total_records, processed_records, start_time, end_time, error_message, sync_date)
            VALUES ('{payment_batch_id}', 'task-003', 'payment_system', 'success', 200, 200, '{now_str}', '{end_str}', NULL, '{sync_date_str}')
        """))

        for i in range(15):
            for source in ["ticket_platform", "gate_system", "payment_system"]:
                bid = f"batch-{source}-{i}"
                if source == "ticket_platform":
                    tid = "task-001"
                elif source == "gate_system":
                    tid = "task-002"
                else:
                    tid = "task-003"
                sync_date = (base_date + timedelta(days=i)).isoformat()
                total = random.randint(100, 500)
                processed = total if random.random() > 0.1 else random.randint(0, total)
                status = "success" if processed == total else "running" if random.random() > 0.5 else "failed"
                start = (base_date + timedelta(days=i, hours=8)).isoformat()
                if status != "running":
                    end = (base_date + timedelta(days=i, hours=8, minutes=random.randint(10, 30))).isoformat()
                else:
                    end = None
                error = "网络超时" if status == "failed" else None
                end_sql = "NULL" if end is None else f"'{end}'"
                error_sql = "NULL" if error is None else f"'{error}'"
                await session.execute(text(f"""
                    INSERT INTO sync_batches (id, task_id, source, status, total_records, processed_records, start_time, end_time, error_message, sync_date)
                    VALUES ('{bid}', '{tid}', '{source}', '{status}', {total}, {processed}, '{start}', {end_sql}, {error_sql}, '{sync_date}')
                """))

        names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "王十二"]
        ticket_type_map = {"tt-001": 1280, "tt-002": 680, "tt-003": 480, "tt-004": 280}
        for i in range(200):
            oid = f"order-{i:05d}"
            tt_id = random.choice(["tt-001", "tt-002", "tt-003", "tt-004"])
            name = random.choice(names)
            phone = f"138{random.randint(10000000, 99999999)}"
            amount = ticket_type_map[tt_id]
            statuses = ["paid", "paid", "paid", "used", "used", "refunded", "disputed"]
            status = random.choice(statuses)
            created = (base_date + timedelta(days=random.randint(0, 20), hours=random.randint(9, 20))).isoformat()
            paid = (base_date + timedelta(days=random.randint(0, 20), hours=random.randint(9, 20))).isoformat() if status != "pending" else None
            verified = (base_date + timedelta(days=random.randint(10, 25), hours=random.randint(18, 22))).isoformat() if status == "used" else None
            check_in = f"CI{i:06d}" if status in ["used", "disputed"] else None
            paid_sql = "NULL" if paid is None else f"'{paid}'"
            verified_sql = "NULL" if verified is None else f"'{verified}'"
            check_in_sql = "NULL" if check_in is None else f"'{check_in}'"
            await session.execute(text(f"""
                INSERT INTO orders (id, ticket_type_id, order_no, buyer_name, buyer_phone, amount, status, created_at, paid_at, verified_at, sync_batch_id, check_in_code)
                VALUES ('{oid}', '{tt_id}', '{oid.upper()}', '{name}', '{phone}', {amount}, '{status}', '{created}', {paid_sql}, {verified_sql}, '{ticket_batch_id}', {check_in_sql})
            """))

            if paid:
                pid = f"pay-{i:05d}"
                await session.execute(text(f"""
                    INSERT INTO payment_records (id, order_id, transaction_id, amount, pay_method, status, pay_time, sync_batch_id)
                    VALUES ('{pid}', '{oid}', 'TXN{i:08d}', {amount}, 'alipay', 'success', '{paid}', '{payment_batch_id}')
                """))

            if check_in and status == "used":
                cid = f"checkin-{i:05d}"
                scan_time = (base_date + timedelta(days=random.randint(10, 25), hours=random.randint(18, 22))).isoformat()
                await session.execute(text(f"""
                    INSERT INTO check_in_records (id, order_id, check_in_code, scanner, location, status, scan_time)
                    VALUES ('{cid}', '{oid}', '{check_in}', '扫码员{random.randint(1, 5)}', '入口{random.choice(["A", "B", "C"])}', 'success', '{scan_time}')
                """))

                if random.random() > 0.8:
                    gid = f"gate-{i:05d}"
                    await session.execute(text(f"""
                        INSERT INTO gate_records (id, order_id, gate_code, device_id, direction, pass_time, sync_batch_id)
                        VALUES ('{gid}', '{oid}', 'GATE-{random.choice(["01", "02", "03"])}', 'DEV{random.randint(100, 999)}', 'in', '{scan_time}', '{gate_batch_id}')
                    """))

            if status == "disputed":
                did = f"dispute-{i:03d}"
                reasons = ["未入场要求退票", "签到码异常", "重复购票", "活动取消", "时间冲突"]
                dispute_status = random.choice(["pending", "processing", "resolved", "rejected"])
                await session.execute(text(f"""
                    INSERT INTO refund_disputes (id, order_id, reason, status)
                    VALUES ('{did}', '{oid}', '{random.choice(reasons)}', '{dispute_status}')
                """))

        await session.commit()
