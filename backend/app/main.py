from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import data_upload, analytics, warning, conflict

app = FastAPI(
    title="口腔诊所影像归档趋势看板",
    description="影像归档趋势复盘、预警阈值管理、爽约复盘材料、口径冲突差异表",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_upload.router)
app.include_router(analytics.router)
app.include_router(warning.router)
app.include_router(conflict.router)


@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
