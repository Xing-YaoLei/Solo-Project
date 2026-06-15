from typing import List, Optional
import polars as pl
from datetime import datetime
from src.sync.base_sync import BaseSyncPipeline, SyncNode
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient

class QuestionBankSyncPipeline(BaseSyncPipeline):
    def __init__(self, db_client: DuckDBClient, minio_client: MinIOClient):
        super().__init__("question_bank", db_client, minio_client)

    def define_nodes(self) -> List[SyncNode]:
        return [
            SyncNode("extract_attempts", "从题库系统提取答题记录", 1),
            SyncNode("detect_plagiarism", "检测作业抄袭相似度", 2),
            SyncNode("calculate_scores", "计算得分和正确率", 3),
            SyncNode("validate_scores", "校验分数合理性", 4),
            SyncNode("generate_plagiarism_samples", "生成抄袭样本对", 5),
            SyncNode("aggregate_exam_stats", "聚合考试通过率统计", 6),
            SyncNode("load_to_database", "加载到DuckDB数据仓库", 7)
        ]

    def execute_node(self, node: SyncNode) -> Optional[pl.DataFrame]:
        if node.name == "extract_attempts":
            return self._extract_attempts()
        elif node.name == "detect_plagiarism":
            return self._detect_plagiarism(node)
        elif node.name == "calculate_scores":
            return self._calculate_scores(node)
        elif node.name == "validate_scores":
            return self._validate_scores(node)
        elif node.name == "generate_plagiarism_samples":
            return self._generate_plagiarism_samples(node)
        elif node.name == "aggregate_exam_stats":
            return self._aggregate_exam_stats(node)
        elif node.name == "load_to_database":
            return self._load_to_database(node)
        return None

    def _extract_attempts(self) -> pl.DataFrame:
        query = """
            SELECT 
                attempt_id,
                student_id,
                student_name,
                question_id,
                exam_id,
                exam_name,
                is_correct,
                score,
                total_score,
                attempt_time,
                plagiarism_score,
                is_plagiarized,
                region,
                created_at
            FROM question_bank_records
            WHERE sync_id IS NULL
            OR created_at >= CURRENT_DATE - INTERVAL '7 days'
        """
        try:
            df = self.db_client.query_to_polars(query)
        except:
            df = pl.DataFrame()
        return df

    def _detect_plagiarism(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_attempts()
        if len(df) == 0:
            return df
        
        df_with_plagiarism = df.with_columns([
            pl.when(pl.col("plagiarism_score").is_null())
              .then(pl.lit(0.0).cast(pl.Float64))
              .otherwise(pl.col("plagiarism_score"))
              .alias("plagiarism_score")
        ]).with_columns([
            (pl.col("plagiarism_score") > 0.8).alias("is_plagiarized_calculated")
        ]).with_columns([
            pl.when(pl.col("is_plagiarized").is_null())
              .then(pl.col("is_plagiarized_calculated"))
              .otherwise(pl.col("is_plagiarized"))
              .alias("is_plagiarized")
        ]).drop("is_plagiarized_calculated")
        
        suspected_count = df_with_plagiarism.filter(pl.col("is_plagiarized")).shape[0]
        node.metadata["plagiarism_suspected_count"] = suspected_count
        node.metadata["plagiarism_rate"] = suspected_count / len(df) if len(df) > 0 else 0
        
        return df_with_plagiarism

    def _calculate_scores(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_attempts()
        if len(df) == 0:
            return df
        
        score_df = df.with_columns([
            pl.when(pl.col("score").is_null())
              .then(pl.when(pl.col("is_correct")).then(pl.col("total_score")).otherwise(0))
              .otherwise(pl.col("score"))
              .alias("score_calculated"),
            (pl.col("score") / pl.col("total_score") * 100).alias("percentage_score")
        ]).with_columns([
            pl.coalesce("score", "score_calculated").alias("score")
        ]).drop("score_calculated")
        
        avg_score = score_df["percentage_score"].mean()
        pass_count = score_df.filter(pl.col("percentage_score") >= 60).shape[0]
        node.metadata["average_score"] = float(avg_score) if avg_score else 0
        node.metadata["pass_count"] = pass_count
        
        return score_df

    def _validate_scores(self, node: SyncNode) -> pl.DataFrame:
        df = self._extract_attempts()
        if len(df) == 0:
            return df
        
        valid_mask = (
            (pl.col("score") >= 0) &
            (pl.col("score") <= pl.col("total_score")) &
            (pl.col("total_score") > 0) &
            (pl.col("attempt_time").is_not_null())
        )
        
        valid_df = df.filter(valid_mask)
        invalid_count = len(df) - len(valid_df)
        node.metadata["invalid_scores_removed"] = invalid_count
        
        return valid_df

    def _generate_plagiarism_samples(self, node: SyncNode) -> Optional[pl.DataFrame]:
        df = self._extract_attempts()
        if len(df) < 2:
            return None
        
        plagiarized_df = df.filter(pl.col("is_plagiarized"))
        if len(plagiarized_df) == 0:
            return None
        
        samples = []
        seen_pairs = set()
        
        for i in range(min(len(plagiarized_df), 100)):
            for j in range(i + 1, min(len(plagiarized_df), 100)):
                row1 = plagiarized_df[i]
                row2 = plagiarized_df[j]
                
                pair_key = tuple(sorted([row1["student_id"][0], row2["student_id"][0]]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                
                if row1["exam_id"][0] == row2["exam_id"][0] and row1["question_id"][0] == row2["question_id"][0]:
                    similarity = max(float(row1["plagiarism_score"][0]), float(row2["plagiarism_score"][0]))
                    samples.append({
                        "sample_id": f"SAMP_{datetime.now().strftime('%Y%m%d')}_{len(samples)}",
                        "attempt_id_1": row1["attempt_id"][0],
                        "attempt_id_2": row2["attempt_id"][0],
                        "student_id_1": row1["student_id"][0],
                        "student_id_2": row2["student_id"][0],
                        "similarity_score": similarity,
                        "matched_questions": row1["question_id"][0],
                        "detection_time": datetime.now(),
                        "review_status": "pending",
                        "reviewer_notes": None,
                        "sync_id": self.sync_id,
                        "created_at": datetime.now()
                    })
        
        if samples:
            samples_df = pl.DataFrame(samples)
            self.db_client.insert_dataframe("plagiarism_samples", samples_df)
            node.metadata["samples_generated"] = len(samples_df)
            return samples_df
        
        return None

    def _aggregate_exam_stats(self, node: SyncNode) -> Optional[pl.DataFrame]:
        df = self._extract_attempts()
        if len(df) == 0:
            return None
        
        exam_stats = df.group_by(["exam_id", "exam_name", "region", pl.col("attempt_time").dt.date().alias("exam_date")]).agg([
            pl.n_unique("student_id").alias("total_students"),
            pl.sum(pl.when(pl.col("score") / pl.col("total_score") >= 0.6).then(1).otherwise(0)).alias("passed_students"),
            (pl.sum(pl.when(pl.col("score") / pl.col("total_score") >= 0.6).then(1).otherwise(0)) / pl.n_unique("student_id")).alias("pass_rate"),
            pl.mean(pl.col("score") / pl.col("total_score") * 100).alias("average_score")
        ]).with_columns([
            pl.concat_str([
                pl.col("exam_id"), 
                pl.col("region"), 
                pl.col("exam_date").cast(pl.Utf8)
            ], separator="_").alias("rate_id")
        ]).with_columns([
            pl.lit(self.sync_id).alias("sync_id"),
            pl.lit(datetime.now()).alias("created_at")
        ])
        
        if len(exam_stats) > 0:
            self.db_client.upsert_dataframe("exam_pass_rates", exam_stats, "rate_id")
            node.metadata["exams_aggregated"] = len(exam_stats)
            node.metadata["overall_pass_rate"] = float(exam_stats["pass_rate"].mean())
        
        return exam_stats

    def _load_to_database(self, node: SyncNode) -> Optional[pl.DataFrame]:
        df = self._extract_attempts()
        if len(df) == 0:
            return None
        
        df = df.with_columns([
            pl.lit(self.sync_id).alias("sync_id")
        ])
        
        self.db_client.upsert_dataframe("question_bank_records", df, "attempt_id")
        node.metadata["table_loaded"] = "question_bank_records"
        return df
