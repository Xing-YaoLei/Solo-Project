from typing import List, Optional
import polars as pl
from datetime import datetime
from src.sync.base_sync import BaseSyncPipeline, SyncNode
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient

class LivePlatformSyncPipeline(BaseSyncPipeline):
    def __init__(self, db_client: DuckDBClient, minio_client: MinIOClient):
        super().__init__("live_platform", db_client, minio_client)

    def define_nodes(self) -> List[SyncNode]:
        return [
            SyncNode("extract_raw_logs", "从直播平台提取观看日志", 1),
            SyncNode("parse_timestamps", "解析进入/离开时间戳", 2),
            SyncNode("calculate_duration", "计算观看时长和互动数据", 3),
            SyncNode("validate_watch_quality", "校验观看质量（时长>0，互动合理）", 4),
            SyncNode("aggregate_student_stats", "按学生聚合统计数据", 5),
            SyncNode("load_to_database", "加载到DuckDB数据仓库", 6)
        ]

    def execute_node(self, node: SyncNode) -> Optional[pl.DataFrame]:
        if node.name == "extract_raw_logs":
            return self._extract_raw_logs()
        elif node.name == "parse_timestamps":
            return self._parse_timestamps(node)
        elif node.name == "calculate_duration":
            return self._calculate_duration(node)
        elif node.name == "validate_watch_quality":
            return self._validate_watch_quality(node)
        elif node.name == "aggregate_student_stats":
            return self._aggregate_student_stats(node)
        elif node.name == "load_to_database":
            return self._load_to_database(node)
        return None

    def _extract_raw_logs(self) -> pl.DataFrame:
        query = """
            SELECT 
                log_id,
                student_id,
                student_name,
                room_id,
                room_title,
                join_time,
                leave_time,
                watch_duration,
                interaction_count,
                region,
                created_at
            FROM live_platform_logs
            WHERE sync_id IS NULL
            OR created_at >= CURRENT_DATE - INTERVAL '7 days'
        """
        try:
            df = self.db_client.query_to_polars(query)
        except:
            df = pl.DataFrame()
        return df

    def _parse_timestamps(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_raw_logs()
        if len(df) == 0:
            return df
        
        parsed_df = df.with_columns([
            pl.col("join_time").str.to_datetime(format="%Y-%m-%d %H:%M:%S", strict=False)
              .alias("join_time_parsed"),
            pl.col("leave_time").str.to_datetime(format="%Y-%m-%d %H:%M:%S", strict=False)
              .alias("leave_time_parsed")
        ]).drop(["join_time", "leave_time"]).rename({
            "join_time_parsed": "join_time",
            "leave_time_parsed": "leave_time"
        })
        
        null_join = parsed_df["join_time"].is_null().sum()
        null_leave = parsed_df["leave_time"].is_null().sum()
        node.metadata["null_join_time"] = int(null_join)
        node.metadata["null_leave_time"] = int(null_leave)
        
        return parsed_df

    def _calculate_duration(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_raw_logs()
        if len(df) == 0:
            return df
        
        duration_df = df.with_columns([
            pl.when(pl.col("join_time").is_not_null() & pl.col("leave_time").is_not_null())
              .then((pl.col("leave_time") - pl.col("join_time")).dt.total_seconds().cast(pl.Int64))
              .otherwise(pl.col("watch_duration"))
              .alias("calculated_duration")
        ]).with_columns([
            pl.max_horizontal(["calculated_duration", "watch_duration"]).alias("watch_duration")
        ]).drop("calculated_duration")
        
        avg_duration = duration_df["watch_duration"].mean()
        node.metadata["avg_watch_duration"] = float(avg_duration) if avg_duration else 0
        
        return duration_df

    def _validate_watch_quality(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_raw_logs()
        if len(df) == 0:
            return df
        
        valid_mask = (
            (pl.col("watch_duration") > 0) &
            (pl.col("watch_duration") < 86400) &
            (pl.col("interaction_count") >= 0) &
            (pl.col("interaction_count") < 10000)
        )
        
        valid_df = df.filter(valid_mask)
        invalid_count = len(df) - len(valid_df)
        node.metadata["invalid_records_removed"] = invalid_count
        node.metadata["quality_pass_rate"] = len(valid_df) / len(df) if len(df) > 0 else 0
        
        return valid_df

    def _aggregate_student_stats(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_raw_logs()
        if len(df) == 0:
            return df
        
        agg_df = df.group_by(["student_id", "student_name", "region"]).agg([
            pl.n_unique("room_id").alias("rooms_joined"),
            pl.sum("watch_duration").alias("total_watch_seconds"),
            pl.mean("watch_duration").alias("avg_watch_per_room"),
            pl.sum("interaction_count").alias("total_interactions"),
            pl.max("join_time").alias("last_join_time")
        ])
        
        node.metadata["students_aggregated"] = len(agg_df)
        node.metadata["avg_rooms_per_student"] = float(agg_df["rooms_joined"].mean()) if len(agg_df) > 0 else 0
        
        return df

    def _load_to_database(self, node: SyncNode) -> Optional[pl.DataFrame]:
        df = self._extract_raw_logs()
        if len(df) == 0:
            return None
        
        df = df.with_columns([
            pl.lit(self.sync_id).alias("sync_id")
        ])
        
        self.db_client.upsert_dataframe("live_platform_logs", df, "log_id")
        node.metadata["table_loaded"] = "live_platform_logs"
        return df
