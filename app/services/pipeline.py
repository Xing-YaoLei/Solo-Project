from __future__ import annotations

from datetime import datetime
from pathlib import Path

import polars as pl

from app.services.minio_service import MinIOService
from app.services.duckdb_service import DuckDBService


class DataPipeline:
    def __init__(self, minio: MinIOService, duckdb: DuckDBService) -> None:
        self.minio = minio
        self.duckdb = duckdb

    def _generate_batch_id(self, source_type: str) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"BATCH_{source_type}_{ts}"

    def ingest_cashier(
        self, file_path: Path, imported_by: str = "system"
    ) -> dict:
        df = pl.read_csv(file_path)
        batch_id = self._generate_batch_id("cashier")

        minio_meta = self.minio.upload_dataframe(df, "cashier_transactions.csv", batch_id)
        row_count = self.duckdb.import_cashier_data(df, batch_id, imported_by)

        return {
            "batch_id": batch_id,
            "source": "cashier",
            "rows_ingested": row_count,
            "minio_metadata": minio_meta,
        }

    def ingest_inventory(
        self, file_path: Path, imported_by: str = "system"
    ) -> dict:
        df = pl.read_csv(file_path)
        batch_id = self._generate_batch_id("inventory")

        minio_meta = self.minio.upload_dataframe(df, "inventory.csv", batch_id)
        row_count = self.duckdb.import_inventory_data(df, batch_id, imported_by)

        return {
            "batch_id": batch_id,
            "source": "inventory",
            "rows_ingested": row_count,
            "minio_metadata": minio_meta,
        }

    def ingest_members(
        self, file_path: Path, imported_by: str = "system"
    ) -> dict:
        df = pl.read_csv(file_path)
        batch_id = self._generate_batch_id("member")

        existing_members = self.duckdb.conn.execute(
            "SELECT member_id, member_name, chronic_disease, allergy_info FROM members"
        ).fetchall()

        existing_map = {row[0]: row for row in existing_members}

        minio_meta = self.minio.upload_dataframe(df, "members.csv", batch_id)
        row_count = self.duckdb.import_member_data(df, batch_id, imported_by)

        for rec in df.to_dicts():
            mid = rec.get("member_id")
            if mid and mid in existing_map:
                old = existing_map[mid]
                for field_idx, field_name in enumerate(
                    ["member_name", "chronic_disease", "allergy_info"]
                ):
                    new_val = str(rec.get(field_name, ""))
                    old_val = str(old[field_idx + 1]) if field_idx + 1 < len(old) else ""
                    if new_val != old_val:
                        self.duckdb.track_member_profile_change(
                            change_id=f"CHG_{mid}_{field_name}_{batch_id}",
                            member_id=mid,
                            field_name=field_name,
                            old_value=old_val,
                            new_value=new_val,
                            source_batch_id=batch_id,
                        )

        return {
            "batch_id": batch_id,
            "source": "member",
            "rows_ingested": row_count,
            "minio_metadata": minio_meta,
        }

    def ingest_followup(
        self, file_path: Path, imported_by: str = "system"
    ) -> dict:
        df = pl.read_csv(file_path)
        batch_id = self._generate_batch_id("followup")

        minio_meta = self.minio.upload_dataframe(df, "followup_records.csv", batch_id)
        row_count = self.duckdb.import_followup_data(df, batch_id, imported_by)

        return {
            "batch_id": batch_id,
            "source": "followup",
            "rows_ingested": row_count,
            "minio_metadata": minio_meta,
        }

    def trace_batch(self, batch_id: str) -> dict:
        _SOURCE_OBJECT_MAP: dict[str, str] = {
            "cashier": "cashier_transactions.csv",
            "inventory": "inventory.csv",
            "member": "members.csv",
            "followup": "followup_records.csv",
        }

        db_batches = self.duckdb.list_import_batches()
        batch_row = db_batches.filter(pl.col("batch_id") == batch_id)

        source_type = None
        if batch_row.height > 0:
            source_type = batch_row["source_type"].to_list()[0]

        minio_meta: dict[str, dict] = {}

        if self.minio is not None:
            if source_type and source_type in _SOURCE_OBJECT_MAP:
                try:
                    obj_name = _SOURCE_OBJECT_MAP[source_type]
                    minio_meta[source_type] = self.minio.get_batch_metadata(batch_id, obj_name)
                except Exception:
                    pass
            else:
                for src_type, obj_name in _SOURCE_OBJECT_MAP.items():
                    try:
                        meta = self.minio.get_batch_metadata(batch_id, obj_name)
                        minio_meta[src_type] = meta
                    except Exception:
                        pass

        db_record = batch_row.to_dicts() if batch_row.height > 0 else []

        return {
            "batch_id": batch_id,
            "source_type": source_type,
            "minio_metadata": minio_meta,
            "db_record": db_record,
            "available_sources": list(minio_meta.keys()),
        }
