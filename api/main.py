from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import Base, engine
from api.routers import auth, dashboard, exceptions, export, prescriptions


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="药房连锁处方审核系统",
    description="药房连锁处方审核系统后端 API",
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

api_prefix = "/api/v1"

app.include_router(auth.router, prefix=api_prefix)
app.include_router(prescriptions.router, prefix=api_prefix)
app.include_router(exceptions.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(export.router, prefix=api_prefix)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
