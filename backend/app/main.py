from contextlib import asynccontextmanager
from sqlalchemy import select
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import pg_engine, pg_session_factory, get_duckdb_conn
from app.models import Base, Complaint, ComplaintStatus
from app.api.funnel import router as funnel_router
from app.api.anomaly import router as anomaly_router
from app.api.notes import router as notes_router
from app.api.export import router as export_router
from app.api.views import router as views_router
from app.services.funnel_service import calc_workday_hours
from datetime import datetime, timedelta
import random


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _seed_sample_data()
    _init_duckdb_sample()
    yield


async def _seed_sample_data():
    async with pg_session_factory() as session:
        result = await session.execute(select(Complaint.id).limit(1))
        if result.scalars().first():
            return

        statuses = list(ComplaintStatus)
        types = ["门锁故障", "卫生问题", "噪音投诉", "设施损坏", "服务态度", "收款问题", "口径不一致"]
        tags = ["硬件", "软件", "服务", "安全", "卫生", "管理"]
        names = ["张先生", "李女士", "王先生", "赵女士", "刘先生", "陈女士", "杨先生", "黄女士"]

        for i in range(30):
            created = datetime.utcnow() - timedelta(days=random.randint(1, 60), hours=random.randint(0, 23))
            status = random.choice(statuses)
            resolved_at = None
            closed_at = None
            if status in (ComplaintStatus.resolved, ComplaintStatus.closed):
                resolved_at = created + timedelta(hours=random.randint(2, 48))
            if status == ComplaintStatus.closed:
                closed_at = resolved_at + timedelta(hours=random.randint(1, 24)) if resolved_at else None

            complaint = Complaint(
                guest_name=random.choice(names),
                room_no=f"{random.randint(3,8)}0{random.randint(1,9)}",
                check_in_date=created - timedelta(days=random.randint(0, 3)),
                check_out_date=created + timedelta(days=random.randint(1, 5)),
                complaint_type=random.choice(types),
                complaint_content=f"第{i+1}条客诉内容描述",
                status=status,
                created_at=created,
                updated_at=created,
                resolved_at=resolved_at,
                closed_at=closed_at,
                assigned_to=random.choice(["前台A", "客房B", "经理C", "客服D"]) if status != ComplaintStatus.pending else None,
                revisit_result="满意" if status == ComplaintStatus.closed and random.random() > 0.3 else None,
                responsibility=random.choice(tags) if random.random() > 0.5 else None,
                problem_tag=random.choice(tags),
            )
            session.add(complaint)
        await session.commit()


def _init_duckdb_sample():
    conn = get_duckdb_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaint_closure_times (
            id INTEGER,
            work_hours DOUBLE
        )
    """)
    count = conn.execute("SELECT COUNT(*) FROM complaint_closure_times").fetchone()[0]
    if count == 0:
        rows = []
        for i in range(30):
            hours = random.choice([8, 12, 18, 24, 36, 48, 60, 72, 96, 120, 180, 200])
            rows.append((i + 1, hours))
        conn.executemany("INSERT INTO complaint_closure_times VALUES (?, ?)", rows)


app = FastAPI(title="旅游民宿客诉处理漏斗报表", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funnel_router)
app.include_router(anomaly_router)
app.include_router(notes_router)
app.include_router(export_router)
app.include_router(views_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
