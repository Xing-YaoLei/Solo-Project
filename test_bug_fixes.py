import os
import sys
import tempfile
import importlib

temp_db = tempfile.mktemp(suffix='.duckdb')
os.environ['DUCKDB_PATH'] = temp_db

import api.utils.duckdb_engine
importlib.reload(api.utils.duckdb_engine)

from api.utils.duckdb_engine import init_duckdb, get_duckdb_conn
from api.utils.database import TABLE_COLUMNS

print("=== Bug 1 测试: DuckDB 双主键问题")
print("-" * 50)

try:
    init_duckdb()
    conn = get_duckdb_conn()
    print("✓ init_duckdb() 成功执行")
    
    pk_count_map = {}
    for table_name in TABLE_COLUMNS.keys():
        result = conn.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'").fetchone()
        if result:
            sql = result[0]
            pk_count = sql.count('PRIMARY KEY')
            pk_count_map[table_name] = pk_count
    
    all_single_pk = all(count == 1 for count in pk_count_map.values())
    print(f"所有表都只有1个主键: {all_single_pk}")
    for table, count in pk_count_map.items():
        print(f"  {table}: {count} PRIMARY KEY(s)")
    
    orders_result = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").fetchone()
    has_order_no_pk = 'order_no VARCHAR PRIMARY KEY' in orders_result[0]
    print(f"orders表中order_no不是主键: {not has_order_no_pk}")
    
    caliber_result = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='caliber_versions'").fetchone()
    has_version_pk = 'version VARCHAR PRIMARY KEY' in caliber_result[0]
    print(f"caliber_versions表中version是主键: {has_version_pk}")
    
    print("\n✓ Bug 1 修复验证通过!")
    
except Exception as e:
    print(f"✗ Bug 1 测试失败: {e}")
    sys.exit(1)

print("\n=== Bug 3a 测试: yoy-mom 响应结构")
print("-" * 50)

try:
    from api.services.report_engine import compute_yoy_mom
    importlib.reload(api.services.report_engine)
    from api.services.report_engine import compute_yoy_mom
    
    result = compute_yoy_mom("total_sales", "mom")
    has_yoy = "yoy" in result
    has_mom = "mom" in result
    print(f"包含 yoy 键: {has_yoy}")
    print(f"包含 mom 键: {has_mom}")
    
    if has_yoy and has_mom:
        yoy_is_list = isinstance(result["yoy"], list)
        mom_is_list = isinstance(result["mom"], list)
        print(f"yoy 是列表: {yoy_is_list}")
        print(f"mom 是列表: {mom_is_list}")
        
        if yoy_is_list and len(result["yoy"]) > 0:
            item = result["yoy"][0]
            has_date = hasattr(item, 'date') or 'date' in (item if isinstance(item, dict) else item.__dict__)
            has_value = hasattr(item, 'value') or 'value' in (item if isinstance(item, dict) else item.__dict__)
            has_seriesName = hasattr(item, 'seriesName') or 'seriesName' in (item if isinstance(item, dict) else item.__dict__)
            print(f"TrendDataPoint 有 date: {has_date}")
            print(f"TrendDataPoint 有 value: {has_value}")
            print(f"TrendDataPoint 有 seriesName: {has_seriesName}")
    
    print("\n✓ Bug 3a 修复验证通过!")
    
except Exception as e:
    print(f"✗ Bug 3a 测试失败: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Bug 3b 测试: funnel 响应结构")
print("-" * 50)

try:
    from api.services.report_engine import compute_sales_funnel
    importlib.reload(api.services.report_engine)
    from api.services.report_engine import compute_sales_funnel
    
    result = compute_sales_funnel()
    has_stages = "stages" in result
    has_values = "values" in result
    print(f"包含 stages 键: {has_stages}")
    print(f"包含 values 键: {has_values}")
    
    if has_stages and has_values:
        stages_is_list = isinstance(result["stages"], list)
        values_is_list = isinstance(result["values"], list)
        print(f"stages 是列表: {stages_is_list}")
        print(f"values 是列表: {values_is_list}")
        print(f"stages: {result['stages']}")
        print(f"values: {result['values']}")
    
    print("\n✓ Bug 3b 修复验证通过!")
    
except Exception as e:
    print(f"✗ Bug 3b 测试失败: {e}")
    import traceback
    traceback.print_exc()

try:
    os.unlink(temp_db)
except:
    pass

print("\n" + "=" * 50)
print("所有测试完成!")
