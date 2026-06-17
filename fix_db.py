import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://rehab:rehab123@localhost:5432/rehab_settlement')
    try:
        await conn.execute('ALTER TABLE remark_task ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\'')
        await conn.execute('ALTER TABLE remark_task ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP')
        print('Columns added successfully')
        await conn.execute('UPDATE remark_task SET status = \'resolved\' WHERE completed = true')
        await conn.execute('UPDATE remark_task SET status = \'processing\' WHERE completed = false AND status IS NULL')
        await conn.execute('UPDATE remark_task SET resolved_at = NOW() WHERE status = \'resolved\' AND resolved_at IS NULL')
        print('Existing records updated')
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await conn.close()

asyncio.run(main())
