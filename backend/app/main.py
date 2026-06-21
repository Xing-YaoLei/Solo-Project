from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User
from app.services.security import get_password_hash
from app.api import api_router


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.username == "admin").first()
        if not admin_exists:
            admin = User(
                username="admin",
                email="admin@example.com",
                full_name="系统管理员",
                role="admin",
                hashed_password=get_password_hash("admin123"),
            )
            db.add(admin)

            manager = User(
                username="manager",
                email="manager@example.com",
                full_name="业务经理",
                role="manager",
                hashed_password=get_password_hash("manager123"),
            )
            db.add(manager)

            lawyer = User(
                username="lawyer",
                email="lawyer@example.com",
                full_name="张律师",
                role="lawyer",
                hashed_password=get_password_hash("lawyer123"),
            )
            db.add(lawyer)

            assistant = User(
                username="assistant",
                email="assistant@example.com",
                full_name="李助理",
                role="assistant",
                hashed_password=get_password_hash("assistant123"),
            )
            db.add(assistant)

            auditor = User(
                username="auditor",
                email="auditor@example.com",
                full_name="王审核",
                role="auditor",
                hashed_password=get_password_hash("auditor123"),
            )
            db.add(auditor)

            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        import logging
        logging.getLogger("app.main").warning(f"Database init skipped (unavailable): {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}
