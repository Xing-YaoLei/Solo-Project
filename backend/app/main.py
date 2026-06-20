from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_duckdb
from .repositories import duckdb_repository
from .utils.logger import logger

from .api.kpi import router as kpi_router
from .api.pipeline import router as pipeline_router
from .api.seatmap import router as seatmap_router
from .api.sponsorship import router as sponsorship_router
from .api.verification import router as verification_router
from .api.ticket import router as ticket_router
from .api.refund import router as refund_router


def _init_data() -> None:
    logger.info("Initializing DuckDB and mock data...")
    with get_duckdb() as conn:
        duckdb_repository._ensure_mock_data(conn)
    logger.info("DuckDB initialization complete.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_data()
    yield
    logger.info("Shutting down application...")


app = FastAPI(
    title="MP0415 Solo Manage Pro API",
    description="赛事活动票务数据中台后端服务",
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

app.include_router(kpi_router)
app.include_router(pipeline_router)
app.include_router(seatmap_router)
app.include_router(sponsorship_router)
app.include_router(verification_router)
app.include_router(ticket_router)
app.include_router(refund_router)


@app.get("/", tags=["健康检查"])
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "MP0415 Solo Manage Pro API",
        "version": "1.0.0",
    }


@app.get("/health", tags=["健康检查"])
async def health() -> dict:
    return {
        "status": "healthy",
        "service": "MP0415 Solo Manage Pro API",
        "version": "1.0.0",
    }
