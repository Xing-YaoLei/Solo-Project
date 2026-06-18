from __future__ import annotations

import hashlib
from typing import Any, Iterable, List, Optional, Dict, Tuple

import pandas as pd
import numpy as np


BRAND_NORMALIZATION_MAP: Dict[str, str] = {
    "BYD": "比亚迪",
    "BYD Auto": "比亚迪",
    "比亚迪汽车": "比亚迪",
    "BMW": "宝马",
    "Bayerische Motoren Werke": "宝马",
    "BMW Brilliance": "宝马",
    "BENZ": "奔驰",
    "Mercedes-Benz": "奔驰",
    "奔驰汽车": "奔驰",
    "AUDI": "奥迪",
    "FAW-VW Audi": "奥迪",
    "一汽奥迪": "奥迪",
    "VW": "大众",
    "Volkswagen": "大众",
    "FAW-VW": "大众",
    "SAIC-VW": "大众",
    "一汽大众": "大众",
    "上汽大众": "大众",
    "TOYOTA": "丰田",
    "Toyota": "丰田",
    "一汽丰田": "丰田",
    "广汽丰田": "丰田",
    "HONDA": "本田",
    "Honda": "本田",
    "广汽本田": "本田",
    "东风本田": "本田",
    "NISSAN": "日产",
    "Nissan": "日产",
    "东风日产": "日产",
    "TESLA": "特斯拉",
    "Tesla": "特斯拉",
    "特斯拉汽车": "特斯拉",
    "GEELY": "吉利",
    "Geely": "吉利",
    "吉利汽车": "吉利",
    "GAC": "广汽",
    "广汽集团": "广汽",
    "CHANGAN": "长安",
    "Changan": "长安",
    "长安汽车": "长安",
    "HAVAL": "哈弗",
    "Haval": "哈弗",
    "长城哈弗": "哈弗",
    "WULING": "五菱",
    "Wuling": "五菱",
    "上汽通用五菱": "五菱",
    "XPENG": "小鹏",
    "Xpeng": "小鹏",
    "小鹏汽车": "小鹏",
    "NIO": "蔚来",
    "蔚来汽车": "蔚来",
    "LI": "理想",
    "Li Auto": "理想",
    "理想汽车": "理想",
}


def _normalize_whitespace(text: Optional[str]) -> str:
    if not isinstance(text, str):
        return ""
    return re.sub(r"\s+", " ", text.strip())


def dedupe_by_vin(df: pd.DataFrame, vin_col: str = "vin") -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty or vin_col not in df.columns:
        return df.copy(), df.iloc[0:0].copy()

    work = df.copy()
    work[vin_col] = work[vin_col].astype(str).str.strip().str.upper()
    mask_valid = work[vin_col].str.fullmatch(r"[A-HJ-NPR-Z0-9]{17}")
    invalid = work[~mask_valid].copy()

    valid = work[mask_valid].copy()
    duplicates = valid[valid.duplicated(subset=[vin_col], keep="first")].copy()
    deduped = valid.drop_duplicates(subset=[vin_col], keep="first").copy()

    removed = pd.concat([invalid, duplicates], ignore_index=True)
    return deduped.reset_index(drop=True), removed.reset_index(drop=True)


def dedupe_by_fuzzy(
    df: pd.DataFrame,
    columns: List[str],
    fingerprint_cols: Optional[List[str]] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty:
        return df.copy(), df.iloc[0:0].copy()

    work = df.copy()
    fp_cols = fingerprint_cols if fingerprint_cols else columns

    def _fingerprint(row: pd.Series) -> str:
        parts = []
        for c in fp_cols:
            v = row.get(c, "")
            if isinstance(v, str):
                parts.append(re.sub(r"[^A-Za-z0-9\u4e00-\u9fa5]", "", v).upper())
            else:
                parts.append(str(v))
        raw = "|".join(parts)
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    work["_fp"] = work.apply(_fingerprint, axis=1)
    duplicates = work[work.duplicated(subset=["_fp"], keep="first")].drop(columns=["_fp"]).copy()
    deduped = work.drop_duplicates(subset=["_fp"], keep="first").drop(columns=["_fp"]).copy()
    return deduped.reset_index(drop=True), duplicates.reset_index(drop=True)


def dedupe_quote(
    df: pd.DataFrame,
    vin_col: str = "vin",
    amount_col: str = "amount",
    date_col: str = "quoted_at",
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty:
        return df.copy(), df.iloc[0:0].copy()

    work = df.copy()
    work[vin_col] = work[vin_col].astype(str).str.strip().str.upper()
    work["_amt_bucket"] = (pd.to_numeric(work[amount_col], errors="coerce") // 1000) * 1000
    work["_date"] = pd.to_datetime(work[date_col], errors="coerce").dt.date

    subset = [vin_col, "_amt_bucket", "_date"]
    duplicates = work[work.duplicated(subset=subset, keep="first")].drop(
        columns=["_amt_bucket", "_date"]
    ).copy()
    deduped = work.drop_duplicates(subset=subset, keep="first").drop(
        columns=["_amt_bucket", "_date"]
    ).copy()
    return deduped.reset_index(drop=True), duplicates.reset_index(drop=True)


def dedupe_test_drive(
    df: pd.DataFrame,
    vin_col: str = "vin",
    phone_col: str = "customer_phone",
    time_col: str = "drive_at",
    window_hours: int = 4,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty:
        return df.copy(), df.iloc[0:0].copy()

    work = df.copy()
    work[vin_col] = work[vin_col].astype(str).str.strip().str.upper()
    work["_phone"] = work[phone_col].astype(str).str.replace(r"\D", "", regex=True)
    work["_dt"] = pd.to_datetime(work[time_col], errors="coerce")
    work = work.sort_values(["_dt"]).reset_index(drop=True)

    keep_mask = np.ones(len(work), dtype=bool)
    seen: Dict[Tuple[str, str], pd.Timestamp] = {}

    for idx, row in work.iterrows():
        key = (row[vin_col], row["_phone"])
        dt = row["_dt"]
        if pd.isna(dt):
            keep_mask[idx] = False
            continue
        if key in seen:
            delta = (dt - seen[key]).total_seconds() / 3600.0
            if delta < window_hours:
                keep_mask[idx] = False
                continue
        seen[key] = dt

    deduped = work[keep_mask].drop(columns=["_phone", "_dt"]).reset_index(drop=True)
    duplicates = work[~keep_mask].drop(columns=["_phone", "_dt"]).reset_index(drop=True)
    return deduped, duplicates


def normalize_brand(
    df: pd.DataFrame,
    brand_col: str = "brand",
    mapping: Optional[Dict[str, str]] = None,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    if df.empty:
        return df.copy(), {}

    work = df.copy()
    effective_map = mapping if mapping is not None else BRAND_NORMALIZATION_MAP
    stats: Dict[str, int] = {}

    def _map(val: Any) -> str:
        if not isinstance(val, str):
            return ""
        key = _normalize_whitespace(val)
        if not key:
            return val
        if key in effective_map:
            stats[key] = stats.get(key, 0) + 1
            return effective_map[key]
        if key in effective_map.values():
            return key
        upper = key.upper()
        if upper in effective_map:
            stats[upper] = stats.get(upper, 0) + 1
            return effective_map[upper]
        return val

    work[brand_col] = work[brand_col].apply(_map)
    return work, stats


def normalize_document_type(
    df: pd.DataFrame,
    doc_col: str = "doc_type",
) -> Tuple[pd.DataFrame, Dict[str, str]]:
    mapping = {
        "行驶证": "driving_license",
        "driving license": "driving_license",
        "驾照": "driving_license",
        "登记证": "registration_cert",
        "机动车登记证书": "registration_cert",
        "registration certificate": "registration_cert",
        "大绿本": "registration_cert",
        "购置税": "purchase_tax",
        "购置税完税证明": "purchase_tax",
        "purchase tax": "purchase_tax",
        "保单": "insurance_policy",
        "交强险保单": "insurance_policy",
        "保险单": "insurance_policy",
        "insurance": "insurance_policy",
        "发票": "invoice",
        "购车发票": "invoice",
        "二手车销售发票": "invoice",
        "其他": "other",
        "其它": "other",
    }
    if df.empty:
        return df.copy(), mapping

    work = df.copy()
    applied: Dict[str, str] = {}

    def _map(v: Any) -> str:
        if not isinstance(v, str):
            return v if isinstance(v, str) else "other"
        key = re.sub(r"\s+", "", v.strip())
        if key in mapping:
            applied[key] = mapping[key]
            return mapping[key]
        if key in mapping.values():
            return key
        return v

    work[doc_col] = work[doc_col].apply(_map)
    return work, applied


def fill_missing_mileage(
    df: pd.DataFrame,
    mileage_col: str = "mileage",
    brand_col: str = "brand",
    year_col: str = "year",
    impute_flag_col: Optional[str] = "mileage_imputed",
) -> Tuple[pd.DataFrame, int]:
    if df.empty:
        return df.copy(), 0

    work = df.copy()
    work[mileage_col] = pd.to_numeric(work[mileage_col], errors="coerce")
    work[year_col] = pd.to_numeric(work[year_col], errors="coerce")

    missing_mask = work[mileage_col].isna() | (work[mileage_col] <= 0)
    filled_count = 0

    grouped_medians = work[~missing_mask].groupby([brand_col, year_col])[mileage_col].median()

    def _fill(row: pd.Series) -> float:
        nonlocal filled_count
        val = row.get(mileage_col)
        if pd.notna(val) and val > 0:
            return float(val)
        key = (row.get(brand_col), row.get(year_col))
        if key in grouped_medians.index and pd.notna(grouped_medians[key]):
            filled_count += 1
            return float(grouped_medians[key])
        overall = work[mileage_col].median()
        if pd.notna(overall) and overall > 0:
            filled_count += 1
            return float(overall)
        return 0.0

    work[mileage_col] = work.apply(_fill, axis=1).astype(int)

    if impute_flag_col:
        work[impute_flag_col] = missing_mask & (work[mileage_col] > 0)

    return work, filled_count


def fill_missing_inbound_date(
    df: pd.DataFrame,
    inbound_col: str = "inbound_date",
    fallback_cols: Optional[List[str]] = None,
) -> Tuple[pd.DataFrame, int]:
    if df.empty:
        return df.copy(), 0

    fallback_cols = fallback_cols or ["uploaded_at", "first_material_at", "sync_time"]
    work = df.copy()
    work[inbound_col] = pd.to_datetime(work[inbound_col], errors="coerce")

    filled_count = 0
    default_fill = pd.Timestamp.now().normalize()

    for idx, row in work.iterrows():
        if pd.notna(row[inbound_col]):
            continue
        filled = False
        for col in fallback_cols:
            if col in work.columns and pd.notna(row.get(col)):
                try:
                    work.at[idx, inbound_col] = pd.to_datetime(row[col]).normalize()
                    filled_count += 1
                    filled = True
                    break
                except Exception:
                    continue
        if not filled:
            work.at[idx, inbound_col] = default_fill
            filled_count += 1

    work[inbound_col] = pd.to_datetime(work[inbound_col]).dt.date
    return work, filled_count


def sanitize_invalid_records(
    df: pd.DataFrame,
    required_cols: Optional[List[str]] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty:
        return df.copy(), df.iloc[0:0].copy()

    required = required_cols or ["vin"]
    work = df.copy()
    valid_mask = pd.Series(True, index=work.index)

    for col in required:
        if col in work.columns:
            if col == "vin":
                valid_mask &= work[col].astype(str).str.strip().str.fullmatch(r"[A-HJ-NPR-Z0-9]{17}")
            else:
                valid_mask &= work[col].notna() & (work[col].astype(str).str.strip() != "")

    invalid = work[~valid_mask].copy()
    valid = work[valid_mask].copy()
    return valid.reset_index(drop=True), invalid.reset_index(drop=True)


import re

__all__ = [
    "BRAND_NORMALIZATION_MAP",
    "dedupe_by_vin",
    "dedupe_by_fuzzy",
    "dedupe_quote",
    "dedupe_test_drive",
    "normalize_brand",
    "normalize_document_type",
    "fill_missing_mileage",
    "fill_missing_inbound_date",
    "sanitize_invalid_records",
]
