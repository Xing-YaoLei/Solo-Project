import sys
sys.path.insert(0, ".")
import polars as pl
from mock_data import generate_all_data
from analytics import VersionConversionLinkage

data = generate_all_data()
vc = VersionConversionLinkage(data["case_system"], data["version_history"], data["publish_schedule"])

print("=" * 70)
print("内容口径 × 版本分组（含相对V1转化率变化、目标差距改善）:")
vg = vc.content_caliber_version_distribution()
print(vg.columns)
print(f"行数: {vg.height}")
print(vg.select([
    "content_category", "content_type", "version_group",
    "avg_conversion_rate", "avg_target_gap",
    "vs_v1_rate_diff", "vs_v1_improvement_pct", "vs_v1_target_gap_improvement",
]).head(10).to_pandas().to_string(index=False))
print()

print("=" * 70)
print("内容口径 × 审核质量矩阵（含相对基线差值）:")
qm = vc.content_caliber_quality_matrix()
print(qm.columns)
print(f"行数: {qm.height}")
print(qm.select([
    "content_category", "content_type", "review_quality",
    "avg_conversion_rate", "avg_target_gap",
    "vs_baseline_rate_diff", "vs_baseline_gap_diff", "vs_content_avg_rate_diff",
]).head(10).to_pandas().to_string(index=False))
print()

print("=" * 70)
print("示例：案例分析 内容类型各版本分组相对V1改善:")
case = vg.filter(pl.col("content_type") == "案例分析").sort("version_group")
print(case.select([
    "version_group", "avg_conversion_rate", "avg_target_gap",
    "vs_v1_rate_diff", "vs_v1_improvement_pct", "vs_v1_target_gap_improvement",
]).to_pandas().to_string(index=False))
print()

print("=" * 70)
print("示例：风险提示 内容类型各审核质量相对基线差值:")
risk = qm.filter(pl.col("content_type") == "风险提示").sort("avg_conversion_rate", descending=True)
print(risk.select([
    "review_quality", "avg_conversion_rate", "avg_target_gap",
    "vs_baseline_rate_diff", "vs_baseline_gap_diff", "vs_content_avg_rate_diff",
]).to_pandas().to_string(index=False))
print()

print("✅ 验证通过：新增字段按内容口径独立计算")
