from dataclasses import dataclass
from typing import Dict, Optional
import polars as pl

from src.data.minio_client import minio_client
from src.data.duckdb_manager import duckdb_manager
from src.data import mock_data


@dataclass
class DataRepository:
    vehicles: Optional[pl.DataFrame] = None
    cash_transactions: Optional[pl.DataFrame] = None
    work_orders: Optional[pl.DataFrame] = None
    work_order_items: Optional[pl.DataFrame] = None
    work_order_versions: Optional[pl.DataFrame] = None
    parts_inventory: Optional[pl.DataFrame] = None
    parts_inventory_history: Optional[pl.DataFrame] = None
    insurance_docs: Optional[pl.DataFrame] = None
    diagnosis_results: Optional[pl.DataFrame] = None
    maintenance_reminders: Optional[pl.DataFrame] = None
    rework_records: Optional[pl.DataFrame] = None
    parts_shortage: Optional[pl.DataFrame] = None

    def load_all(self, use_mock: bool = True) -> None:
        if use_mock:
            self._load_mock_data()
        else:
            self._load_from_store()
        self._register_to_duckdb()

    def _load_mock_data(self) -> None:
        self.vehicles = mock_data.generate_vehicles()
        self.cash_transactions = mock_data.generate_cash_transactions()
        self.work_orders = mock_data.generate_work_orders()
        self.work_order_items = mock_data.generate_work_order_items()
        self.work_order_versions = mock_data.generate_work_order_versions()
        self.parts_inventory = mock_data.generate_parts_inventory()
        self.parts_inventory_history = mock_data.generate_parts_inventory_history()
        self.insurance_docs = mock_data.generate_insurance_docs()
        self.diagnosis_results = mock_data.generate_diagnosis_results()
        self.maintenance_reminders = mock_data.generate_maintenance_reminders()
        self.rework_records = mock_data.generate_rework_records()
        self.parts_shortage = mock_data.generate_parts_shortage(
            inventory_history=self.parts_inventory_history
        )

    def _load_from_store(self) -> None:
        data_map = {
            "vehicles": "vehicles/vehicles.parquet",
            "cash_transactions": "transactions/cash_transactions.parquet",
            "work_orders": "workorders/work_orders.parquet",
            "work_order_items": "workorders/work_order_items.parquet",
            "work_order_versions": "workorders/work_order_versions.parquet",
            "parts_inventory": "inventory/parts_inventory.parquet",
            "parts_inventory_history": "inventory/parts_inventory_history.parquet",
            "insurance_docs": "insurance/insurance_docs.parquet",
            "diagnosis_results": "diagnosis/diagnosis_results.parquet",
            "maintenance_reminders": "maintenance/maintenance_reminders.parquet",
            "rework_records": "quality/rework_records.parquet",
            "parts_shortage": "inventory/parts_shortage.parquet",
        }

        for attr, path in data_map.items():
            df = minio_client.get_dataframe(path)
            if df is not None:
                setattr(self, attr, df)

    def _register_to_duckdb(self) -> None:
        tables = {
            "vehicles": self.vehicles,
            "cash_transactions": self.cash_transactions,
            "work_orders": self.work_orders,
            "work_order_items": self.work_order_items,
            "work_order_versions": self.work_order_versions,
            "parts_inventory": self.parts_inventory,
            "parts_inventory_history": self.parts_inventory_history,
            "insurance_docs": self.insurance_docs,
            "diagnosis_results": self.diagnosis_results,
            "maintenance_reminders": self.maintenance_reminders,
            "rework_records": self.rework_records,
            "parts_shortage": self.parts_shortage,
        }

        for name, df in tables.items():
            if df is not None:
                duckdb_manager.register_polars(name, df)

    def save_all(self) -> None:
        data_map = {
            "vehicles/vehicles.parquet": self.vehicles,
            "transactions/cash_transactions.parquet": self.cash_transactions,
            "workorders/work_orders.parquet": self.work_orders,
            "workorders/work_order_items.parquet": self.work_order_items,
            "workorders/work_order_versions.parquet": self.work_order_versions,
            "inventory/parts_inventory.parquet": self.parts_inventory,
            "inventory/parts_inventory_history.parquet": self.parts_inventory_history,
            "insurance/insurance_docs.parquet": self.insurance_docs,
            "diagnosis/diagnosis_results.parquet": self.diagnosis_results,
            "maintenance/maintenance_reminders.parquet": self.maintenance_reminders,
            "quality/rework_records.parquet": self.rework_records,
            "inventory/parts_shortage.parquet": self.parts_shortage,
        }

        for path, df in data_map.items():
            if df is not None:
                minio_client.put_dataframe(path, df)

    def get_work_orders_with_vehicles(self) -> pl.DataFrame:
        if self.work_orders is None or self.vehicles is None:
            return pl.DataFrame()
        return self.work_orders.join(
            self.vehicles, on="vehicle_id", how="left", suffix="_vehicle"
        )

    def get_work_orders_with_transactions(self) -> pl.DataFrame:
        if self.work_orders is None or self.cash_transactions is None:
            return pl.DataFrame()
        return self.work_orders.join(
            self.cash_transactions, on="work_order_id", how="left", suffix="_cash"
        )

    def get_inventory_with_shortage(self) -> pl.DataFrame:
        if self.parts_inventory is None or self.parts_shortage is None:
            return self.parts_inventory if self.parts_inventory is not None else pl.DataFrame()
        return self.parts_inventory.join(
            self.parts_shortage, on="part_id", how="left", suffix="_shortage"
        )

    def get_rework_summary(self) -> pl.DataFrame:
        if self.rework_records is None or self.work_orders is None:
            return pl.DataFrame()

        rework_count = self.rework_records.group_by("work_order_id").agg(
            pl.count("rework_id").alias("rework_count")
        )

        return self.work_orders.join(
            rework_count, on="work_order_id", how="left"
        ).with_columns(
            pl.col("rework_count").fill_null(0).alias("rework_count"),
            (pl.col("rework_count") > 0).alias("is_reworked"),
        )


repository = DataRepository()
