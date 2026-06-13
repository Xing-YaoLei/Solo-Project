from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import analytics, thresholds, renewal_notes, members
from .db.duckdb_conn import init_duckdb_tables

pg_available = False
try:
    from .db.database import engine, Base
    Base.metadata.create_all(bind=engine)
    pg_available = True
except Exception as e:
    print(f"Warning: PostgreSQL not available, running in DuckDB-only mode: {e}")

init_duckdb_tables()

app = FastAPI(
    title="健身私教会员续费漏斗报表系统",
    description="用于复盘健身私教的会员续费问题的数据分析系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)

if pg_available:
    app.include_router(thresholds.router)
    app.include_router(renewal_notes.router)
    app.include_router(members.router)
else:
    from fastapi import HTTPException
    from .api import thresholds as thresholds_router
    from .api import renewal_notes as notes_router
    from .api import members as members_router
    app.include_router(thresholds_router.router)
    app.include_router(notes_router.router)
    app.include_router(members_router.router)


@app.get("/")
def root():
    return {"message": "健身私教会员续费漏斗报表系统 API", "version": "1.0.0", "pg_available": pg_available}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "pg_available": pg_available}
