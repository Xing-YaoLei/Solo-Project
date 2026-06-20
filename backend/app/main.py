from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, analytics, data_ingestion, export, share
from .db.session import engine, Base
from .models import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="景区运营演出排期风险监测系统",
    description="用于拆解景区运营的演出排期数据，接入小程序订单、商户流水与摄像头统计，提供座位趋势、签到码构成、赞助明细与核销异常监测。",
    version="1.0.0",
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
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "scenic-performance-monitor"}
