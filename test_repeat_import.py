"""测试重复导入 - 验证主键不冲突、数据保留正常"""
from datetime import date, timedelta
import polars as pl
from src.config import load_config
from src.etl.pipeline import ETLPipeline

print("=" * 60)
print("测试重复导入 - 主键不冲突、数据保留")
print("=" * 60)

config = load_config()

with ETLPipeline(config) as pipeline:
    print("\n1. 清理旧数据...")
    pipeline.db.execute_query("DELETE FROM attendance_rate_metrics")
    pipeline.db.execute_query("DELETE FROM inventory_anomaly_notes")
    pipeline.db.execute_query("DELETE FROM technician_schedules")
    pipeline.db.execute_query("DELETE FROM service_cards")
    pipeline.db.execute_query("DELETE FROM recharge_transactions")
    pipeline.db.execute_query("DELETE FROM appointments")
    pipeline.db.execute_query("DELETE FROM reviews")
    pipeline.db.execute_query("DELETE FROM inventory")
    pipeline.db.execute_query("DELETE FROM etl_batches")
    print("   ✓ 旧数据已清理")

    end_date = date.today()

    def make_data(offset_days=0):
        """生成测试数据，offset_days 用于区分不同批次"""
        base = end_date - timedelta(days=offset_days)
        inv = pl.DataFrame({
            "product_code": [f"SKU{offset_days:03d}_1", f"SKU{offset_days:03d}_2"],
            "product_name": [f"商品{offset_days}-A", f"商品{offset_days}-B"],
            "category": ["面部护理", "身体护理"],
            "stock_quantity": [100 + offset_days, 50 + offset_days],
            "unit_price": [298.0, 368.0],
            "cost_price": [150.0, 180.0],
            "supplier": ["供应商A", "供应商B"],
            "expiry_date": [(base + timedelta(days=365)).isoformat()] * 2,
            "store": ["总店", "朝阳店"],
            "is_consumable": [True, True],
        })
        rev = pl.DataFrame({
            "customer_id": [f"C{offset_days:03d}_1", f"C{offset_days:03d}_2"],
            "customer_name": [f"顾客{offset_days}-1", f"顾客{offset_days}-2"],
            "order_id": [f"ORD{offset_days:03d}_1", f"ORD{offset_days:03d}_2"],
            "rating": [5, 4],
            "review_tags": ["服务好", "环境舒适"],
            "review_text": ["很好", "不错"],
            "technician": ["张技师", "李技师"],
            "service_item": ["面部护理", "身体护理"],
            "category": ["面部护理", "身体护理"],
            "store": ["总店", "朝阳店"],
            "review_date": [base.isoformat(), base.isoformat()],
        })
        return inv, rev

    print("\n2. 第一次导入 (批次 1)...")
    inv1, rev1 = make_data(1)
    results1 = pipeline.run_full_pipeline(
        inventory_df=inv1,
        reviews_df=rev1,
    )
    stats1 = pipeline.db.get_summary_stats()
    print(f"   inventory: {stats1.get('inventory', 0)} 条")
    print(f"   reviews: {stats1.get('reviews', 0)} 条")

    print("\n3. 第二次导入 (批次 2)...")
    inv2, rev2 = make_data(2)
    results2 = pipeline.run_full_pipeline(
        inventory_df=inv2,
        reviews_df=rev2,
    )
    stats2 = pipeline.db.get_summary_stats()
    print(f"   inventory: {stats2.get('inventory', 0)} 条 (预期: 4)")
    print(f"   reviews: {stats2.get('reviews', 0)} 条 (预期: 4)")

    inv_ok = stats2.get('inventory', 0) == 4
    rev_ok = stats2.get('reviews', 0) == 4

    print("\n4. 验证主键唯一性...")
    inv_ids = pipeline.db.execute_query("SELECT id FROM inventory ORDER BY id").to_series().to_list()
    rev_ids = pipeline.db.execute_query("SELECT id FROM reviews ORDER BY id").to_series().to_list()
    print(f"   inventory ids: {inv_ids}")
    print(f"   reviews ids: {rev_ids}")
    
    inv_unique = len(inv_ids) == len(set(inv_ids))
    rev_unique = len(rev_ids) == len(set(rev_ids))
    print(f"   inventory 主键唯一: {'✓' if inv_unique else '✗'}")
    print(f"   reviews 主键唯一: {'✓' if rev_unique else '✗'}")

    print("\n5. 验证批次回查...")
    batches = pipeline.get_batch_history()
    print(f"   批次总数: {len(batches)} (预期: >=4)")
    if len(batches) >= 4:
        print("   ✓ 多个批次记录保留正常")
    else:
        print("   ✗ 批次记录不足")

    print("\n6. 验证消课率指标...")
    metrics = pipeline.db.get_attendance_metrics()
    print(f"   消课率指标: {len(metrics)} 条")
    if not metrics.is_empty():
        metric_ids = metrics["id"].to_list()
        print(f"   指标 ids: {sorted(metric_ids)}")
        print(f"   主键唯一: {'✓' if len(metric_ids) == len(set(metric_ids)) else '✗'}")

    all_ok = inv_ok and rev_ok and inv_unique and rev_unique and len(batches) >= 4

    if all_ok:
        print("\n" + "=" * 60)
        print("✓ 重复导入测试通过！主键不冲突，数据保留正常。")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ 测试失败，请检查上述输出。")
        print("=" * 60)
