from datetime import datetime
from fastapi import APIRouter, Query, Path
from sqlalchemy import text

from api.utils.database import async_session, pg_async_session, is_postgresql
from api.utils.duckdb_engine import (
    sync_postgres_to_duckdb,
    sync_all_tables_to_duckdb,
    get_duckdb_sync_status,
)
from api.schemas.common import ApiResponse
from api.schemas.sync import SyncBatch, SyncTask
from api.services.sync_pipeline import sync_pipeline

router = APIRouter()


def _get_session():
    return pg_async_session if is_postgresql() else async_session


@router.get("/batches", response_model=ApiResponse[list])
async def list_sync_batches(
    source: str = Query(default=None),
    status: str = Query(default=None),
):
    async with _get_session()() as session:
        where = "WHERE 1=1"
        params: dict = {}

        if source:
            where += " AND sb.source = :source"
            params["source"] = source
        if status:
            where += " AND sb.status = :status"
            params["status"] = status

        result = await session.execute(
            text(f"""
                SELECT sb.id, sb.source, sb.status, sb.total_records,
                       sb.processed_records, sb.start_time, sb.end_time,
                       sb.error_message, sb.sync_date
                FROM sync_batches sb
                {where}
                ORDER BY sb.start_time DESC
            """),
            params,
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
        return ApiResponse(data=batches)


@router.post("/batches/{batchId}/rerun", response_model=ApiResponse[SyncBatch])
async def rerun_batch(batchId: str):
    async with _get_session()() as session:
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
    async with _get_session()() as session:
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
    async with _get_session()() as session:
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
        {"id": "gate_system", "label": "闸机系统", "type": "source"},
        {"id": "payment_system", "label": "支付系统", "type": "source"},
        {"id": "clean", "label": "数据清洗", "type": "process"},
        {"id": "pg", "label": "PostgreSQL", "type": "storage"},
        {"id": "duckdb", "label": "DuckDB", "type": "analytics"},
        {"id": "dashboard", "label": "看板", "type": "output"},
    ]
    edges = [
        {"source": "ticket_platform", "target": "clean", "label": "订单数据"},
        {"source": "gate_system", "target": "clean", "label": "通行记录"},
        {"source": "payment_system", "target": "clean", "label": "支付流水"},
        {"source": "clean", "target": "pg", "label": "清洗后数据"},
        {"source": "pg", "target": "duckdb", "label": "同步到分析库"},
        {"source": "duckdb", "target": "dashboard", "label": "查询分析"},
    ]
    return ApiResponse(data={"nodes": nodes, "edges": edges})


@router.post("/pipeline/run", response_model=ApiResponse[dict])
async def run_pipeline():
    results = await sync_pipeline.run_full_sync()
    return ApiResponse(data=results)


@router.post("/pipeline/sync/{source}", response_model=ApiResponse[dict])
async def sync_source_pipeline(source: str = Path(..., description="数据源key")):
    result = await sync_pipeline.sync_source(source)
    if result.get("status") == "error":
        return ApiResponse(code=400, message=result.get("message", "同步失败"), data=None)
    return ApiResponse(data=result)


@router.post("/pipeline/batch/{batch_id}/rerun", response_model=ApiResponse[dict])
async def rerun_batch_pipeline(batch_id: str = Path(..., description="批次ID")):
    result = await sync_pipeline.rerun_batch(batch_id)
    if result.get("status") == "error":
        return ApiResponse(code=404, message=result.get("message", "批次不存在"), data=None)
    return ApiResponse(data=result)


@router.get("/pipeline/batch/{batch_id}/progress", response_model=ApiResponse[dict])
async def get_batch_progress(batch_id: str = Path(..., description="批次ID")):
    result = await sync_pipeline.get_sync_progress(batch_id)
    if result.get("status") == "error":
        return ApiResponse(code=404, message=result.get("message", "批次不存在"), data=None)
    return ApiResponse(data=result)


@router.get("/pipeline/sources", response_model=ApiResponse[dict])
async def get_pipeline_sources():
    sources = sync_pipeline.get_sources()
    return ApiResponse(data=sources)
