from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.work_orders import router as work_orders_router
from app.api.parts import router as parts_router
from app.api.quotes import router as quotes_router
from app.api.inspections import router as inspections_router
from app.api.shortages import router as shortages_router
from app.api.statistics import router as statistics_router
from app.database import Base, engine
from app.models import *  # noqa: F401,F403
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    os.makedirs("uploads", exist_ok=True)
    yield


app = FastAPI(title="汽车维修预约进厂跟进系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(work_orders_router, prefix="/api")
app.include_router(parts_router, prefix="/api")
app.include_router(quotes_router, prefix="/api")
app.include_router(inspections_router, prefix="/api")
app.include_router(shortages_router, prefix="/api")
app.include_router(statistics_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
