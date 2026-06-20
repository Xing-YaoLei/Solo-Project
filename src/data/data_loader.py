import os
import json
import uuid
import polars as pl
from pathlib import Path
from datetime import datetime
from src.data.duckdb_manager import DuckDBManager
from src.data.minio_client import MinIOClient
from src.utils.config import Config


TABLE_NAMES = {
    "registrations": "registrations",
    "payments": "payments",
    "checkin_codes": "checkin_codes",
    "seats": "seats",
    "sponsors": "sponsors",
    "refunds": "refunds",
    "refund_notes": "refund_notes",
    "platform_raw_records": "platform_raw_records",
}


class DataLoader:
    def __init__(self):
        self.ddb = DuckDBManager()
        self.minio = MinIOClient()
        self.data_dir = Path(Config.DATA_DIR)

    def load_local_csv(self, table_name: str, csv_path: str) -> bool:
        if not os.path.exists(csv_path):
            return False
        self.ddb.create_table_from_csv(table_name, csv_path)
        return True

    def load_from_minio(self, table_name: str, object_key: str) -> bool:
        if not self.minio.bucket_exists():
            return False
        local_path = self.data_dir / Path(object_key).name
        try:
            self.minio.download_file(object_key, str(local_path))
            self.ddb.create_table_from_csv(table_name, str(local_path))
            return True
        except Exception:
            return False

    def load_polars_df(self, table_name: str, df: pl.DataFrame):
        self.ddb.create_table_from_polars(table_name, df)

    def has_table(self, table_name: str) -> bool:
        return self.ddb.table_exists(table_name)

    def get_df(self, table_name: str) -> pl.DataFrame:
        return self.ddb.query(f"SELECT * FROM {table_name}")

    def list_tables(self) -> list:
        return self.ddb.list_tables()

    def ensure_all_tables(self) -> dict:
        status = {}
        for key, name in TABLE_NAMES.items():
            status[key] = self.has_table(name)
        return status

    def _ensure_platforms_table(self):
        self.ddb.execute("""
            CREATE TABLE IF NOT EXISTS platforms (
                code VARCHAR,
                name VARCHAR,
                base_url VARCHAR,
                api_prefix VARCHAR
            )
        """)

    def _get_platform_info(self, platform_code: str) -> dict:
        if not self.ddb.table_exists("platforms"):
            return {"name": platform_code or "未知", "base_url": "", "api_prefix": ""}
        try:
            result = self.ddb.query(
                f"SELECT name, base_url, api_prefix FROM platforms WHERE code = '{platform_code}'"
            ).to_pandas()
            if len(result) > 0:
                return {
                    "name": result.iloc[0]["name"],
                    "base_url": result.iloc[0]["base_url"],
                    "api_prefix": result.iloc[0]["api_prefix"],
                }
        except Exception:
            pass
        return {"name": platform_code or "未知", "base_url": "", "api_prefix": ""}

    def _infer_platform_code(self, source: str) -> str:
        mapping = {
            "大麦网": "damai",
            "猫眼演出": "maoyan",
            "微信小程序": "weixin",
            "官方自研": "self",
            "官方网站": "self",
            "线下渠道": "self",
            "合作伙伴": "self",
        }
        return mapping.get(source, "self")

    def sync_platform_raw_records(self):
        self._ensure_platforms_table()

        if not self.ddb.table_exists("platform_raw_records"):
            self.ddb.execute("""
                CREATE TABLE platform_raw_records (
                    record_id VARCHAR,
                    source_type VARCHAR,
                    source_id VARCHAR,
                    platform_code VARCHAR,
                    platform_name VARCHAR,
                    platform_record_id VARCHAR,
                    platform_url VARCHAR,
                    raw_payload VARCHAR,
                    synced_at TIMESTAMP
                )
            """)

        if self.ddb.table_exists("registrations"):
            self._sync_registration_records()

        if self.ddb.table_exists("payments"):
            self._sync_payment_records()

    def _sync_registration_records(self):
        uncovered_sql = """
            SELECT r.*
            FROM registrations r
            WHERE NOT EXISTS (
                SELECT 1 FROM platform_raw_records p
                WHERE p.source_type = 'registration' AND p.source_id = r.registration_id
            )
        """
        try:
            uncovered = self.ddb.query(uncovered_sql).to_pandas()
        except Exception:
            return

        if len(uncovered) == 0:
            return

        for _, row in uncovered.iterrows():
            platform_code = row.get("platform_code") or self._infer_platform_code(row.get("source", ""))
            pf = self._get_platform_info(platform_code)

            platform_order_id = row.get("platform_order_id")
            if not platform_order_id or not isinstance(platform_order_id, str) or pd_is_na(platform_order_id):
                platform_order_id = f"{platform_code.upper()}{hash(row['registration_id']) % 1000000000:09d}"

            platform_url = pf["base_url"] + pf["api_prefix"] + platform_order_id

            raw_payload = {
                "platform": platform_code,
                "platform_name": pf["name"],
                "order_id": platform_order_id,
                "attendee": {
                    "name": row.get("attendee_name", ""),
                    "email": row.get("email", ""),
                    "phone": row.get("phone", ""),
                },
                "ticket": {
                    "type": row.get("ticket_type", ""),
                    "seat_id": row.get("seat_id", ""),
                },
                "status": row.get("status", ""),
                "source": row.get("source", ""),
                "imported_from": "csv_or_minio",
            }
            if "registration_time" in row and row["registration_time"] is not None:
                raw_payload["created_at"] = str(row["registration_time"])

            payload_str = json.dumps(raw_payload, ensure_ascii=False, default=str).replace("'", "''")
            record_id = str(uuid.uuid4())
            synced_at = datetime.now().isoformat()

            self.ddb.execute(f"""
                INSERT INTO platform_raw_records
                (record_id, source_type, source_id, platform_code, platform_name,
                 platform_record_id, platform_url, raw_payload, synced_at)
                VALUES (
                    '{record_id}', 'registration', '{row['registration_id']}',
                    '{platform_code}', '{pf["name"]}',
                    '{platform_order_id}', '{platform_url}',
                    '{payload_str}', '{synced_at}'
                )
            """)

    def _sync_payment_records(self):
        uncovered_sql = """
            SELECT p.*
            FROM payments p
            WHERE NOT EXISTS (
                SELECT 1 FROM platform_raw_records pr
                WHERE pr.source_type = 'payment' AND pr.source_id = p.payment_id
            )
        """
        try:
            uncovered = self.ddb.query(uncovered_sql).to_pandas()
        except Exception:
            return

        if len(uncovered) == 0:
            return

        for _, row in uncovered.iterrows():
            platform_code = row.get("platform_code", "self")
            pf = self._get_platform_info(platform_code)

            platform_payment_id = row.get("platform_payment_id")
            if not platform_payment_id or not isinstance(platform_payment_id, str) or pd_is_na(platform_payment_id):
                platform_payment_id = f"{platform_code.upper()}_PAY_{hash(row['payment_id']) % 1000000:06d}"

            platform_url = pf["base_url"] + pf["api_prefix"] + "payments/" + platform_payment_id

            raw_payload = {
                "platform": platform_code,
                "platform_name": pf["name"],
                "payment_id": platform_payment_id,
                "registration_id": row.get("registration_id", ""),
                "amount": float(row["amount"]) if row.get("amount") is not None else 0,
                "currency": row.get("currency", "CNY"),
                "method": row.get("payment_method", ""),
                "status": row.get("status", ""),
                "imported_from": "csv_or_minio",
            }
            if "transaction_id" in row and row.get("transaction_id") is not None:
                raw_payload["transaction_id"] = str(row["transaction_id"])
            if "payment_time" in row and row.get("payment_time") is not None:
                raw_payload["paid_at"] = str(row["payment_time"])

            payload_str = json.dumps(raw_payload, ensure_ascii=False, default=str).replace("'", "''")
            record_id = str(uuid.uuid4())
            synced_at = datetime.now().isoformat()

            self.ddb.execute(f"""
                INSERT INTO platform_raw_records
                (record_id, source_type, source_id, platform_code, platform_name,
                 platform_record_id, platform_url, raw_payload, synced_at)
                VALUES (
                    '{record_id}', 'payment', '{row['payment_id']}',
                    '{platform_code}', '{pf["name"]}',
                    '{platform_payment_id}', '{platform_url}',
                    '{payload_str}', '{synced_at}'
                )
            """)


def pd_is_na(val) -> bool:
    try:
        import pandas as pd
        return pd.isna(val)
    except Exception:
        return val is None
