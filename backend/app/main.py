from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.db.seed import seed_database
from app.api.complaints import router as complaints_router
from app.api.escalations import router as escalations_router
from app.api.sync import router as sync_router
from app.api.reports import router as reports_router


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="旅游民宿客诉处理风险监测系统API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_prefix": settings.API_V1_STR
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(escalations_router, prefix=settings.API_V1_STR)
app.include_router(sync_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
