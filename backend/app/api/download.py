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
    duckdb_service.refresh_data(db)
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
    duckdb_service.refresh_data(db)
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


def _auto_width(worksheet):
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


def _build_excel(sheets: dict) -> BytesIO:
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for name, df in sheets.items():
            df.to_excel(writer, sheet_name=name, index=False)
        for sheet_name in writer.sheets:
            _auto_width(writer.sheets[sheet_name])
    output.seek(0)
    return output


@router.get("/rectification-report")
def download_rectification_report(
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Rectification)
    if status:
        query = query.filter(models.Rectification.rectification_status == status)
    if start_date:
        query = query.filter(models.Rectification.require_rectification_date >= start_date)
    if end_date:
        query = query.filter(models.Rectification.require_rectification_date <= end_date)
    rectifications = query.order_by(models.Rectification.require_rectification_date.desc()).all()

    total = len(rectifications)
    completed = len([r for r in rectifications if r.rectification_status == "completed"])
    pending = len([r for r in rectifications if r.rectification_status == "pending"])
    overdue = len([r for r in rectifications if r.rectification_status == "overdue"])

    summary_df = pd.DataFrame([{
        "总记录数": total,
        "已完成": completed,
        "待整改": pending,
        "已超期": overdue,
        "完成率(%)": round(completed / total * 100, 2) if total > 0 else 0,
    }])

    detail_rows = []
    for r in rectifications:
        promo = db.query(models.Promotion).filter(models.Promotion.id == r.promotion_id).first()
        detail_rows.append({
            "问题描述": r.issue_description,
            "促销编码": promo.promo_code if promo else "",
            "要求完成日期": r.require_rectification_date.isoformat() if r.require_rectification_date else "",
            "实际完成日期": r.actual_rectification_date.isoformat() if r.actual_rectification_date else "",
            "状态": {"pending": "待整改", "completed": "已完成", "overdue": "已超期"}.get(r.rectification_status, r.rectification_status),
            "整改人": r.rectification_by or "",
            "审核人": r.reviewer or "",
            "备注": r.rectification_remark or "",
        })
    detail_df = pd.DataFrame(detail_rows) if detail_rows else pd.DataFrame([{"提示": "暂无整改记录"}])

    overdue_rows = [d for d in detail_rows if d["状态"] == "已超期"]
    overdue_df = pd.DataFrame(overdue_rows) if overdue_rows else pd.DataFrame([{"提示": "暂无超期记录"}])

    person_stats = {}
    for r in rectifications:
        by = r.rectification_by or "未分配"
        person_stats.setdefault(by, {"总问题数": 0, "已完成": 0})
        person_stats[by]["总问题数"] += 1
        if r.rectification_status == "completed":
            person_stats[by]["已完成"] += 1
    person_rows = [{"责任人": k, **v} for k, v in person_stats.items()]
    person_df = pd.DataFrame(person_rows) if person_rows else pd.DataFrame([{"提示": "暂无责任人数据"}])

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    output = _build_excel({
        "整改进度总览": summary_df,
        "整改明细列表": detail_df,
        "超期预警清单": overdue_df,
        "责任人汇总": person_df,
        "促销达成计算规则": rules_df,
    })

    filename = f"整改记录汇总报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/display-photo-report")
def download_display_photo_report(
    store_id: Optional[int] = Query(None),
    promotion_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.DisplayInspection)
    if store_id:
        query = query.filter(models.DisplayInspection.store_id == store_id)
    if promotion_id:
        query = query.filter(models.DisplayInspection.promotion_id == promotion_id)
    if start_date:
        query = query.filter(models.DisplayInspection.inspection_date >= start_date)
    if end_date:
        query = query.filter(models.DisplayInspection.inspection_date <= end_date)
    inspections = query.order_by(models.DisplayInspection.inspection_date.desc()).all()

    total = len(inspections)
    qualified = len([i for i in inspections if i.is_qualified])
    summary_df = pd.DataFrame([{
        "巡检总次数": total,
        "合格次数": qualified,
        "不合格次数": total - qualified,
        "合格率(%)": round(qualified / total * 100, 2) if total > 0 else 0,
        "平均得分": round(sum(i.overall_score for i in inspections) / total, 1) if total > 0 else 0,
    }])

    photo_rows = []
    for ins in inspections:
        photos = db.query(models.DisplayPhoto).filter(models.DisplayPhoto.inspection_id == ins.id).all()
        for p in photos:
            photo_rows.append({
                "巡检日期": ins.inspection_date.isoformat(),
                "照片类型": {"display": "陈列全景", "pop": "POP物料", "price": "价格标签", "stock": "库存堆头"}.get(p.photo_type, p.photo_type),
                "文件名": p.file_name,
                "上传人": p.upload_by or "",
                "上传时间": p.created_at.isoformat() if p.created_at else "",
            })
    photo_df = pd.DataFrame(photo_rows) if photo_rows else pd.DataFrame([{"提示": "暂无照片记录"}])

    score_rows = []
    for ins in inspections:
        store = db.query(models.Store).filter(models.Store.id == ins.store_id).first()
        score_rows.append({
            "巡检日期": ins.inspection_date.isoformat(),
            "门店": store.store_name if store else "",
            "位置(0-30)": ins.position_score,
            "POP物料(0-20)": ins.pop_score,
            "价格标签(0-20)": ins.price_score,
            "库存展示(0-30)": ins.stock_score,
            "综合得分": ins.overall_score,
            "是否合格": "合格" if ins.is_qualified else "不合格",
            "巡检人": ins.inspector or "",
        })
    score_df = pd.DataFrame(score_rows) if score_rows else pd.DataFrame([{"提示": "暂无巡检记录"}])

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    output = _build_excel({
        "陈列合格统计": summary_df,
        "照片上传记录": photo_df,
        "巡检评分明细": score_df,
        "促销达成计算规则": rules_df,
    })

    filename = f"陈列照片巡检报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/threshold-audit-report")
def download_threshold_audit_report(db: Session = Depends(get_db)):
    configs = db.query(models.ThresholdConfig).order_by(models.ThresholdConfig.id).all()

    config_rows = []
    for cfg in configs:
        config_rows.append({
            "配置键名": cfg.config_key,
            "配置名称": cfg.config_name,
            "当前值": cfg.config_value,
            "单位": cfg.config_unit or "",
            "值类型": cfg.value_type or "count",
            "最小值": cfg.min_value if cfg.min_value is not None else "",
            "最大值": cfg.max_value if cfg.max_value is not None else "",
            "分类": cfg.category or "",
            "说明": cfg.description or "",
            "最近修改人": cfg.current_modified_by or "",
            "创建时间": cfg.created_at.isoformat() if cfg.created_at else "",
            "更新时间": cfg.updated_at.isoformat() if cfg.updated_at else "",
        })
    config_df = pd.DataFrame(config_rows) if config_rows else pd.DataFrame([{"提示": "暂无阈值配置"}])

    all_logs = db.query(models.ThresholdChangeLog).order_by(models.ThresholdChangeLog.changed_at.desc()).all()
    log_rows = []
    for log in all_logs:
        cfg = db.query(models.ThresholdConfig).filter(models.ThresholdConfig.id == log.config_id).first()
        log_rows.append({
            "配置键名": cfg.config_key if cfg else "",
            "配置名称": cfg.config_name if cfg else "",
            "变更前值": log.old_value,
            "变更后值": log.new_value,
            "修改人": log.changed_by,
            "修改原因": log.change_reason or "",
            "修改时间": log.changed_at.isoformat() if log.changed_at else "",
        })
    log_df = pd.DataFrame(log_rows) if log_rows else pd.DataFrame([{"提示": "暂无变更历史"}])

    person_stats = {}
    for log in all_logs:
        person_stats.setdefault(log.changed_by, {"修改次数": 0})
        person_stats[log.changed_by]["修改次数"] += 1
    person_rows = [{"修改人": k, **v} for k, v in person_stats.items()]
    person_df = pd.DataFrame(person_rows) if person_rows else pd.DataFrame([{"提示": "暂无修改人记录"}])

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    output = _build_excel({
        "当前阈值配置": config_df,
        "阈值变更历史": log_df,
        "修改人统计": person_df,
        "促销达成计算规则": rules_df,
    })

    filename = f"阈值调整审计报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/exception-digest-report")
def download_exception_digest_report(
    exception_type: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.SalesRecord)
    if start_date:
        query = query.filter(models.SalesRecord.sale_date >= start_date)
    if end_date:
        query = query.filter(models.SalesRecord.sale_date <= end_date)
    sales_records = query.all()

    cashier_delay_cfg = db.query(models.ThresholdConfig).filter(
        models.ThresholdConfig.config_key == "cashier_delay_minutes"
    ).first()
    delay_threshold = cashier_delay_cfg.config_value if cashier_delay_cfg else 30
    member_missing_cfg = db.query(models.ThresholdConfig).filter(
        models.ThresholdConfig.config_key == "member_missing_count"
    ).first()
    missing_threshold = member_missing_cfg.config_value if member_missing_cfg else 5

    delay_rows, missing_rows, mi_rows = [], [], []
    for sr in sales_records:
        if sr.cashier_delay_minutes >= delay_threshold:
            if not exception_type or exception_type == "cashier_delay":
                delay_rows.append({
                    "日期": sr.sale_date.isoformat(),
                    "促销ID": sr.promotion_id,
                    "门店ID": sr.store_id,
                    "延迟分钟数": sr.cashier_delay_minutes,
                    "阈值": delay_threshold,
                })
        if sr.member_record_missing_count >= missing_threshold:
            if not exception_type or exception_type == "member_missing":
                missing_rows.append({
                    "日期": sr.sale_date.isoformat(),
                    "促销ID": sr.promotion_id,
                    "门店ID": sr.store_id,
                    "缺失条数": sr.member_record_missing_count,
                    "阈值": missing_threshold,
                })
        if sr.medical_insurance_caliber_changed:
            if not exception_type or exception_type == "mi_caliber_change":
                mi_rows.append({
                    "日期": sr.sale_date.isoformat(),
                    "促销ID": sr.promotion_id,
                    "门店ID": sr.store_id,
                    "数据版本": sr.data_version,
                })

    summary_df = pd.DataFrame([{
        "收银系统延迟(条)": len(delay_rows),
        "会员记录缺失(条)": len(missing_rows),
        "医保口径变化(条)": len(mi_rows),
        "异常总计": len(delay_rows) + len(missing_rows) + len(mi_rows),
    }])

    delay_df = pd.DataFrame(delay_rows) if delay_rows else pd.DataFrame([{"提示": "暂无收银延迟记录"}])
    missing_df = pd.DataFrame(missing_rows) if missing_rows else pd.DataFrame([{"提示": "暂无会员缺失记录"}])
    mi_df = pd.DataFrame(mi_rows) if mi_rows else pd.DataFrame([{"提示": "暂无医保口径变化记录"}])

    annotations = db.query(models.ExceptionAnnotation).all()
    if start_date:
        annotations = [a for a in annotations if a.annotation_date >= start_date]
    if end_date:
        annotations = [a for a in annotations if a.annotation_date <= end_date]
    if exception_type:
        annotations = [a for a in annotations if a.exception_type == exception_type]

    status_rows = []
    for ann in annotations:
        status_rows.append({
            "日期": ann.annotation_date.isoformat(),
            "异常类型": EXCEPTION_TYPES.get(ann.exception_type, ann.exception_type),
            "异常描述": ann.exception_description,
            "影响程度": ann.impact_degree,
            "复盘说明": ann.review_note or "",
            "处理人": ann.review_by or "",
        })
    status_df = pd.DataFrame(status_rows) if status_rows else pd.DataFrame([{"提示": "暂无异常处理记录"}])

    rules_df = pd.DataFrame(PROMO_CALCULATION_RULES)
    output = _build_excel({
        "异常类型汇总": summary_df,
        "收银延迟明细": delay_df,
        "会员缺失明细": missing_df,
        "医保口径变化明细": mi_df,
        "异常处理状态": status_df,
        "促销达成计算规则": rules_df,
    })

    filename = f"异常数据摘要报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
