import pandas as pd
import re
from datetime import datetime
from typing import List, Dict, Any


class DataCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        if pd.isna(text) or text is None:
            return ""
        text = str(text).strip()
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def clean_date(date_val, fmt: str = "%Y-%m-%d %H:%M:%S"):
        if pd.isna(date_val) or date_val is None:
            return None
        if isinstance(date_val, datetime):
            return date_val
        try:
            return pd.to_datetime(date_val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def clean_numeric(val):
        if pd.isna(val) or val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def deduplicate_df(df: pd.DataFrame, subset: List[str]) -> pd.DataFrame:
        if df.empty:
            return df
        return df.drop_duplicates(subset=subset, keep="last").reset_index(drop=True)
