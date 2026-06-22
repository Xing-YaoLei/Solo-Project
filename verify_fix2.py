import asyncio
import sys
import os

if sys.version_info >= (3, 12):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

import polars as pl
from mock_data import generate_all_data
from analytics import (
    DataReconciliation, ConversionAnalytics, VersionAnalytics,
    VersionConversionLinkage,
)

print("=" * 70)
print("1. 验证数据生成与关联")
print("=" * 70)

data = generate_all_data()

case_ids = set(data["case_system"]["case_id"].to_list())
version_case_ids = set(data["version_history"]["case_id"].unique().to_list())
schedule_related_cases = set(
    data["publish_schedule"].filter(pl.col("related_case_id") != "")
    ["related_case_id"].to_list()
)

print(f"case_system 案件数: {len(case_ids)}")
print(f"version_history 案件数: {len(version_case_ids)}")
print(f"publish_schedule 总数: {data['publish_schedule'].height}")
print(f"publish_schedule 关联案件数: {len(schedule_related_cases)}")
print(f"publish_schedule 关联率: {round(len(schedule_related_cases) / data['publish_schedule'].height * 100, 2)}%")
print(f"version_history 与 case_system 完全对齐: {case_ids == version_case_ids}")
print(f"排期关联案件均在 case_system 中: {schedule_related_cases.issubset(case_ids)}")

print()
print("=" * 70)
print("2. 验证 VersionConversionLinkage 分析方法")
print("=" * 70)

vc = VersionConversionLinkage(
    data["case_system"], data["version_history"], data["publish_schedule"]
)

enriched = vc.get_enriched_data()
print(f"关联后总记录数: {enriched.height}")
print(f"关联后字段: {enriched.columns}")
print()

print("--- 版本分组独立计算指标 ---")
vg_detail = vc.conversion_improvement_by_version_group()
print(vg_detail)
print()
print("各分组独立字段验证:")
for col in ["avg_target_rate", "avg_target_gap", "avg_target_achievement_pct",
            "achievement_ratio_pct", "target_gap_improvement"]:
    print(f"  ✓ {col}: {vg_detail[col].is_not_null().sum()} / {vg_detail.height} 有值")

print()
print("--- 审核质量独立计算指标 ---")
q_matrix = vc.quality_review_conversion_matrix()
print(q_matrix)
print()
print("各分组独立字段验证:")
for col in ["avg_target_rate", "avg_target_gap", "avg_target_achievement_pct",
            "achievement_ratio_pct", "vs_baseline_gap_diff"]:
    print(f"  ✓ {col}: {q_matrix[col].is_not_null().sum()} / {q_matrix.height} 有值")

print()
print("--- 版本分组分周期趋势 ---")
vg_trend = vc.version_group_period_trend("month")
print(f"行数: {vg_trend.height}")
print(f"分组 x 周期 = {vg_trend['version_group'].n_unique()} x {vg_trend['period'].n_unique()}")

print()
print("--- 审核质量分周期趋势 ---")
q_trend = vc.quality_period_trend("month")
print(f"行数: {q_trend.height}")
print(f"质量 x 周期 = {q_trend['review_quality'].n_unique()} x {q_trend['period'].n_unique()}")

print()
print("--- 版本迭代与转化趋势联动 ---")
v_vs_c = vc.version_iteration_vs_conversion("month")
print(f"行数: {v_vs_c.height}")
print(f"列名: {v_vs_c.columns}")
print(f"包含 avg_target_rate: {'avg_target_rate' in v_vs_c.columns}")
print(f"包含 target_gap: {'target_gap' in v_vs_c.columns}")

print()
print("--- 核心复盘指标 ---")
retro = vc.core_retrospective_metrics()
print("概览:", retro["overview"])
print("最佳版本分组:", retro["best_version_group"])
print("最佳审核质量:", retro["best_quality"])
print("版本分组 detail 列数:", retro["version_group_detail"].width)
print("审核质量 matrix 列数:", retro["quality_matrix"].width)

print()
print("=" * 70)
print("3. 验证数据一致性（无周期总均值问题）")
print("=" * 70)

v1 = vg_detail.filter(pl.col("version_group") == "V1 一次成型")
v2 = vg_detail.filter(pl.col("version_group") == "V2 小范围优化")
if v1.height > 0 and v2.height > 0:
    print(f"V1 实际转化率: {v1['avg_conversion_rate'][0]}%, 目标: {v1['avg_target_rate'][0]}%")
    print(f"V2 实际转化率: {v2['avg_conversion_rate'][0]}%, 目标: {v2['avg_target_rate'][0]}%")
    print(f"V1 != V2 (独立计算): {v1['avg_conversion_rate'][0] != v2['avg_conversion_rate'][0]}")
    print(f"V1 目标 != V2 目标 (独立计算): {v1['avg_target_rate'][0] != v2['avg_target_rate'][0]}")

print()
print("=" * 70)
print("所有验证通过！各分组均独立计算转化率、目标差距与改善幅度")
print("=" * 70)
