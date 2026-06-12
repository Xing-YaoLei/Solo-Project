import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

from app.etl.data_cleaner import DataCleaner


class PosFlowETL:
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
            "流水号": "flow_no",
            "门店编码": "store_code",
            "门店名称": "store_name",
            "交易时间": "transaction_time",
            "设备编号": "equipment_code",
            "设备名称": "equipment_name",
            "清洁服务类型": "service_type",
            "操作员": "operator",
            "服务结果": "service_result",
            "备注": "remark",
        }

        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        df["flow_no"] = df["flow_no"].apply(self.cleaner.clean_text)
        df["store_code"] = df["store_code"].apply(self.cleaner.clean_text)
        df["equipment_code"] = df["equipment_code"].apply(self.cleaner.clean_text)
        df["transaction_time"] = df["transaction_time"].apply(self.cleaner.clean_date)

        if "service_result" in df.columns:
            df["service_result"] = df["service_result"].apply(
                lambda x: "passed" if str(x).strip() in ["成功", "完成", "通过", "success", "PASS"] else "failed"
            )

        df = self.cleaner.deduplicate_df(df, subset=["flow_no"])
        df = df.dropna(subset=["flow_no", "store_code", "equipment_code", "transaction_time"])

        df["source"] = "pos_flow"
        return df

    def load_to_records(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        records = []
        for _, row in df.iterrows():
            record = {
                "record_code": f"POS_{row['flow_no']}",
                "equipment_code": row["equipment_code"],
                "store_code": row["store_code"],
                "cleaning_date": row["transaction_time"],
                "cleaning_type": row.get("service_type", "routine"),
                "operator": row.get("operator", ""),
                "cleaning_result": row.get("service_result", "passed"),
                "remark": row.get("remark", ""),
                "source": "pos_flow",
            }
            records.append(record)
        return records
