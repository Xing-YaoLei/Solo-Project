from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.database import init_duckdb, engine, Base
from api.routers import schedule, annotation, medication, visit, activity, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    init_duckdb()
    yield


app = FastAPI(
    title="养老院床位排班风险监控仪表盘",
    description="养老院床位排班风险监控系统后端 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180", "http://localhost:5181", "http://localhost:5182", "http://localhost:5183", "http://localhost:5184", "http://localhost:5185", "http://localhost:5186"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router, prefix="/api")
app.include_router(annotation.router, prefix="/api")
app.include_router(medication.router, prefix="/api")
app.include_router(visit.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/api/health", summary="健康检查")
async def health_check():
    return {"状态": "正常运行", "服务": "养老院床位排班风险监控系统"}
