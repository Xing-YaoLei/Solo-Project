from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .core.database import Base, engine
from .api import router as api_router
from .api.export import router as export_router


def init_database():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ 数据库表初始化完成")
    except Exception as e:
        print(f"⚠️  数据库表初始化跳过（连接失败或已存在）: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="旅游民宿套餐售卖跟进台",
    description="""
    旅游民宿套餐售卖跟进台 - 解决套餐售卖交接慢、记录散的问题

    核心能力：
    1. 套餐 & 价格规则 & 入住日期配置
    2. 套餐库存管理（含超卖检测）
    3. 订单全生命周期（创建→确认→入住→退房/取消）
    4. 核销记录管理
    5. 押金管理（支付/退款/扣款明细）
    6. 状态流转时间线（OrderStatusLog）
    7. 超卖异常单（影响范围、责任归属、处理过程、处理结果）
    8. 数据导出（含口径说明） & 套餐转化率分析
    9. Celery 异步超卖巡检 + 异步导出
    """,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["系统"])
def root():
    return {
        "service": "旅游民宿套餐售卖跟进台 API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["系统"])
def health_check():
    from .core.database import SessionLocal
    db_ok = False
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db_ok = True
    except Exception:
        db_ok = False
    finally:
        try:
            db.close()
        except Exception:
            pass
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z"
    }


app.include_router(api_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/exports")
