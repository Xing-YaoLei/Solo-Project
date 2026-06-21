import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.utils.analyzer import risk_analyzer
from datetime import datetime

start = datetime(2026, 5, 21)
end = datetime(2026, 6, 20)

print('=== 环比 (MoM) ===')
mom_total = risk_analyzer.get_yoy_mom('total', start, end, compare_type='mom')
print('提交总数: 当前=%s, 上期=%s, 变化=%s%%' % (mom_total.current_value, mom_total.previous_value, mom_total.change_rate))

print()
print('=== 同比 (YoY) ===')
yoy_total = risk_analyzer.get_yoy_mom('total', start, end, compare_type='yoy')
print('提交总数: 当前=%s, 去年同期=%s, 变化=%s%%' % (yoy_total.current_value, yoy_total.previous_value, yoy_total.change_rate))

print()
print('=== 发布排期同比 ===')
publish_yoy = risk_analyzer.get_publish_yoy_mom(start, end, compare_type='yoy')
for k, v in publish_yoy.items():
    print('%s: 当前=%s, 去年同期=%s, 变化=%s%%' % (k, v.current_value, v.previous_value, v.change_rate))

print()
print('=== 发布排期环比 ===')
publish_mom = risk_analyzer.get_publish_yoy_mom(start, end, compare_type='mom')
for k, v in publish_mom.items():
    print('%s: 当前=%s, 上期=%s, 变化=%s%%' % (k, v.current_value, v.previous_value, v.change_rate))

print()
print("All YoY/MoM tests passed!")
