from datetime import date, timedelta, datetime

# date + timedelta(0.5天) 的行为
d = date(2026, 6, 15)
x0 = d - timedelta(days=0.5)
x1 = d + timedelta(days=0.5)
print(f"date对象运算: x0={x0}, x1={x1}, diff days={(x1-x0).days}")

# datetime
dt = datetime(2026, 6, 15)
x0d = dt - timedelta(days=0.5)
x1d = dt + timedelta(days=0.5)
print(f"datetime运算: x0={x0d}, x1={x1d}, diff={x1d-x0d}")

# 验证: 用 x0=d-1, x1=d 对于单日会过宽(2天). 用 x0=d, x1=d+1 也不对
# plotly 的日期坐标轴上，相邻日期间距为1单位
# 所以正确做法: x0=d - 0.5, x1=d + 0.5 会产生宽度为 1 的矩形
# 但 Python date 只支持整数天。需要用字符串或 datetime。

# 改用 plotly 能识别的方式: 用 date 的字符串形式 ± 偏移, 或用 timestamp
# 更简单: 对 date 类型, x0 = d - 1天, x1 = d, 然后 line_dash="dot" border
# 或者用 mid_date 的概念。对于单日 d，用 x0 = d, x1 = d + 1 day, 但 border 会占下一天的一半。
# 最佳: 将 date 转为 datetime 来处理

# 方案验证:
print()
print("用 datetime 进行日期偏移:")
print(f"单日 {d}: x0={datetime(d.year, d.month, d.day) - timedelta(hours=12)}, x1={datetime(d.year, d.month, d.day) + timedelta(hours=12)}")

# 对于连续日期段 [d1, d2], 整个区间应该是 d1-12h 到 d2+12h
d1 = date(2026, 6, 10)
d2 = date(2026, 6, 12)
seg_x0 = datetime(d1.year, d1.month, d1.day) - timedelta(hours=12)
seg_x1 = datetime(d2.year, d2.month, d2.day) + timedelta(hours=12)
print(f"区段 {d1}~{d2}: x0={seg_x0}, x1={seg_x1}, 覆盖3整天")

# 但 plotly 不支持 date 和 datetime 混合，需要统一类型
# 最简单: 直接用 timedelta(days=1) 对 x0 和 x1 做整数偏移
# 单日: x0 = d - 1天 (即前一天), x1 = d, 不对, 这样占两天中间。
# 或者: x0 = d, x1 = d + timedelta(days=1) 也是两天
# 实际上 plotly 的 date 轴上每个日期位置为整数: d1=0, d2=1, d3=2...
# 那么 d 这个点的左边界为 d-0.5, 右边界为 d+0.5
# 所以我们应该传 datetime 类型给 plotly，以获得小数天精度
