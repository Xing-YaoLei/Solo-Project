import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import date, timedelta
from src.data.database import DatabaseManager
from src.analysis.attendance_analyzer import AttendanceAnalyzer
from src.analysis.conflict_detector import ConflictDetector
import importlib

app_module = importlib.import_module("app")
merge_continuous_dates = app_module.merge_continuous_dates

print("=" * 60)
print(" 到场率区间顺序 + 冲突段合并验证")
print("=" * 60)

db = DatabaseManager()
analyzer = AttendanceAnalyzer(db)
detector = ConflictDetector(db)

today = date.today()
start = today - timedelta(days=30)
end = today
mid = start + timedelta(days=15)

prev_start = start
prev_end = mid
curr_start = mid + timedelta(days=1)
curr_end = end

print(f"\n日期范围: {start} ~ {end}")
print(f"  前期: {prev_start} ~ {prev_end}")
print(f"  后期: {curr_start} ~ {curr_end}")

comparison = analyzer.compare_periods(
    curr_start, curr_end,
    prev_start, prev_end
)

print("\n1. 验证区间顺序修正:")
print(f"  comparison['previous_period']['start'] = {comparison['previous_period']['start']}")
print(f"  期望 = {prev_start}")
assert str(comparison['previous_period']['start']) == str(prev_start), "前期 start 错误!"

print(f"  comparison['current_period']['start'] = {comparison['current_period']['start']}")
print(f"  期望 = {curr_start}")
assert str(comparison['current_period']['start']) == str(curr_start), "后期 start 错误!"

prev_rate = comparison['previous_period']['attendance_rate']
curr_rate = comparison['current_period']['attendance_rate']
print(f"  前期到场率: {prev_rate}%")
print(f"  后期到场率: {curr_rate}%")
print(f"  改善值 (后期 - 前期): {comparison['improvement']['absolute_diff']:+.2f}%")
print(f"  相对变化: {comparison['improvement']['relative_diff']:+.2f}%")
print(f"  是否改善: {comparison['improvement']['is_improved']}")
print("  ✅ 区间顺序正确")

print("\n2. 验证连续日期合并算法:")

# 测试用例1: 完全连续
dates1 = [date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 3), date(2026, 6, 4)]
segs1 = merge_continuous_dates(dates1)
print(f"  输入: {dates1}")
print(f"  输出: {segs1}")
assert len(segs1) == 1 and segs1[0] == (date(2026, 6, 1), date(2026, 6, 4)), "连续日期合并错误"
print("  ✅ 连续日期正确合并为 1 段")

# 测试用例2: 两段不连续
dates2 = [date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 5), date(2026, 6, 6)]
segs2 = merge_continuous_dates(dates2)
print(f"  输入: {dates2}")
print(f"  输出: {segs2}")
assert len(segs2) == 2, "分段数量错误"
assert segs2[0] == (date(2026, 6, 1), date(2026, 6, 2))
assert segs2[1] == (date(2026, 6, 5), date(2026, 6, 6))
print("  ✅ 两段不连续日期正确合并为 2 段")

# 测试用例3: 单日
dates3 = [date(2026, 6, 15)]
segs3 = merge_continuous_dates(dates3)
print(f"  输入: {dates3}")
print(f"  输出: {segs3}")
assert len(segs3) == 1 and segs3[0] == (date(2026, 6, 15), date(2026, 6, 15))
print("  ✅ 单日正确生成长度为 0.5*2 天的可见区段")

# 测试用例4: 真实数据
time_confs = detector.detect_time_slot_conflicts(start, end)
if len(time_confs) > 0:
    real_dates = []
    for d in time_confs["conflict_date"].to_list():
        if hasattr(d, 'date'):
            real_dates.append(d.date() if not isinstance(d, date) else d)
        else:
            real_dates.append(date.fromisoformat(str(d)))
    real_segs = merge_continuous_dates(real_dates)
    print(f"\n3. 真实冲突数据:")
    print(f"  冲突天数: {len(set(real_dates))}")
    print(f"  合并为区段数: {len(real_segs)}")
    for i, (s, e) in enumerate(real_segs, 1):
        duration = (e - s).days + 1
        print(f"    区段 {i}: {s} ~ {e} ({duration}天)")

db.close()
print("\n✅ 所有验证通过！")
