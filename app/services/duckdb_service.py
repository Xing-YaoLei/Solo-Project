from __future__ import annotations

import duckdb
from datetime import datetime
from pathlib import Path

import polars as pl

from app.config import settings


class DuckDBService:
    def __init__(self) -> None:
        db_dir = Path(settings.duckdb_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        self.conn = duckdb.connect(settings.duckdb_path)
        self._init_tables()

    def _init_tables(self) -> None:
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS cashier_transactions (
                transaction_id VARCHAR PRIMARY KEY,
                store_id VARCHAR,
                store_name VARCHAR,
                transaction_date TIMESTAMP,
                member_id VARCHAR,
                product_code VARCHAR,
                product_name VARCHAR,
                quantity INTEGER,
                unit_price DOUBLE,
                total_amount DOUBLE,
                prescription_id VARCHAR,
                pharmacist_id VARCHAR,
                batch_id VARCHAR,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                inventory_id VARCHAR PRIMARY KEY,
                store_id VARCHAR,
                product_code VARCHAR,
                product_name VARCHAR,
                batch_number VARCHAR,
                production_date DATE,
                expiry_date DATE,
                stock_quantity INTEGER,
                supplier VARCHAR,
                batch_id VARCHAR,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS members (
                member_id VARCHAR PRIMARY KEY,
                member_name VARCHAR,
                phone VARCHAR,
                store_id VARCHAR,
                register_date DATE,
                chronic_disease VARCHAR,
                allergy_info VARCHAR,
                last_visit_date DATE,
                batch_id VARCHAR,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS followup_records (
                followup_id VARCHAR PRIMARY KEY,
                transaction_id VARCHAR,
                member_id VARCHAR,
                store_id VARCHAR,
                pharmacist_id VARCHAR,
                followup_date TIMESTAMP,
                followup_type VARCHAR,
                followup_status VARCHAR,
                followup_result VARCHAR,
                next_followup_date TIMESTAMP,
                batch_id VARCHAR,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS prescription_annotations (
                annotation_id VARCHAR PRIMARY KEY,
                prescription_id VARCHAR,
                transaction_id VARCHAR,
                pharmacist_id VARCHAR,
                annotation_text VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS member_profile_changes (
                change_id VARCHAR PRIMARY KEY,
                member_id VARCHAR,
                field_name VARCHAR,
                old_value VARCHAR,
                new_value VARCHAR,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_batch_id VARCHAR
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS import_batches (
                batch_id VARCHAR PRIMARY KEY,
                source_type VARCHAR,
                file_name VARCHAR,
                row_count INTEGER,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                imported_by VARCHAR
            )
        """)

    def import_cashier_data(
        self, df: pl.DataFrame, batch_id: str, imported_by: str = "system"
    ) -> int:
        records = df.to_dicts()
        if not records:
            return 0

        for rec in records:
            rec["batch_id"] = batch_id
            rec["imported_at"] = datetime.now()

        self.conn.execute(
            "INSERT INTO cashier_transactions SELECT * FROM records",
            {"records": records},
        )

        self.conn.execute(
            """INSERT INTO import_batches (batch_id, source_type, file_name, row_count, imported_at, imported_by)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [batch_id, "cashier", "cashier_upload", len(records), datetime.now(), imported_by],
        )
        return len(records)

    def import_inventory_data(
        self, df: pl.DataFrame, batch_id: str, imported_by: str = "system"
    ) -> int:
        records = df.to_dicts()
        if not records:
            return 0

        for rec in records:
            rec["batch_id"] = batch_id
            rec["imported_at"] = datetime.now()

        self.conn.execute(
            "INSERT INTO inventory SELECT * FROM records",
            {"records": records},
        )

        self.conn.execute(
            """INSERT INTO import_batches (batch_id, source_type, file_name, row_count, imported_at, imported_by)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [batch_id, "inventory", "inventory_upload", len(records), datetime.now(), imported_by],
        )
        return len(records)

    def import_member_data(
        self, df: pl.DataFrame, batch_id: str, imported_by: str = "system"
    ) -> int:
        records = df.to_dicts()
        if not records:
            return 0

        for rec in records:
            rec["batch_id"] = batch_id
            rec["imported_at"] = datetime.now()

        self.conn.execute(
            "INSERT INTO members SELECT * FROM records",
            {"records": records},
        )

        self.conn.execute(
            """INSERT INTO import_batches (batch_id, source_type, file_name, row_count, imported_at, imported_by)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [batch_id, "member", "member_upload", len(records), datetime.now(), imported_by],
        )
        return len(records)

    def import_followup_data(
        self, df: pl.DataFrame, batch_id: str, imported_by: str = "system"
    ) -> int:
        records = df.to_dicts()
        if not records:
            return 0

        for rec in records:
            rec["batch_id"] = batch_id
            rec["imported_at"] = datetime.now()

        self.conn.execute(
            "INSERT INTO followup_records SELECT * FROM records",
            {"records": records},
        )

        self.conn.execute(
            """INSERT INTO import_batches (batch_id, source_type, file_name, row_count, imported_at, imported_by)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [batch_id, "followup", "followup_upload", len(records), datetime.now(), imported_by],
        )
        return len(records)

    def add_prescription_annotation(
        self,
        annotation_id: str,
        prescription_id: str,
        transaction_id: str,
        pharmacist_id: str,
        annotation_text: str,
    ) -> None:
        self.conn.execute(
            """INSERT INTO prescription_annotations
               (annotation_id, prescription_id, transaction_id, pharmacist_id, annotation_text)
               VALUES (?, ?, ?, ?, ?)""",
            [annotation_id, prescription_id, transaction_id, pharmacist_id, annotation_text],
        )

    def get_prescription_annotations(self, prescription_id: str) -> list[dict]:
        result = self.conn.execute(
            "SELECT * FROM prescription_annotations WHERE prescription_id = ? ORDER BY created_at",
            [prescription_id],
        ).fetchall()
        columns = [desc[0] for desc in self.conn.execute(
            "SELECT * FROM prescription_annotations WHERE prescription_id = ? ORDER BY created_at",
            [prescription_id],
        ).description]
        return [dict(zip(columns, row)) for row in result]

    def track_member_profile_change(
        self,
        change_id: str,
        member_id: str,
        field_name: str,
        old_value: str,
        new_value: str,
        source_batch_id: str,
    ) -> None:
        self.conn.execute(
            """INSERT INTO member_profile_changes
               (change_id, member_id, field_name, old_value, new_value, source_batch_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [change_id, member_id, field_name, old_value, new_value, source_batch_id],
        )

    def get_merged_followup_view(self, store_id: str | None = None) -> pl.DataFrame:
        query = """
            SELECT
                f.followup_id,
                f.transaction_id,
                f.member_id,
                f.store_id,
                f.pharmacist_id,
                f.followup_date,
                f.followup_type,
                f.followup_status,
                f.followup_result,
                f.next_followup_date,
                c.product_name,
                c.total_amount,
                c.prescription_id,
                m.member_name,
                m.phone,
                m.chronic_disease,
                m.allergy_info,
                inv.batch_number,
                inv.expiry_date,
                inv.supplier
            FROM followup_records f
            LEFT JOIN cashier_transactions c ON f.transaction_id = c.transaction_id
            LEFT JOIN members m ON f.member_id = m.member_id
            LEFT JOIN inventory inv ON c.product_code = inv.product_code
                AND f.store_id = inv.store_id
        """
        if store_id:
            query += " WHERE f.store_id = $1"
            result = self.conn.execute(query, [store_id]).fetchdf()
        else:
            result = self.conn.execute(query).fetchdf()
        return pl.from_pandas(result)

    def get_prescription_photo_distribution(self, store_id: str | None = None) -> pl.DataFrame:
        query = """
            SELECT
                c.store_id,
                c.prescription_id,
                COUNT(pa.annotation_id) AS annotation_count,
                COUNT(*) FILTER (WHERE c.prescription_id IS NOT NULL) AS has_prescription,
                COUNT(*) FILTER (WHERE c.prescription_id IS NULL) AS no_prescription
            FROM cashier_transactions c
            LEFT JOIN prescription_annotations pa ON c.prescription_id = pa.prescription_id
            GROUP BY c.store_id, c.prescription_id
        """
        if store_id:
            query += " HAVING c.store_id = $1"
            result = self.conn.execute(query, [store_id]).fetchdf()
        else:
            result = self.conn.execute(query).fetchdf()
        return pl.from_pandas(result)

    def get_pharmacist_opinion_funnel(self, store_id: str | None = None) -> pl.DataFrame:
        query = """
            SELECT
                f.pharmacist_id,
                COUNT(*) AS total_followups,
                COUNT(*) FILTER (WHERE f.followup_status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE f.followup_status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE f.followup_status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE f.followup_result = 'effective') AS effective,
                COUNT(*) FILTER (WHERE f.followup_result = 'adjusted') AS adjusted,
                COUNT(*) FILTER (WHERE f.followup_result = 'side_effect') AS side_effect,
                COUNT(*) FILTER (WHERE f.followup_result = 'no_response') AS no_response
            FROM followup_records f
        """
        if store_id:
            query += " WHERE f.store_id = $1"
        query += " GROUP BY f.pharmacist_id"
        if store_id:
            result = self.conn.execute(query, [store_id]).fetchdf()
        else:
            result = self.conn.execute(query).fetchdf()
        return pl.from_pandas(result)

    def get_batch_expiry_ranking(self, store_id: str | None = None) -> pl.DataFrame:
        query = """
            SELECT
                store_id,
                product_code,
                product_name,
                batch_number,
                expiry_date,
                stock_quantity,
                supplier,
                CURRENT_DATE AS today,
                expiry_date - CURRENT_DATE AS days_until_expiry
            FROM inventory
        """
        if store_id:
            query += " WHERE store_id = $1"
        query += " ORDER BY days_until_expiry ASC"
        if store_id:
            result = self.conn.execute(query, [store_id]).fetchdf()
        else:
            result = self.conn.execute(query).fetchdf()
        return pl.from_pandas(result)

    def get_member_profile_changes(
        self, member_id: str | None = None, store_id: str | None = None
    ) -> pl.DataFrame:
        query = """
            SELECT
                mpc.change_id,
                mpc.member_id,
                m.member_name,
                m.store_id,
                mpc.field_name,
                mpc.old_value,
                mpc.new_value,
                mpc.changed_at,
                mpc.source_batch_id
            FROM member_profile_changes mpc
            LEFT JOIN members m ON mpc.member_id = m.member_id
            WHERE 1=1
        """
        params: list[str] = []
        if member_id:
            query += " AND mpc.member_id = ?"
            params.append(member_id)
        if store_id:
            query += " AND m.store_id = ?"
            params.append(store_id)
        query += " ORDER BY mpc.changed_at DESC"
        result = self.conn.execute(query, params).fetchdf()
        return pl.from_pandas(result)

    def get_followup_completion_rate(
        self, store_id: str | None = None, pharmacist_id: str | None = None
    ) -> pl.DataFrame:
        query = """
            SELECT
                f.store_id,
                f.pharmacist_id,
                DATE_TRUNC('month', f.followup_date) AS month,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE f.followup_status = 'completed') AS completed,
                ROUND(
                    COUNT(*) FILTER (WHERE f.followup_status = 'completed') * 100.0 / COUNT(*),
                    1
                ) AS completion_rate
            FROM followup_records f
            WHERE 1=1
        """
        params: list[str] = []
        if store_id:
            query += " AND f.store_id = ?"
            params.append(store_id)
        if pharmacist_id:
            query += " AND f.pharmacist_id = ?"
            params.append(pharmacist_id)
        query += " GROUP BY f.store_id, f.pharmacist_id, DATE_TRUNC('month', f.followup_date)"
        query += " ORDER BY month"
        result = self.conn.execute(query, params).fetchdf()
        return pl.from_pandas(result)

    def get_member_detail_with_source(self, member_id: str) -> dict:
        member = self.conn.execute(
            "SELECT * FROM members WHERE member_id = ?",
            [member_id],
        ).fetchone()

        if not member:
            return {}

        columns = [desc[0] for desc in self.conn.execute(
            "SELECT * FROM members WHERE member_id = ?", [member_id]
        ).description]
        member_dict = dict(zip(columns, member))

        source_batch = self.conn.execute(
            "SELECT * FROM import_batches WHERE batch_id = ?",
            [member_dict.get("batch_id", "")],
        ).fetchone()

        if source_batch:
            batch_columns = [desc[0] for desc in self.conn.execute(
                "SELECT * FROM import_batches WHERE batch_id = ?",
                [member_dict.get("batch_id", "")],
            ).description]
            member_dict["_source_batch"] = dict(zip(batch_columns, source_batch))

        changes = self.conn.execute(
            "SELECT * FROM member_profile_changes WHERE member_id = ? ORDER BY changed_at DESC",
            [member_id],
        ).fetchall()
        if changes:
            change_columns = [desc[0] for desc in self.conn.execute(
                "SELECT * FROM member_profile_changes WHERE member_id = ? ORDER BY changed_at DESC",
                [member_id],
            ).description]
            member_dict["_profile_changes"] = [
                dict(zip(change_columns, row)) for row in changes
            ]

        return member_dict

    def list_import_batches(self) -> pl.DataFrame:
        result = self.conn.execute(
            "SELECT * FROM import_batches ORDER BY imported_at DESC"
        ).fetchdf()
        return pl.from_pandas(result)

    def get_batch_records(self, batch_id: str, source_type: str) -> pl.DataFrame:
        table_map = {
            "cashier": "cashier_transactions",
            "inventory": "inventory",
            "member": "members",
            "followup": "followup_records",
        }
        table = table_map.get(source_type)
        if not table:
            return pl.DataFrame()
        try:
            result = self.conn.execute(
                f"SELECT * FROM {table} WHERE batch_id = ?",
                [batch_id],
            ).fetchdf()
            return pl.from_pandas(result)
        except Exception:
            return pl.DataFrame()

    def get_member_snapshot_at_batch(self, member_id: str, batch_id: str) -> dict | None:
        member = self.conn.execute(
            "SELECT * FROM members WHERE member_id = ? AND batch_id = ?",
            [member_id, batch_id],
        ).fetchone()
        if not member:
            member = self.conn.execute(
                "SELECT * FROM members WHERE member_id = ?",
                [member_id],
            ).fetchone()
            if not member:
                return None
        columns = [desc[0] for desc in self.conn.execute(
            "SELECT * FROM members WHERE member_id = ? LIMIT 1",
            [member_id],
        ).description]
        return dict(zip(columns, member))

    def get_batch_detail(self, batch_id: str) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM import_batches WHERE batch_id = ?",
            [batch_id],
        ).fetchone()
        if not row:
            return None
        columns = [desc[0] for desc in self.conn.execute(
            "SELECT * FROM import_batches WHERE batch_id = ?",
            [batch_id],
        ).description]
        return dict(zip(columns, row))

    def close(self) -> None:
        self.conn.close()
