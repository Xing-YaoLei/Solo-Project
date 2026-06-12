from __future__ import annotations

import os
from typing import Optional

import duckdb
import polars as pl

from src.config import app_config


class DuckDBManager:
    _instance: Optional["DuckDBManager"] = None

    def __new__(cls) -> "DuckDBManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            os.makedirs(os.path.dirname(app_config.duckdb_path), exist_ok=True)
            cls._instance._conn = duckdb.connect(app_config.duckdb_path)
            cls._instance._init_schema()
        return cls._instance

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        return self._conn

    def _init_schema(self) -> None:
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS inventory (
                id VARCHAR PRIMARY KEY,
                store_id VARCHAR,
                store_name VARCHAR,
                sku_id VARCHAR,
                sku_name VARCHAR,
                category VARCHAR,
                quantity DOUBLE,
                unit VARCHAR,
                unit_price DOUBLE,
                record_date DATE
            )
            """
        )
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS member_receipts (
                id VARCHAR PRIMARY KEY,
                store_id VARCHAR,
                store_name VARCHAR,
                member_id VARCHAR,
                product_id VARCHAR,
                product_name VARCHAR,
                category VARCHAR,
                quantity DOUBLE,
                unit_price DOUBLE,
                total_amount DOUBLE,
                sale_date DATE,
                channel VARCHAR
            )
            """
        )
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS delivery_orders (
                id VARCHAR PRIMARY KEY,
                platform VARCHAR,
                order_no VARCHAR,
                store_id VARCHAR,
                store_name VARCHAR,
                product_id VARCHAR,
                product_name VARCHAR,
                category VARCHAR,
                quantity DOUBLE,
                unit_price DOUBLE,
                total_amount DOUBLE,
                order_date DATE,
                status VARCHAR,
                raw_data JSON
            )
            """
        )
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS loss_report (
                id VARCHAR PRIMARY KEY,
                report_no VARCHAR,
                store_id VARCHAR,
                store_name VARCHAR,
                sku_id VARCHAR,
                sku_name VARCHAR,
                category VARCHAR,
                loss_quantity DOUBLE,
                unit VARCHAR,
                unit_price DOUBLE,
                loss_amount DOUBLE,
                loss_reason VARCHAR,
                loss_reason_detail VARCHAR,
                report_date DATE,
                reporter VARCHAR,
                review_status VARCHAR,
                reviewer VARCHAR,
                review_comment VARCHAR,
                review_date DATE,
                responsible_store VARCHAR,
                is_exception BOOLEAN DEFAULT FALSE,
                exception_reason VARCHAR,
                metric_version VARCHAR
            )
            """
        )
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS metric_versions (
                version VARCHAR PRIMARY KEY,
                description VARCHAR,
                formula TEXT,
                effective_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR,
                changelog TEXT
            )
            """
        )
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR PRIMARY KEY,
                password_hash VARCHAR,
                role VARCHAR,
                stores VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

    def execute(self, sql: str, params: list | None = None) -> duckdb.DuckDBPyConnection:
        if params:
            return self._conn.execute(sql, params)
        return self._conn.execute(sql)

    def query_df(self, sql: str, params: list | None = None) -> pl.DataFrame:
        if params:
            result = self._conn.execute(sql, params)
        else:
            result = self._conn.execute(sql)
        return pl.from_arrow(result.fetch_arrow_table())

    def register_polars(self, name: str, df: pl.DataFrame) -> None:
        self._conn.register(name, df)

    def close(self) -> None:
        self._conn.close()
        DuckDBManager._instance = None
