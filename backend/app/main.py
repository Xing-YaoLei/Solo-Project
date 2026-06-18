from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.work_orders import router as work_orders_router
from app.api.parts import router as parts_router
from app.api.quotes import router as quotes_router
from app.api.inspections import router as inspections_router
from app.api.shortages import router as shortages_router
from app.api.statistics import router as statistics_router
from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401,F403 - ensure models are imported for metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.core.security import get_password_hash
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.models.enums import UserRole
    import uuid

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "manager"))
        existing = result.scalar_one_or_none()
        if not existing:
            manager = User(
                id=uuid.uuid4(),
                username="manager",
                hashed_password=get_password_hash("manager123"),
                display_name="系统厂长",
                role=UserRole.manager,
                is_active=True,
            )
            db.add(manager)
            for username, display, role in [
                ("consultant", "服务顾问", UserRole.consultant),
                ("technician", "维修技师", UserRole.technician),
                ("parts", "配件管理员", UserRole.parts_staff),
            ]:
                r = await db.execute(select(User).where(User.username == username))
                if not r.scalar_one_or_none():
                    db.add(User(
                        id=uuid.uuid4(),
                        username=username,
                        hashed_password=get_password_hash(f"{username}123"),
                        display_name=display,
                        role=role,
                        is_active=True,
                    ))
            await db.commit()
    yield


app = FastAPI(title="汽车维修预约进厂跟进系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(work_orders_router, prefix="/api")
app.include_router(parts_router, prefix="/api")
app.include_router(quotes_router, prefix="/api")
app.include_router(inspections_router, prefix="/api")
app.include_router(shortages_router, prefix="/api")
app.include_router(statistics_router, prefix="/api")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
