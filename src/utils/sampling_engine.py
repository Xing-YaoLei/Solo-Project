import uuid
import random
import math
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
import polars as pl
import numpy as np


@dataclass
class SamplingResult:
    sampling_id: str
    sampling_method: str
    population_size: int
    sample_size: int
    confidence_level: float
    margin_of_error: float
    samples: List[Dict[str, Any]]
    sampling_criteria: str
    original_record_refs: List[str]


class SamplingEngine:
    @staticmethod
    def calculate_sample_size(population_size: int, confidence_level: float = 0.95,
                              margin_of_error: float = 0.05, proportion: float = 0.5) -> int:
        z_score = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        }.get(confidence_level, 1.96)

        p = proportion
        e = margin_of_error
        n0 = (z_score ** 2 * p * (1 - p)) / (e ** 2)

        n = n0 / (1 + (n0 - 1) / population_size)

        return math.ceil(n)

    @staticmethod
    def calculate_confidence_interval(sample_size: int, population_size: int,
                                      success_count: int, confidence_level: float = 0.95) -> Tuple[float, float, float]:
        z_score = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        }.get(confidence_level, 1.96)

        p_hat = success_count / sample_size if sample_size > 0 else 0
        se = math.sqrt((p_hat * (1 - p_hat) / sample_size) * (1 - sample_size / population_size))
        margin_of_error = z_score * se

        return (p_hat, max(0, p_hat - margin_of_error), min(1, p_hat + margin_of_error))

    @staticmethod
    def random_sampling(df: pl.DataFrame, sample_size: int,
                       seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        population_size = len(df)
        sample_size = min(sample_size, population_size)

        indices = random.sample(range(population_size), sample_size)
        samples = df[indices].to_dicts()

        id_col = df.columns[0]
        original_refs = [str(row.get(id_col, "")) for row in samples]

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="random",
            population_size=population_size,
            sample_size=sample_size,
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Simple random sampling of {sample_size} from {population_size} records",
            original_record_refs=original_refs
        )

    @staticmethod
    def stratified_sampling(df: pl.DataFrame, stratify_col: str,
                           sample_size: int, seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        population_size = len(df)

        strata = df[stratify_col].unique().to_list()
        strata_sizes = df.group_by(stratify_col).agg(pl.count().alias("count")).to_dicts()

        samples = []
        original_refs = []
        id_col = df.columns[0]

        total_sample = min(sample_size, population_size)

        for strata_info in strata_sizes:
            stratum_value = strata_info[stratify_col]
            stratum_size = strata_info["count"]

            stratum_sample_size = max(1, round(total_sample * stratum_size / population_size))
            stratum_sample_size = min(stratum_sample_size, stratum_size)

            stratum_df = df.filter(pl.col(stratify_col) == stratum_value)
            stratum_indices = random.sample(range(stratum_size), stratum_sample_size)

            stratum_samples = stratum_df[stratum_indices].to_dicts()
            samples.extend(stratum_samples)
            original_refs.extend([str(row.get(id_col, "")) for row in stratum_samples])

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="stratified",
            population_size=population_size,
            sample_size=len(samples),
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Stratified sampling by {stratify_col}, total {len(samples)} from {population_size} records",
            original_record_refs=original_refs
        )

    @staticmethod
    def systematic_sampling(df: pl.DataFrame, interval: int,
                           start_index: int = 0, seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            start_index = random.randint(0, interval - 1)

        population_size = len(df)
        indices = list(range(start_index, population_size, interval))
        samples = df[indices].to_dicts()

        id_col = df.columns[0]
        original_refs = [str(row.get(id_col, "")) for row in samples]

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="systematic",
            population_size=population_size,
            sample_size=len(samples),
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Systematic sampling with interval {interval}, starting at index {start_index}",
            original_record_refs=original_refs
        )

    @staticmethod
    def cluster_sampling(df: pl.DataFrame, cluster_col: str,
                        num_clusters: int, seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        population_size = len(df)
        clusters = df[cluster_col].unique().to_list()
        num_clusters = min(num_clusters, len(clusters))

        selected_clusters = random.sample(clusters, num_clusters)
        cluster_df = df.filter(pl.col(cluster_col).is_in(selected_clusters))
        samples = cluster_df.to_dicts()

        id_col = df.columns[0]
        original_refs = [str(row.get(id_col, "")) for row in samples]

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="cluster",
            population_size=population_size,
            sample_size=len(samples),
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Cluster sampling by {cluster_col}, selected {num_clusters} clusters: {selected_clusters}",
            original_record_refs=original_refs
        )

    @staticmethod
    def weighted_sampling(df: pl.DataFrame, weight_col: str,
                         sample_size: int, seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        population_size = len(df)
        sample_size = min(sample_size, population_size)

        weights = df[weight_col].to_numpy()
        weights = weights / weights.sum()

        indices = np.random.choice(population_size, size=sample_size, replace=False, p=weights)
        samples = df[indices.tolist()].to_dicts()

        id_col = df.columns[0]
        original_refs = [str(row.get(id_col, "")) for row in samples]

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="weighted",
            population_size=population_size,
            sample_size=sample_size,
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Weighted random sampling using weights from column {weight_col}",
            original_record_refs=original_refs
        )

    @staticmethod
    def filter_sampling(df: pl.DataFrame, filter_expr: pl.Expr,
                       sample_size: int = None, seed: int = None) -> SamplingResult:
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        filtered_df = df.filter(filter_expr)
        population_size = len(filtered_df)

        if sample_size is None:
            selected = filtered_df
        else:
            sample_size = min(sample_size, population_size)
            indices = random.sample(range(population_size), sample_size)
            selected = filtered_df[indices]

        samples = selected.to_dicts()
        id_col = df.columns[0]
        original_refs = [str(row.get(id_col, "")) for row in samples]

        return SamplingResult(
            sampling_id=f"sample_{uuid.uuid4().hex[:12]}",
            sampling_method="filtered",
            population_size=population_size,
            sample_size=len(samples),
            confidence_level=0.95,
            margin_of_error=0.05,
            samples=samples,
            sampling_criteria=f"Filter-based sampling with criteria: {str(filter_expr)}",
            original_record_refs=original_refs
        )

    @staticmethod
    def get_sample_explanation(sampling_result: SamplingResult) -> str:
        method_names = {
            "random": "简单随机抽样",
            "stratified": "分层抽样",
            "systematic": "系统抽样",
            "cluster": "整群抽样",
            "weighted": "加权抽样",
            "filtered": "过滤抽样"
        }

        method_name = method_names.get(sampling_result.sampling_method, sampling_result.sampling_method)

        explanation = f"""
        抽样方法: {method_name}
        抽样标准: {sampling_result.sampling_criteria}
        总体数量: {sampling_result.population_size}
        样本数量: {sampling_result.sample_size}
        置信水平: {sampling_result.confidence_level * 100:.0f}%
        边际误差: ±{sampling_result.margin_of_error * 100:.1f}%
        抽样ID: {sampling_result.sampling_id}
        """

        return explanation.strip()

    @staticmethod
    def validate_sample_representativeness(sample: List[Dict[str, Any]],
                                          population: pl.DataFrame,
                                          check_columns: List[str]) -> Dict[str, Any]:
        results = {}

        for col in check_columns:
            if col in population.columns:
                pop_dist = population.group_by(col).agg(
                    (pl.count() / len(population) * 100).round(2).alias("pop_pct")
                ).to_dicts()

                sample_df = pl.DataFrame(sample)
                if col in sample_df.columns:
                    sample_dist = sample_df.group_by(col).agg(
                        (pl.count() / len(sample) * 100).round(2).alias("sample_pct")
                    ).to_dicts()

                    pop_dict = {str(d[col]): d["pop_pct"] for d in pop_dist}
                    sample_dict = {str(d[col]): d["sample_pct"] for d in sample_dist}

                    all_categories = set(pop_dict.keys()) | set(sample_dict.keys())
                    differences = []

                    for cat in all_categories:
                        pop_pct = pop_dict.get(cat, 0)
                        sample_pct = sample_dict.get(cat, 0)
                        diff = abs(pop_pct - sample_pct)
                        differences.append({
                            "category": cat,
                            "population_pct": pop_pct,
                            "sample_pct": sample_pct,
                            "difference": round(diff, 2)
                        })

                    max_diff = max(d["difference"] for d in differences) if differences else 0
                    avg_diff = sum(d["difference"] for d in differences) / len(differences) if differences else 0

                    results[col] = {
                        "differences": differences,
                        "max_difference": round(max_diff, 2),
                        "avg_difference": round(avg_diff, 2),
                        "is_representative": max_diff <= 10
                    }

        overall_max = max((v["max_difference"] for v in results.values()), default=0)
        overall_pass = all(v["is_representative"] for v in results.values())

        return {
            "by_column": results,
            "overall_max_difference": round(overall_max, 2),
            "overall_pass": overall_pass
        }
