from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.dashboard import router as dashboard_router
from app.api.activity import router as activity_router
from app.api.risk import router as risk_router
from app.api.resident import router as resident_router
from app.api.threshold import router as threshold_router
from app.api.review import router as review_router
from app.api.data_import import router as data_import_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.database import init_pg_tables
    init_pg_tables()
    yield


app = FastAPI(
    title="养老护理床位排班漏斗报表系统",
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

app.include_router(dashboard_router, prefix="/api")
app.include_router(activity_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(resident_router, prefix="/api")
app.include_router(threshold_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(data_import_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    from app.db.database import is_pg_available, get_pg_engine
    pg_available = is_pg_available()
    if pg_available:
        get_pg_engine()
    return {
        "code": 0,
        "message": "success",
        "data": {
            "status": "ok",
            "pgAvailable": pg_available,
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9090)
