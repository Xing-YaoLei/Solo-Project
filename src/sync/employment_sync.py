from typing import List, Optional
import polars as pl
from datetime import datetime
from src.sync.base_sync import BaseSyncPipeline, SyncNode
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient

class EmploymentSyncPipeline(BaseSyncPipeline):
    def __init__(self, db_client: DuckDBClient, minio_client: MinIOClient):
        super().__init__("employment", db_client, minio_client)

    def define_nodes(self) -> List[SyncNode]:
        return [
            SyncNode("extract_source", "从就业表系统提取原始数据", 1),
            SyncNode("validate_schema", "校验数据格式和完整性", 2),
            SyncNode("deduplicate", "去重处理", 3),
            SyncNode("enrich_region", "补全区域信息", 4),
            SyncNode("load_to_database", "加载到DuckDB数据仓库", 5)
        ]

    def execute_node(self, node: SyncNode) -> Optional[pl.DataFrame]:
        if node.name == "extract_source":
            return self._extract_data()
        elif node.name == "validate_schema":
            return self._validate_schema(node)
        elif node.name == "deduplicate":
            return self._deduplicate(node)
        elif node.name == "enrich_region":
            return self._enrich_region(node)
        elif node.name == "load_to_database":
            return self._load_to_database(node)
        return None

    def _extract_data(self) -> pl.DataFrame:
        query = """
            SELECT 
                record_id,
                student_id,
                student_name,
                course_id,
                course_name,
                employment_date,
                company_name,
                position,
                salary,
                region,
                is_placed,
                created_at
            FROM employment_records
            WHERE sync_id IS NULL
            OR created_at >= CURRENT_DATE - INTERVAL '7 days'
        """
        try:
            df = self.db_client.query_to_polars(query)
        except:
            df = pl.DataFrame()
        return df

    def _validate_schema(self, node: SyncNode) -> pl.DataFrame:
        prev_node = self.nodes[node.node_order - 2]
        query = f"""
            SELECT * FROM sync_audit_log 
            WHERE sync_id = '{self.sync_id}' 
            AND sync_node = '{prev_node.name}'
            ORDER BY end_time DESC LIMIT 1
        """
        try:
            audit_df = self.db_client.query_to_polars(query)
            if len(audit_df) > 0:
                records_count = audit_df["records_processed"][0]
                node.metadata["previous_records"] = records_count
        except:
            pass
        
        df = self._extract_data()
        if len(df) == 0:
            return df
        
        validation_rules = {
            "record_id": df["record_id"].is_not_null(),
            "student_id": df["student_id"].is_not_null(),
            "employment_date": df["employment_date"].is_not_null(),
            "salary": df["salary"] >= 0
        }
        
        valid_mask = pl.lit(True)
        for rule in validation_rules.values():
            valid_mask &= rule
        
        valid_df = df.filter(valid_mask)
        invalid_count = len(df) - len(valid_df)
        node.metadata["invalid_records"] = invalid_count
        node.metadata["validation_rules"] = list(validation_rules.keys())
        
        return valid_df

    def _deduplicate(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_data()
        if len(df) == 0:
            return df
        
        dedup_df = df.unique(subset=["record_id"], keep="last")
        dup_count = len(df) - len(dedup_df)
        node.metadata["duplicates_removed"] = dup_count
        
        return dedup_df

    def _enrich_region(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_data()
        if len(df) == 0:
            return df
        
        region_mapping = {
            "上海": "华东", "江苏": "华东", "浙江": "华东", "安徽": "华东", "福建": "华东", "江西": "华东", "山东": "华东",
            "广东": "华南", "广西": "华南", "海南": "华南",
            "北京": "华北", "天津": "华北", "河北": "华北", "山西": "华北", "内蒙古": "华北",
            "湖北": "华中", "湖南": "华中", "河南": "华中",
            "四川": "西南", "云南": "西南", "贵州": "西南", "西藏": "西南", "重庆": "西南",
            "陕西": "西北", "甘肃": "西北", "青海": "西北", "宁夏": "西北", "新疆": "西北",
            "辽宁": "东北", "吉林": "东北", "黑龙江": "东北"
        }
        
        enriched_df = df.with_columns([
            pl.when(pl.col("region").is_in(list(region_mapping.keys())))
              .then(pl.col("region").map_dict(region_mapping))
              .otherwise(pl.col("region"))
              .alias("region")
        ])
        
        node.metadata["region_enriched"] = enriched_df["region"].is_not_null().sum()
        return enriched_df

    def _load_to_database(self, node: SyncNode) -> Optional[pl.DataFrame]:
        df = self._extract_data()
        if len(df) == 0:
            return None
        
        df = df.with_columns([
            pl.lit(self.sync_id).alias("sync_id")
        ])
        
        self.db_client.upsert_dataframe("employment_records", df, "record_id")
        node.metadata["table_loaded"] = "employment_records"
        return df
