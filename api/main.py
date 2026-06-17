from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import init_db
from api.routers import settlement, drilldown, rejection, views


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="康复中心医保结算趋势看板 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180", "http://localhost:5181"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settlement.router)
app.include_router(drilldown.router)
app.include_router(rejection.router)
app.include_router(views.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
