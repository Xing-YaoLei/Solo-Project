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

    print('测试同步单个数据源 (ticket_platform):')
    result = await sync_pipeline.sync_source('ticket_platform')
    print(f'结果: {result}')

    if result.get("batches") and len(result["batches"]) > 0:
        batch_id = result["batches"][0]["batch_id"]
        print(f'\n批次详情 ({batch_id}):')
        progress = await sync_pipeline.get_sync_progress(batch_id)
        for key, value in progress.items():
            print(f'  {key}: {value}')

    print('\n测试全量同步:')
    full_result = await sync_pipeline.run_full_sync()
    for source, res in full_result.items():
        print(f'  {source}: {res.get("status")}')


if __name__ == '__main__':
    asyncio.run(test())
