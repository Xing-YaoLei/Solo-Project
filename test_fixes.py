import json
import pandas as pd
import numpy as np

from config import settings
print("Config OK")

from database import Base, SessionLocal, Patient, Appointment, PaymentDetail, ImageAttachment, AnomalyMarker, Remark, HisCaliberChange, RefreshLog, AppointmentStatus, AnomalyType
print("Database OK")

from etl import DataQuerier, DataTransformer, FunnelAnalyzer, AnomalyDetector, MetricsCalculator
print("ETL OK")

from dashboard.app import app, server
print("Dashboard app OK")

from dashboard.layouts import serve_layout, FunnelDashboard, ImagesView, PaymentsView, PatientsView, ReviewView
print("Layouts OK")

from dashboard.callbacks import register_callbacks
print("Callbacks OK")

from dashboard.callbacks.main_callbacks import _safe_to_records

df = pd.DataFrame({
    "a": [1, pd.NA, 3],
    "b": pd.to_datetime(["2024-01-01", pd.NaT, "2024-01-03"]),
    "c": ["x", None, "z"],
    "d": [{"key": 1}, None, {"key": 3}],
})
result = _safe_to_records(df)
json_str = json.dumps(result, ensure_ascii=False)
print(f"Safe serialization OK: {len(json_str)} bytes")

df_empty = pd.DataFrame()
result_empty = _safe_to_records(df_empty)
assert result_empty == [], f"Empty DataFrame should return [], got {result_empty}"
print("Empty DataFrame OK")

df_nat = pd.DataFrame({
    "date_col": pd.to_datetime(["2024-01-01", pd.NaT]),
    "num_col": [1.0, float("nan")],
    "str_col": ["hello", None],
})
result_nat = _safe_to_records(df_nat)
json_str_nat = json.dumps(result_nat, ensure_ascii=False)
print(f"NaT/NaN serialization OK: {len(json_str_nat)} bytes")

print()
print("ALL CHECKS PASSED")
