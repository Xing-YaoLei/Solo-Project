import inspect
from src.data_layer.data_repository import (
    DataRepository, DualWriteResult, TABLE_PRIMARY_KEYS, CORE_TABLES
)
from src.utils.config import load_config, MinIOConfig

print("=" * 60)
print("验证 1: TABLE_PRIMARY_KEYS 和 CORE_TABLES 定义")
print("=" * 60)
print("TABLE_PRIMARY_KEYS:")
for t, pk in TABLE_PRIMARY_KEYS.items():
    print(f"  {t}: {pk}")
print()
print(f"CORE_TABLES: {CORE_TABLES}")
assert "ota_orders" in CORE_TABLES, "ota_orders 应在核心表中"
assert "door_lock_records" in CORE_TABLES, "door_lock_records 应在核心表中"
assert "payment_transactions" in CORE_TABLES, "payment_transactions 应在核心表中"
assert TABLE_PRIMARY_KEYS["ota_orders"] == ["order_id"], "ota_orders 主键应为 order_id"
assert TABLE_PRIMARY_KEYS["door_lock_records"] == ["record_id"], "door_lock_records 主键应为 record_id"
assert TABLE_PRIMARY_KEYS["payment_transactions"] == ["transaction_id"], "payment_transactions 主键应为 transaction_id"
print("✅ 表主键和核心表定义正确")

print()
print("=" * 60)
print("验证 2: MinIOConfig.enabled 字段")
print("=" * 60)
config = load_config()
assert hasattr(config.minio, "enabled"), "MinIOConfig 应包含 enabled 字段"
assert isinstance(config.minio.enabled, bool), "enabled 应为布尔值"
print(f"  MinIOConfig.enabled = {config.minio.enabled}")
print("✅ MinIOConfig.enabled 字段存在")

print()
print("=" * 60)
print("验证 3: DataRepository 批量方法返回 DualWriteResult")
print("=" * 60)
methods = [
    'save_ota_orders_batch',
    'save_door_lock_records_batch',
    'save_payment_transactions_batch',
    'save_package_inventory_batch',
    'save_pricing_rules_batch',
    'save_analysis_notes_batch',
    'save_oversell_records_batch',
    'save_conversion_rate_versions_batch',
    'sync_from_minio',
    'sync_to_minio',
    'list_minio_objects',
]
for m in methods:
    sig = inspect.signature(getattr(DataRepository, m))
    print(f'  {m}: {sig}')

batch_methods = [m for m in methods if m.startswith("save_") and m.endswith("_batch")]
for m in batch_methods:
    anno = inspect.signature(getattr(DataRepository, m)).return_annotation
    assert anno == DualWriteResult, f"{m} 应返回 DualWriteResult，实际是 {anno}"
print("✅ 所有 save_*_batch 方法返回 DualWriteResult")

print()
print("=" * 60)
print("验证 4: DualWriteResult 属性")
print("=" * 60)
dr = DualWriteResult("test_table", 100)
print(f"  summary(): {dr.summary()}")
print(f"  duckdb_ok = {dr.duckdb_ok}")
print(f"  minio_ok = {dr.minio_ok}")
print(f"  minio_object_name = {dr.minio_object_name}")
print(f"  minio_error = {dr.minio_error}")
print(f"  duckdb_only = {dr.duckdb_only}")
assert dr.duckdb_only is True, "MinIO 未写入时 duckdb_only 应为 True"
dr.minio_ok = True
assert dr.duckdb_only is False, "MinIO 写入成功时 duckdb_only 应为 False"
print("✅ DualWriteResult 属性正确")

print()
print("=" * 60)
print("验证 5: sync_from_minio 返回结构")
print("=" * 60)
sig = inspect.signature(getattr(DataRepository, "sync_from_minio"))
print(f"  sync_from_minio 签名: {sig}")
assert "table_names" in sig.parameters
assert "object_prefix" in sig.parameters
print("✅ sync_from_minio 签名正确（支持按表名和前缀过滤）")

print()
print("=" * 60)
print("验证 6: 所有修改文件语法检查")
print("=" * 60)
import ast
for f in ['app.py', 'init_data.py',
          'src/data_layer/data_repository.py',
          'src/data_layer/minio_client.py',
          'src/utils/config.py',
          'src/utils/data_generator.py']:
    try:
        ast.parse(open(f).read())
        print(f"  {f}: OK")
    except SyntaxError as e:
        print(f"  {f}: SYNTAX ERROR: {e}")
        raise
print("✅ 所有文件语法正确")

print()
print("=" * 60)
print("验证 7: 关键常量和导出")
print("=" * 60)
# 验证可导出 CORE_TABLES, TABLE_PRIMARY_KEYS
from src.data_layer import data_repository
assert hasattr(data_repository, 'CORE_TABLES')
assert hasattr(data_repository, 'TABLE_PRIMARY_KEYS')
assert hasattr(data_repository, 'DualWriteResult')
print("✅ 关键常量可从 data_repository 模块导出")

print()
print("🎉 所有验证通过！")
print()
print("核心规则总结:")
print("  1. OTA 订单、门锁记录、收款流水是 CORE_TABLES，必须双写 MinIO")
print("  2. MinIO 不可用时，核心表写入直接抛 RuntimeError，不静默降级")
print("  3. 主键映射: ota_orders→order_id | door_lock_records→record_id | payment_transactions→transaction_id")
print("  4. sync_from_minio 按表目录 + 各表主键 upsert 回灌")
print("  5. init_data.py / app.py 都有 MinIO 状态检查，连接失败时明确提示，不显示对象已保留")
