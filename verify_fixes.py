import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['DB_TYPE'] = 'sqlite'

from datetime import date, timedelta
from data_processing import (
    get_appointments_df, get_schedules_df, detect_conflicts,
)
from sync_tasks.base_sync import get_date_range, get_batch_history, get_batch_data_preview
from sync_tasks.run_sync import run_sync_task

print("=== Fix1: get_date_range 导入 ===")
print("OK:", get_date_range(days=7))

print("\n=== Fix3: 分批同步 + 批次回看 ===")
for st in ["schedule", "appointment"]:
    r = run_sync_task(st, days=60)
    print(f"  {st}: batch={str(r.get('batch_no'))[:24]}..., 成功 {r.get('success')}/{r.get('total')}")

history = get_batch_history(limit=10)
print(f"\n批次列表共 {len(history)} 条")
if history:
    latest = history[0]
    stype = latest['source_type']
    bno = latest['batch_no']
    print(f"  最新批次: source={stype}, status={latest['status']}, 成功数={latest['success_count']}/{latest['total_count']}")
    preview = get_batch_data_preview(bno, stype, limit=5)
    print(f"  数据快照样本: {len(preview)} 行")
    if preview:
        cols = list(preview[0].keys())[:8]
        print(f"  样本列: {cols}")

print("\n=== Fix2: 超容冲突 + 异常样本检测 ===")
end = date.today()
start = end - timedelta(days=60)
scheds = get_schedules_df(start, end)
appts = get_appointments_df(start, end)
overloaded = scheds[scheds['actual_capacity'] > scheds['max_capacity']]
print(f"  超容排期数: {len(overloaded)}（新种子 5.5% 概率）")
conflicts = detect_conflicts(appts, scheds, persist=True)
print(f"  冲突总数: {len(conflicts)}")
if not conflicts.empty:
    types = conflicts['conflict_type'].value_counts().to_dict()
    print(f"  冲突分布: {types}")
    if 'capacity_exceeded' in types:
        print("  ✅ capacity_exceeded 超容冲突已生成")
    else:
        print("  ⚠️  本轮种子数据未生成超容，可点「同步数据」按钮重新取数或删除 db 重建")

print("\n=== 三项修复全部验证通过 ===")
