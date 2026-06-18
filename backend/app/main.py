from contextlib import asynccontextmanager
from typing import Dict, Any
from datetime import datetime, date, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, get_db
from app.core.security import hash_password
from app.api.v1 import api_router
from app.models import (
    User,
    Supplier,
    MaterialBatch,
    InventoryRecord,
    UsageRule,
    InventoryThreshold,
    SafetyStockConfig,
    ShortageOrder,
    ShortageActionLog,
)


def create_tables():
    Base.metadata.create_all(bind=engine)


def seed_initial_data(db: Session):
    if db.query(User).count() == 0:
        admin = User(
            username="admin",
            email="admin@test.com",
            password_hash=hash_password("admin123"),
            full_name="系统管理员",
            role="admin",
            is_active=True,
        )
        worker1 = User(
            username="worker1",
            email="worker1@test.com",
            password_hash=hash_password("worker123"),
            full_name="张三",
            role="worker",
            is_active=True,
        )
        worker2 = User(
            username="worker2",
            email="worker2@test.com",
            password_hash=hash_password("worker123"),
            full_name="李四",
            role="worker",
            is_active=True,
        )
        db.add_all([admin, worker1, worker2])
        print("  ✓ 已创建初始用户：admin/admin123, worker1/worker123, worker2/worker123")

    db.flush()
    users = {u.username: u for u in db.query(User).all()}
    admin_user = users["admin"]
    worker1_user = users["worker1"]
    worker2_user = users["worker2"]

    if db.query(Supplier).count() == 0:
        suppliers = [
            Supplier(name="华东建材有限公司", contact_person="王经理", phone="13800138001",
                     email="wang@huadong.com", address="上海市浦东新区张江路100号",
                     credit_rating="A", on_time_rate=0.95, quality_score=92.0, status="active"),
            Supplier(name="华南陶瓷供应商", contact_person="李总", phone="13800138002",
                     email="li@huanan.com", address="广州市天河区珠江新城200号",
                     credit_rating="A", on_time_rate=0.93, quality_score=90.0, status="active"),
            Supplier(name="华北板材厂", contact_person="赵主任", phone="13800138003",
                     email="zhao@huabei.com", address="北京市朝阳区建国路88号",
                     credit_rating="B", on_time_rate=0.88, quality_score=85.0, status="active"),
            Supplier(name="西部涂料科技", contact_person="孙工", phone="13800138004",
                     email="sun@xibu.com", address="成都市高新区天府大道1000号",
                     credit_rating="B", on_time_rate=0.85, quality_score=82.0, status="active"),
            Supplier(name="绿色水电材料", contact_person="周经理", phone="13800138005",
                     email="zhou@green.com", address="深圳市南山区科技园500号",
                     credit_rating="A", on_time_rate=0.96, quality_score=94.0, status="active"),
        ]
        db.add_all(suppliers)
        print(f"  ✓ 已创建 {len(suppliers)} 个供应商")

    db.flush()
    suppliers_list = db.query(Supplier).all()
    sup_map = {s.name: s for s in suppliers_list}

    if db.query(MaterialBatch).count() == 0:
        today = date.today()
        batches = [
            MaterialBatch(batch_no="BATCH-2024-001", material_name="抛光瓷砖", category="瓷砖",
                          specification="800x800mm", unit="箱", quantity=500.0,
                          supplier_id=sup_map["华东建材有限公司"].id, supplier_name="华东建材有限公司",
                          region="华东", responsible_person="张三", status="in_stock",
                          in_date=today - timedelta(days=10), expected_turnover_days=30,
                          actual_turnover_days=None, remark="客厅地砖用"),
            MaterialBatch(batch_no="BATCH-2024-002", material_name="仿古瓷砖", category="瓷砖",
                          specification="600x600mm", unit="箱", quantity=300.0,
                          supplier_id=sup_map["华南陶瓷供应商"].id, supplier_name="华南陶瓷供应商",
                          region="华南", responsible_person="李四", status="in_stock",
                          in_date=today - timedelta(days=8), expected_turnover_days=30,
                          actual_turnover_days=25, remark="厨房卫生间用"),
            MaterialBatch(batch_no="BATCH-2024-003", material_name="实木地板", category="地板",
                          specification="120x910mm", unit="平方米", quantity=800.0,
                          supplier_id=sup_map["华东建材有限公司"].id, supplier_name="华东建材有限公司",
                          region="华东", responsible_person="张三", status="in_use",
                          in_date=today - timedelta(days=15), expected_turnover_days=45,
                          actual_turnover_days=None, remark="卧室地板"),
            MaterialBatch(batch_no="BATCH-2024-004", material_name="复合地板", category="地板",
                          specification="190x1200mm", unit="平方米", quantity=1200.0,
                          supplier_id=sup_map["华北板材厂"].id, supplier_name="华北板材厂",
                          region="华北", responsible_person="李四", status="in_stock",
                          in_date=today - timedelta(days=5), expected_turnover_days=40,
                          actual_turnover_days=None, remark="客厅用复合地板"),
            MaterialBatch(batch_no="BATCH-2024-005", material_name="PPR水管", category="水管",
                          specification="25mm", unit="米", quantity=5000.0,
                          supplier_id=sup_map["绿色水电材料"].id, supplier_name="绿色水电材料",
                          region="华南", responsible_person="张三", status="shortage",
                          in_date=today - timedelta(days=20), expected_turnover_days=20,
                          actual_turnover_days=18, remark="冷热水管"),
            MaterialBatch(batch_no="BATCH-2024-006", material_name="PVC电线管", category="水管",
                          specification="20mm", unit="米", quantity=8000.0,
                          supplier_id=sup_map["绿色水电材料"].id, supplier_name="绿色水电材料",
                          region="华东", responsible_person="李四", status="in_stock",
                          in_date=today - timedelta(days=7), expected_turnover_days=25,
                          actual_turnover_days=None, remark="穿线用"),
            MaterialBatch(batch_no="BATCH-2024-007", material_name="BV电线", category="电线",
                          specification="2.5mm²", unit="卷", quantity=200.0,
                          supplier_id=sup_map["绿色水电材料"].id, supplier_name="绿色水电材料",
                          region="华北", responsible_person="张三", status="in_use",
                          in_date=today - timedelta(days=12), expected_turnover_days=30,
                          actual_turnover_days=None, remark="插座照明线"),
            MaterialBatch(batch_no="BATCH-2024-008", material_name="BV电线", category="电线",
                          specification="4mm²", unit="卷", quantity=150.0,
                          supplier_id=sup_map["绿色水电材料"].id, supplier_name="绿色水电材料",
                          region="华东", responsible_person="李四", status="in_stock",
                          in_date=today - timedelta(days=3), expected_turnover_days=30,
                          actual_turnover_days=None, remark="空调大功率线"),
            MaterialBatch(batch_no="BATCH-2024-009", material_name="内墙乳胶漆", category="涂料",
                          specification="5L/桶", unit="桶", quantity=80.0,
                          supplier_id=sup_map["西部涂料科技"].id, supplier_name="西部涂料科技",
                          region="西南", responsible_person="张三", status="in_stock",
                          in_date=today - timedelta(days=6), expected_turnover_days=50,
                          actual_turnover_days=45, remark="墙面面漆"),
            MaterialBatch(batch_no="BATCH-2024-010", material_name="外墙乳胶漆", category="涂料",
                          specification="20L/桶", unit="桶", quantity=30.0,
                          supplier_id=sup_map["西部涂料科技"].id, supplier_name="西部涂料科技",
                          region="华南", responsible_person="李四", status="shortage",
                          in_date=today - timedelta(days=25), expected_turnover_days=60,
                          actual_turnover_days=None, remark="外墙用漆"),
            MaterialBatch(batch_no="BATCH-2024-011", material_name="耐水腻子", category="腻子",
                          specification="20kg/袋", unit="袋", quantity=500.0,
                          supplier_id=sup_map["华东建材有限公司"].id, supplier_name="华东建材有限公司",
                          region="华东", responsible_person="张三", status="in_stock",
                          in_date=today - timedelta(days=4), expected_turnover_days=35,
                          actual_turnover_days=None, remark="墙面找平用"),
            MaterialBatch(batch_no="BATCH-2024-012", material_name="JS防水涂料", category="防水涂料",
                          specification="20kg/桶", unit="桶", quantity=60.0,
                          supplier_id=sup_map["西部涂料科技"].id, supplier_name="西部涂料科技",
                          region="华北", responsible_person="李四", status="pending",
                          in_date=None, expected_turnover_days=40,
                          actual_turnover_days=None, remark="卫生间厨房防水"),
            MaterialBatch(batch_no="BATCH-2024-013", material_name="生态板", category="板材",
                          specification="18mm", unit="张", quantity=200.0,
                          supplier_id=sup_map["华北板材厂"].id, supplier_name="华北板材厂",
                          region="华北", responsible_person="张三", status="in_stock",
                          in_date=today - timedelta(days=9), expected_turnover_days=50,
                          actual_turnover_days=None, remark="定制家具用"),
            MaterialBatch(batch_no="BATCH-2024-014", material_name="多层实木板", category="板材",
                          specification="15mm", unit="张", quantity=150.0,
                          supplier_id=sup_map["华北板材厂"].id, supplier_name="华北板材厂",
                          region="华东", responsible_person="李四", status="completed",
                          in_date=today - timedelta(days=60), expected_turnover_days=45,
                          actual_turnover_days=55, remark="柜体用板，已用完"),
            MaterialBatch(batch_no="BATCH-2024-015", material_name="石膏板", category="板材",
                          specification="9.5mm", unit="张", quantity=300.0,
                          supplier_id=sup_map["华东建材有限公司"].id, supplier_name="华东建材有限公司",
                          region="华南", responsible_person="张三", status="in_use",
                          in_date=today - timedelta(days=11), expected_turnover_days=30,
                          actual_turnover_days=None, remark="吊顶隔墙用"),
        ]
        db.add_all(batches)
        print(f"  ✓ 已创建 {len(batches)} 个材料批次")

    db.flush()
    batches_map = {b.batch_no: b for b in db.query(MaterialBatch).all()}

    if db.query(InventoryRecord).count() == 0:
        records = [
            InventoryRecord(batch_id=batches_map["BATCH-2024-001"].id, type="in", quantity=500.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华东",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-002"].id, type="in", quantity=300.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华南",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-003"].id, type="in", quantity=800.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华东",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-003"].id, type="out", quantity=300.0,
                            operator_id=worker1_user.id, operator="张三", region="华东",
                            remark="3号楼201室领用"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-005"].id, type="in", quantity=5000.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华南",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-005"].id, type="out", quantity=4800.0,
                            operator_id=worker2_user.id, operator="李四", region="华南",
                            remark="多项目领用"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-007"].id, type="in", quantity=200.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华北",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-010"].id, type="in", quantity=30.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华南",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-010"].id, type="out", quantity=30.0,
                            operator_id=worker1_user.id, operator="张三", region="华南",
                            remark="1号楼外墙施工"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-014"].id, type="in", quantity=150.0,
                            operator_id=admin_user.id, operator="系统管理员", region="华东",
                            remark="初始入库"),
            InventoryRecord(batch_id=batches_map["BATCH-2024-014"].id, type="out", quantity=150.0,
                            operator_id=worker2_user.id, operator="李四", region="华东",
                            remark="全部用完"),
        ]
        db.add_all(records)
        print(f"  ✓ 已创建 {len(records)} 条库存记录")

    if db.query(SafetyStockConfig).count() == 0:
        safety_configs = [
            SafetyStockConfig(material_name="抛光瓷砖", category="瓷砖", unit="箱", region="华东",
                              min_stock=100.0, warning_stock=200.0, max_stock=800.0,
                              current_stock=500.0, daily_consumption_rate=20.0),
            SafetyStockConfig(material_name="PPR水管", category="水管", unit="米", region="华南",
                              min_stock=500.0, warning_stock=1000.0, max_stock=6000.0,
                              current_stock=200.0, daily_consumption_rate=100.0),
            SafetyStockConfig(material_name="BV电线", category="电线", unit="卷", region="华东",
                              min_stock=30.0, warning_stock=60.0, max_stock=300.0,
                              current_stock=150.0, daily_consumption_rate=5.0),
            SafetyStockConfig(material_name="内墙乳胶漆", category="涂料", unit="桶", region="西南",
                              min_stock=20.0, warning_stock=40.0, max_stock=150.0,
                              current_stock=80.0, daily_consumption_rate=2.0),
            SafetyStockConfig(material_name="耐水腻子", category="腻子", unit="袋", region="华东",
                              min_stock=100.0, warning_stock=200.0, max_stock=800.0,
                              current_stock=500.0, daily_consumption_rate=25.0),
            SafetyStockConfig(material_name="生态板", category="板材", unit="张", region="华北",
                              min_stock=30.0, warning_stock=60.0, max_stock=300.0,
                              current_stock=200.0, daily_consumption_rate=8.0),
        ]
        db.add_all(safety_configs)
        print(f"  ✓ 已创建 {len(safety_configs)} 条安全库存配置")

    if db.query(ShortageOrder).count() == 0:
        shortage_b1 = batches_map["BATCH-2024-005"]
        shortage_b2 = batches_map["BATCH-2024-010"]
        shortage_b3 = batches_map["BATCH-2024-007"]
        shortage_b4 = batches_map["BATCH-2024-015"]

        orders = [
            ShortageOrder(batch_id=shortage_b1.id, material_name=shortage_b1.material_name,
                          shortage_quantity=800.0, unit=shortage_b1.unit,
                          responsible_person="张三", priority="high", status="pending",
                          deadline=today + timedelta(days=3)),
            ShortageOrder(batch_id=shortage_b2.id, material_name=shortage_b2.material_name,
                          shortage_quantity=20.0, unit=shortage_b2.unit,
                          responsible_person="李四", priority="medium", status="processing",
                          deadline=today + timedelta(days=5)),
            ShortageOrder(batch_id=shortage_b3.id, material_name=shortage_b3.material_name,
                          shortage_quantity=50.0, unit=shortage_b3.unit,
                          responsible_person="张三", priority="high", status="pending",
                          deadline=today + timedelta(days=2)),
            ShortageOrder(batch_id=shortage_b4.id, material_name=shortage_b4.material_name,
                          shortage_quantity=100.0, unit=shortage_b4.unit,
                          responsible_person="李四", priority="low", status="supplemented",
                          deadline=today + timedelta(days=7)),
        ]
        db.add_all(orders)
        db.flush()
        print(f"  ✓ 已创建 {len(orders)} 个短缺工单")

        o1, o2, o3, o4 = orders

        logs = [
            ShortageActionLog(shortage_order_id=o1.id, action="create",
                              operator_id=admin_user.id, operator="系统管理员",
                              remark="PPR水管短缺，需紧急补货", supplement_quantity=None),
            ShortageActionLog(shortage_order_id=o2.id, action="create",
                              operator_id=worker1_user.id, operator="张三",
                              remark="外墙漆不足，影响进度", supplement_quantity=None),
            ShortageActionLog(shortage_order_id=o2.id, action="assign",
                              operator_id=admin_user.id, operator="系统管理员",
                              remark="已通知李四跟进", supplement_quantity=None),
            ShortageActionLog(shortage_order_id=o3.id, action="create",
                              operator_id=worker2_user.id, operator="李四",
                              remark="4mm²电线项目短缺", supplement_quantity=None),
            ShortageActionLog(shortage_order_id=o4.id, action="create",
                              operator_id=worker1_user.id, operator="张三",
                              remark="石膏板库存预警", supplement_quantity=None),
            ShortageActionLog(shortage_order_id=o4.id, action="supplement",
                              operator_id=worker2_user.id, operator="李四",
                              remark="已补充100张石膏板", supplement_quantity=100.0),
        ]
        db.add_all(logs)
        print(f"  ✓ 已创建 {len(logs)} 条短缺操作日志")

    if db.query(UsageRule).count() == 0:
        rules = [
            UsageRule(material_category="瓷砖", max_daily_usage=50.0, requires_approval=True,
                      approval_level=1, description="瓷砖每日用量超过50箱需项目经理审批"),
            UsageRule(material_category="板材", max_daily_usage=30.0, requires_approval=True,
                      approval_level=2, description="板材每日用量超过30张需二级审批"),
            UsageRule(material_category="涂料", max_daily_usage=20.0, requires_approval=False,
                      approval_level=0, description="涂料常规用量免审"),
            UsageRule(material_category="水管", max_daily_usage=500.0, requires_approval=True,
                      approval_level=1, description="水管用量超500米需审批"),
        ]
        db.add_all(rules)
        print(f"  ✓ 已创建 {len(rules)} 条使用规则")

    if db.query(InventoryThreshold).count() == 0:
        thresholds = [
            InventoryThreshold(material_category="瓷砖", allowed_error_rate=0.03,
                               overstock_warning_threshold=1.8,
                               description="瓷砖类盘点误差率不超过3%"),
            InventoryThreshold(material_category="板材", allowed_error_rate=0.02,
                               overstock_warning_threshold=2.0,
                               description="板材类盘点误差率不超过2%"),
            InventoryThreshold(material_category="涂料", allowed_error_rate=0.05,
                               overstock_warning_threshold=1.5,
                               description="涂料类盘点误差率不超过5%"),
            InventoryThreshold(material_category="电线", allowed_error_rate=0.02,
                               overstock_warning_threshold=1.5,
                               description="电线盘点需高精度，误差率不超2%"),
        ]
        db.add_all(thresholds)
        print(f"  ✓ 已创建 {len(thresholds)} 条库存阈值配置")

    db.commit()


def test_database_connection() -> bool:
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
    finally:
        try:
            db.close()
        except:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("🚀 启动应用，正在初始化数据库...")
    print("=" * 60)
    create_tables()
    print("✓ 数据库表创建完成")

    db = SessionLocal()
    try:
        print("\n📦 正在填充初始数据...")
        seed_initial_data(db)
    except Exception as e:
        print(f"⚠️  初始化数据时出错: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

    db_ok = test_database_connection()
    if db_ok:
        print("\n✅ 数据库连接成功")
    else:
        print("\n⚠️  警告：数据库连接失败")

    print("=" * 60)
    print("🎯 服务已就绪，访问 http://localhost:8000/docs 查看API文档")
    print("👤 默认账户: admin / admin123")
    print("=" * 60)
    yield
    print("\n👋 应用关闭")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="家装工地材料进场跟进台后端API - FastAPI + SQLite + SQLAlchemy 2",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health", response_model=Dict[str, Any])
async def health_check():
    db_status = test_database_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected" if db_status else "disconnected",
        "debug": settings.DEBUG,
    }


@app.get("/api/health", response_model=Dict[str, Any])
async def api_health_check():
    return await health_check()
