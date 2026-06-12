from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

import polars as pl

DEFAULT_METRIC_VERSION = "v1.0"

METRIC_VERSION_DEFINITIONS = {
    "v1.0": {
        "description": "初版口径：报损金额 / 销售成本",
        "formula": "损耗率 = 报损金额 ÷ (会员小票销售金额 + 外卖平台销售金额)",
        "effective_date": date(2025, 1, 1),
        "changelog": "初始版本，以销售金额为分母。",
    },
    "v1.1": {
        "description": "调整分母：报损金额 / (销售成本 + 期末库存成本)",
        "formula": "损耗率 = 报损金额 ÷ (销售金额 + 库存成本)",
        "effective_date": date(2025, 6, 1),
        "changelog": "分母加入期末库存成本，更准确反映整体货值损耗。",
    },
    "v2.0": {
        "description": "引入复核权重：仅统计已通过复核的报损单",
        "formula": "损耗率 = (已复核通过的报损金额) ÷ (销售金额 + 库存成本)",
        "effective_date": date(2026, 1, 1),
        "changelog": "分子仅包含 review_status='通过' 的报损单，排除待复核和驳回数据。",
    },
}


@dataclass
class MetricVersion:
    version: str
    description: str
    formula: str
    effective_date: date
    changelog: str

    @classmethod
    def from_dict(cls, version: str, data: dict) -> "MetricVersion":
        return cls(
            version=version,
            description=data["description"],
            formula=data["formula"],
            effective_date=data["effective_date"],
            changelog=data["changelog"],
        )


def get_all_metric_versions() -> list[MetricVersion]:
    return [MetricVersion.from_dict(v, d) for v, d in METRIC_VERSION_DEFINITIONS.items()]


def get_metric_version(version: str) -> Optional[MetricVersion]:
    data = METRIC_VERSION_DEFINITIONS.get(version)
    if data:
        return MetricVersion.from_dict(version, data)
    return None


def get_version_for_date(target_date: date) -> MetricVersion:
    versions = sorted(
        get_all_metric_versions(),
        key=lambda v: v.effective_date,
        reverse=True,
    )
    for v in versions:
        if target_date >= v.effective_date:
            return v
    return versions[-1] if versions else MetricVersion.from_dict(DEFAULT_METRIC_VERSION, METRIC_VERSION_DEFINITIONS[DEFAULT_METRIC_VERSION])


def apply_metric_filter(loss_df: pl.DataFrame, version: str) -> pl.DataFrame:
    if version in ("v2.0",) and "review_status" in loss_df.columns:
        return loss_df.filter(pl.col("review_status") == "通过")
    return loss_df


def explain_version_change(old_version: str, new_version: str) -> str:
    old = get_metric_version(old_version)
    new = get_metric_version(new_version)
    if not old or not new:
        return "无法识别的版本号。"
    lines = [f"版本变更：{old_version} → {new_version}"]
    if old.formula != new.formula:
        lines.append(f"  公式调整：{old.formula} → {new.formula}")
    if old.description != new.description:
        lines.append(f"  描述更新：{old.description} → {new.description}")
    lines.append(f"  变更说明：{new.changelog}")
    lines.append(f"  生效日期：{new.effective_date.isoformat()}")
    return "\n".join(lines)
