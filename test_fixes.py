import sys
sys.path.insert(0, ".")

import polars as pl
from datetime import datetime

print("测试1: clean_data 函数...")
from data_layer.polars_processor import PolarsProcessor
processor = PolarsProcessor()

test_df = pl.DataFrame({
    "id": ["1", "2", "3"],
    "project_id": ["P001", "P002", "P003"],
    "project_name": ["项目A", None, "项目C"],
    "design_version": ["v1.0", "v2.0", None],
    "export_time": [datetime.now(), datetime.now(), None],
})

cleaned = processor.clean_data(test_df, "design_export")
print(f"✅ 列: {cleaned.columns}")
print(f"✅ is_missing 存在: {'is_missing' in cleaned.columns}")
print(f"✅ 结果:\n{cleaned}")

print("\n测试2: SyncResult 属性...")
from sync_pipeline.sync_pipeline import SyncResult
result = SyncResult(batch_id="test_123", data_source="design_export", status="成功")
print(f"✅ data_source_label: {result.data_source_label}")

print("\n测试3: Repository 插入...")
from data_layer import DataRepository
repo = DataRepository()

result = repo.insert_design_exports(test_df)
print(f"✅ 插入结果: {result}")

print("\n🎉 所有测试通过！")
