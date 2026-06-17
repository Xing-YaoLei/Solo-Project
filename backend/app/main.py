from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import SessionLocal
from app.database.init_db import init_db
from app.api.main import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/")
def root():
    return {
        "message": "Property Management API",
        "version": "1.0.0",
        "docs": "/docs",
    }
