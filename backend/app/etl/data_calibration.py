import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta


class DataCalibration:
    EQUIPMENT_TYPE_MAPPING = {
        "咖啡机": "coffee_machine",
        "意式咖啡机": "coffee_machine",
        "美式咖啡机": "coffee_machine",
        "磨豆机": "grinder",
        "咖啡豆研磨机": "grinder",
        "冰沙机": "blender",
        "榨汁机": "juicer",
        "冷藏柜": "refrigerator",
        "冰柜": "freezer",
        "制冰机": "ice_maker",
        "开水机": "water_heater",
        "热水器": "water_heater",
    }

    CLEANING_TYPE_MAPPING = {
        "routine": "routine",
        "日常清洁": "routine",
        "daily": "routine",
        "deep": "deep",
        "深度清洁": "deep",
        "weekly": "weekly",
        "周度清洁": "weekly",
        "monthly": "monthly",
        "月度清洁": "monthly",
    }

    STATUS_MAPPING = {
        "正常": "normal",
        "在用": "normal",
        "active": "normal",
        "normal": "normal",
        "维修中": "maintenance",
        "维护": "maintenance",
        "maintenance": "maintenance",
        "离线": "offline",
        "停用": "offline",
        "offline": "offline",
        "故障": "fault",
        "fault": "fault",
    }

    @classmethod
    def calibrate_equipment_type(cls, eq_type: str) -> str:
        if not eq_type:
            return "unknown"
        eq_type_str = str(eq_type).strip()
        return cls.EQUIPMENT_TYPE_MAPPING.get(eq_type_str, eq_type_str.lower().replace(" ", "_"))

    @classmethod
    def calibrate_cleaning_type(cls, cleaning_type: str) -> str:
        if not cleaning_type:
            return "routine"
        ct_str = str(cleaning_type).strip()
        return cls.CLEANING_TYPE_MAPPING.get(ct_str, ct_str.lower().replace(" ", "_"))

    @classmethod
    def calibrate_status(cls, status: str) -> str:
        if not status:
            return "normal"
        status_str = str(status).strip()
        return cls.STATUS_MAPPING.get(status_str, status_str.lower().replace(" ", "_"))

    @classmethod
    def merge_cleaning_records(cls, member_records: List[Dict], pos_records: List[Dict]) -> List[Dict]:
        all_records = member_records + pos_records

        df = pd.DataFrame(all_records)
        if df.empty:
            return []

        df["date_key"] = pd.to_datetime(df["cleaning_date"]).dt.date
        df["dedup_key"] = df["equipment_code"] + "_" + df["date_key"].astype(str) + "_" + df["cleaning_type"]

        df = df.drop_duplicates(subset=["dedup_key"], keep="first")
        df = df.drop(columns=["date_key", "dedup_key"])

        return df.to_dict("records")

    @classmethod
    def detect_offline_equipments(
        cls,
        equipments: List[Dict],
        cleaning_records: List[Dict],
        threshold_days: int = 7
    ) -> List[Dict]:
        if not equipments:
            return []

        now = datetime.utcnow()
        offline_list = []

        cleaning_df = pd.DataFrame(cleaning_records) if cleaning_records else pd.DataFrame()

        for eq in equipments:
            eq_code = eq.get("equipment_code", "")
            last_clean_date = eq.get("last_cleaning_date")

            if last_clean_date:
                if isinstance(last_clean_date, str):
                    last_clean_date = pd.to_datetime(last_clean_date)
                days_since_clean = (now - last_clean_date).days
            elif not cleaning_df.empty and eq_code in cleaning_df["equipment_code"].values:
                eq_records = cleaning_df[cleaning_df["equipment_code"] == eq_code]
                if not eq_records.empty:
                    latest_clean = pd.to_datetime(eq_records["cleaning_date"]).max()
                    days_since_clean = (now - latest_clean).days
                else:
                    days_since_clean = 999
            else:
                days_since_clean = 999

            cycle_days = eq.get("cleaning_cycle_days", threshold_days)
            if days_since_clean > cycle_days:
                offline_list.append({
                    "equipment_code": eq_code,
                    "equipment_name": eq.get("equipment_name", ""),
                    "store_code": eq.get("store_code", ""),
                    "store_name": eq.get("store_name", ""),
                    "days_since_clean": days_since_clean,
                    "cleaning_cycle_days": cycle_days,
                    "status": eq.get("status", "normal"),
                    "last_cleaning_date": last_clean_date,
                })

        return offline_list
