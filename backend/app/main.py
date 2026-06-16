from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, elders, medications, visits, activities, risks, incidents, audit, exports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="养老护理康复活动跟进系统 - 解决康复活动交接慢、记录散的问题",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(elders.router)
app.include_router(medications.router)
app.include_router(visits.router)
app.include_router(activities.router)
app.include_router(risks.router)
app.include_router(incidents.router)
app.include_router(audit.router)
app.include_router(exports.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
