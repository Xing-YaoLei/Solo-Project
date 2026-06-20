from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import (
    dashboard,
    ticket_types,
    orders,
    seat_map,
    verification,
    refund_dispute,
    data_sync,
    checkin_code,
)
from api.utils.database import init_db
from api.utils.mock_data import seed_mock_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_mock_data()
    yield


app = FastAPI(
    title="活动票务赞助权益趋势看板 API",
    description="用于观察活动票务里的赞助权益变化的数据分析平台后端",
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


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": f"Internal Server Error: {str(exc)}",
            "data": None,
        },
    )


app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ticket_types.router, prefix="/api/ticket-types", tags=["Ticket Types"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(seat_map.router, prefix="/api/seat-map", tags=["Seat Map"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])
app.include_router(refund_dispute.router, prefix="/api/refund-disputes", tags=["Refund Disputes"])
app.include_router(data_sync.router, prefix="/api/sync", tags=["Data Sync"])
app.include_router(checkin_code.router, prefix="/api/checkin-code", tags=["Check-in Code"])
