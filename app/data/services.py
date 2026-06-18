from datetime import date, timedelta
from typing import Optional

from app.data.queries import (
    get_reconciliation_trend,
    get_contract_attachments,
    get_attachment_type_stats,
    get_document_details,
    get_approval_abnormal,
    get_payment_cycle_data,
    get_project_funnel,
    get_project_list,
    _to_float
)


def build_reconciliation_trend_df(
    months: int = 6,
    end_date: Optional[date] = None
):
    if end_date is None:
        end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)
    return get_reconciliation_trend(start_date, end_date)


def aggregate_monthly_diff(df):
    if df.empty or "月份" not in df.columns:
        import pandas as pd
        return pd.DataFrame()
    monthly = df.groupby("月份").agg(
        预算总额=("预算金额", "sum"),
        实际总额=("实际金额", "sum"),
        差异总额=("差异金额", "sum"),
        采购单数=("采购单号", "nunique")
    ).reset_index()
    monthly["月差异率(%)"] = round(
        monthly["差异总额"] / monthly["预算总额"].replace(0, float("nan")) * 100, 2
    )
    return monthly


def aggregate_category_diff(df):
    if df.empty or "分类" not in df.columns:
        import pandas as pd
        return pd.DataFrame()
    cat = df.groupby("分类").agg(
        预算总额=("预算金额", "sum"),
        实际总额=("实际金额", "sum"),
        差异总额=("差异金额", "sum"),
        采购单数=("采购单号", "nunique")
    ).reset_index()
    cat["差异率(%)"] = round(
        cat["差异总额"] / cat["预算总额"].replace(0, float("nan")) * 100, 2
    )
    cat = cat.sort_values("差异总额", key=abs, ascending=False)
    return cat
