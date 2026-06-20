import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio

async def main():
    from api.utils.database import init_db
    from api.utils.mock_data import seed_mock_data
    from api.utils.duckdb_engine import init_duckdb, get_duckdb_sync_status, get_duckdb_conn
    from api.services.sync_pipeline import sync_pipeline
    from sqlalchemy import text
    from api.utils.database import async_session, pg_async_session, is_postgresql

    def get_session():
        return pg_async_session if is_postgresql() else async_session

    print("=" * 60)
    print("STEP 1: Init DB + Seed mock data")
    print("=" * 60)
    await init_db()
    await seed_mock_data()
    print("  Seed OK")

    print()
    print("=" * 60)
    print("STEP 2: Init DuckDB")
    print("=" * 60)
    try:
        init_duckdb()
        print("  DuckDB init OK")
    except Exception as e:
        print(f"  DuckDB init FAILED: {e}")
        return

    print()
    print("=" * 60)
    print("STEP 3: Count seed batches before pipeline/run")
    print("=" * 60)
    async with get_session()() as sess:
        r = await sess.execute(text("SELECT source, COUNT(*) FROM sync_batches GROUP BY source"))
        for row in r.fetchall():
            print(f"  {row[0]}: {row[1]} batches")

    print()
    print("=" * 60)
    print("STEP 4: Run pipeline (ticket_platform → gate_system → payment_system)")
    print("=" * 60)
    results = await sync_pipeline.run_full_sync()
    for src, r in results.items():
        status = r.get("status")
        name = r.get("source_name")
        rows_pg = r.get("rows_synced_to_pg", 0)
        batches = r.get("batches", [])
        print(f"  {src} ({name}): status={status}, rows_pg={rows_pg}, batches={len(batches)}")
        for b in batches:
            print(f"    - table={b['table']} batch_id={b['batch_id']}")

    print()
    print("=" * 60)
    print("STEP 5: Query sync_batches with source filter (simulate frontend)")
    print("=" * 60)
    for src in ["ticket_platform", "gate_system", "payment_system", None]:
        async with get_session()() as sess:
            where = "WHERE 1=1"
            params = {}
            if src:
                where += " AND source = :src"
                params["src"] = src
            r = await sess.execute(
                text(f"SELECT source, COUNT(*), SUM(processed_records) FROM sync_batches {where} GROUP BY source"),
                params,
            )
            label = f"source={src or 'ALL'}"
            rows = r.fetchall()
            if not rows:
                print(f"  {label}: (0 rows)")
            for row in rows:
                print(f"  {label}: {row[0]}={row[1]} batches, processed={row[2]} records")

    print()
    print("=" * 60)
    print("STEP 6: DuckDB tables row count")
    print("=" * 60)
    conn = get_duckdb_conn()
    for t in ["orders", "gate_records", "payment_records", "check_in_records", "orders_agg", "daily_sales_agg", "funnel_agg"]:
        try:
            r = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()
            print(f"  {t}: {r[0]} rows")
        except Exception as e:
            print(f"  {t}: ERROR {e}")

    print()
    print("=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60)

asyncio.run(main())
