#!/usr/bin/env python3
"""初始化数据库并导入模拟数据"""

import sys
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import polars as pl
from datetime import datetime

from data_layer import DataRepository, DuckDBEngine
from sync_pipeline import SyncPipeline, DesignExportSync, PaymentRecordSync, PurchaseOrderSync
from data_generator import generate_all_data
from config import DataSource


def _safe_write(engine, table_name, df):
    if df.height == 0:
        return
    if "id" not in df.columns:
        df = df.with_columns(
            pl.Series([str(uuid.uuid4())[:8] for _ in range(df.height)]).alias("id")
        )
    now = datetime.now()
    if "created_at" not in df.columns:
        df = df.with_columns(pl.lit(now).alias("created_at"))
    if "updated_at" not in df.columns:
        df = df.with_columns(pl.lit(now).alias("updated_at"))
    engine.write_df(table_name, df, mode="overwrite")
    print(f"   ✅ {table_name}: {df.height} 条")


def init_database():
    print("=" * 60)
    print("🏗️  家装工地客户确认风险监测系统 - 数据初始化")
    print("=" * 60)

    print("\n📦 初始化数据库...")
    engine = DuckDBEngine()
    print("✅ 数据库表结构已创建")

    repo = DataRepository(engine)

    print("\n📊 生成模拟数据（包含资料缺失样本）...")
    data = generate_all_data()

    design_df = data["design_exports"]
    payment_df = data["payment_records"]
    purchase_df = data["purchase_orders"]
    attach_df = data["attachments"]
    timeline_df = data["change_timeline"]
    auth_df = data["auth_scopes"]

    print(f"   - design_exports 原始: {design_df.height} 条")
    print(f"   - payment_records 原始: {payment_df.height} 条")
    print(f"   - purchase_orders 原始: {purchase_df.height} 条")
    print(f"   - attachments 原始: {attach_df.height} 条")
    print(f"   - change_timeline 原始: {timeline_df.height} 条")
    print(f"   - auth_scopes 原始: {auth_df.height} 条")

    print("\n🔄 同步三路数据（带批次追踪）...")
    pipeline = SyncPipeline(repo)
    pipeline.register(DesignExportSync(repo, mock_data=design_df))
    pipeline.register(PaymentRecordSync(repo, mock_data=payment_df))
    pipeline.register(PurchaseOrderSync(repo, mock_data=purchase_df))

    results = pipeline.run_all(refresh_confirmations=False)
    for src, res in results.items():
        status_icon = "✅" if res.status == "成功" else "⚠️" if res.status == "部分成功" else "❌"
        print(f"   {status_icon} {res.data_source_label}: {res.status} "
              f"(成功 {res.success_count}/{res.total_count}, 失败 {res.failed_count})")

    print("\n📎 写入附件材料...")
    _safe_write(engine, "attachments", attach_df)

    print("\n📜 写入变更时间线...")
    _safe_write(engine, "change_timeline", timeline_df)

    print("\n👤 写入授权范围...")
    _safe_write(engine, "auth_scopes", auth_df)

    print("\n🔄 刷新项目确认状态...")
    repo.refresh_project_confirmations()

    confirmations = repo.get_project_confirmations()
    print(f"   ✅ project_confirmations: {confirmations.height} 条")
    if confirmations.height > 0 and "overall_completeness" in confirmations.columns:
        avg_comp = confirmations["overall_completeness"].mean()
        print(f"   📈 平均完整率: {avg_comp:.2f}%")

    print("\n� 检查资料缺失样本...")
    missing = repo.get_missing_data_samples()
    if missing.height > 0:
        print(f"   ⚠️  发现 {missing.height} 条资料缺失记录（用于跳转展示）")
        if "data_source" in missing.columns:
            src_counts = missing.group_by("data_source").agg(pl.count("id").alias("cnt")).to_dicts()
            for sc in src_counts:
                label = {
                    "design_export": "设计软件导出",
                    "payment_record": "收款记录",
                    "purchase_order": "采购单记录",
                }.get(sc["data_source"], sc["data_source"])
                print(f"      - {label}: {sc['cnt']} 条")
    else:
        print("   ⚠️  未生成缺失样本，手动注入...")
        missing_design = pl.DataFrame({
            "id": [str(uuid.uuid4())[:8]],
            "project_id": [design_df["project_id"][0] if design_df.height > 0 else "PRJ001"],
            "project_name": [design_df["project_name"][0] if design_df.height > 0 and "project_name" in design_df.columns else "测试项目"],
            "region": ["华东区"],
            "customer_id": [None],
            "customer_name": [None],
            "design_version": [None],
            "export_time": [None],
            "file_path": [None],
            "file_size": [None],
            "confirmation_status": ["待确认"],
            "confirmed_by": [None],
            "confirmed_at": [None],
            "batch_id": [f"design_export_{datetime.now().strftime('%Y%m%d')}_missing"],
            "is_missing": [True],
            "missing_fields": ["design_version,export_time,file_path"],
        })
        engine.write_df("design_exports", missing_design)
        repo.refresh_project_confirmations()
        missing = repo.get_missing_data_samples()
        print(f"   ✅ 已注入缺失样本，当前共 {missing.height} 条")

    print("\n✅ 验证所有数据表...")
    tables = [
        "design_exports",
        "payment_records",
        "purchase_orders",
        "project_confirmations",
        "attachments",
        "change_timeline",
        "auth_scopes",
        "sync_batches",
    ]
    for t in tables:
        try:
            count = engine.query_df(f"SELECT COUNT(*) as cnt FROM {t}")["cnt"][0]
            mark = "✅" if count > 0 else "⚠️"
            print(f"   {mark} {t}: {count} 条")
        except Exception as e:
            print(f"   ❌ {t}: 查询失败 - {e}")

    print("\n" + "=" * 60)
    print("🎉 数据初始化完成！")
    print("=" * 60)
    print(f"\n💾 数据库文件: {engine.db_path}")
    print(f"\n🚀 启动应用: streamlit run app.py")
    print()


if __name__ == "__main__":
    init_database()
