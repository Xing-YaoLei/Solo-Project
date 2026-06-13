"""系统集成测试脚本 v2 - 针对本次修复的专项验证"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import polars as pl
from datetime import date, timedelta


def use_temp_db():
    """创建临时数据库，避免 DuckDB 锁冲突"""
    db_path = os.environ.get("TEST_DB_PATH")
    if db_path:
        from src.config import config
        config.duckdb.db_path = db_path
    else:
        import tempfile
        tmp_db = tempfile.mktemp(suffix=".duckdb")
        os.environ["TEST_DB_PATH"] = tmp_db
        from src.config import config
        config.duckdb.db_path = tmp_db


use_temp_db()

from src.data import duckdb_manager
from src.data.minio_client import minio_client
from src.data.ingestion import ingestion_pipeline, DataIngestionPipeline
from src.utils.data_cleaner import DataCleaner
from src.modules.risk_engine import RiskEngine
from src.modules.charts import ChartGenerator
from src.modules.review_report import ReviewReportGenerator


# ---------------------------------------------------------------------------
# 测试 1：核心模块导入
# ---------------------------------------------------------------------------
print("=" * 60)
print("模块导入 OK")


# ---------------------------------------------------------------------------
# 测试 2：先构造 material_usage 完整数据，然后模拟异常检测部分列 UPDATE
# 验证：UPDATE 后 NOT NULL 列（store_id, order_id, usage_quantity 等）不丢失
# ---------------------------------------------------------------------------
print()
print("=" * 60)
print("测试 2：_persist_material_abnormalities UPDATE 后原始数据不丢失")
print("=" * 60)

# 2a. 插入完整的 material_usage 行（有所有 NOT NULL 列）
material_rows = []
for i in range(10):
    is_abnormal_target = i < 3   # 前 3 条将被标记为异常
    material_rows.append({
        "usage_id": f"U_TEST2_{i:03d}",
        "store_id": "S001",
        "order_id": f"O_TEST2_{i:03d}",
        "service_name": f"服务{i}",
        "material_code": f"MAT{i % 3 + 1:03d}",
        "material_name": f"耗材{i % 3 + 1}",
        "usage_quantity": round(8.0 if is_abnormal_target else 4.0, 2),
        "standard_usage_quantity": 5.0,
        "unit": "ml",
        "transaction_date": date.today() - timedelta(days=i),
        "customer_id": f"C{i:04d}",
        "technician_name": ["张技师", "李技师", "王技师"][i % 3],
        # is_abnormal / anomaly_reason / usage_ratio 都先为空
        "is_abnormal": False,
        "anomaly_reason": None,
        "usage_ratio": None,
    })
material_full = pl.DataFrame(material_rows)
inserted = duckdb_manager.insert_dataframe("material_usage", material_full, if_exists="upsert")
assert inserted == 10, f"插入失败: inserted={inserted}"
print("2a. 已插入 10 行完整 material_usage 记录")

# 2b. 验证：所有原始 NOT NULL 列有值
before = duckdb_manager.query(
    "SELECT COUNT(*) as total, "
    "COUNT(usage_id) as id_ok, "
    "COUNT(store_id) as store_ok, "
    "COUNT(order_id) as order_ok, "
    "COUNT(material_code) as mat_ok, "
    "COUNT(material_name) as name_ok, "
    "COUNT(usage_quantity) as qty_ok, "
    "COUNT(transaction_date) as date_ok, "
    "COUNT(CASE WHEN is_abnormal IS FALSE THEN 1 END) as normal_count, "
    "COUNT(CASE WHEN usage_ratio IS NULL THEN 1 END) as no_ratio_count "
    "FROM material_usage WHERE usage_id LIKE 'U_TEST2_%'"
)
print("2b. 更新前状态：", before.to_dicts()[0])
assert before["total"][0] == 10
assert before["normal_count"][0] == 10, "插入时 is_abnormal 应该都为 False"
assert before["no_ratio_count"][0] == 10, "插入时 usage_ratio 应为 NULL"

# 2c. 关键测试：构造只有部分列（usage_id, usage_ratio, is_abnormal, anomaly_reason）
#     的 DataFrame（模拟 detect_material_abnormalities 的输出），然后调用
#     RiskEngine._persist_material_abnormalities。
#     验证：不会 DELETE+INSERT 导致 NOT NULL 列丢失！
engine = RiskEngine()

# 构造异常检测结果（只有 4 列，模拟之前会导致 bug 的场景）
abnormal_result_df = pl.DataFrame([
    {
        "usage_id": "U_TEST2_000",
        "usage_ratio": 1.6,
        "is_abnormal": True,
        "anomaly_reason": "测试：超标 1.6x",
    },
    {
        "usage_id": "U_TEST2_001",
        "usage_ratio": 1.8,
        "is_abnormal": True,
        "anomaly_reason": "测试：超标 1.8x",
    },
    {
        "usage_id": "U_TEST2_002",
        "usage_ratio": 2.2,
        "is_abnormal": True,
        "anomaly_reason": "测试：超标 2.2x",
    },
])
fake_alerts = []   # 本次测试不需要 alert

print(f"2c. 调用 _persist_material_abnormalities（只有 {abnormal_result_df.columns} 4 列）")
engine._persist_material_abnormalities(abnormal_result_df, fake_alerts)

# 2d. 最重要的验证：行数必须还是 10，且 NOT NULL 列仍然有值
after = duckdb_manager.query(
    "SELECT COUNT(*) as total, "
    "COUNT(usage_id) as id_ok, "
    "COUNT(store_id) as store_ok, "
    "COUNT(order_id) as order_ok, "
    "COUNT(material_code) as mat_ok, "
    "COUNT(material_name) as name_ok, "
    "COUNT(usage_quantity) as qty_ok, "
    "COUNT(transaction_date) as date_ok "
    "FROM material_usage WHERE usage_id LIKE 'U_TEST2_%'"
)
print("2d. 更新后 NOT NULL 列完整性：", after.to_dicts()[0])

total_after = after["total"][0]
assert total_after == 10, f"❌ 行数从 10 变成了 {total_after}！" \
    "原始记录被 DELETE+INSERT 丢失了"
assert after["store_ok"][0] == 10, f"❌ store_id 丢失"
assert after["order_ok"][0] == 10, f"❌ order_id 丢失"
assert after["mat_ok"][0] == 10, f"❌ material_code 丢失"
assert after["name_ok"][0] == 10, f"❌ material_name 丢失"
assert after["qty_ok"][0] == 10, f"❌ usage_quantity 丢失"
assert after["date_ok"][0] == 10, f"❌ transaction_date 丢失"
print("✅ PASS: 所有 NOT NULL 列完整保留")

# 2e. 验证：目标行的 usage_ratio / is_abnormal / anomaly_reason 已被正确更新
updated_rows = duckdb_manager.query(
    "SELECT usage_id, usage_ratio, is_abnormal, anomaly_reason, usage_quantity "
    "FROM material_usage WHERE usage_id IN ('U_TEST2_000','U_TEST2_001','U_TEST2_002') "
    "ORDER BY usage_id"
)
print("2e. 更新后的异常列：")
print(updated_rows)

for row in updated_rows.iter_rows(named=True):
    assert row["is_abnormal"] == True, f"{row['usage_id']} is_abnormal 未更新"
    assert row["usage_ratio"] is not None and row["usage_ratio"] > 1.0, \
        f"{row['usage_id']} usage_ratio 未更新"
    assert row["anomaly_reason"] is not None and "超标" in row["anomaly_reason"], \
        f"{row['usage_id']} anomaly_reason 未更新"
print("✅ PASS: 目标行的异常字段都已正确 UPDATE")

# 2f. 验证：非目标行仍为原始状态
untouched = duckdb_manager.query_one(
    "SELECT usage_id, usage_ratio, is_abnormal, anomaly_reason FROM material_usage "
    "WHERE usage_id = 'U_TEST2_009'"
)
assert untouched["is_abnormal"] == False, "非目标行不应被修改"
print("✅ PASS: 非目标行保持原样")


# ---------------------------------------------------------------------------
# 测试 3：ingestion_pipeline 返回正确的 storage_status
# ---------------------------------------------------------------------------
print()
print("=" * 60)
print("测试 3：ingestion_pipeline 存储状态区分准确")
print("=" * 60)

sample_reviews = pl.DataFrame([
    {
        "review_id": f"RTEST3_{i:03d}",
        "customer_id": f"C{i:04d}",
        "store_name": "旗舰店",
        "order_id": f"OTEST3_{i:03d}",
        "rating": 5,
        "service_date": date.today().isoformat(),
    }
    for i in range(5)
])
csv_bytes = sample_reviews.write_csv().encode()

# 3a. skip_minio=True -> storage_status 应为 "skipped"
print("3a. skip_minio=True ...")
r = ingestion_pipeline.ingest(csv_bytes, "test3a.csv", "reviews", skip_minio=True)
print("    返回: storage_status=%s, minio_stored=%s" % (r["storage_status"], r["minio_stored"]))
assert r["storage_status"] == DataIngestionPipeline.STORAGE_STATUS_SKIPPED, \
    f"期望 skipped, 实际 {r['storage_status']}"
assert r["minio_stored"] == False
assert r["inserted_rows"] == 5, f"入库失败: {r['inserted_rows']}"
print("    ✅ PASS: skip_minio=True -> skipped, 且数据成功入库")

# 3b. skip_minio=False, 且当前无可用 MinIO -> 应为 "duckdb_only"
#     （测试环境通常没有 MinIO）
print("3b. skip_minio=False (无 MinIO 服务) ...")
r = ingestion_pipeline.ingest(csv_bytes, "test3b.csv", "reviews", skip_minio=False)
print("    返回: storage_status=%s, minio_stored=%s, minio_error=%s" % (
    r.get("storage_status"), r.get("minio_stored"), r.get("minio_error")))
assert r["storage_status"] == DataIngestionPipeline.STORAGE_STATUS_DUCKDB_ONLY, \
    f"期望 duckdb_only (因为无 MinIO), 实际 {r['storage_status']}"
assert r["minio_stored"] == False
assert "minio_error" in r, "duckdb_only 时应附带 minio_error"
assert r["inserted_rows"] == 5, f"入库失败: {r['inserted_rows']}"
print("    ✅ PASS: 无 MinIO 时 -> duckdb_only + minio_error, 数据仍入库")


# ---------------------------------------------------------------------------
# 测试 4：charts 和 review_report 的 material_usage 查询无 usage_ratio 报错
# ---------------------------------------------------------------------------
print()
print("=" * 60)
print("测试 4：charts + review_report 查询 (material_usage)")
print("=" * 60)

th = RiskEngine().thresholds
charts = ChartGenerator(th)
date_to = date.today()
date_from = date_to - timedelta(days=30)

print("4a. get_material_abnormality_chart ...")
fig = charts.get_material_abnormality_chart(None, date_from, date_to, top_n=10)
assert fig is not None and len(fig.data) > 0, "图表数据为空"
print("    ✅ PASS")

print("4b. ReviewReportGenerator.get_material_abnormal_details ...")
report = ReviewReportGenerator(th)
details = report.get_material_abnormal_details(None, date_from, date_to)
print(f"    返回 {details.height} 行, columns={details.columns}")
assert "ratio" in details.columns, "缺少 ratio 列"
print("    ✅ PASS")


# ---------------------------------------------------------------------------
# 测试 5：DuckDB align_dataframe_to_table 在 upsert 时自动补齐默认列
# ---------------------------------------------------------------------------
print()
print("=" * 60)
print("测试 5：upsert 默认列补齐 (is_abnormal, is_delayed)")
print("=" * 60)

# 构造 reviews，不包含 is_delayed
r5_raw = pl.DataFrame([
    {
        "review_id": "RTEST5_001",
        "customer_id": "C0001",
        "store_id": "S001",
        "order_id": "OTEST5_001",
        "rating": 5,
        "service_date": date.today(),
        "review_submit_date": "2026-06-14 10:00:00",
        "sync_date": "2026-06-14 10:05:00",
    }
])
cleaned_r5, _ = DataCleaner.clean_reviews(r5_raw)
print(f"5a. 清洗后 columns: {cleaned_r5.columns}")
assert "is_delayed" in cleaned_r5.columns, "is_delayed 应在清洗时补齐"

inserted = duckdb_manager.insert_dataframe("reviews", cleaned_r5, if_exists="upsert")
assert inserted == 1

check_r5 = duckdb_manager.query_one(
    "SELECT review_id, is_delayed, created_at FROM reviews WHERE review_id='RTEST5_001'"
)
print(f"5b. 入库后: {check_r5}")
assert check_r5["is_delayed"] is not None, "is_delayed 不应为 NULL"
assert check_r5["created_at"] is not None, "created_at 应由 DB 自动填充"
print("    ✅ PASS: is_delayed 已补齐, created_at 由 DB 自动填充")


# ---------------------------------------------------------------------------
# 最终总结
# ---------------------------------------------------------------------------
print()
print("=" * 60)
print("ALL 6 TESTS PASSED ✅")
print("=" * 60)
print()
print("总结：")
print("  1. ✅ _persist_material_abnormalities 改用 UPDATE FROM 临时表，")
print("     不再 DELETE+INSERT 部分列，原始 NOT NULL 数据 100% 保留")
print("  2. ✅ ingestion_pipeline.ingest 准确区分三种状态：")
print("     stored / duckdb_only(附minio_error) / skipped")
print("  3. ✅ material_usage usage_ratio 查询稳定")
print("  4. ✅ upsert 默认列补齐正常")
