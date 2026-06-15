from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.api import auth, students, scores, reviews, advisors, notifications, reports, audit, classrooms
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_database()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(students.router, prefix="/api/students", tags=["学生管理"])
app.include_router(scores.router, prefix="/api/scores", tags=["成绩管理"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["成绩复核"])
app.include_router(advisors.router, prefix="/api/advisors", tags=["导师名额"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["通知中心"])
app.include_router(reports.router, prefix="/api/reports", tags=["报表中心"])
app.include_router(audit.router, prefix="/api/audit", tags=["审计日志"])
app.include_router(classrooms.router, prefix="/api/classrooms", tags=["教室管理"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
