from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.api import auth, basic, orders, alerts, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="生鲜冷链门店补货跟进台 API",
    description="用于整理门店补货流程，核对批次码、装车单、质检图片和到货差异，温控异常追踪",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(basic.router)
app.include_router(orders.router)
app.include_router(alerts.router)
app.include_router(stats.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
