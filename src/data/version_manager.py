import polars as pl
from datetime import datetime
from typing import Optional, Dict, List
from src.data.database import db
from config import setup_logger, DATA_SOURCES

logger = setup_logger()


class VersionManager:
    def create_version(
        self,
        data_source: str,
        snapshot_name: str,
        description: str = "",
        df: Optional[pl.DataFrame] = None
    ) -> int:
        record_count = len(df) if df is not None else 0

        result = db.query("SELECT COALESCE(MAX(version_id), 0) + 1 as next_id FROM data_version")
        version_id = result["next_id"][0]

        sql = """
        INSERT INTO data_version (version_id, data_source, snapshot_name, description, record_count)
        VALUES (?, ?, ?, ?, ?)
        """
        db.execute(sql, {
            "1": version_id,
            "2": data_source,
            "3": snapshot_name,
            "4": description,
            "5": record_count
        })
        logger.info(f"创建数据版本成功: version_id={version_id}, source={data_source}, records={record_count}")
        return version_id

    def get_versions(self, data_source: Optional[str] = None) -> pl.DataFrame:
        sql = "SELECT * FROM data_version"
        if data_source:
            sql += f" WHERE data_source = '{data_source}'"
        sql += " ORDER BY snapshot_time DESC"
        return db.query(sql)

    def get_version(self, version_id: int) -> Optional[dict]:
        sql = "SELECT * FROM data_version WHERE version_id = ?"
        result = db.query(sql, {"1": version_id})
        if result.is_empty():
            return None
        return result.to_dicts()[0]

    def get_latest_version(self, data_source: str) -> Optional[dict]:
        sql = """
        SELECT * FROM data_version
        WHERE data_source = ?
        ORDER BY snapshot_time DESC
        LIMIT 1
        """
        result = db.query(sql, {"1": data_source})
        if result.is_empty():
            return None
        return result.to_dicts()[0]

    def compare_versions(self, version_a: int, version_b: int) -> Dict:
        sql = """
        SELECT
            va.data_source as source_a,
            vb.data_source as source_b,
            va.snapshot_time as time_a,
            vb.snapshot_time as time_b,
            va.record_count as count_a,
            vb.record_count as count_b,
            va.record_count - vb.record_count as count_diff
        FROM data_version va, data_version vb
        WHERE va.version_id = ? AND vb.version_id = ?
        """
        result = db.query(sql, {"1": version_a, "2": version_b})
        if result.is_empty():
            return {}
        return result.to_dicts()[0]

    def list_data_sources(self) -> List[Dict]:
        return DATA_SOURCES

    def get_data_source_name(self, source_id: str) -> str:
        for ds in DATA_SOURCES:
            if ds["id"] == source_id:
                return ds["name"]
        return source_id


version_manager = VersionManager()
