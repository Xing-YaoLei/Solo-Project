import sys
sys.path.insert(0, '.')
import asyncio
from api.utils.database import init_db
from api.utils.mock_data import seed_mock_data
from api.utils.duckdb_engine import init_duckdb, sync_postgres_to_duckdb


async def test():
    await init_db()
    await seed_mock_data()
    init_duckdb()

    print('测试同步 orders 表到 DuckDB:')
    result = await sync_postgres_to_duckdb('orders', 'batch-ticket-platform-001')
    print(f'结果: {result}')

    print('\n测试同步 payment_records 表到 DuckDB:')
    result = await sync_postgres_to_duckdb('payment_records', 'batch-payment-system-001')
    print(f'结果: {result}')

    print('\n测试同步 gate_records 表到 DuckDB:')
    result = await sync_postgres_to_duckdb('gate_records', 'batch-gate-system-001')
    print(f'结果: {result}')


if __name__ == '__main__':
    asyncio.run(test())
