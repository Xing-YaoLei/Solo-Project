import os
import duckdb
from datetime import date, datetime, timedelta
import random
from decimal import Decimal
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.duckdb_init import get_duckdb_path

path = get_duckdb_path()
os.makedirs(os.path.dirname(path), exist_ok=True)

if os.path.exists(path):
    os.remove(path)

conn = duckdb.connect(path)
print(f"Connected to: {path}")

# 重新创建表
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
print("✅ Tables created")

now = datetime.now()
today = date.today()

# Insert merchant
try:
    conn.execute("""
        INSERT INTO merchants VALUES (1, 'M001', 'Test', 'Test', '123', 7, 'active', ?, ?)
    """, [now, now])
    print("✅ merchant inserted")
except Exception as e:
    print(f"❌ merchant failed: {e}")

# Insert settlement
try:
    d = today
    params = [
        1, f"SETTTEST001", d, Decimal("50000.00"), 100, Decimal("500.00"),
        Decimal("1000.00"), Decimal("48500.00"), "pending", "unpaid",
        False, None, None, None, now, now,
    ]
    print(f"  Number of params: {len(params)}")
    conn.execute("""
        INSERT INTO settlements (id, settlement_no, merchant_id, settlement_date, total_amount,
            order_count, refund_amount, service_fee, actual_settlement, status, payment_status,
            has_anomaly, anomaly_type, anomaly_desc, review_note, created_at, updated_at)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, params)
    print("✅ settlement inserted")
except Exception as e:
    print(f"❌ settlement failed: {e}")
    import traceback
    traceback.print_exc()

# Insert order
try:
    params = [
        1, "ORDTEST001", 1, datetime.now(), Decimal("100.00"),
        "completed", "wechat", False, 0, now,
    ]
    print(f"  Number of params: {len(params)}")
    conn.execute("""
        INSERT INTO orders (id, order_no, merchant_id, settlement_id, order_date,
            amount, status, payment_method, has_delay, delay_hours, created_at)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    """, params)
    print("✅ order inserted")
except Exception as e:
    print(f"❌ order failed: {e}")
    import traceback
    traceback.print_exc()

conn.commit()
conn.close()
print("Done")
