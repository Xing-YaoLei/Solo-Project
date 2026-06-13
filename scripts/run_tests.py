"""系统集成测试脚本 - 使用临时数据库"""
import sys
import os
import tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import polars as pl
from datetime import date, timedelta

TEST_DB_PATH = os.environ.get("TEST_DB_PATH")
if TEST_DB_PATH:
    from src.config import config
    config.duckdb.db_path = TEST_DB_PATH

from src.data import duckdb_manager
from src.data.minio_client import minio_client
from src.data.ingestion import ingestion_pipeline
from src.utils.data_cleaner import DataCleaner
from src.modules.risk_engine import RiskEngine
from src.modules.charts import ChartGenerator
from src.modules.review_report import ReviewReportGenerator


def test_minio_fallback():
    print("=" * 60)
    print("1. 测试 MinIO 客户端降级能力")
    print("=" * 60)
    print("is_available:", minio_client.is_available())
    ok = minio_client.upload_bytes("test/test.txt", b"hello")
    print("upload_bytes returned:", ok)
    print("list_objects:", minio_client.list_objects("raw/"))
    print("OK")


def test_material_usage_schema():
    print()
    print("=" * 60)
    print("2. 验证 DuckDB material_usage 表含 usage_ratio 列")
    print("=" * 60)
    cols = duckdb_manager.get_table_columns("material_usage")
    print("material_usage columns:", cols)
    assert "usage_ratio" in cols, "usage_ratio 列缺失！"
    print("OK: usage_ratio 列存在")


def test_usage_ratio_values():
    print()
    print("=" * 60)
    print("3. 验证 material_usage 表中有 usage_ratio 值")
    print("=" * 60)
    row_count = duckdb_manager.get_table_row_count("material_usage")
    print(f"material_usage 共 {row_count} 行")
    if row_count == 0:
        print("SKIP: 表为空，跳过此测试")
        return
    df = duckdb_manager.query(
        "SELECT COUNT(*) as total, COUNT(usage_ratio) as has_ratio, "
        "SUM(CASE WHEN is_abnormal THEN 1 ELSE 0 END) as abnormal FROM material_usage"
    )
    print(df)
    ratio_count = df["has_ratio"][0]
    if ratio_count == 0:
        print("!!! usage_ratio 为空，触发 RiskEngine 重新检测并回写")
        engine = RiskEngine()
        result_df, alerts = engine.detect_material_abnormalities()
        print(f"回写完成，检测到异常 {len(alerts)} 条")
        df = duckdb_manager.query(
            "SELECT COUNT(*) as total, COUNT(usage_ratio) as has_ratio, "
            "SUM(CASE WHEN is_abnormal THEN 1 ELSE 0 END) as abnormal FROM material_usage"
        )
        print(df)
        assert df["has_ratio"][0] > 0, "usage_ratio 回写失败！"
    else:
        print("OK: usage_ratio 已有值")


def test_all_charts():
    print()
    print("=" * 60)
    print("4. 测试核心图表（含耗材异常图表）")
    print("=" * 60)
    th = RiskEngine().thresholds
    charts = ChartGenerator(th)
    date_to = date.today()
    date_from = date_to - timedelta(days=60)

    print("core metrics...")
    metrics = charts.get_core_metrics_cards(None, date_from, date_to)
    print("OK:", metrics)

    print("material abnormality chart...")
    fig = charts.get_material_abnormality_chart(None, date_from, date_to, top_n=10)
    print("OK: figure created, data count =", len(fig.data))

    print("recharge trend chart...")
    fig = charts.get_recharge_trend_chart(None, date_from, date_to, "day")
    print("OK")

    print("rating distribution chart...")
    fig = charts.get_rating_distribution_chart(None, date_from, date_to)
    print("OK")

    print("review tags chart...")
    fig = charts.get_review_tags_chart(None, date_from, date_to)
    print("OK")

    print("review delay timeline...")
    fig = charts.get_review_delay_timeline(None, date_from, date_to)
    print("OK")

    print("course consumption chart...")
    fig = charts.get_course_consumption_chart(None, top_n=10)
    print("OK")

    print("course consumption rate gauge...")
    fig = charts.get_course_consumption_rate_gauge(None)
    print("OK")

    print("alert summary chart...")
    fig = charts.get_alert_summary_chart(None)
    print("OK")


def test_report_details():
    print()
    print("=" * 60)
    print("5. 测试复盘报告明细查询")
    print("=" * 60)
    th = RiskEngine().thresholds
    report = ReviewReportGenerator(th)
    date_to = date.today()
    date_from = date_to - timedelta(days=60)

    details = report.get_material_abnormal_details(None, date_from, date_to)
    print(f"material abnormal details: {details.height} rows, columns={details.columns}")
    if details.height > 0:
        assert "ratio" in details.columns, "material_abnormal_details 缺少 ratio 列"
    print("OK")

    consumer_risk = report.get_consumer_risk_details(None)
    print(f"consumer risk details: {consumer_risk.height} rows, columns={consumer_risk.columns}")
    print("OK")


def test_ingestion_pipeline():
    print()
    print("=" * 60)
    print("6. 测试数据摄入管道 (无 MinIO 降级模式)")
    print("=" * 60)
    sample_data = pl.DataFrame([
        {
            "review_id": "RTEST002",
            "customer_id": "C0001",
            "store_name": "旗舰店",
            "order_id": "OTEST002",
            "service_name": "面部护理",
            "technician_name": "张技师",
            "rating": 5,
            "review_content": "非常好",
            "tags": "服务好,技师专业",
            "service_date": "2026-06-01",
            "review_submit_date": "2026-06-01 20:00:00",
            "sync_date": "2026-06-01 20:05:00",
        },
        {
            "review_id": "RTEST002",
            "customer_id": "C0001",
            "store_name": "旗舰店",
            "order_id": "OTEST002",
            "rating": 5,
            "service_date": "2026-06-01",
        },
    ])
    csv_bytes = sample_data.write_csv().encode()
    result = ingestion_pipeline.ingest(csv_bytes, "test_reviews.csv", "reviews", skip_minio=True)
    print("ingest result:", {k: v for k, v in result.items() if k != "errors"})
    if result.get("errors"):
        print("errors:", result["errors"])
    assert result["cleaned_rows"] == 1, f"去重失败！期望1行，实际{result['cleaned_rows']}行"
    assert result["inserted_rows"] == 1, f"入库失败！期望1行，实际{result['inserted_rows']}行"
    print("OK: 去重 1 条，入库 1 条 (minio_stored=%s)" % result["minio_stored"])


def test_data_cleaner_material_usage():
    print()
    print("=" * 60)
    print("7. 测试 DataCleaner.clean_material_usage 自动计算 usage_ratio")
    print("=" * 60)
    raw = pl.DataFrame([
        {
            "usage_id": "U_TEST_003",
            "material_code": "MAT001",
            "material_name": "测试耗材",
            "store_name": "旗舰店",
            "usage_quantity": 8.0,
            "standard_usage_quantity": 5.0,
            "transaction_date": "2026-06-01",
        },
        {
            "usage_id": "U_TEST_004",
            "material_code": "MAT002",
            "material_name": "测试耗材2",
            "store_name": "分店A",
            "usage_quantity": 3.0,
            "standard_usage_quantity": None,
            "transaction_date": "2026-06-02",
        },
    ])
    cleaned, stats = DataCleaner.clean_material_usage(raw)
    print(f"cleaned columns: {cleaned.columns}")
    print(cleaned)
    assert "usage_ratio" in cleaned.columns, "usage_ratio 列缺失！"
    assert "is_abnormal" in cleaned.columns, "is_abnormal 列缺失！"
    r1 = cleaned.filter(pl.col("usage_id") == "U_TEST_003")
    assert abs(r1["usage_ratio"][0] - 1.6) < 0.001, f"ratio 计算错误: {r1['usage_ratio'][0]}"
    r2 = cleaned.filter(pl.col("usage_id") == "U_TEST_004")
    assert r2["usage_ratio"][0] is None, "standard_usage_quantity 为 NULL 时 ratio 应为 NULL"
    print("OK: usage_ratio 自动计算正确")


def test_upsert_default_columns():
    print()
    print("=" * 60)
    print("8. 测试 upsert 时默认列处理 (is_abnormal, usage_ratio)")
    print("=" * 60)
    partial = pl.DataFrame([
        {
            "usage_id": "U_TEST_UPSERT",
            "material_code": "MAT001",
            "material_name": "测试耗材 upsert",
            "store_id": "S001",
            "usage_quantity": 10.0,
            "standard_usage_quantity": 5.0,
            "transaction_date": date(2026, 6, 10),
            "order_id": "O_UPSERT_001",
        },
    ])
    inserted = duckdb_manager.insert_dataframe("material_usage", partial, if_exists="upsert")
    assert inserted == 1, f"upsert 失败: inserted={inserted}"

    row = duckdb_manager.query_one(
        "SELECT usage_id, is_abnormal, usage_ratio, created_at FROM material_usage WHERE usage_id = ?",
        ["U_TEST_UPSERT"],
    )
    print("upsert result row:", row)
    assert row is not None, "upsert 后查不到数据"
    assert "created_at" in row and row["created_at"] is not None, "created_at 没有被 DB 自动填充"
    assert row["is_abnormal"] is not None, "is_abnormal 默认值没有补齐"
    print("OK: upsert 默认列处理正确 (created_at 由 DB 填充, is_abnormal 已补齐)")


def main():
    try:
        test_minio_fallback()
        test_material_usage_schema()
        test_usage_ratio_values()
        test_all_charts()
        test_report_details()
        test_ingestion_pipeline()
        test_data_cleaner_material_usage()
        test_upsert_default_columns()

        print()
        print("=" * 60)
        print("ALL TESTS PASSED ✅")
        print("=" * 60)
    except AssertionError as e:
        print()
        print("=" * 60)
        print(f"ASSERTION FAILED: {e}")
        print("=" * 60)
        raise
    except Exception as e:
        print()
        print("=" * 60)
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        raise


if __name__ == "__main__":
    main()
