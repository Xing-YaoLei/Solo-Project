from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, stores, loss_reports, reviews, approvals, statistics, communications
from app.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="连锁咖啡报损复核跟进台",
    description="Coffee Chain Loss Review and Tracking System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(stores.router, prefix="/api/stores", tags=["门店管理"])
app.include_router(loss_reports.router, prefix="/api/loss-reports", tags=["报损单管理"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["复核管理"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["审批管理"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["统计分析"])
app.include_router(communications.router, prefix="/api/communications", tags=["沟通记录"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "loss_rate_threshold": settings.LOSS_RATE_THRESHOLD}


@app.get("/")
async def root():
    return {
        "message": "连锁咖啡报损复核跟进台 API",
        "docs": "/docs",
        "version": "1.0.0"
    }
