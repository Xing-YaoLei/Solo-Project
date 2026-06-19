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

SEED_VALUE = 42


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

        rng = random.Random(SEED_VALUE)

        statuses = list(ComplaintStatus)
        types = ["门锁故障", "卫生问题", "噪音投诉", "设施损坏", "服务态度", "收款问题", "口径不一致"]
        tags = ["硬件", "软件", "服务", "安全", "卫生", "管理"]
        names = ["张先生", "李女士", "王先生", "赵女士", "刘先生", "陈女士", "杨先生", "黄女士"]

        base_time = datetime(2025, 6, 1, 10, 0, 0)
        complaints: list[Complaint] = []

        fixed_samples = [
            {
                "complaint_type": "门锁故障",
                "status": ComplaintStatus.processing,
                "revisit_result": None,
                "assigned_to": "前台A",
            },
            {
                "complaint_type": "门锁故障",
                "status": ComplaintStatus.closed,
                "revisit_result": "满意",
                "assigned_to": "前台B",
            },
            {
                "complaint_type": "卫生问题",
                "status": ComplaintStatus.closed,
                "revisit_result": None,
                "assigned_to": "客房B",
            },
            {
                "complaint_type": "设施损坏",
                "status": ComplaintStatus.closed,
                "revisit_result": None,
                "assigned_to": "经理C",
            },
            {
                "complaint_type": "口径不一致",
                "status": ComplaintStatus.resolved,
                "revisit_result": "一般",
                "assigned_to": "客服D",
            },
            {
                "complaint_type": "口径不一致",
                "status": ComplaintStatus.closed,
                "revisit_result": "满意",
                "assigned_to": "客服D",
            },
        ]

        for idx, sample in enumerate(fixed_samples):
            created = base_time - timedelta(days=idx * 3 + 1)
            resolved_at = None
            closed_at = None
            if sample["status"] in (ComplaintStatus.resolved, ComplaintStatus.closed):
                resolved_at = created + timedelta(hours=6 + idx * 2)
            if sample["status"] == ComplaintStatus.closed:
                closed_at = resolved_at + timedelta(hours=4 + idx)

            complaints.append(Complaint(
                guest_name=rng.choice(names),
                room_no=f"{rng.randint(3, 8)}0{rng.randint(1, 9)}",
                check_in_date=created - timedelta(days=rng.randint(0, 2)),
                check_out_date=created + timedelta(days=rng.randint(1, 4)),
                complaint_type=sample["complaint_type"],
                complaint_content=f"固定样本{idx + 1}号客诉描述",
                status=sample["status"],
                created_at=created,
                updated_at=created,
                resolved_at=resolved_at,
                closed_at=closed_at,
                assigned_to=sample["assigned_to"],
                revisit_result=sample["revisit_result"],
                responsibility=rng.choice(tags),
                problem_tag=rng.choice(tags),
            ))

        for i in range(len(fixed_samples), 30):
            created = base_time - timedelta(days=rng.randint(1, 60), hours=rng.randint(0, 23))
            status = rng.choice(statuses)
            resolved_at = None
            closed_at = None
            if status in (ComplaintStatus.resolved, ComplaintStatus.closed):
                resolved_at = created + timedelta(hours=rng.randint(2, 48))
            if status == ComplaintStatus.closed:
                closed_at = resolved_at + timedelta(hours=rng.randint(1, 24)) if resolved_at else None

            complaints.append(Complaint(
                guest_name=rng.choice(names),
                room_no=f"{rng.randint(3, 8)}0{rng.randint(1, 9)}",
                check_in_date=created - timedelta(days=rng.randint(0, 3)),
                check_out_date=created + timedelta(days=rng.randint(1, 5)),
                complaint_type=rng.choice(types),
                complaint_content=f"第{i + 1}条客诉内容描述",
                status=status,
                created_at=created,
                updated_at=created,
                resolved_at=resolved_at,
                closed_at=closed_at,
                assigned_to=rng.choice(["前台A", "客房B", "经理C", "客服D"]) if status != ComplaintStatus.pending else None,
                revisit_result="满意" if status == ComplaintStatus.closed and rng.random() > 0.3 else None,
                responsibility=rng.choice(tags) if rng.random() > 0.5 else None,
                problem_tag=rng.choice(tags),
            ))

        for c in complaints:
            session.add(c)
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
        rng = random.Random(SEED_VALUE)
        rows = []
        for i in range(30):
            hours = rng.choice([8, 12, 18, 24, 36, 48, 60, 72, 96, 120, 180, 200])
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
