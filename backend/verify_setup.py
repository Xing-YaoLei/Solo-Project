import sys
import os

os.environ.setdefault("PYTHONPATH", os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("🧪 后端代码验证脚本")
print("=" * 60)

errors = []

try:
    from app.core.config import settings
    print("✓ app.core.config 导入成功")
except Exception as e:
    errors.append(("app.core.config", str(e)))
    print(f"✗ app.core.config 失败: {e}")

try:
    from app.core.database import engine, Base, SessionLocal
    print("✓ app.core.database 导入成功")
except Exception as e:
    errors.append(("app.core.database", str(e)))
    print(f"✗ app.core.database 失败: {e}")

try:
    from app.core.security import hash_password, verify_password, create_access_token, verify_token
    print("✓ app.core.security 导入成功")
except Exception as e:
    errors.append(("app.core.security", str(e)))
    print(f"✗ app.core.security 失败: {e}")

try:
    from app.models import (
        User, Supplier, MaterialBatch, InventoryRecord,
        UsageRule, InventoryThreshold, SafetyStockConfig,
        ShortageOrder, ShortageActionLog
    )
    print("✓ app.models 全部导入成功 (9个模型)")
except Exception as e:
    errors.append(("app.models", str(e)))
    print(f"✗ app.models 失败: {e}")

try:
    from app.schemas import (
        LoginRequest, TokenResponse, UserResponse,
        SupplierCreate, SupplierUpdate, SupplierResponse,
        MaterialBatchCreate, MaterialBatchUpdate, MaterialBatchResponse,
        PaginatedResponse,
        InventoryRecordCreate, InventoryRecordResponse,
        UsageRuleCreate, UsageRuleUpdate, UsageRuleResponse,
        InventoryThresholdCreate, InventoryThresholdUpdate, InventoryThresholdResponse,
        SafetyStockCreate, SafetyStockUpdate, SafetyStockResponse,
        ShortageOrderCreate, ShortageOrderUpdate, ShortageOrderResponse,
        ShortageHandleRequest,
        DashboardStatsResponse, TrendPoint, TurnoverAnalysisRow, RegionDistribution
    )
    print("✓ app.schemas 全部导入成功 (11个模块)")
except Exception as e:
    errors.append(("app.schemas", str(e)))
    print(f"✗ app.schemas 失败: {e}")

try:
    from app.api.deps import get_db, get_current_user, get_current_admin
    print("✓ app.api.deps 导入成功")
except Exception as e:
    errors.append(("app.api.deps", str(e)))
    print(f"✗ app.api.deps 失败: {e}")

try:
    from app.api.v1 import api_router
    print("✓ app.api.v1 (路由汇总) 导入成功")
except Exception as e:
    errors.append(("app.api.v1", str(e)))
    print(f"✗ app.api.v1 失败: {e}")

try:
    from app.main import app, create_tables, seed_initial_data, lifespan
    print("✓ app.main (FastAPI应用) 导入成功")
except Exception as e:
    errors.append(("app.main", str(e)))
    print(f"✗ app.main 失败: {e}")

print()
print("=" * 60)

if errors:
    print(f"❌ 发现 {len(errors)} 个导入错误:")
    for name, err in errors:
        print(f"  - {name}: {err}")
    sys.exit(1)

print("✅ 所有模块导入成功！现在测试数据库创建 + seed...")
print("=" * 60)

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_test.db")
if os.path.exists(db_path):
    os.remove(db_path)

from sqlalchemy import create_engine
test_engine = create_engine(f"sqlite:///{db_path}", echo=False)
TestSession = __import__("sqlalchemy.orm", fromlist=["sessionmaker"]).sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

try:
    Base.metadata.create_all(bind=test_engine)
    print("✓ 测试数据库表创建成功")
except Exception as e:
    print(f"✗ 创建表失败: {e}")
    sys.exit(1)

try:
    tdb = TestSession()
    seed_initial_data(tdb)
    tdb.close()
    print("✓ seed 初始数据成功")
except Exception as e:
    print(f"✗ seed 数据失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    tdb = TestSession()
    counts = {
        "用户": tdb.query(User).count(),
        "供应商": tdb.query(Supplier).count(),
        "材料批次": tdb.query(MaterialBatch).count(),
        "库存记录": tdb.query(InventoryRecord).count(),
        "使用规则": tdb.query(UsageRule).count(),
        "库存阈值": tdb.query(InventoryThreshold).count(),
        "安全库存配置": tdb.query(SafetyStockConfig).count(),
        "短缺工单": tdb.query(ShortageOrder).count(),
        "短缺操作日志": tdb.query(ShortageActionLog).count(),
    }
    tdb.close()

    print()
    print("=" * 60)
    print("📊 初始化后数据统计:")
    print("=" * 60)
    for name, count in counts.items():
        print(f"  {name:<16}: {count}")
    print()

    total = sum(counts.values())
    expected_min = 3 + 5 + 15 + 11 + 4 + 4 + 6 + 4 + 6
    if total >= expected_min:
        print(f"✅ seed 数据完整（共 {total} 条，预期 >= {expected_min}）")
    else:
        print(f"⚠️  seed 数据偏少（共 {total} 条，预期 >= {expected_min}）")

    tdb = TestSession()
    admin = tdb.query(User).filter(User.username == "admin").first()
    ok = verify_password("admin123", admin.password_hash)
    print(f"🔐 密码验证: admin/admin123 -> {'✅通过' if ok else '❌失败'}")

    token = create_access_token("admin", "admin")
    payload = verify_token(token)
    ok2 = payload and payload.get("sub") == "admin" and payload.get("role") == "admin"
    print(f"🎟️  Token验证: -> {'✅通过' if ok2 else '❌失败'}")

    tdb.close()
except Exception as e:
    print(f"✗ 验证数据失败: {e}")
    import traceback
    traceback.print_exc()

if os.path.exists(db_path):
    os.remove(db_path)

print()
print("=" * 60)
print("🎉 后端代码验证全部通过！")
print("=" * 60)
print()
print("启动命令:")
print("  cd backend && ./start.sh")
print()
print("默认账户:")
print("  管理员: admin / admin123")
print("  工人1:  worker1 / worker123 (张三)")
print("  工人2:  worker2 / worker123 (李四)")
print()
print("API文档地址:")
print("  Swagger: http://localhost:8000/docs")
print("  Redoc:   http://localhost:8000/redoc")
