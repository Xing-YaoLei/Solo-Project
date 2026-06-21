import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.utils.analyzer import risk_analyzer
from src.data.pipeline import pipeline_manager

print("=== Test 1: get_delay_annotations ===")
annotations = risk_analyzer.get_delay_annotations()
print(f"Annotation count: {len(annotations)}")
for a in annotations:
    print(f"  {a['source_name']}: date={a['date']}, delay={a['delay_hours']}h, label={a['label']}, detail={a['detail']}")

print()
print("=== Test 2: pipeline_status ===")
status = pipeline_manager.get_pipeline_status()
for s in status:
    print(f"  {s['source_name']}: is_delayed={s['is_delayed']}, delay_hours={s['delay_hours']}, last_sync={s.get('last_sync_time')}")

print()
print("=== Test 3: ui_components import ===")
from src.utils.ui_components import plot_line_chart
import inspect
sig = inspect.signature(plot_line_chart)
print(f"plot_line_chart params: {list(sig.parameters.keys())}")

print()
print("=== Test 4: daily_trend with annotations ===")
from datetime import datetime, timedelta
trend = risk_analyzer.get_daily_trend(30)
print(f"Trend rows: {trend.shape[0]}, cols: {trend.columns}")

print()
print("All core tests passed!")
