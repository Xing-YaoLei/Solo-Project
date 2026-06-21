from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.db.database import init_db
from app.db.duckdb_client import duckdb_client
from app.middleware.auth import AuthMiddleware
from app.middleware.permission import PermissionMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import auth, report, share, export, data_sync


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    await duckdb_client.connect()
    yield
    await duckdb_client.close()


app = FastAPI(
    title="Solo Management System API",
    description="案件管理系统后端API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(PermissionMiddleware)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(report.router, prefix="/api/reports", tags=["报表"])
app.include_router(share.router, prefix="/api/share", tags=["分享"])
app.include_router(export.router, prefix="/api/export", tags=["导出"])
app.include_router(data_sync.router, prefix="/api/data-sync", tags=["数据同步"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
