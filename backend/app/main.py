from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import cleaning, devices, points, persons, statistics

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


app.include_router(cleaning.router, prefix="/api/cleaning", tags=["清洁单据"])
app.include_router(devices.router, prefix="/api/devices", tags=["设备管理"])
app.include_router(points.router, prefix="/api/points", tags=["点位管理"])
app.include_router(persons.router, prefix="/api/persons", tags=["人员管理"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["数据统计"])
