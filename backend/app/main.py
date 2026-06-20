from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import address_dict, track_rules, subsidy_rules, orders, appeals, settlements, stats, riders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="跑腿即时下单跟进台 API",
    description="本地跑腿即时下单跟进台管理系统后端API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Errand Management API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(address_dict.router, prefix="/api/address-dict", tags=["地址字典"])
app.include_router(track_rules.router, prefix="/api/track-rules", tags=["骑手轨迹规则"])
app.include_router(subsidy_rules.router, prefix="/api/subsidy-rules", tags=["补贴规则阈值"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单管理"])
app.include_router(appeals.router, prefix="/api/appeals", tags=["申诉管理"])
app.include_router(settlements.router, prefix="/api/settlements", tags=["结算管理"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计分析"])
app.include_router(riders.router, prefix="/api/riders", tags=["骑手管理"])
