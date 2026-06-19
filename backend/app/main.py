from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .api import time_slots, reservations, conflicts, misc
from .models import User, UserRole

Base.metadata.create_all(bind=engine)


def init_seed_data():
    db = SessionLocal()
    try:
        existing_count = db.query(User).count()
        if existing_count > 0:
            return

        seed_users = [
            User(
                username="zhangsan",
                full_name="张三",
                email="zhangsan@example.com",
                role=UserRole.ADMIN,
                hashed_password="hashed_admin_123",
                is_active=True,
            ),
            User(
                username="lisi",
                full_name="李四",
                email="lisi@example.com",
                role=UserRole.OPERATOR,
                hashed_password="hashed_operator_123",
                is_active=True,
            ),
            User(
                username="wangwu",
                full_name="王五",
                email="wangwu@example.com",
                role=UserRole.SUPERVISOR,
                hashed_password="hashed_supervisor_123",
                is_active=True,
            ),
        ]
        db.add_all(seed_users)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


init_seed_data()

app = FastAPI(title="景区门票预约跟进台 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(time_slots.router)
app.include_router(reservations.router)
app.include_router(conflicts.router)
app.include_router(misc.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "景区门票预约跟进台 API 运行正常"}
