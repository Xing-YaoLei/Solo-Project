import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services import data_service

print("=" * 60)
print("  数据源优先级验证")
print("=" * 60)
print()

print(f"当前数据源: {data_service.get_data_source()}")
print(f"PostgreSQL 可用: {data_service._pg_available}")
print(f"DuckDB 可用: {data_service._duckdb_available}")
print()

s = data_service.get_dashboard_summary()
print(f"Dashboard Summary (来自 {data_service.get_data_source()}):")
print(f"   total_settlement: {s.total_settlement}")
print(f"   total_orders: {s.total_orders}")
print(f"   anomaly_count: {s.anomaly_count}")
print()

if data_service._pg_available:
    print("✅ PostgreSQL 已连接，数据从 PG 表读取")
elif data_service._duckdb_available:
    print("⚠️  PostgreSQL 不可用，降级到 DuckDB 本地数据源")
    print("   配置 PostgreSQL 后（设置 POSTGRES_SERVER 等环境变量），")
    print("   summary 将优先从 PostgreSQL 表读取。")
else:
    print("⚠️  DuckDB 也不可用，降级到 mock 数据")

print()
print("=" * 60)
print("  数据源优先级: PostgreSQL → DuckDB → Mock")
print("=" * 60)
