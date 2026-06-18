import compat  # noqa: F401
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, async_session
from routers import dashboard, vehicles, diffs, turnover

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialized")

    # Auto-seed if empty database (first run)
    try:
        async with async_session() as session:
            from models import Vehicle
            from sqlalchemy import select, func
            count = (await session.execute(select(func.count(Vehicle.vehicle_id)))).scalar() or 0
            if count == 0:
                logger.info("Empty database detected, running seed...")
                from seed import seed
                await seed()
                logger.info("Seed completed")
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")

    logger.info("Dashboard API started on http://localhost:8000")
    logger.info("API docs available at http://localhost:8000/docs")
    yield


app = FastAPI(title="二手车过户材料趋势看板 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(diffs.router, prefix="/api")
app.include_router(turnover.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "database": "ready"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
