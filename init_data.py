#!/usr/bin/env python3
"""初始化数据库并导入模拟数据"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from data_layer import DataRepository, DuckDBEngine
from sync_pipeline import SyncPipeline, DesignExportSync, PaymentRecordSync, PurchaseOrderSync
from data_generator import generate_all_data, generate_attachments, generate_change_timeline, generate_auth_scopes
import polars as pl


def init_database():
    print("=" * 60)
    print("🏗️  家装工地客户确认风险监测系统 - 数据初始化")
    print("=" * 60)

    print("\n📦 初始化数据库...")
    engine = DuckDBEngine()
    print("✅ 数据库表结构已创建")

    repo = DataRepository(engine)

    print("\n📊 生成模拟数据...")
    data = generate_all_data()
    print(f"   - 设计软件导出：{data['design_exports'].height} 条")
    print(f"   - 收款记录：{data['payment_records'].height} 条")
    print(f"   - 采购单记录：{data['purchase_orders'].height} 条")
    print(f"   - 附件材料：{data['attachments'].height} 条")
    print(f"   - 变更时间线：{data['change_timeline'].height} 条")
    print(f"   - 授权范围：{data['auth_scopes'].height} 条")

    print("\n🔄 同步数据...")
    pipeline = SyncPipeline(repo)
    pipeline.register(DesignExportSync(repo, mock_data=data["design_exports"]))
    pipeline.register(PaymentRecordSync(repo, mock_data=data["payment_records"]))
    pipeline.register(PurchaseOrderSync(repo, mock_data=data["purchase_orders"]))

    results = pipeline.run_all(refresh_confirmations=False)
    for src, res in results.items():
        print(f"   ✅ {res.data_source_label}: {res.status} "
              f"(成功 {res.success_count}/{res.total_count}, 失败 {res.failed_count})")

    print("\n📎 写入附件数据...")
    attach_df = data["attachments"]
    if "id" not in attach_df.columns:
        import uuid
        attach_df = attach_df.with_columns(
            pl.Series([str(uuid.uuid4())[:8] for _ in range(attach_df.height)]).alias("id")
        )
    engine.write_df("attachments", attach_df, mode="overwrite")
    print(f"   ✅ 附件材料：{attach_df.height} 条")

    print("\n📜 写入变更时间线...")
    timeline_df = data["change_timeline"]
    if "id" not in timeline_df.columns:
        import uuid
        timeline_df = timeline_df.with_columns(
            pl.Series([str(uuid.uuid4())[:8] for _ in range(timeline_df.height)]).alias("id")
        )
    engine.write_df("change_timeline", timeline_df, mode="overwrite")
    print(f"   ✅ 变更记录：{timeline_df.height} 条")

    print("\n👤 写入授权范围...")
    auth_df = data["auth_scopes"]
    engine.write_df("auth_scopes", auth_df, mode="overwrite")
    print(f"   ✅ 授权范围：{auth_df.height} 条")

    print("\n🔄 刷新项目确认状态...")
    repo.refresh_project_confirmations()

    confirmations = repo.get_project_confirmations()
    print(f"   ✅ 项目确认记录：{confirmations.height} 条")
    if confirmations.height > 0:
        avg_comp = confirmations["overall_completeness"].mean()
        print(f"   📈 平均完整率：{avg_comp:.2f}%")

    missing = repo.get_missing_data_samples()
    if missing.height > 0:
        print(f"   ⚠️  资料缺失记录：{missing.height} 条")
    else:
        print(f"   ✅ 无资料缺失记录")

    print("\n" + "=" * 60)
    print("🎉 数据初始化完成！")
    print("=" * 60)
    print(f"\n💾 数据库文件：{engine.db_path}")
    print(f"\n🚀 启动应用：streamlit run app.py")
    print()


if __name__ == "__main__":
    init_database()
