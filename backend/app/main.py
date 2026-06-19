from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import (
    funnel,
    repair_orders,
    vehicles,
    stock_tasks,
    warnings,
    rework,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="汽车维修报价漏斗报表系统",
    description="用于复盘汽车维修报价问题的数据分析平台",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funnel.router, prefix="/api/funnel", tags=["报价漏斗"])
app.include_router(repair_orders.router, prefix="/api/repair-orders", tags=["维修工单"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["车辆档案"])
app.include_router(stock_tasks.router, prefix="/api/stock-tasks", tags=["缺货任务"])
app.include_router(warnings.router, prefix="/api/warnings", tags=["预警配置"])
app.include_router(rework.router, prefix="/api/rework", tags=["返修分析"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "系统运行正常"}
