from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.database import Base, engine
from .api import auth, vehicles, stations, work_orders, parts, shortages, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="汽车维修工位排班跟进台",
    description="汽车维修管理系统 - 工位排班、车辆档案、诊断记录、工单管理、配件库存、报表分析",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(vehicles.router, prefix=api_prefix)
app.include_router(stations.router, prefix=api_prefix)
app.include_router(work_orders.router, prefix=api_prefix)
app.include_router(parts.router, prefix=api_prefix)
app.include_router(shortages.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)


@app.get("/")
def root():
    return {
        "name": "汽车维修工位排班跟进台 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
