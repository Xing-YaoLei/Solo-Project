import sys
sys.path.insert(0, '.')

from app.analytics.duckdb_client import DuckDBClient

print('Creating DuckDB client...')
client = DuckDBClient()
print('✅ DuckDB client created')

result = client.sync_from_postgres()
print(f'✅ Sync completed')
print()

print('Testing metrics queries...')
from app.analytics.metrics import analytics_metrics

water = analytics_metrics.get_utility_readings()
print(f"✅ 水电读数: {len(water.get('data', []))} 条记录")

funnel = analytics_metrics.get_inspection_funnel()
print(f"✅ 验房漏斗: {len(funnel.get('data', []))} 个阶段")
print(f"   漏斗数据: {funnel.get('data', [])[:3]}")

ranking = analytics_metrics.get_payment_ranking()
print(f"✅ 收款排行: {len(ranking.get('data', []))} 条记录")

tags = analytics_metrics.get_complaint_tag_trend()
print(f"✅ 投诉标签: {len(tags.get('data', []))} 条记录")

repair = analytics_metrics.get_repair_duration()
print(f"✅ 维修时长: {repair}")

print()
print('🎉 All analytics metrics working!')
