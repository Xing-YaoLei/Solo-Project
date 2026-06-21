import os
import duckdb
from datetime import date, datetime, timedelta
import random
from decimal import Decimal


def get_duckdb_path():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(project_root, "data", "settlement.duckdb")


def init_duckdb():
    db_path = get_duckdb_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = duckdb.connect(db_path)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS merchants (
            id INTEGER PRIMARY KEY,
            merchant_code VARCHAR(50) UNIQUE,
            merchant_name VARCHAR(200),
            contact_person VARCHAR(100),
            phone VARCHAR(20),
            settlement_cycle INTEGER DEFAULT 7,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY,
            settlement_no VARCHAR(50) UNIQUE,
            merchant_id INTEGER,
            settlement_date DATE,
            total_amount DECIMAL(15,2),
            order_count INTEGER DEFAULT 0,
            refund_amount DECIMAL(15,2) DEFAULT 0,
            service_fee DECIMAL(15,2) DEFAULT 0,
            actual_settlement DECIMAL(15,2),
            status VARCHAR(20) DEFAULT 'pending',
            payment_status VARCHAR(20) DEFAULT 'unpaid',
            has_anomaly BOOLEAN DEFAULT false,
            anomaly_type VARCHAR(50),
            anomaly_desc TEXT,
            review_note TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            order_no VARCHAR(50) UNIQUE,
            merchant_id INTEGER,
            settlement_id INTEGER,
            order_date TIMESTAMP,
            amount DECIMAL(15,2),
            status VARCHAR(20) DEFAULT 'completed',
            payment_method VARCHAR(20),
            has_delay BOOLEAN DEFAULT false,
            delay_hours INTEGER DEFAULT 0,
            created_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS customer_service_records (
            id INTEGER PRIMARY KEY,
            record_no VARCHAR(50) UNIQUE,
            order_id INTEGER,
            record_date TIMESTAMP,
            record_type VARCHAR(50),
            amount DECIMAL(15,2) DEFAULT 0,
            description TEXT,
            handler VARCHAR(100),
            is_missing BOOLEAN DEFAULT false,
            created_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS payment_flows (
            id INTEGER PRIMARY KEY,
            flow_no VARCHAR(50) UNIQUE,
            order_id INTEGER,
            flow_date TIMESTAMP,
            amount DECIMAL(15,2),
            flow_type VARCHAR(20),
            channel VARCHAR(50),
            caliber_version VARCHAR(20) DEFAULT 'v1',
            created_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS approval_nodes (
            id INTEGER PRIMARY KEY,
            node_no VARCHAR(50) UNIQUE,
            settlement_id INTEGER,
            node_name VARCHAR(100),
            node_order INTEGER,
            status VARCHAR(20) DEFAULT 'pending',
            approver VARCHAR(100),
            approval_time TIMESTAMP,
            approval_opinion TEXT,
            created_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS amount_checks (
            id INTEGER PRIMARY KEY,
            check_no VARCHAR(50) UNIQUE,
            settlement_id INTEGER,
            check_date DATE,
            order_amount DECIMAL(15,2),
            refund_amount DECIMAL(15,2) DEFAULT 0,
            service_fee DECIMAL(15,2) DEFAULT 0,
            expected_settlement DECIMAL(15,2),
            actual_settlement DECIMAL(15,2),
            difference DECIMAL(15,2) DEFAULT 0,
            is_consistent BOOLEAN DEFAULT true,
            check_note TEXT,
            created_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS caliber_diffs (
            id INTEGER PRIMARY KEY,
            diff_no VARCHAR(50) UNIQUE,
            order_id INTEGER,
            cs_amount DECIMAL(15,2),
            payment_amount DECIMAL(15,2),
            difference DECIMAL(15,2),
            diff_type VARCHAR(50),
            is_resolved BOOLEAN DEFAULT false,
            resolution TEXT,
            created_at TIMESTAMP
        )
    """)

    result = conn.execute("SELECT COUNT(*) FROM merchants").fetchone()
    if result[0] == 0:
        _seed_data(conn)

    conn.close()
    return db_path


def _seed_data(conn):
    now = datetime.now()
    today = date.today()

    conn.execute("""
        INSERT INTO merchants (id, merchant_code, merchant_name, contact_person, phone, settlement_cycle, status, created_at, updated_at)
        VALUES (1, 'M001', '快跑腿便利超市', '王经理', '13800138001', 7, 'active', ?, ?),
               (2, 'M002', '美食速递餐饮', '李店长', '13800138002', 7, 'active', ?, ?),
               (3, 'M003', '鲜果优选水果店', '张老板', '13800138003', 14, 'active', ?, ?)
    """, [now, now, now, now, now, now])

    settlement_id = 1
    order_id = 1
    cs_id = 1
    flow_id = 1
    approval_id = 1
    check_id = 1
    diff_id = 1

    base_amount = 50000
    anomaly_days = {7: "order_delay", 14: "cs_missing", 21: "caliber_change"}

    for day_offset in range(29, -1, -1):
        d = today - timedelta(days=day_offset)
        day_idx = 29 - day_offset

        variation = random.uniform(-0.15, 0.15)
        amount = base_amount * (1 + variation)

        has_anomaly = day_idx in anomaly_days
        anomaly_type = anomaly_days.get(day_idx)
        if has_anomaly:
            amount = amount * 0.7

        anomaly_desc_map = {
            "order_delay": "订单系统延迟，部分订单未按时结算",
            "cs_missing": "客服记录缺失，退款金额核对异常",
            "caliber_change": "支付流水口径变化，结算金额调整",
        }
        anomaly_desc = anomaly_desc_map.get(anomaly_type)

        order_count = max(1, int(amount / 150))
        refund_amount = Decimal(str(round(random.uniform(500, 3000), 2)))
        service_fee = Decimal(str(round(amount * 0.02, 2)))
        actual = Decimal(str(round(amount - float(refund_amount) - float(service_fee), 2)))

        conn.execute("""
            INSERT INTO settlements (id, settlement_no, merchant_id, settlement_date, total_amount,
                order_count, refund_amount, service_fee, actual_settlement, status, payment_status,
                has_anomaly, anomaly_type, anomaly_desc, review_note, created_at, updated_at)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            settlement_id,
            f"SETT{d.strftime('%Y%m%d')}",
            d,
            Decimal(str(round(amount, 2))),
            order_count,
            refund_amount,
            service_fee,
            actual,
            random.choice(["pending", "approved", "paid"]),
            random.choice(["unpaid", "paid"]),
            has_anomaly,
            anomaly_type,
            anomaly_desc,
            None,
            now,
            now,
        ])

        daily_orders = min(order_count, 8)
        for oi in range(daily_orders):
            order_date = datetime.combine(d, datetime.min.time()) + timedelta(
                hours=random.randint(8, 22), minutes=random.randint(0, 59)
            )
            order_amount = Decimal(str(round(random.uniform(50, 500), 2)))
            has_delay = random.random() < 0.15
            delay_hours = random.randint(1, 48) if has_delay else 0

            conn.execute("""
                INSERT INTO orders (id, order_no, merchant_id, settlement_id, order_date,
                    amount, status, payment_method, has_delay, delay_hours, created_at)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                order_id,
                f"ORD{d.strftime('%Y%m%d')}{oi:04d}",
                settlement_id,
                order_date,
                order_amount,
                random.choice(["completed", "refunded", "pending"]),
                random.choice(["wechat", "alipay", "cash"]),
                has_delay,
                delay_hours,
                now,
            ])

            cs_count = random.randint(0, 1)
            for ci in range(cs_count):
                conn.execute("""
                    INSERT INTO customer_service_records (id, record_no, order_id, record_date,
                        record_type, amount, description, handler, is_missing, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    cs_id,
                    f"CS{order_id:06d}{ci}",
                    order_id,
                    order_date + timedelta(hours=random.randint(1, 24)),
                    random.choice(["refund", "complaint", "inquiry"]),
                    Decimal(str(round(random.uniform(10, 200), 2))),
                    "客户咨询/退款记录",
                    random.choice(["客服A", "客服B", "客服C"]),
                    False,
                    now,
                ])
                cs_id += 1

            flow_count = 1
            for fi in range(flow_count):
                conn.execute("""
                    INSERT INTO payment_flows (id, flow_no, order_id, flow_date, amount,
                        flow_type, channel, caliber_version, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    flow_id,
                    f"PF{order_id:06d}{fi}",
                    order_id,
                    order_date + timedelta(minutes=random.randint(1, 30)),
                    order_amount,
                    random.choice(["pay", "refund"]),
                    random.choice(["wechat", "alipay", "bank"]),
                    "v2" if day_idx >= 15 and day_idx <= 20 else "v1",
                    now,
                ])
                flow_id += 1

            order_id += 1

        if day_idx % 3 == 0:
            order_amt = Decimal(str(round(random.uniform(30000, 80000), 2)))
            refund = Decimal(str(round(random.uniform(500, 3000), 2)))
            svc_fee = (order_amt * Decimal("0.02")).quantize(Decimal("0.01"))
            expected = (order_amt - refund - svc_fee).quantize(Decimal("0.01"))
            is_consistent = random.random() > 0.3
            if is_consistent:
                actual_amt = expected
                diff = Decimal("0")
            else:
                diff = Decimal(str(round(random.uniform(-500, 500), 2)))
                actual_amt = (expected + diff).quantize(Decimal("0.01"))

            conn.execute("""
                INSERT INTO amount_checks (id, check_no, settlement_id, check_date,
                    order_amount, refund_amount, service_fee, expected_settlement,
                    actual_settlement, difference, is_consistent, check_note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                check_id,
                f"CHK{d.strftime('%Y%m%d')}",
                settlement_id,
                d,
                order_amt,
                refund,
                svc_fee,
                expected,
                actual_amt,
                abs(diff),
                is_consistent,
                None if is_consistent else "客服退款记录与支付流水存在差异，需进一步核对",
                now,
            ])
            check_id += 1

        settlement_id += 1

    approval_data = [
        (1, "财务初审", 1, "approved", "张三", now - timedelta(days=3), "单据齐全，金额核对无误"),
        (2, "业务复核", 2, "approved", "李四", now - timedelta(days=2), "订单量与业务数据一致"),
        (3, "财务终审", 3, "pending", None, None, None),
        (4, "总经理审批", 4, "pending", None, None, None),
    ]
    for node_no, node_name, node_order, status, approver, approval_time, opinion in approval_data:
        conn.execute("""
            INSERT INTO approval_nodes (id, node_no, settlement_id, node_name, node_order,
                status, approver, approval_time, approval_opinion, created_at)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        """, [
            approval_id,
            f"APR001-{node_no:02d}",
            node_name,
            node_order,
            status,
            approver,
            approval_time,
            opinion,
            now,
        ])
        approval_id += 1

    for di in range(87):
        cs_amt = Decimal(str(round(random.uniform(50, 500), 2)))
        pay_amt = (cs_amt * Decimal(str(round(random.uniform(0.8, 1.2), 2)))).quantize(Decimal("0.01"))
        diff = abs(cs_amt - pay_amt).quantize(Decimal("0.01"))
        conn.execute("""
            INSERT INTO caliber_diffs (id, diff_no, order_id, cs_amount, payment_amount,
                difference, diff_type, is_resolved, resolution, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            diff_id,
            f"DIFF{today.strftime('%Y%m%d')}{di:05d}",
            di + 1,
            cs_amt,
            pay_amt,
            diff,
            random.choice(["amount_mismatch", "record_missing", "caliber_mismatch"]),
            random.random() < 0.4,
            None if random.random() >= 0.4 else "已确认差异原因，按支付流水口径执行",
            now - timedelta(days=random.randint(0, 30)),
        ])
        diff_id += 1

    print(f"Seed data inserted: merchants=3, settlements={settlement_id-1}, "
          f"orders={order_id-1}, cs_records={cs_id-1}, payment_flows={flow_id-1}, "
          f"approvals={approval_id-1}, checks={check_id-1}, diffs={diff_id-1}")
