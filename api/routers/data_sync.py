from datetime import datetime
from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.utils.duckdb_engine import (
    sync_postgres_to_duckdb,
    sync_all_tables_to_duckdb,
    get_duckdb_sync_status,
)
from api.schemas.common import ApiResponse
from api.schemas.sync import SyncBatch, SyncTask

router = APIRouter()


@router.get("/batches", response_model=ApiResponse[dict])
async def list_sync_batches(
    source: str = Query(default=None),
    status: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
):
    async with async_session() as session:
        where = "WHERE 1=1"
        params: dict = {}

        if source:
            where += " AND sb.source = :source"
            params["source"] = source
        if status:
            where += " AND sb.status = :status"
            params["status"] = status

        count_result = await session.execute(
            text(f"SELECT COUNT(*) FROM sync_batches sb {where}"),
            params,
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * pageSize
        result = await session.execute(
            text(f"""
                SELECT sb.id, sb.source, sb.status, sb.total_records,
                       sb.processed_records, sb.start_time, sb.end_time,
                       sb.error_message, sb.sync_date
                FROM sync_batches sb
                {where}
                ORDER BY sb.start_time DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": pageSize, "offset": offset},
        )
        rows = result.fetchall()

        batches = [
            SyncBatch(
                batchId=row[0],
                source=row[1],
                status=row[2],
                totalRecords=row[3],
                processedRecords=row[4],
                startTime=row[5],
                endTime=row[6],
                errorMessage=row[7],
                syncDate=row[8],
            )
            for row in rows
        ]
        return ApiResponse(data={"list": batches, "total": total})


@router.post("/batches/{batchId}/rerun", response_model=ApiResponse[SyncBatch])
async def rerun_batch(batchId: str):
    async with async_session() as session:
        result = await session.execute(
            text("SELECT id FROM sync_batches WHERE id = :bid"),
            {"bid": batchId},
        )
        if not result.fetchone():
            return ApiResponse(code=404, message="批次不存在", data=None)

        now = datetime.now().isoformat()
        await session.execute(
            text("""
                UPDATE sync_batches
                SET status = 'running', start_time = :now, end_time = NULL, error_message = NULL
                WHERE id = :bid
            """),
            {"bid": batchId, "now": now},
        )
        await session.commit()

        updated = await session.execute(
            text("""
                SELECT id, source, status, total_records, processed_records,
                       start_time, end_time, error_message, sync_date
                FROM sync_batches WHERE id = :bid
            """),
            {"bid": batchId},
        )
        row = updated.fetchone()

        data = SyncBatch(
            batchId=row[0],
            source=row[1],
            status=row[2],
            totalRecords=row[3],
            processedRecords=row[4],
            startTime=row[5],
            endTime=row[6],
            errorMessage=row[7],
            syncDate=row[8],
        )
        return ApiResponse(data=data)


@router.get("/tasks", response_model=ApiResponse[list[SyncTask]])
async def list_sync_tasks():
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT id, name, source, cron_expression, last_run_time, next_run_time, status
                FROM sync_tasks
                ORDER BY id
            """)
        )
        rows = result.fetchall()

        tasks = [
            SyncTask(
                taskId=row[0],
                name=row[1],
                source=row[2],
                cronExpression=row[3],
                lastRunTime=row[4],
                nextRunTime=row[5],
                status=row[6],
            )
            for row in rows
        ]
        return ApiResponse(data=tasks)


@router.post("/tasks/{taskId}/trigger", response_model=ApiResponse[SyncTask])
async def trigger_task(taskId: str):
    async with async_session() as session:
        result = await session.execute(
            text("SELECT id FROM sync_tasks WHERE id = :tid"),
            {"tid": taskId},
        )
        if not result.fetchone():
            return ApiResponse(code=404, message="任务不存在", data=None)

        now = datetime.now().isoformat()
        from datetime import timedelta
        next_run = (datetime.now() + timedelta(hours=1)).isoformat()

        await session.execute(
            text("""
                UPDATE sync_tasks
                SET last_run_time = :now, next_run_time = :next
                WHERE id = :tid
            """),
            {"tid": taskId, "now": now, "next": next_run},
        )
        await session.commit()

        updated = await session.execute(
            text("""
                SELECT id, name, source, cron_expression, last_run_time, next_run_time, status
                FROM sync_tasks WHERE id = :tid
            """),
            {"tid": taskId},
        )
        row = updated.fetchone()

        data = SyncTask(
            taskId=row[0],
            name=row[1],
            source=row[2],
            cronExpression=row[3],
            lastRunTime=row[4],
            nextRunTime=row[5],
            status=row[6],
        )
        return ApiResponse(data=data)


@router.post("/duckdb/sync", response_model=ApiResponse[dict])
async def sync_to_duckdb(
    tableName: str = Query(default=None),
    syncBatchId: str = Query(default=None),
):
    if tableName:
        result = await sync_postgres_to_duckdb(tableName, syncBatchId)
        return ApiResponse(data=result)
    else:
        results = await sync_all_tables_to_duckdb(syncBatchId)
        return ApiResponse(data={"results": results})


@router.get("/duckdb/status", response_model=ApiResponse[list])
async def get_duckdb_status():
    status = get_duckdb_sync_status()
    return ApiResponse(data=status)


@router.get("/topology", response_model=ApiResponse[dict])
async def get_topology():
    nodes = [
        {"id": "ticket_platform", "label": "票务平台", "type": "source"},
        {"id": "clean", "label": "数据清洗", "type": "process"},
        {"id": "pg", "label": "PostgreSQL", "type": "storage"},
        {"id": "duckdb", "label": "DuckDB", "type": "analytics"},
        {"id": "dashboard", "label": "看板", "type": "output"},
    ]
    edges = [
        {"source": "ticket_platform", "target": "clean", "label": "原始数据"},
        {"source": "clean", "target": "pg", "label": "清洗后数据"},
        {"source": "pg", "target": "duckdb", "label": "同步到分析库"},
        {"source": "duckdb", "target": "dashboard", "label": "查询分析"},
    ]
    return ApiResponse(data={"nodes": nodes, "edges": edges})
