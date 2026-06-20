import sys
sys.path.insert(0, '.')
import asyncio
import os
from api.utils.database import init_db
from api.utils.mock_data import seed_mock_data
from sqlalchemy import text
from api.utils.database import async_session
from api.services.sync_pipeline import sync_pipeline
from api.utils.duckdb_engine import init_duckdb

if os.path.exists('./analytics.duckdb'):
    os.remove('./analytics.duckdb')
if os.path.exists('./ticket_dashboard.db'):
    os.remove('./ticket_dashboard.db')


async def test():
    await init_db()
    await seed_mock_data()
    init_duckdb()

    print('=== 测试管道服务 ===\n')

    print('1. 获取所有数据源:')
    sources = sync_pipeline.get_sources()
    for key, info in sources.items():
        print(f'   {key}: {info["name"]} - {info["description"]}')

    print('\n2. 同步单个数据源 (ticket_platform):')
    result = await sync_pipeline.sync_source('ticket_platform')
    print(f'   状态: {result.get("status")}')
    if result.get("batches"):
        for batch in result["batches"]:
            print(f'   表: {batch["table"]}, 批次ID: {batch["batch_id"]}')

    if result.get("batches") and len(result["batches"]) > 0:
        batch_id = result["batches"][0]["batch_id"]
        print(f'\n3. 获取批次进度 ({batch_id}):')
        progress = await sync_pipeline.get_sync_progress(batch_id)
        print(f'   状态: {progress.get("status")}')
        print(f'   进度: {progress.get("progress_percent")}%')
        print(f'   已处理: {progress.get("processed_records")}/{progress.get("total_records")}')
        if progress.get("error_message"):
            print(f'   错误: {progress.get("error_message")}')

    print('\n4. 重跑批次:')
    rerun_result = await sync_pipeline.rerun_batch(batch_id)
    print(f'   状态: {rerun_result.get("status")}')
    if rerun_result.get("processed_records"):
        print(f'   处理记录数: {rerun_result.get("processed_records")}')
    if rerun_result.get("error"):
        print(f'   错误: {rerun_result.get("error")}')

    print('\n5. 全量同步:')
    full_result = await sync_pipeline.run_full_sync()
    for source, res in full_result.items():
        print(f'   {source}: {res.get("status")}')

    print('\n=== 测试完成 ===')


if __name__ == '__main__':
    asyncio.run(test())
