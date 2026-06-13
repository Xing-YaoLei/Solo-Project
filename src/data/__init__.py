"""
数据层包：MinIO 接入、DuckDB 持久化、数据摄入管道
"""
from src.data.minio_client import MinIOClient, minio_client
from src.data.duckdb_manager import DuckDBManager, duckdb_manager
from src.data.ingestion import DataIngestionPipeline, ingestion_pipeline

__all__ = [
    "MinIOClient", "minio_client",
    "DuckDBManager", "duckdb_manager",
    "DataIngestionPipeline", "ingestion_pipeline",
]
