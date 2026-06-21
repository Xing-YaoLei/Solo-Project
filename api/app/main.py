from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import appeals, compensations, photos, reports, settlements, subsidy_rules, todo_pool, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="跑腿路线补贴跟进台",
    description="Local Errand Route Subsidy Tracking Platform API",
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

app.include_router(subsidy_rules.router)
app.include_router(appeals.router)
app.include_router(settlements.router)
app.include_router(compensations.router)
app.include_router(photos.router)
app.include_router(todo_pool.router)
app.include_router(reports.router)
app.include_router(users.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "subsidy-tracker"}
