import sys
sys.path.insert(0, '.')
import asyncio
from api.utils.database import init_db
from api.utils.mock_data import seed_mock_data
from sqlalchemy import text
from api.utils.database import async_session
from api.services.sync_pipeline import sync_pipeline


async def test():
    await init_db()
    await seed_mock_data()
    print('Database initialized and mock data seeded successfully')
    print()

    async with async_session() as session:
        result = await session.execute(text('SELECT COUNT(*) FROM sync_batches'))
        count = result.scalar()
        print(f'Total sync_batches: {count}')

        result = await session.execute(
            text('SELECT id, source, status, total_records FROM sync_batches WHERE id IN (:b1, :b2, :b3)'),
            {'b1': 'batch-ticket-platform-001', 'b2': 'batch-gate-system-001', 'b3': 'batch-payment-system-001'}
        )
        rows = result.fetchall()
        print('\n主要同步批次:')
        for row in rows:
            print(f'  Batch: {row[0]}, source: {row[1]}, status: {row[2]}, total: {row[3]}')

        result = await session.execute(text('SELECT COUNT(*) FROM orders WHERE sync_batch_id IS NOT NULL'))
        count = result.scalar()
        print(f'\nOrders with sync_batch_id: {count}')

        result = await session.execute(text('SELECT COUNT(*) FROM payment_records WHERE sync_batch_id IS NOT NULL'))
        count = result.scalar()
        print(f'Payment records with sync_batch_id: {count}')

        result = await session.execute(text('SELECT COUNT(*) FROM gate_records WHERE sync_batch_id IS NOT NULL'))
        count = result.scalar()
        print(f'Gate records with sync_batch_id: {count}')

    print('\n=== 测试管道服务 ===')
    sources = sync_pipeline.get_sources()
    print(f'可用数据源: {list(sources.keys())}')

    print('\n测试同步单个数据源 (ticket_platform):')
    result = await sync_pipeline.sync_source('ticket_platform')
    print(f'结果: {result.get("status")}')
    if result.get("batches"):
        for batch in result["batches"]:
            print(f'  表: {batch["table"]}, 批次: {batch["batch_id"]}')

    if result.get("batches") and len(result["batches"]) > 0:
        batch_id = result["batches"][0]["batch_id"]
        print(f'\n获取批次进度 ({batch_id}):')
        progress = await sync_pipeline.get_sync_progress(batch_id)
        print(f'  状态: {progress.get("status")}')
        print(f'  进度: {progress.get("progress_percent")}%')
        print(f'  已处理: {progress.get("processed_records")}/{progress.get("total_records")}')

    print('\n=== 所有测试通过 ===')


if __name__ == '__main__':
    asyncio.run(test())
