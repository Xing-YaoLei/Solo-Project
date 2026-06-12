from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import equipment, inventory, pos, faults, tasks, inspection, analytics
from app.core.database import init_db

app = FastAPI(title="连锁咖啡设备清洁风险监测系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"message": "连锁咖啡设备清洁风险监测系统 API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

app.include_router(equipment.router, prefix="/api/equipment", tags=["设备管理"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["库存管理"])
app.include_router(pos.router, prefix="/api/pos", tags=["POS流水"])
app.include_router(faults.router, prefix="/api/faults", tags=["故障记录"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["整改任务"])
app.include_router(inspection.router, prefix="/api/inspection", tags=["巡检管理"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["数据分析"])
