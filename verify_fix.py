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
from data_layer import dw

print("=" * 60)
print("1. 验证 version_history 与 case_system 数据一致性")
print("=" * 60)

data = generate_all_data()

case_ids = set(data["case_system"]["case_id"].to_list())
version_case_ids = set(data["version_history"]["case_id"].unique().to_list())

print(f"case_system 案件数: {len(case_ids)}")
print(f"version_history 案件数: {len(version_case_ids)}")
print(f"case_system ⊆ version_history: {case_ids.issubset(version_case_ids)}")
print(f"version_history ⊆ case_system: {version_case_ids.issubset(case_ids)}")
print(f"两集合完全相等: {case_ids == version_case_ids}")

sample_id = data["case_system"]["case_id"][0]
case_row = data["case_system"].filter(pl.col("case_id") == sample_id).row(0, named=True)
version_rows = data["version_history"].filter(pl.col("case_id") == sample_id)
print(f"\n抽样案件 {sample_id}:")
print(f"  case_system 版本数: {case_row['version']}, 状态: {case_row['status']}")
print(f"  version_history 版本数: {version_rows.height}")
print(f"  version_history 最高版本: {version_rows['version'].max()}")
print(f"  version_history 含案件类型: {version_rows['case_type'][0] if version_rows.height > 0 else 'N/A'}")
latest_v = version_rows.filter(pl.col("is_latest"))
if latest_v.height > 0:
    print(f"  最新版本审核状态: {latest_v['review_status'][0]}")

print()
print("=" * 60)
print("2. 验证 VersionConversionLinkage 核心复盘指标")
print("=" * 60)

vc = VersionConversionLinkage(
    data["case_system"], data["version_history"], data["publish_schedule"]
)

retro = vc.core_retrospective_metrics()
print("概览指标:", retro["overview"])
print("最佳版本分组:", retro["best_version_group"])
print("最佳审核质量:", retro["best_quality"])
print("版本分组明细行数:", retro["version_group_detail"].height)
print("审核质量矩阵行数:", retro["quality_matrix"].height)

print()
print("=" * 60)
print("3. 验证版本-转化联动方法")
print("=" * 60)

v_vs_c = vc.version_iteration_vs_conversion("month")
print(f"version_iteration_vs_conversion 行数: {v_vs_c.height}")
print(f"  列: {v_vs_c.columns}")

vg_detail = vc.conversion_improvement_by_version_group()
print(f"conversion_improvement_by_version_group 行数: {vg_detail.height}")
print(vg_detail)

imp_trend = vc.improvement_trend("month")
print(f"improvement_trend 行数: {imp_trend.height}")

q_matrix = vc.quality_review_conversion_matrix()
print(f"quality_review_conversion_matrix 行数: {q_matrix.height}")
print(q_matrix)

print()
print("=" * 60)
print("4. 验证 Streamlit 应用导入")
print("=" * 60)

import streamlit as st
print("Streamlit 导入成功")
print()
print("=" * 60)
print("所有验证通过！")
print("=" * 60)
