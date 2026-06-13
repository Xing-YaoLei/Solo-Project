"""快速验证：重复导入示例数据的累积效果"""
from datetime import date, timedelta
from src.config import load_config
from src.etl.pipeline import ETLPipeline
from scripts.generate_sample_data import (
    generate_inventory, generate_reviews, generate_appointments,
    generate_recharge, generate_service_cards, generate_schedules,
)

config = load_config()

print("=" * 60)
print("快速验证：重复导入累积效果")
print("=" * 60)

def gen_small_data():
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    return {
        "inv": generate_inventory(start_date, end_date),
        "rev": generate_reviews(start_date, end_date, 20),
        "appt": generate_appointments(start_date, end_date, 50),
        "recharge": generate_recharge(start_date, end_date, 15),
        "cards": generate_service_cards(start_date, end_date, 12),
        "sched": generate_schedules(start_date, end_date),
    }

with ETLPipeline(config) as p:
    p.db.execute_query("DELETE FROM attendance_rate_metrics")
    p.db.execute_query("DELETE FROM inventory")
    p.db.execute_query("DELETE FROM reviews")
    p.db.execute_query("DELETE FROM etl_batches")

    print("\n【第一次导入】")
    d1 = gen_small_data()
    r1 = p.run_full_pipeline(d1["inv"], d1["rev"], d1["appt"], d1["recharge"], d1["cards"], d1["sched"])
    s1 = p.db.get_summary_stats()
    m1 = len(p.db.get_attendance_metrics())
    b1 = len(p.get_batch_history())
    print(f"  inventory: {s1.get('inventory',0)}, reviews: {s1.get('reviews',0)}, appt: {s1.get('appointments',0)}")
    print(f"  消课率指标: {m1} 条, 批次: {b1} 条")

    print("\n【第二次导入】")
    d2 = gen_small_data()
    r2 = p.run_full_pipeline(d2["inv"], d2["rev"], d2["appt"], d2["recharge"], d2["cards"], d2["sched"])
    s2 = p.db.get_summary_stats()
    m2 = len(p.db.get_attendance_metrics())
    b2 = len(p.get_batch_history())
    print(f"  inventory: {s2.get('inventory',0)}, reviews: {s2.get('reviews',0)}, appt: {s2.get('appointments',0)}")
    print(f"  消课率指标: {m2} 条, 批次: {b2} 条")

    print("\n【验证】")
    tables = ["inventory", "reviews", "appointments"]
    ok = True
    for t in tables:
        ids = p.db.execute_query(f"SELECT id FROM {t}")["id"].to_list()
        unique = len(ids) == len(set(ids))
        expected = s2.get(t, 0)
        print(f"  {t}: {len(ids)} 条, 主键唯一: {unique}, 总数正确: {len(ids) == expected}")
        ok = ok and unique and (len(ids) == expected)
    
    m_ok = m2 > m1 and b2 > b1
    print(f"  消课率增长: {m2} > {m1} = {m2 > m1}, 批次增长: {b2} > {b1} = {b2 > b1}")
    
    if ok and m_ok:
        print("\n✓ 验证通过！重复导入主键不冲突，数据累积正常")
    else:
        print("\n✗ 验证失败")
