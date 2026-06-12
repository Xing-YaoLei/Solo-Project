import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

from app.etl.data_cleaner import DataCleaner


class InventoryETL:
    def __init__(self):
        self.cleaner = DataCleaner()

    def extract(self, file_path: str) -> pd.DataFrame:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path}")
        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        column_mapping = {
            "库存编号": "inventory_no",
            "门店编码": "store_code",
            "门店名称": "store_name",
            "设备编号": "equipment_code",
            "设备名称": "equipment_name",
            "设备类型": "equipment_type",
            "品牌": "brand",
            "型号": "model",
            "安装日期": "install_date",
            "上次清洁日期": "last_cleaning_date",
            "下次清洁日期": "next_cleaning_date",
            "清洁周期(天)": "cleaning_cycle_days",
            "设备状态": "status",
            "盘点时间": "inventory_time",
            "操作员": "operator",
        }

        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        df["inventory_no"] = df["inventory_no"].apply(self.cleaner.clean_text)
        df["store_code"] = df["store_code"].apply(self.cleaner.clean_text)
        df["equipment_code"] = df["equipment_code"].apply(self.cleaner.clean_text)
        df["install_date"] = df["install_date"].apply(self.cleaner.clean_date)
        df["last_cleaning_date"] = df["last_cleaning_date"].apply(self.cleaner.clean_date)
        df["next_cleaning_date"] = df["next_cleaning_date"].apply(self.cleaner.clean_date)
        df["inventory_time"] = df["inventory_time"].apply(self.cleaner.clean_date)

        if "cleaning_cycle_days" in df.columns:
            df["cleaning_cycle_days"] = df["cleaning_cycle_days"].apply(self.cleaner.clean_numeric)

        if "status" in df.columns:
            df["status"] = df["status"].apply(
                lambda x: "normal" if str(x).strip() in ["正常", "在用", "normal", "active"]
                else "maintenance" if str(x).strip() in ["维修中", "维护", "maintenance"]
                else "offline"
            )

        df = self.cleaner.deduplicate_df(df, subset=["equipment_code", "inventory_time"])
        df = df.dropna(subset=["equipment_code", "store_code"])

        df["source"] = "inventory"
        return df

    def load_to_equipment_updates(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        records = []
        latest_df = df.sort_values("inventory_time").groupby("equipment_code").last().reset_index()
        for _, row in latest_df.iterrows():
            record = {
                "equipment_code": row["equipment_code"],
                "equipment_name": row.get("equipment_name", ""),
                "equipment_type": row.get("equipment_type", ""),
                "store_code": row["store_code"],
                "brand": row.get("brand", ""),
                "model": row.get("model", ""),
                "install_date": row.get("install_date"),
                "last_cleaning_date": row.get("last_cleaning_date"),
                "next_cleaning_date": row.get("next_cleaning_date"),
                "cleaning_cycle_days": row.get("cleaning_cycle_days", 7),
                "status": row.get("status", "normal"),
            }
            records.append(record)
        return records
