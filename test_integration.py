import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['DB_TYPE'] = 'sqlite'

from datetime import date, timedelta
from data_processing import (
    get_appointments_df, get_reschedule_df, get_schedules_df,
    get_conflicts_df, detect_conflicts, calculate_attendance_rate,
    calculate_capacity_utilization, get_multi_region_comparison,
    analyze_reschedule_impact, get_prev_period_dates, compute_period_over_period,
)

end = date.today()
start = end - timedelta(days=30)

print("=== 核心数据查询 ===")
appts = get_appointments_df(start, end)
print(f"预约: {len(appts)} 条, has region_name: {'region_name' in appts.columns}")

scheds = get_schedules_df(start, end)
print(f"排期: {len(scheds)} 条, has max_capacity: {'max_capacity' in scheds.columns}")

rescheds = get_reschedule_df(start, end)
print(f"改约: {len(rescheds)} 条")

conflicts_existing = get_conflicts_df(start, end)
print(f"已有冲突: {len(conflicts_existing)} 条")

print("\n=== 冲突检测 ===")
detected = detect_conflicts(appts, scheds, persist=True)
print(f"检测到冲突: {len(detected)} 条")
if not detected.empty:
    print(f"  类型分布: {detected['conflict_type'].value_counts().to_dict()}")

print("\n=== 同环比 ===")
prev_start, prev_end = get_prev_period_dates(start, end, mode='week')
print(f"上周对比期: {prev_start} ~ {prev_end}")

print("\n=== 业务指标 ===")
att_rate = calculate_attendance_rate(appts)
if not att_rate.empty:
    overall = att_rate['attendance_rate'].mean()
    print(f"平均到场率: {overall:.1f}%")

cap_util = calculate_capacity_utilization(scheds)
if not cap_util.empty:
    print(f"容量利用率: {cap_util['utilization_rate'].mean():.1f}%")

region_comp = get_multi_region_comparison(appts)
print(f"区域对比: {len(region_comp)} 个区域")

resched_impact = analyze_reschedule_impact(rescheds, appts)
print(f"改约影响分析: {list(resched_impact.keys())}")

print("\n=== 全部测试通过 ===")
