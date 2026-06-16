import json
import pandas as pd
import numpy as np
from datetime import datetime

from dashboard.callbacks.main_callbacks import _safe_to_records

df = pd.DataFrame({
    "id": [1, 2, 3],
    "name": ["Alice", None, "Charlie"],
    "date_col": pd.to_datetime(["2024-01-01", pd.NaT, "2024-01-03"]),
    "amount": [100.0, float("nan"), 300.0],
    "is_active": [True, False, None],
    "data_snapshot": [{"key": 1}, None, {"key": 3}],
})
result = _safe_to_records(df)
json_str = json.dumps(result, ensure_ascii=False)
print(f"Complex DataFrame serialization OK: {len(json_str)} bytes")
print(f"Record 0: {result[0]}")
print(f"Record 1: {result[1]}")

assert result[1]["name"] is None
assert result[1]["date_col"] is None
assert result[1]["data_snapshot"] is None
print("NaT/NaN values correctly converted to None")

df2 = pd.DataFrame({
    "appointment_no": ["A001", "A002"],
    "status": ["已完成", "爽约"],
    "his_sync_time": pd.to_datetime(["2024-01-01 10:00:00", pd.NaT]),
    "amount": [200.0, 0],
})
result2 = _safe_to_records(df2)
json_str2 = json.dumps(result2, ensure_ascii=False)
print(f"Appointment DataFrame OK: {len(json_str2)} bytes")
print(f"Record 0: {result2[0]}")
print(f"Record 1: {result2[1]}")

print()
print("ALL DETAILED CHECKS PASSED")
