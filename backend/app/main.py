from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.api.v1 import api_router
from app.models import *


def create_tables():
    Base.metadata.create_all(bind=engine)


def test_database_connection() -> bool:
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    db_ok = test_database_connection()
    if db_ok:
        print("Database connection successful")
    else:
        print("Warning: Database connection failed")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="家装工地材料进场跟进台后端API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health", response_model=Dict[str, Any])
async def health_check():
    db_status = test_database_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected" if db_status else "disconnected",
        "debug": settings.DEBUG,
    }


@app.get("/api/health", response_model=Dict[str, Any])
async def api_health_check():
    return await health_check()
