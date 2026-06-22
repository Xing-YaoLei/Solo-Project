from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .models import models
from .api.auth import router as auth_router
from .api.orders import router as orders_router
from .api.analytics import router as analytics_router
from .api.dispatch import router as dispatch_router, router2 as users_router, router3 as upload_router
from .config import settings
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="合规审计整改跟踪系统",
    description="用于接住合规审计的整改跟踪流程",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(analytics_router)
app.include_router(dispatch_router)
app.include_router(users_router)
app.include_router(upload_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "合规审计整改跟踪系统运行正常"}
