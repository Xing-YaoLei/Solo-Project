"""端到端测试：模拟从数据导入页点击「生成示例数据并运行ETL」，验证累积效果"""
from datetime import date, timedelta
from src.config import load_config
from src.etl.pipeline import ETLPipeline
from scripts.generate_sample_data import (
    generate_inventory, generate_reviews, generate_appointments,
    generate_recharge, generate_service_cards, generate_schedules,
)

print("=" * 70)
print("端到端测试：重复点击「生成示例数据并运行ETL」验证累积效果")
print("=" * 70)

config = load_config()

def generate_sample_data():
    """模拟 app.py 中的 generate_sample_data 函数（完全一致）"""
    end_date = date.today()
    start_date = end_date - timedelta(days=90)
    
    inv_df = generate_inventory(start_date, end_date)
    rev_df = generate_reviews(start_date, end_date, 200)
    appt_df = generate_appointments(start_date, end_date, 500)
    recharge_df = generate_recharge(start_date, end_date, 150)
    cards_df = generate_service_cards(start_date, end_date, 120)
    schedules_df = generate_schedules(start_date, end_date)
    
    return {
        "inventory": inv_df,
        "reviews": rev_df,
        "appointments": appt_df,
        "recharge": recharge_df,
        "service_cards": cards_df,
        "schedules": schedules_df,
    }

def get_display_stats(db):
    """获取管理层总览显示的统计数据"""
    stats = db.get_summary_stats()
    metrics = db.get_attendance_metrics()
    return stats, len(metrics)

with ETLPipeline(config) as pipeline:
    print("\n" + "=" * 70)
    print("【第一次点击】生成示例数据并运行ETL")
    print("=" * 70)
    
    print("\n步骤1: 清理数据库（模拟全新状态）...")
    pipeline.db.execute_query("DELETE FROM attendance_rate_metrics")
    pipeline.db.execute_query("DELETE FROM inventory_anomaly_notes")
    pipeline.db.execute_query("DELETE FROM technician_schedules")
    pipeline.db.execute_query("DELETE FROM service_cards")
    pipeline.db.execute_query("DELETE FROM recharge_transactions")
    pipeline.db.execute_query("DELETE FROM appointments")
    pipeline.db.execute_query("DELETE FROM reviews")
    pipeline.db.execute_query("DELETE FROM inventory")
    pipeline.db.execute_query("DELETE FROM etl_batches")
    print("   ✓ 数据库已清空")
    
    print("\n步骤2: 第一次生成并导入示例数据...")
    data1 = generate_sample_data()
    results1 = pipeline.run_full_pipeline(
        inventory_df=data1["inventory"],
        reviews_df=data1["reviews"],
        appointments_df=data1["appointments"],
        recharge_df=data1["recharge"],
        service_cards_df=data1["service_cards"],
        schedules_df=data1["schedules"],
    )
    
    stats1, metrics1 = get_display_stats(pipeline.db)
    batches1 = pipeline.get_batch_history()
    print("\n第一次导入后数据统计（管理层总览显示）:")
    for t, c in stats1.items():
        print(f"  {t:25s}: {c:4d} 条")
    print(f"  {'消课率指标':25s}: {metrics1:4d} 条")
    print(f"  {'批次回查':25s}: {len(batches1):4d} 条")
    
    print("\n" + "=" * 70)
    print("【第二次点击】从数据导入页再次点击「生成示例数据并运行ETL」")
    print("=" * 70)
    
    print("\n步骤3: 第二次生成并导入示例数据（模拟用户点击按钮）...")
    data2 = generate_sample_data()
    results2 = pipeline.run_full_pipeline(
        inventory_df=data2["inventory"],
        reviews_df=data2["reviews"],
        appointments_df=data2["appointments"],
        recharge_df=data2["recharge"],
        service_cards_df=data2["service_cards"],
        schedules_df=data2["schedules"],
    )
    
    stats2, metrics2 = get_display_stats(pipeline.db)
    batches2 = pipeline.get_batch_history()
    print("\n第二次导入后数据统计（管理层总览显示）:")
    for t, c in stats2.items():
        delta = c - stats1.get(t, 0)
        print(f"  {t:25s}: {c:4d} 条 (+{delta})")
    print(f"  {'消课率指标':25s}: {metrics2:4d} 条 (+{metrics2 - metrics1})")
    print(f"  {'批次回查':25s}: {len(batches2):4d} 条 (+{len(batches2) - len(batches1)})")
    
    print("\n" + "=" * 70)
    print("【验证】主键不冲突、数据正常累积")
    print("=" * 70)
    
    tables = ["inventory", "reviews", "appointments", "recharge_transactions", "service_cards", "technician_schedules"]
    all_ok = True
    
    for table in tables:
        ids = pipeline.db.execute_query(f"SELECT id FROM {table} ORDER BY id")["id"].to_list()
        is_unique = len(ids) == len(set(ids))
        expected = stats2.get(table, 0)
        actual = len(ids)
        ok = is_unique and actual == expected
        all_ok = all_ok and ok
        status = "✓" if ok else "✗"
        print(f"  {table:25s}: ids={sorted(ids)[:10]}... (共{actual}条), 唯一={is_unique}, 总数正确={actual == expected} {status}")
    
    metric_ids = pipeline.db.execute_query("SELECT id FROM attendance_rate_metrics ORDER BY id")["id"].to_list()
    metric_ok = len(metric_ids) == len(set(metric_ids)) and len(metric_ids) == metrics2
    all_ok = all_ok and metric_ok
    print(f"  {'消课率指标':25s}: ids={sorted(metric_ids)}, 唯一={len(metric_ids) == len(set(metric_ids))} {'✓' if metric_ok else '✗'}")
    
    print("\n【验证】批次回查保留所有批次:")
    batch_summary = batches2.group_by(["data_type"]).agg(pl.len().alias("count"))
    for row in batch_summary.to_dicts():
        print(f"  {row['data_type']:25s}: {row['count']} 个批次")
    
    print("\n【验证】消课率指标包含所有技师数据:")
    metric_techs = pipeline.db.execute_query("""
        SELECT technician, COUNT(*) as cnt, AVG(attendance_rate) as avg_rate
        FROM attendance_rate_metrics
        GROUP BY technician
        ORDER BY technician
    """)
    for row in metric_techs.to_dicts():
        print(f"  {row['technician']:10s}: {row['cnt']} 条记录, 平均消课率 {row['avg_rate']:.1%}")
    
    if all_ok and len(batches2) > len(batches1) and metrics2 > metrics1:
        print("\n" + "=" * 70)
        print("✓ 端到端测试通过！")
        print("  - 重复导入主键不冲突")
        print("  - 管理层总览显示累积数据")
        print("  - 批次回查保留新增批次")
        print("  - 消课率指标持续累积")
        print("=" * 70)
    else:
        print("\n" + "=" * 70)
        print("✗ 测试失败，请检查上述输出。")
        print("=" * 70)
