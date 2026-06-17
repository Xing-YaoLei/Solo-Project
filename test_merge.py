import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import date
import importlib.util

spec = importlib.util.spec_from_file_location("app_merge_only", Path(__file__).parent / "app.py")
app_module = importlib.util.module_from_spec(spec)

import types
fake_st = types.ModuleType("streamlit")
fake_st.set_page_config = lambda **kw: None
sys.modules["streamlit"] = fake_st
fake_pl = types.ModuleType("polars")
fake_pl.DataFrame = lambda *a, **kw: None
sys.modules["polars"] = fake_pl
fake_px = types.ModuleType("plotly.express")
sys.modules["plotly.express"] = fake_px
fake_go = types.ModuleType("plotly.graph_objects")
sys.modules["plotly.graph_objects"] = fake_go
sys.modules["src"] = types.ModuleType("src")
sys.modules["src.data"] = types.ModuleType("src.data")
sys.modules["src.data.database"] = types.ModuleType("src.data.database")
sys.modules["src.data.storage"] = types.ModuleType("src.data.storage")
sys.modules["src.analysis"] = types.ModuleType("src.analysis")
sys.modules["src.analysis.conflict_detector"] = types.ModuleType("src.analysis.conflict_detector")
sys.modules["src.analysis.attendance_analyzer"] = types.ModuleType("src.analysis.attendance_analyzer")
sys.modules["src.utils"] = types.ModuleType("src.utils")
sys.modules["src.utils.mock_data"] = types.ModuleType("src.utils.mock_data")

spec.loader.exec_module(app_module)
merge_continuous_dates = app_module.merge_continuous_dates

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
