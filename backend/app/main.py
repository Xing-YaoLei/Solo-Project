from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    _HAS_SCHEDULER = True
except ImportError:
    _HAS_SCHEDULER = False
    AsyncIOScheduler = None  # type: ignore[assignment,misc]

from app.core.config import settings
from app.api.v1.routers import (
    auth,
    stores,
    vehicles,
    documents,
    alerts,
    rules,
    review,
    analytics,
    sync,
    etl,
)


logger = logging.getLogger(__name__)

scheduler: "AsyncIOScheduler | None" if _HAS_SCHEDULER else None  # type: ignore[valid-type]
scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global scheduler

    if not settings.MOCK_MODE:
        try:
            from app.db.session import (
                init_engine,
                init_session_factory,
                init_redis,
            )
            logger.info("Initializing database engine...")
            engine = init_engine()
            init_session_factory(engine)
            logger.info("Database engine initialized.")

            logger.info("Initializing Redis client...")
            init_redis()
            logger.info("Redis client initialized.")
        except Exception as exc:
            logger.warning("Failed to initialize DB/Redis (running in degraded mode): %s", exc)
    else:
        logger.info("MOCK_MODE enabled, skipping DB/Redis initialization.")

    logger.info("Starting APScheduler...")
    try:
        if not _HAS_SCHEDULER or AsyncIOScheduler is None:
            raise ImportError("apscheduler not installed")
        scheduler = AsyncIOScheduler(timezone=settings.SCHEDULER_TIMEZONE)  # type: ignore[misc]

        try:
            from app.utils.helpers import local_now
        except Exception:
            local_now = None
        from apscheduler.triggers.cron import CronTrigger  # type: ignore

        def _make_cron_trigger(cron_expr: str) -> "CronTrigger":
            parts = cron_expr.split()
            if len(parts) == 5:
                return CronTrigger(
                    minute=parts[0], hour=parts[1], day=parts[2],
                    month=parts[3], day_of_week=parts[4],
                )
            return CronTrigger.from_crontab(cron_expr)

        scheduler.add_job(
            id="alert_scan",
            func=lambda: logger.info("[scheduler] alert scan tick"),
            trigger=_make_cron_trigger(settings.ALERT_SCAN_CRON),
        )

        scheduler.add_job(
            id="data_sync",
            func=lambda: logger.info("[scheduler] data sync tick"),
            trigger=_make_cron_trigger(settings.SYNC_CRON),
        )

        scheduler.start()
        logger.info("APScheduler started with %d jobs.", len(scheduler.get_jobs()))
    except Exception as exc:
        logger.warning("Failed to start scheduler: %s", exc)
        scheduler = None

    yield

    logger.info("Shutting down APScheduler...")
    if scheduler is not None and scheduler.running:
        scheduler.shutdown(wait=False)
        scheduler = None
        logger.info("APScheduler stopped.")

    if not settings.MOCK_MODE:
        try:
            from app.db.session import shutdown_redis, shutdown_db
            logger.info("Shutting down Redis...")
            await shutdown_redis()
            logger.info("Redis closed.")

            logger.info("Shutting down database engine...")
            await shutdown_db()
            logger.info("Database engine disposed.")
        except Exception as exc:
            logger.warning("Error during shutdown: %s", exc)


app = FastAPI(
    title=settings.APP_NAME,
    description="二手车过户材料风险监测系统 API",
    version="1.0.0",
    debug=settings.APP_DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
)

_prefix = settings.API_PREFIX

app.include_router(auth.router, prefix=_prefix)
app.include_router(stores.router, prefix=_prefix)
app.include_router(vehicles.router, prefix=_prefix)
app.include_router(documents.router, prefix=_prefix)
app.include_router(alerts.router, prefix=_prefix)
app.include_router(rules.router, prefix=_prefix)
app.include_router(review.router, prefix=_prefix)
app.include_router(analytics.router, prefix=_prefix)
app.include_router(sync.router, prefix=_prefix)
app.include_router(etl.router, prefix=_prefix)


@app.get("/", tags=["健康检查"])
async def health_check() -> dict:
    try:
        from app.utils.helpers import local_now
        ts = local_now().isoformat()
    except Exception:
        from datetime import datetime
        ts = datetime.now().isoformat()

    return {
        "code": 0,
        "message": "ok",
        "data": {
            "name": settings.APP_NAME,
            "version": "1.0.0",
            "env": settings.APP_ENV,
            "mockMode": settings.MOCK_MODE,
            "timestamp": ts,
            "scheduler": "running" if (scheduler and scheduler.running) else "stopped",
        },
    }


@app.get("/health", tags=["健康检查"])
async def liveness_probe() -> dict:
    return {"status": "healthy"}


@app.get("/ready", tags=["健康检查"])
async def readiness_probe() -> dict:
    checks = {"db": False, "redis": False, "mockMode": settings.MOCK_MODE}

    if settings.MOCK_MODE:
        checks["db"] = True
        checks["redis"] = True
    else:
        try:
            from app.db.session import get_engine
            engine = get_engine()
            async with engine.connect() as conn:
                from sqlalchemy import text
                await conn.execute(text("SELECT 1"))
            checks["db"] = True
        except Exception:
            checks["db"] = False

        try:
            from app.db.session import get_redis
            redis = get_redis()
            await redis.ping()
            checks["redis"] = True
        except Exception:
            checks["redis"] = False

    ready = all([checks["db"], checks["redis"]])
    return {"status": "ready" if ready else "not-ready", "checks": checks}
