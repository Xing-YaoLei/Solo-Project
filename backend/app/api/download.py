from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from io import BytesIO
import pandas as pd

from app.db.session import get_db
from app import models
from app.services.duckdb_service import duckdb_service
from app.core.config import settings

router = APIRouter(prefix="/download", tags=["报表下载"])


PROMO_CALCULATION_RULES = [
    {
        "规则名称": "促销销售金额",
        "计算公式": "Σ(促销商品实际销售金额)",
        "说明": "仅统计该促销活动关联的商品实际销售金额（优惠后），收银延迟数据将在延迟到账后补入",
    },
    {
        "规则名称": "目标销售额",
        "计算公式": "活动配置的目标销售金额",
        "说明": "由促销活动创建时录入，用于达成率计算基准",
    },
    {
        "规则名称": "销售达成率",
        "计算公式": "(促销销售金额 / 目标销售额) × 100%",
        "说明": "精确到小数点后2位，低于100%表示未达标",
    },
    {
        "规则名称": "日均目标额",
        "计算公式": "目标销售额 / 活动天数",
        "说明": "活动天数 = 结束日期 - 开始日期 + 1",
    },
    {
        "规则名称": "陈列巡检完成率",
        "计算公式": "(已巡检次数 / 应巡检次数) × 100%",
        "说明": "应巡检次数通常为活动天数，具体以业务配置为准",
    },
    {
        "规则名称": "陈列合格率",
        "计算公式": "(合格巡检次数 / 总巡检次数) × 100%",
        "说明": "陈列综合评分达到阈值（默认60分）为合格",
    },
    {
        "规则名称": "问题整改完成率",
        "计算公式": "(已整改问题数 / 总问题数) × 100%",
        "说明": "整改状态为'completed'记为已整改",
    },
    {
        "规则名称": "会员销售占比",
        "计算公式": "(会员销售金额 / 总销售金额) × 100%",
        "说明": "仅统计明确标记为会员的销售记录，缺失数据将单独标注",
    },
    {
        "规则名称": "医保销售占比",
        "计算公式": "(医保结算金额 / 总销售金额) × 100%",
        "说明": "医保接口口径变化的日期将单独标记，需人工复核",
    },
    {
        "规则名称": "预计损失销售额",
        "计算公式": "日均目标额 × 陈列不合格影响天数 × 30%",
        "说明": "假设陈列不合格导致约30%销售损失，为估算值仅供参考",
    },
]


EXCEPTION_TYPES = {
    "cashier_delay": "收银系统延迟",
    "member_missing": "会员记录缺失",
    "mi_caliber_change": "医保接口口径变化",
}


@router.get("/funnel-report")
def download_funnel_report(
    promotion_id: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    duckdb_service.refresh_data(settings.DATABASE_URL)
    funnel_rows = duckdb_service.query_funnel_data(
        promotion_id=promotion_id,
        region=region,
        start_date=start_date,
        end_date=end_date,
    )

    funnel_data = []
    for row in funnel_rows:
        target = row["target_sales"] or 0.0
        actual = row["actual_sales"] or 0.0
        total_checks = row["total_display_checks"] or 0
        qualified_checks = row["qualified_display_count"] or 0
        display_rate = (qualified_checks / total_checks * 100) if total_checks > 0 else 0
        total_issues = row["total_issues"] or 0
        rectified = row["rectified_count"] or 0
        rectify_rate = (rectified / total_issues * 100) if total_issues > 0 else 100
        achievement = (actual / target * 100) if target > 0 else 0

        funnel_data.append(
            {
                "促销编码": row["promo_code"],
                "促销名称": row["promo_name"],
                "门店名称": row["store_name"],
                "区域": row["region"],
                "开始日期": row["start_date"].isoformat() if row["start_date"] else "",
                "结束日期": row["end_date"].isoformat() if row["end_date"] else "",
                "目标销售额(元)": round(target, 2),
                "实际销售额(元)": round(actual, 2),
                "销售达成率(%)": round(achievement, 2),
                "巡检总次数": total_checks,
                "合格次数": qualified_checks,
                "陈列合格率(%)": round(display_rate, 2),
                "平均陈列得分": round(row["avg_display_score"] or 0, 0),
                "问题总数": total_issues,
                "已整改数": rectified,
                "整改完成率(%)": round(rectify_rate, 2),
            }
        )

    exception_records = []
    exception_query = db.query(models.ExceptionAnnotation)
    if promotion_id:
        exception_query = exception_query.filter(
            models.ExceptionAnnotation.promotion_id == promotion_id
        )
    annotations = exception_query.all()
    for ann in annotations:
        promo = (
            db.query(models.Promotion)
            .filter(models.Promotion.id == ann.promotion_id)
            .first()
        )
        exception_records.append(
            {
                "日期": ann.annotation_date.isoformat(),
                "促销编码": promo.promo_code if promo else "",
                "异常类型": EXCEPTION_TYPES.get(ann.exception_type, ann.exception_type),
                "异常描述": ann.exception_description,
                "影响程度": ann.impact_degree,
                "复盘说明": ann.review_note or "",
                "处理人": ann.review_by or "",
            }
        )

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    funnel_df = pd.DataFrame(funnel_data)
    exception_df = pd.DataFrame(exception_records)

    if exception_df.empty:
        exception_df = pd.DataFrame(
            [{"提示": "当前查询范围内暂无异常标注记录"}]
        )
    if funnel_df.empty:
        funnel_df = pd.DataFrame([{"提示": "当前查询范围内暂无促销陈列数据"}])

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        funnel_df.to_excel(writer, sheet_name="促销陈列漏斗", index=False)
        exception_df.to_excel(writer, sheet_name="异常点与复盘说明", index=False)
        rules_df.to_excel(writer, sheet_name="促销达成计算规则", index=False)

        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except Exception:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)
    filename = f"促销陈列漏斗报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )


@router.get("/sales-trend-report")
def download_sales_trend_report(
    promotion_id: int = Query(..., description="促销活动ID"),
    db: Session = Depends(get_db),
):
    duckdb_service.refresh_data(settings.DATABASE_URL)
    trend_rows = duckdb_service.query_sales_trend(promotion_id=promotion_id)
    impact_rows = duckdb_service.detect_display_impact_ranges(promotion_id=promotion_id)
    promotion = (
        db.query(models.Promotion).filter(models.Promotion.id == promotion_id).first()
    )

    if not promotion:
        return {"error": "促销活动不存在"}

    promo_days = max((promotion.end_date - promotion.start_date).days + 1, 1)
    target_daily = (promotion.target_sales or 0) / promo_days

    unqualified_inspections = (
        db.query(models.DisplayInspection)
        .filter(
            models.DisplayInspection.promotion_id == promotion_id,
            models.DisplayInspection.is_qualified == False,
        )
        .all()
    )
    unqualified_dates = {ins.inspection_date for ins in unqualified_inspections}

    exception_annotations = (
        db.query(models.ExceptionAnnotation)
        .filter(models.ExceptionAnnotation.promotion_id == promotion_id)
        .all()
    )
    exception_map = {}
    for ann in exception_annotations:
        if ann.annotation_date not in exception_map:
            exception_map[ann.annotation_date] = []
        exception_map[ann.annotation_date].append(
            {
                "type": EXCEPTION_TYPES.get(ann.exception_type, ann.exception_type),
                "desc": ann.exception_description,
                "review": ann.review_note or "",
            }
        )

    trend_data = []
    total_sales = 0.0
    for row in trend_rows:
        s_date = row["sale_date"]
        amount = row["sales_amount"] or 0.0
        total_sales += amount

        exceptions = exception_map.get(s_date, [])
        exception_types = [e["type"] for e in exceptions]
        if row["cashier_delay_count"] and row["cashier_delay_count"] > 0:
            exception_types.append("收银系统延迟")
        if row["member_missing_total"] and row["member_missing_total"] > 0:
            exception_types.append("会员记录缺失")
        if row["mi_caliber_change_count"] and row["mi_caliber_change_count"] > 0:
            exception_types.append("医保接口口径变化")

        review_notes = " | ".join([e["review"] for e in exceptions if e["review"]])

        trend_data.append(
            {
                "日期": s_date.isoformat(),
                "销售额(元)": round(amount, 2),
                "销售件数": row["sales_units"] or 0,
                "日均目标(元)": round(target_daily, 2),
                "当日达成率(%)": round((amount / target_daily * 100) if target_daily > 0 else 0, 2),
                "陈列是否合格": "不合格" if s_date in unqualified_dates else "合格",
                "异常标记": "、".join(list(set(exception_types))) if exception_types else "无",
                "复盘说明": review_notes if review_notes else "无",
            }
        )

    impact_data = []
    for row in impact_rows:
        impact_data.append(
            {
                "影响开始日期": row["start_date"].isoformat(),
                "影响结束日期": row["end_date"].isoformat(),
                "影响天数": int(row["impact_days"] or 0),
                "预计损失销售额(元)": round(float(row["estimated_loss_sales"] or 0.0), 2),
                "期间平均陈列得分": int(row["avg_score_during_period"] or 0),
            }
        )

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    trend_df = pd.DataFrame(trend_data)
    impact_df = pd.DataFrame(impact_data) if impact_data else pd.DataFrame([{"提示": "暂无陈列不合格影响的时间范围"}])

    summary_df = pd.DataFrame(
        [
            {
                "促销编码": promotion.promo_code,
                "促销名称": promotion.promo_name,
                "总目标销售额(元)": round(promotion.target_sales or 0, 2),
                "总实际销售额(元)": round(total_sales, 2),
                "整体达成率(%)": round(
                    (total_sales / (promotion.target_sales or 0) * 100)
                    if promotion.target_sales
                    else 0,
                    2,
                ),
                "活动天数": promo_days,
            }
        ]
    )

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="促销汇总", index=False)
        trend_df.to_excel(writer, sheet_name="每日销售走势(含异常复盘)", index=False)
        impact_df.to_excel(writer, sheet_name="陈列不合格影响范围", index=False)
        rules_df.to_excel(writer, sheet_name="促销达成计算规则", index=False)

        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except Exception:
                        pass
                adjusted_width = min(max_length + 2, 60)
                worksheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)
    filename = f"促销销售走势报表_{promotion.promo_code}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )
