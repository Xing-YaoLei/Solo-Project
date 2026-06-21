from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional
import random

from app.schemas import (
    SettlementTrendItem,
    SettlementTrendResponse,
    OrderDetail,
    ApprovalNode,
    AmountCheck,
    CaliberDiffDetail,
    DashboardSummary,
)


def generate_mock_trend_data(merchant_id: int, days: int = 30) -> List[SettlementTrendItem]:
    trend_data = []
    base_amount = Decimal("50000")
    today = date.today()

    anomaly_dates = [7, 14, 21]
    affected_ranges = [(10, 16)]

    for i in range(days):
        d = today - timedelta(days=days - i - 1)
        variation = random.uniform(-0.15, 0.15)
        amount = base_amount * Decimal(1 + variation)

        if i in [a for a in anomaly_dates]:
            amount = amount * Decimal("0.7")
            has_anomaly = True
            anomaly_type = random.choice(["order_delay", "cs_missing", "caliber_change"])
            anomaly_desc = {
                "order_delay": "订单系统延迟，部分订单未按时结算",
                "cs_missing": "客服记录缺失，退款金额核对异常",
                "caliber_change": "支付流水口径变化，结算金额调整",
            }[anomaly_type]
        else:
            has_anomaly = False
            anomaly_type = None
            anomaly_desc = None

        order_count = int(amount / Decimal("150"))

        trend_data.append(
            SettlementTrendItem(
                date=d,
                amount=amount.quantize(Decimal("0.01")),
                order_count=order_count,
                has_anomaly=has_anomaly,
                anomaly_type=anomaly_type,
                anomaly_desc=anomaly_desc,
            )
        )

    return trend_data


def get_settlement_trend(
    merchant_id: int = 1,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> SettlementTrendResponse:
    if start_date and end_date:
        days = (end_date - start_date).days
    else:
        days = 30

    trend_data = generate_mock_trend_data(merchant_id, days)

    affected_ranges = [
        {
            "start_date": (date.today() - timedelta(days=20)).isoformat(),
            "end_date": (date.today() - timedelta(days=14)).isoformat(),
            "reason": "支付流水口径v1切换至v2，结算金额计算方式调整",
            "affected_amount": "125,680.00",
        },
        {
            "start_date": (date.today() - timedelta(days=10)).isoformat(),
            "end_date": (date.today() - timedelta(days=8)).isoformat(),
            "reason": "订单系统延迟48小时，批量订单延迟结算",
            "affected_amount": "89,320.50",
        },
    ]

    anomaly_summary = {
        "order_delay_count": 3,
        "cs_missing_count": 2,
        "caliber_change_count": 1,
        "total_anomalies": 6,
    }

    return SettlementTrendResponse(
        merchant_id=merchant_id,
        merchant_name="快跑腿便利超市",
        trend_data=trend_data,
        affected_ranges=affected_ranges,
        anomaly_summary=anomaly_summary,
    )


def get_order_details(
    merchant_id: int = 1,
    settlement_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    orders = []
    today = date.today()

    for i in range(page_size):
        order_date = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))
        has_delay = random.random() < 0.15
        delay_hours = random.randint(1, 48) if has_delay else 0

        orders.append(
            OrderDetail(
                id=i + (page - 1) * page_size,
                order_no=f"ORD{datetime.now().strftime('%Y%m%d')}{i + 1:06d}",
                merchant_id=merchant_id,
                settlement_id=settlement_id,
                order_date=order_date,
                amount=Decimal(random.uniform(50, 500)).quantize(Decimal("0.01")),
                status=random.choice(["completed", "refunded", "pending"]),
                payment_method=random.choice(["wechat", "alipay", "cash"]),
                has_delay=has_delay,
                delay_hours=delay_hours,
                created_at=order_date,
                merchant_name="快跑腿便利超市",
                customer_service_count=random.randint(0, 3),
                payment_flow_count=random.randint(1, 3),
            )
        )

    return {
        "items": orders,
        "total": 156,
        "page": page,
        "page_size": page_size,
    }


def get_approval_nodes(settlement_id: int) -> List[ApprovalNode]:
    nodes = [
        ApprovalNode(
            id=1,
            node_no=f"APR{settlement_id}-01",
            settlement_id=settlement_id,
            node_name="财务初审",
            node_order=1,
            status="approved",
            approver="张三",
            approval_time=datetime.now() - timedelta(days=3),
            approval_opinion="单据齐全，金额核对无误",
            created_at=datetime.now() - timedelta(days=5),
        ),
        ApprovalNode(
            id=2,
            node_no=f"APR{settlement_id}-02",
            settlement_id=settlement_id,
            node_name="业务复核",
            node_order=2,
            status="approved",
            approver="李四",
            approval_time=datetime.now() - timedelta(days=2),
            approval_opinion="订单量与业务数据一致",
            created_at=datetime.now() - timedelta(days=4),
        ),
        ApprovalNode(
            id=3,
            node_no=f"APR{settlement_id}-03",
            settlement_id=settlement_id,
            node_name="财务终审",
            node_order=3,
            status="pending",
            approver=None,
            approval_time=None,
            approval_opinion=None,
            created_at=datetime.now() - timedelta(days=3),
        ),
        ApprovalNode(
            id=4,
            node_no=f"APR{settlement_id}-04",
            settlement_id=settlement_id,
            node_name="总经理审批",
            node_order=4,
            status="pending",
            approver=None,
            approval_time=None,
            approval_opinion=None,
            created_at=datetime.now() - timedelta(days=2),
        ),
    ]
    return nodes


def get_amount_checks(settlement_id: Optional[int] = None) -> List[AmountCheck]:
    checks = []
    today = date.today()

    for i in range(10):
        check_date = today - timedelta(days=i * 3)
        order_amount = Decimal(random.uniform(30000, 80000)).quantize(Decimal("0.01"))
        refund_amount = Decimal(random.uniform(500, 3000)).quantize(Decimal("0.01"))
        service_fee = (order_amount * Decimal("0.02")).quantize(Decimal("0.01"))
        expected = (order_amount - refund_amount - service_fee).quantize(Decimal("0.01"))

        is_consistent = random.random() > 0.3
        if is_consistent:
            actual = expected
            diff = Decimal("0")
        else:
            diff = Decimal(random.uniform(-500, 500)).quantize(Decimal("0.01"))
            actual = (expected + diff).quantize(Decimal("0.01"))

        checks.append(
            AmountCheck(
                id=i + 1,
                check_no=f"CHK{check_date.strftime('%Y%m%d')}{i:03d}",
                settlement_id=settlement_id or (i + 1),
                check_date=check_date,
                order_amount=order_amount,
                refund_amount=refund_amount,
                service_fee=service_fee,
                expected_settlement=expected,
                actual_settlement=actual,
                difference=abs(diff),
                is_consistent=is_consistent,
                check_note=None if is_consistent else "客服退款记录与支付流水存在差异，需进一步核对",
                created_at=datetime.now() - timedelta(days=i),
            )
        )

    return checks


def get_caliber_diffs(page: int = 1, page_size: int = 20) -> dict:
    diffs = []

    for i in range(page_size):
        cs_amount = Decimal(random.uniform(50, 500)).quantize(Decimal("0.01"))
        payment_amount = (cs_amount * Decimal(random.uniform(0.8, 1.2))).quantize(Decimal("0.01"))
        diff = (cs_amount - payment_amount).quantize(Decimal("0.01"))

        diffs.append(
            CaliberDiffDetail(
                id=i + (page - 1) * page_size,
                diff_no=f"DIFF{datetime.now().strftime('%Y%m%d')}{i + 1:05d}",
                order_id=i + 1,
                cs_amount=cs_amount,
                payment_amount=payment_amount,
                difference=abs(diff),
                diff_type=random.choice(["amount_mismatch", "record_missing", "caliber_mismatch"]),
                is_resolved=random.random() < 0.4,
                resolution=None if random.random() >= 0.4 else "已确认差异原因，按支付流水口径执行",
                created_at=datetime.now() - timedelta(days=random.randint(0, 30)),
                order_no=f"ORD{datetime.now().strftime('%Y%m%d')}{i + 1:06d}",
                merchant_name="快跑腿便利超市",
            )
        )

    return {
        "items": diffs,
        "total": 87,
        "page": page,
        "page_size": page_size,
    }


def get_dashboard_summary() -> DashboardSummary:
    return DashboardSummary(
        total_settlement=Decimal("1256890.50"),
        total_orders=3456,
        anomaly_count=23,
        delay_orders=156,
        missing_cs_records=42,
        caliber_changes=3,
        affected_amount=Decimal("256800.00"),
    )


SETTLEMENT_RULES = """
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


def get_settlement_rules() -> str:
    return SETTLEMENT_RULES


def generate_download_data(
    merchant_id: Optional[int] = None,
    start_date: date = None,
    end_date: date = None,
    include_rules: bool = True,
) -> dict:
    trend = get_settlement_trend(merchant_id or 1, start_date, end_date)
    orders = get_order_details(merchant_id or 1)
    checks = get_amount_checks()
    diffs = get_caliber_diffs()

    result = {
        "trend_data": [item.model_dump() for item in trend.trend_data],
        "affected_ranges": trend.affected_ranges,
        "orders": [item.model_dump() for item in orders["items"]],
        "amount_checks": [item.model_dump() for item in checks],
        "caliber_diffs": [item.model_dump() for item in diffs["items"]],
    }

    if include_rules:
        result["settlement_rules"] = SETTLEMENT_RULES

    return result
