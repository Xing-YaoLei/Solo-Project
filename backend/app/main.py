from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api import auth, dashboard, import_data, caliber

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="职业教育题库练习趋势看板API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(import_data.router, prefix=settings.API_V1_PREFIX)
app.include_router(caliber.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
