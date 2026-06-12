from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import api_router
from app.services.threshold_service import ThresholdService
from app.models import *

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        ThresholdService.init_defaults(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
