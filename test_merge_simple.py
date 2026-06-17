from datetime import date, timedelta


def merge_continuous_dates(dates):
    if not dates:
        return []
    sorted_dates = sorted(set(dates))
    segments = []
    seg_start = sorted_dates[0]
    seg_end = sorted_dates[0]
    for d in sorted_dates[1:]:
        if (d - seg_end).days == 1:
            seg_end = d
        else:
            segments.append((seg_start, seg_end))
            seg_start = d
            seg_end = d
    segments.append((seg_start, seg_end))
    return segments


print("测试 merge_continuous_dates 算法:")

dates1 = [date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 3), date(2026, 6, 4)]
segs1 = merge_continuous_dates(dates1)
assert len(segs1) == 1 and segs1[0] == (date(2026, 6, 1), date(2026, 6, 4))
print(f"  ✅ 连续4天: {segs1}")

dates2 = [date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 5), date(2026, 6, 6)]
segs2 = merge_continuous_dates(dates2)
assert len(segs2) == 2
assert segs2[0] == (date(2026, 6, 1), date(2026, 6, 2))
assert segs2[1] == (date(2026, 6, 5), date(2026, 6, 6))
print(f"  ✅ 两段分开: {segs2}")

dates3 = [date(2026, 6, 15)]
segs3 = merge_continuous_dates(dates3)
assert len(segs3) == 1 and segs3[0] == (date(2026, 6, 15), date(2026, 6, 15))
print(f"  ✅ 单日: {segs3}")

dates4 = [date(2026, 6, 1), date(2026, 6, 3), date(2026, 6, 5), date(2026, 6, 7)]
segs4 = merge_continuous_dates(dates4)
assert len(segs4) == 4
print(f"  ✅ 4个单日: {segs4}")

dates5 = [date(2026, 6, 10), date(2026, 6, 11), date(2026, 6, 12), date(2026, 6, 15), date(2026, 6, 16), date(2026, 6, 20)]
segs5 = merge_continuous_dates(dates5)
assert len(segs5) == 3
print(f"  ✅ 3段混合: {segs5}")

print("\n✅ 所有日期合并算法测试通过")
print()
print("vrect 宽度演示 (x0=start-0.5d, x1=end+0.5d):")
for s, e in segs5:
    x0 = s - timedelta(days=0.5)
    x1 = e + timedelta(days=0.5)
    print(f"  {s} ~ {e}: x0={x0}, x1={x1}, 宽度={(x1 - x0).days + 1}天")
