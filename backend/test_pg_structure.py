import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["DATABASE_URL"] = "sqlite:///./test_pg_doublewrite.db"

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.repositories.pg_repository import (
    _init_pg, is_pg_enabled, create_tables_if_not_exists,
    get_pg_session
)
from datetime import datetime, timedelta
import uuid

print("=== 测试 PG 双写结构（使用 SQLite 模拟） ===")

print(f"\n1. is_pg_enabled: {is_pg_enabled()}")
assert is_pg_enabled(), "应启用 PG 模式"

print("\n2. 初始化并建表...")
_init_pg()
create_tables_if_not_exists()

from app.repositories.pg_repository import (
    Registration, Payment, GateRecord, SyncTask, SyncLog
)

engine = create_engine(os.environ["DATABASE_URL"])
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"   已建表: {tables}")
required = ["registrations", "payments", "gate_records", "sync_tasks", "sync_logs"]
for t in required:
    assert t in tables, f"缺少表: {t}"
print("   ✅ 所有必需表存在")

print("\n3. 测试 gate_records 无外键约束 (可独立写入)...")
with get_pg_session() as session:
    assert session is not None
    gr = GateRecord(
        id=str(uuid.uuid4()),
        ticket_id="non-existent-ticket-123",
        gate_no="G01",
        checkin_code="CK999999",
        pass_time=datetime.now(),
        status="通过"
    )
    session.add(gr)
    session.commit()
    count = session.query(GateRecord).count()
    print(f"   gate_records 写入成功，行数: {count}")
print("   ✅ GateRecord 可独立写入（无外键约束）")

print("\n4. 测试 sync_tasks 和 sync_logs 写入...")
with get_pg_session() as session:
    task = SyncTask(
        task_code="TEST_SYNC",
        task_name="测试同步",
        source_type="UNIT_TEST",
        last_sync_time=datetime.now(),
        last_sync_count=100,
        status="正常"
    )
    session.merge(task)
    
    log1 = SyncLog(
        id=str(uuid.uuid4()),
        task_code="TEST_SYNC",
        level="INFO",
        message="测试同步开始",
        detail="详情信息",
        created_at=datetime.now()
    )
    log2 = SyncLog(
        id=str(uuid.uuid4()),
        task_code="TEST_SYNC",
        level="INFO",
        message="测试同步完成",
        detail="100 条记录",
        created_at=datetime.now()
    )
    session.add_all([log1, log2])
    session.commit()
    
    task_count = session.query(SyncTask).count()
    log_count = session.query(SyncLog).count()
    print(f"   sync_tasks: {task_count} 行, sync_logs: {log_count} 行")

print("   ✅ sync_tasks 和 sync_logs 写入成功")

print("\n5. 测试 registration 和 payment 写入...")
with get_pg_session() as session:
    rid = str(uuid.uuid4())
    reg = Registration(
        id=rid,
        name="测试用户",
        phone="13800138000",
        ticket_type="VIP",
        amount=999.00,
        area_code="A1",
        status="已核销",
        created_at=datetime.now()
    )
    pay = Payment(
        id=str(uuid.uuid4()),
        registration_id=rid,
        order_no="PAY20260620001",
        amount=999.00,
        channel="微信",
        status="已支付",
        paid_at=datetime.now()
    )
    session.add_all([reg, pay])
    session.commit()
    
    reg_count = session.query(Registration).count()
    pay_count = session.query(Payment).count()
    print(f"   registrations: {reg_count} 行, payments: {pay_count} 行")

print("   ✅ registrations 和 payments 写入成功")

print("\n✅ 全部 PostgreSQL 双写结构测试通过！")

# 清理测试 DB
test_db = os.path.join(os.path.dirname(__file__), "test_pg_doublewrite.db")
if os.path.exists(test_db):
    os.remove(test_db)
    print(f"\n已清理测试数据库")
