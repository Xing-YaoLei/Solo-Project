from datetime import date
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.models import (
    ReviewMaterial,
    AlertRecord,
    CleanedInventory,
    MaterialDailyUsage,
    BatchInfo,
    Supplier,
)


def generate_review_materials(session, alert_records):
    for alert in alert_records:
        store_code = alert.store_code
        material_code = alert.material_code

        cutoff = date.today() - __import__("datetime").timedelta(days=30)
        avg_row = (
            session.query(func.avg(MaterialDailyUsage.usage_qty).label("avg_qty"))
            .filter(
                MaterialDailyUsage.store_code == store_code,
                MaterialDailyUsage.material_code == material_code,
                MaterialDailyUsage.usage_date >= cutoff,
            )
            .scalar()
        )
        avg_daily_usage = float(avg_row) if avg_row else 0.0

        snapshot = (
            session.query(CleanedInventory)
            .filter(
                CleanedInventory.store_code == store_code,
                CleanedInventory.material_code == material_code,
            )
            .order_by(CleanedInventory.snapshot_date.desc())
            .first()
        )

        batch_rows = (
            session.query(BatchInfo)
            .filter(
                BatchInfo.store_code == store_code,
                BatchInfo.material_code == material_code,
                BatchInfo.status == "active",
            )
            .all()
        )

        batch_info_summary = "; ".join(
            f"批次{b.batch_no}: 数量{b.current_qty}, 到期{b.expiry_date}"
            for b in batch_rows
        ) if batch_rows else ""

        supplier_code = batch_rows[0].supplier_code if batch_rows and batch_rows[0].supplier_code else ""

        supplier = None
        if supplier_code:
            supplier = (
                session.query(Supplier)
                .filter(Supplier.supplier_code == supplier_code)
                .first()
            )

        lead_time_days = supplier.lead_time_days if supplier and supplier.lead_time_days else 3
        current_stock = float(snapshot.stock_qty) if snapshot and snapshot.stock_qty else 0.0
        turnover_days = float(alert.current_value) if alert.current_value else 0.0

        shortage_qty = 0.0
        if alert.alert_type == "turnover":
            shortage_qty = max(avg_daily_usage * lead_time_days - current_stock, 0.0)
        elif alert.alert_type == "stockout":
            shortage_qty = max((float(alert.threshold_value) if alert.threshold_value else 0.0) - current_stock, 0.0)

        root_cause_map = {
            "turnover": f"周转天数 {turnover_days:.1f} 天，低于安全阈值，存在断货风险",
            "expiry": f"物料即将过期，需尽快消耗或处理",
            "stockout": f"当前库存 {current_stock:.3f}，低于安全库存水平",
        }
        root_cause = root_cause_map.get(alert.alert_type, "")

        action_plan = ""
        if avg_daily_usage > 0:
            replenish_qty = avg_daily_usage * lead_time_days - current_stock
            if replenish_qty > 0:
                action_plan = f"建议补货 {replenish_qty:.3f}，按日均用量 {avg_daily_usage:.3f} × 采购周期 {lead_time_days} 天计算"
            else:
                action_plan = "当前库存可覆盖采购周期，暂无需补货"
        else:
            action_plan = "无法计算日均用量，请人工评估"

        title = f"短缺复盘-{alert.material_name}-{store_code}-{date.today()}"

        review = ReviewMaterial(
            title=title,
            material_code=material_code,
            material_name=alert.material_name,
            store_code=store_code,
            shortage_qty=Decimal(str(round(shortage_qty, 3))),
            turnover_days=Decimal(str(round(turnover_days, 2))),
            avg_daily_usage=Decimal(str(round(avg_daily_usage, 3))),
            supplier_code=supplier_code,
            batch_info_summary=batch_info_summary,
            root_cause=root_cause,
            action_plan=action_plan,
            review_date=date.today(),
            alert_record_id=alert.id,
        )
        session.add(review)


def get_review_df(session, store_code=None, status=None):
    query = session.query(ReviewMaterial)
    if store_code:
        query = query.filter(ReviewMaterial.store_code == store_code)
    if status:
        query = query.filter(ReviewMaterial.status == status)

    rows = query.all()
    data = [
        {
            "id": r.id,
            "title": r.title,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "store_code": r.store_code,
            "shortage_qty": float(r.shortage_qty) if r.shortage_qty else 0.0,
            "turnover_days": float(r.turnover_days) if r.turnover_days else 0.0,
            "avg_daily_usage": float(r.avg_daily_usage) if r.avg_daily_usage else 0.0,
            "supplier_code": r.supplier_code,
            "batch_info_summary": r.batch_info_summary,
            "root_cause": r.root_cause,
            "action_plan": r.action_plan,
            "review_date": r.review_date,
            "status": r.status,
            "alert_record_id": r.alert_record_id,
        }
        for r in rows
    ]
    return pd.DataFrame(data)
