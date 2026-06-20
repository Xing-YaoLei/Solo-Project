from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .api import auth, analytics, data_ingestion, export, share

logger = logging.getLogger(__name__)

db_available = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_available
    try:
        from .db.session import get_engine
        from .models.models import Base as ModelBase
        engine = get_engine()
        ModelBase.metadata.create_all(bind=engine)
        db_available = True
        logger.info("数据库连接与表初始化成功")
    except Exception as e:
        db_available = False
        logger.warning(f"数据库初始化失败，服务仍将启动但数据接口不可用: {e}")
    yield
    if db_available:
        try:
            from .db.session import get_engine
            get_engine().dispose()
        except Exception:
            pass


app = FastAPI(
    title="景区运营演出排期风险监测系统",
    description="用于拆解景区运营的演出排期数据，接入小程序订单、商户流水与摄像头统计，提供座位趋势、签到码构成、赞助明细与核销异常监测。",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(data_ingestion.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(share.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "景区运营演出排期风险监测系统",
        "version": "1.0.0",
        "docs": "/docs",
        "database": "connected" if db_available else "disconnected",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "scenic-performance-monitor",
        "database": "available" if db_available else "unavailable",
    }
