import sys
sys.path.insert(0, '.')

from src.data_layer.minio_client import MinioClient
from src.utils.config import load_config
import inspect
import os

print("=" * 60)
print("MinIO 双写接口一致性验证")
print("=" * 60)

sig = inspect.signature(MinioClient.upload_dataframe)
print(f"\n1. MinioClient.upload_dataframe 参数: {list(sig.parameters.keys())}")
assert 'df' in sig.parameters
assert 'object_name' in sig.parameters
assert 'metadata' in sig.parameters
assert 'format' in sig.parameters, "缺少 format 参数"
print("   ✅ 包含 df, object_name, metadata, format 四个参数")

sig2 = inspect.signature(MinioClient.download_dataframe)
print(f"\n2. MinioClient.download_dataframe 参数: {list(sig2.parameters.keys())}")
assert 'format' in sig2.parameters, "缺少 format 参数"
print("   ✅ 包含 format 参数")

# 静态检查 data_repository.py 源码
repo_path = os.path.join('.', 'src/data_layer/data_repository.py')
with open(repo_path) as f:
    repo_src = f.read()

batch_methods = [
    'save_ota_orders_batch',
    'save_door_lock_records_batch', 
    'save_payment_transactions_batch',
    'save_package_inventory_batch',
    'save_pricing_rules_batch',
    'save_analysis_notes_batch',
    'save_oversell_records_batch',
    'save_conversion_rate_versions_batch',
]
print(f"\n3. 批量双写方法 (共 {len(batch_methods)} 个):")
for m in batch_methods:
    exists = f"def {m}(" in repo_src
    status = "✅" if exists else "❌"
    print(f"   {status} {m}")
    assert exists, f"缺少方法: {m}"

import re
dual_write_match = re.search(r'def _dual_write\([^)]+\):(.+?)(?=\n    def |\nclass |\Z)', repo_src, re.DOTALL)
dual_upsert_match = re.search(r'def _dual_upsert\([^)]+\):(.+?)(?=\n    def |\nclass |\Z)', repo_src, re.DOTALL)

print("\n4. _dual_write/_dual_upsert 内部调用参数:")
if dual_write_match and 'format="parquet"' in dual_write_match.group(1):
    print("   ✅ _dual_write 传入 format=\"parquet\"")
else:
    print("   ❌ _dual_write 缺少 format 参数")
    assert False

if dual_upsert_match and 'format="parquet"' in dual_upsert_match.group(1):
    print("   ✅ _dual_upsert 传入 format=\"parquet\"")
else:
    print("   ❌ _dual_upsert 缺少 format 参数")
    assert False

files_to_check = [
    'app.py',
    'init_data.py', 
    'seed_oversell_conclusions.py',
    'src/pages/version_manager.py',
]
print(f"\n5. 各入口 use_minio 配置 (共 {len(files_to_check)} 个):")
for f in files_to_check:
    path = os.path.join('.', f)
    if os.path.exists(path):
        with open(path) as fp:
            content = fp.read()
        if 'use_minio=True' in content:
            print(f"   ✅ {f}: use_minio=True")
        elif 'use_minio=False' in content:
            print(f"   ❌ {f}: use_minio=False")
            assert False, f"{f} 仍使用 use_minio=False"
        else:
            print(f"   ❓ {f}: 未找到")

print("\n" + "=" * 60)
print("✅ 所有验证通过！")
print("=" * 60)
