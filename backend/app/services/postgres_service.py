from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import SessionLocal
from app.models import (
    Merchant, Settlement, Order, CustomerServiceRecord, PaymentFlow,
    ApprovalNode as ApprovalNodeModel, AmountCheck as AmountCheckModel,
    CaliberDiff,
)
from app.schemas import (
    SettlementTrendItem, SettlementTrendResponse, OrderDetail,
    ApprovalNode, AmountCheck, CaliberDiffDetail, DashboardSummary,
)

logger = logging.getLogger(__name__)


def get_db_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_dashboard_summary_pg(db: Session) -> DashboardSummary:
    total_settlement = db.query(func.coalesce(func.sum(Settlement.actual_settlement), 0)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    anomaly_count = db.query(func.count(Settlement.id)).filter(Settlement.has_anomaly == True).scalar()
    delay_orders = db.query(func.count(Order.id)).filter(Order.has_delay == True).scalar()
    missing_cs = db.query(func.count(CustomerServiceRecord.id)).filter(CustomerServiceRecord.is_missing == True).scalar()
    caliber_changes = db.query(func.count(func.distinct(func.date_trunc('day', PaymentFlow.flow_date)))).filter(
        PaymentFlow.caliber_version != 'v1'
    ).scalar()
    affected_amount = db.query(func.coalesce(func.sum(AmountCheckModel.difference), 0)).filter(
        AmountCheckModel.is_consistent == False
    ).scalar()

    return DashboardSummary(
        total_settlement=Decimal(str(total_settlement or 0)),
        total_orders=int(total_orders or 0),
        anomaly_count=int(anomaly_count or 0),
        delay_orders=int(delay_orders or 0),
        missing_cs_records=int(missing_cs or 0),
        caliber_changes=int(caliber_changes or 0),
        affected_amount=Decimal(str(affected_amount or 0)),
    )


def get_settlement_trend_pg(
    db: Session,
    merchant_id: int = 1,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> SettlementTrendResponse:
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    merchant_name = merchant.merchant_name if merchant else "未知商户"

    query = db.query(Settlement).filter(Settlement.merchant_id == merchant_id)
    if start_date:
        query = query.filter(Settlement.settlement_date >= start_date)
    if end_date:
        query = query.filter(Settlement.settlement_date <= end_date)

    settlements = query.order_by(Settlement.settlement_date.asc()).all()

    trend_data = []
    for s in settlements:
        trend_data.append(SettlementTrendItem(
            date=s.settlement_date,
            amount=Decimal(str(s.actual_settlement)),
            order_count=int(s.order_count or 0),
            has_anomaly=bool(s.has_anomaly),
            anomaly_type=s.anomaly_type,
            anomaly_desc=s.anomaly_desc,
        ))

    affected_ranges = []
    i = 0
    while i < len(trend_data):
        if trend_data[i].has_anomaly:
            start_idx = max(0, i - 1)
            end_idx = min(len(trend_data) - 1, i + 2)
            start_d = trend_data[start_idx].date
            end_d = trend_data[end_idx].date
            affected = Decimal("0")
            for j in range(start_idx, end_idx + 1):
                affected += trend_data[j].amount

            reason_map = {
                "order_delay": "订单系统延迟，部分订单未按时结算",
                "cs_missing": "客服记录缺失，退款金额核对异常",
                "caliber_change": "支付流水口径变化，结算金额调整",
            }
            reason = reason_map.get(trend_data[i].anomaly_type, trend_data[i].anomaly_desc or "数据异常")

            affected_ranges.append({
                "start_date": start_d.isoformat(),
                "end_date": end_d.isoformat(),
                "reason": reason,
                "affected_amount": f"{float(affected):,.2f}",
            })
            i = end_idx + 1
        else:
            i += 1

    anomaly_summary = {
        "order_delay_count": sum(1 for t in trend_data if t.anomaly_type == "order_delay"),
        "cs_missing_count": sum(1 for t in trend_data if t.anomaly_type == "cs_missing"),
        "caliber_change_count": sum(1 for t in trend_data if t.anomaly_type == "caliber_change"),
        "total_anomalies": sum(1 for t in trend_data if t.has_anomaly),
    }

    return SettlementTrendResponse(
        merchant_id=merchant_id,
        merchant_name=merchant_name,
        trend_data=trend_data,
        affected_ranges=affected_ranges,
        anomaly_summary=anomaly_summary,
    )


def get_order_details_pg(
    db: Session,
    merchant_id: int = 1,
    settlement_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    query = db.query(Order).filter(Order.merchant_id == merchant_id)
    if settlement_id:
        query = query.filter(Order.settlement_id == settlement_id)

    total = query.count()
    offset = (page - 1) * page_size
    orders = query.order_by(Order.order_date.desc()).offset(offset).limit(page_size).all()

    merchant_name = ""
    m = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if m:
        merchant_name = m.merchant_name

    items = []
    for o in orders:
        cs_count = db.query(func.count(CustomerServiceRecord.id)).filter(
            CustomerServiceRecord.order_id == o.id
        ).scalar() or 0
        pf_count = db.query(func.count(PaymentFlow.id)).filter(
            PaymentFlow.order_id == o.id
        ).scalar() or 0

        items.append(OrderDetail(
            id=o.id,
            order_no=o.order_no,
            merchant_id=o.merchant_id,
            settlement_id=o.settlement_id,
            order_date=o.order_date,
            amount=Decimal(str(o.amount)),
            status=o.status,
            payment_method=o.payment_method,
            has_delay=bool(o.has_delay),
            delay_hours=int(o.delay_hours or 0),
            created_at=o.created_at,
            merchant_name=merchant_name,
            customer_service_count=int(cs_count),
            payment_flow_count=int(pf_count),
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def get_approval_nodes_pg(db: Session, settlement_id: int) -> List[ApprovalNode]:
    nodes = db.query(ApprovalNodeModel).filter(
        ApprovalNodeModel.settlement_id == settlement_id
    ).order_by(ApprovalNodeModel.node_order.asc()).all()

    return [ApprovalNode(
        id=n.id,
        node_no=n.node_no,
        settlement_id=n.settlement_id,
        node_name=n.node_name,
        node_order=n.node_order,
        status=n.status,
        approver=n.approver,
        approval_time=n.approval_time,
        approval_opinion=n.approval_opinion,
        created_at=n.created_at,
    ) for n in nodes]


def get_amount_checks_pg(
    db: Session,
    settlement_id: Optional[int] = None,
) -> List[AmountCheck]:
    query = db.query(AmountCheckModel)
    if settlement_id:
        query = query.filter(AmountCheckModel.settlement_id == settlement_id)

    checks = query.order_by(AmountCheckModel.check_date.desc()).limit(50).all()

    return [AmountCheck(
        id=c.id,
        check_no=c.check_no,
        settlement_id=c.settlement_id,
        check_date=c.check_date,
        order_amount=Decimal(str(c.order_amount)),
        refund_amount=Decimal(str(c.refund_amount)),
        service_fee=Decimal(str(c.service_fee)),
        expected_settlement=Decimal(str(c.expected_settlement)),
        actual_settlement=Decimal(str(c.actual_settlement)),
        difference=Decimal(str(c.difference)),
        is_consistent=bool(c.is_consistent),
        check_note=c.check_note,
        created_at=c.created_at,
    ) for c in checks]


def get_caliber_diffs_pg(
    db: Session,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    query = db.query(CaliberDiff)
    total = query.count()
    offset = (page - 1) * page_size

    diffs = query.order_by(CaliberDiff.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for d in diffs:
        order = db.query(Order).filter(Order.id == d.order_id).first()
        order_no = order.order_no if order else f"ORD{d.order_id:010d}"
        merchant_name = ""
        if order:
            m = db.query(Merchant).filter(Merchant.id == order.merchant_id).first()
            if m:
                merchant_name = m.merchant_name

        items.append(CaliberDiffDetail(
            id=d.id,
            diff_no=d.diff_no,
            order_id=d.order_id,
            cs_amount=Decimal(str(d.cs_amount)) if d.cs_amount is not None else None,
            payment_amount=Decimal(str(d.payment_amount)) if d.payment_amount is not None else None,
            difference=Decimal(str(d.difference)) if d.difference is not None else None,
            diff_type=d.diff_type,
            is_resolved=bool(d.is_resolved),
            resolution=d.resolution,
            created_at=d.created_at,
            order_no=order_no,
            merchant_name=merchant_name,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def save_amount_check_pg(
    db: Session,
    check_id: int,
    actual_settlement: Decimal,
    check_note: Optional[str] = None,
) -> Optional[AmountCheck]:
    check = db.query(AmountCheckModel).filter(AmountCheckModel.id == check_id).first()
    if not check:
        return None

    check.actual_settlement = actual_settlement
    check.difference = abs(check.expected_settlement - actual_settlement)
    check.is_consistent = (check.difference == 0)
    if check_note is not None:
        check.check_note = check_note

    db.commit()
    db.refresh(check)

    return AmountCheck(
        id=check.id,
        check_no=check.check_no,
        settlement_id=check.settlement_id,
        check_date=check.check_date,
        order_amount=Decimal(str(check.order_amount)),
        refund_amount=Decimal(str(check.refund_amount)),
        service_fee=Decimal(str(check.service_fee)),
        expected_settlement=Decimal(str(check.expected_settlement)),
        actual_settlement=Decimal(str(check.actual_settlement)),
        difference=Decimal(str(check.difference)),
        is_consistent=bool(check.is_consistent),
        check_note=check.check_note,
        created_at=check.created_at,
    )


def get_settlement_rules_pg() -> str:
    return """
=======================================
商户结算回款周期计算规则说明
=======================================

一、基础规则
1. 结算周期：T+7 自然日
2. 结算日：每周一进行上周结算
3. 到账时效：结算审批完成后3个工作日内到账

二、金额计算规则
结算金额 = 订单总额 - 退款金额 - 服务费 - 其他扣除

三、口径说明
1. 订单口径：以订单完成时间为准
2. 退款口径：以客服记录的退款时间为准
3. 支付口径：以支付渠道实际到账时间为准

四、异常处理
1. 订单延迟：延迟超过24小时的订单顺延至下一结算周期
2. 记录缺失：客服记录缺失时暂按支付流水计算，待补录后调整
3. 口径变化：口径变更前按旧口径，变更后按新口径，过渡期保留差异表

五、特殊情况
1. 法定节假日顺延
2. 商户申请加急结算需支付1%手续费
3. 月度对账差异在次月5日前完成调整
"""


def generate_download_data_pg(
    db: Session,
    merchant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_rules: bool = True,
) -> Dict[str, Any]:
    mid = merchant_id or 1

    trend = get_settlement_trend_pg(db, mid, start_date, end_date)
    orders = get_order_details_pg(db, mid, page=1, page_size=1000)
    checks = get_amount_checks_pg(db)
    diffs = get_caliber_diffs_pg(db, page=1, page_size=1000)

    result = {
        "trend_data": [item.model_dump(mode="json") for item in trend.trend_data],
        "affected_ranges": trend.affected_ranges,
        "orders": [item.model_dump(mode="json") for item in orders["items"]],
        "amount_checks": [item.model_dump(mode="json") for item in checks],
        "caliber_diffs": [item.model_dump(mode="json") for item in diffs["items"]],
    }

    if include_rules:
        result["settlement_rules"] = get_settlement_rules_pg()

    return result
