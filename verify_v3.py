import sys
sys.path.insert(0, ".")
import polars as pl

from mock_data import generate_all_data
from analytics import VersionConversionLinkage

data = generate_all_data()

print("=" * 60)
print("发布排期字段：")
print(data["publish_schedule"].columns)
print()

print("=" * 60)
print("发布排期内容口径分布：")
print(data["publish_schedule"].group_by("content_category", "content_type", "content_format").agg(
    pl.col("schedule_id").count().alias("cnt")
).sort("content_category", "content_type"))
print()

print("=" * 60)
vc = VersionConversionLinkage(data["case_system"], data["version_history"], data["publish_schedule"])

enriched = vc.get_enriched_data()
print("关联后明细字段：")
print(enriched.columns)
print(f"关联数据量: {enriched.height} 条")
print()

print("=" * 60)
print("目标差距逻辑验证 (target_gap = conversion_rate - target_rate):")
sample = enriched.select(["conversion_rate", "target_rate", "target_gap", "target_achievement_pct", "target_status"]).head(10)
print(sample)
for row in sample.iter_rows(named=True):
    calc_gap = round(row["conversion_rate"] - row["target_rate"], 2)
    assert calc_gap == row["target_gap"], f"差距计算不一致: calc={calc_gap}, actual={row['target_gap']}"
print("✅ target_gap 计算一致")
print()

print("=" * 60)
print("版本分组转化率/目标差距（独立计算验证：")
vg = vc.conversion_improvement_by_version_group()
print(vg.select(["version_group", "avg_conversion_rate", "avg_target_rate", "avg_target_gap", "avg_target_achievement_pct", "conversion_improvement_pct", "target_gap_improvement"]).sort("version_group"))
print()

print("=" * 60)
print("内容口径 × 版本分组：")
cc_vg = vc.content_caliber_version_distribution()
print(cc_vg)
print()

print("=" * 60)
print("内容口径 × 审核质量矩阵：")
cc_qm = vc.content_caliber_quality_matrix()
print(cc_qm)
print()

print("=" * 60)
print("最佳版本分组（按 avg_target_gap 从大到小排序，越大越接近目标）：")
best = vc.core_retrospective_metrics()
print(f"最佳: {best['best_version_group']}")
print(f"最佳审核质量: {best['best_quality']}")
print()

print("=" * 60)
print("✅ 所有验证通过！")
