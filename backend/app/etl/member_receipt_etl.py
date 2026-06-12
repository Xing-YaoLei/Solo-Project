import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

from app.etl.data_cleaner import DataCleaner


class MemberReceiptETL:
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
            "小票编号": "receipt_no",
            "会员卡号": "member_card_no",
            "门店编码": "store_code",
            "门店名称": "store_name",
            "消费时间": "consume_time",
            "设备编号": "equipment_code",
            "设备名称": "equipment_name",
            "清洁项目": "cleaning_items",
            "操作员": "operator",
            "清洁结果": "cleaning_result",
        }

        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        df["receipt_no"] = df["receipt_no"].apply(self.cleaner.clean_text)
        df["store_code"] = df["store_code"].apply(self.cleaner.clean_text)
        df["equipment_code"] = df["equipment_code"].apply(self.cleaner.clean_text)
        df["consume_time"] = df["consume_time"].apply(self.cleaner.clean_date)

        if "cleaning_result" in df.columns:
            df["cleaning_result"] = df["cleaning_result"].apply(
                lambda x: "passed" if str(x).strip() in ["合格", "通过", "passed", "PASS"] else "failed"
            )

        df = self.cleaner.deduplicate_df(df, subset=["receipt_no"])
        df = df.dropna(subset=["receipt_no", "store_code", "equipment_code", "consume_time"])

        df["source"] = "member_receipt"
        return df

    def load_to_records(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        records = []
        for _, row in df.iterrows():
            record = {
                "record_code": f"MR_{row['receipt_no']}",
                "equipment_code": row["equipment_code"],
                "store_code": row["store_code"],
                "cleaning_date": row["consume_time"],
                "cleaning_type": "routine",
                "operator": row.get("operator", ""),
                "cleaning_items": row.get("cleaning_items", ""),
                "cleaning_result": row.get("cleaning_result", "passed"),
                "source": "member_receipt",
            }
            records.append(record)
        return records
