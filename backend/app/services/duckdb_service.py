import os
import duckdb
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any

from app.schemas import (
    SettlementTrendItem,
    SettlementTrendResponse,
    OrderDetail,
    ApprovalNode,
    AmountCheck,
    CaliberDiffDetail,
    DashboardSummary,
)
from app.services.duckdb_init import get_duckdb_path


def get_conn():
    db_path = get_duckdb_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return duckdb.connect(db_path)


def _row_to_dict(row, columns):
    return dict(zip(columns, row))


def get_dashboard_summary_duckdb() -> DashboardSummary:
    conn = get_conn()
    try:
        total_settlement = conn.execute(
            "SELECT COALESCE(SUM(actual_settlement), 0) FROM settlements"
        ).fetchone()[0]

        total_orders = conn.execute(
            "SELECT COUNT(*) FROM orders"
        ).fetchone()[0]

        anomaly_count = conn.execute(
            "SELECT COUNT(*) FROM settlements WHERE has_anomaly = true"
        ).fetchone()[0]

        delay_orders = conn.execute(
            "SELECT COUNT(*) FROM orders WHERE has_delay = true"
        ).fetchone()[0]

        missing_cs_records = conn.execute(
            "SELECT COUNT(*) FROM customer_service_records WHERE is_missing = true"
        ).fetchone()[0]

        caliber_changes = conn.execute(
            "SELECT COUNT(DISTINCT DATE_TRUNC('day', flow_date)) "
            "FROM payment_flows WHERE caliber_version != 'v1'"
        ).fetchone()[0]

        affected_amount = conn.execute(
            "SELECT COALESCE(SUM(difference), 0) FROM amount_checks WHERE is_consistent = false"
        ).fetchone()[0]

        return DashboardSummary(
            total_settlement=Decimal(str(total_settlement or 0)),
            total_orders=int(total_orders or 0),
            anomaly_count=int(anomaly_count or 0),
            delay_orders=int(delay_orders or 0),
            missing_cs_records=int(missing_cs_records or 0),
            caliber_changes=int(caliber_changes or 0),
            affected_amount=Decimal(str(affected_amount or 0)),
        )
    finally:
        conn.close()


def get_settlement_trend_duckdb(
    merchant_id: int = 1,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> SettlementTrendResponse:
    conn = get_conn()
    try:
        merchant_info = conn.execute(
            "SELECT merchant_name FROM merchants WHERE id = ?", [merchant_id]
        ).fetchone()
        merchant_name = merchant_info[0] if merchant_info else "未知商户"

        where_clause = "WHERE merchant_id = ?"
        params: list = [merchant_id]

        if start_date:
            where_clause += " AND settlement_date >= ?"
            params.append(start_date)
        if end_date:
            where_clause += " AND settlement_date <= ?"
            params.append(end_date)

        rows = conn.execute(f"""
            SELECT settlement_date, actual_settlement, order_count,
                   has_anomaly, anomaly_type, anomaly_desc
            FROM settlements
            {where_clause}
            ORDER BY settlement_date ASC
        """, params).fetchall()

        trend_data = []
        anomaly_dates = []
        for row in rows:
            s_date, amount, order_count, has_anom, a_type, a_desc = row
            trend_item = SettlementTrendItem(
                date=s_date if isinstance(s_date, date) else s_date.date(),
                amount=Decimal(str(amount)),
                order_count=int(order_count or 0),
                has_anomaly=bool(has_anom),
                anomaly_type=a_type,
                anomaly_desc=a_desc,
            )
            trend_data.append(trend_item)
            if has_anom:
                anomaly_dates.append(trend_item.date)

        affected_ranges = _detect_affected_ranges(trend_data)

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
    finally:
        conn.close()


def _detect_affected_ranges(trend_data: List[SettlementTrendItem]) -> List[Dict[str, Any]]:
    ranges = []
    if len(trend_data) < 3:
        return ranges

    i = 0
    while i < len(trend_data):
        if trend_data[i].has_anomaly:
            start_idx = max(0, i - 1)
            end_idx = min(len(trend_data) - 1, i + 2)

            start_date = trend_data[start_idx].date
            end_date = trend_data[end_idx].date

            affected_amount = Decimal("0")
            for j in range(start_idx, end_idx + 1):
                affected_amount += trend_data[j].amount

            reason_map = {
                "order_delay": "订单系统延迟，部分订单未按时结算",
                "cs_missing": "客服记录缺失，退款金额核对异常",
                "caliber_change": "支付流水口径变化，结算金额调整",
            }
            reason = reason_map.get(
                trend_data[i].anomaly_type,
                trend_data[i].anomaly_desc or "数据异常",
            )

            ranges.append({
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "reason": reason,
                "affected_amount": f"{float(affected_amount):,.2f}",
            })
            i = end_idx + 1
        else:
            i += 1

    return ranges


def get_order_details_duckdb(
    merchant_id: int = 1,
    settlement_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    conn = get_conn()
    try:
        where_clause = "WHERE o.merchant_id = ?"
        params: list = [merchant_id]

        if settlement_id:
            where_clause += " AND o.settlement_id = ?"
            params.append(settlement_id)

        total = conn.execute(f"""
            SELECT COUNT(*) FROM orders o {where_clause}
        """, params).fetchone()[0]

        offset = (page - 1) * page_size
        rows = conn.execute(f"""
            SELECT o.id, o.order_no, o.merchant_id, o.settlement_id, o.order_date,
                   o.amount, o.status, o.payment_method, o.has_delay, o.delay_hours,
                   o.created_at, m.merchant_name,
                   (SELECT COUNT(*) FROM customer_service_records cs WHERE cs.order_id = o.id) as cs_count,
                   (SELECT COUNT(*) FROM payment_flows pf WHERE pf.order_id = o.id) as pf_count
            FROM orders o
            LEFT JOIN merchants m ON o.merchant_id = m.id
            {where_clause}
            ORDER BY o.order_date DESC
            LIMIT ? OFFSET ?
        """, params + [page_size, offset]).fetchall()

        orders = []
        for row in rows:
            (oid, order_no, mid, sid, order_date, amount, status,
             pay_method, has_delay, delay_hours, created_at,
             merchant_name, cs_count, pf_count) = row

            orders.append(OrderDetail(
                id=int(oid),
                order_no=order_no,
                merchant_id=int(mid),
                settlement_id=int(sid) if sid else None,
                order_date=order_date if isinstance(order_date, datetime) else datetime.combine(order_date, datetime.min.time()),
                amount=Decimal(str(amount)),
                status=status,
                payment_method=pay_method,
                has_delay=bool(has_delay),
                delay_hours=int(delay_hours or 0),
                created_at=created_at if isinstance(created_at, datetime) else datetime.now(),
                merchant_name=merchant_name,
                customer_service_count=int(cs_count or 0),
                payment_flow_count=int(pf_count or 0),
            ))

        return {
            "items": orders,
            "total": int(total or 0),
            "page": page,
            "page_size": page_size,
        }
    finally:
        conn.close()


def get_approval_nodes_duckdb(settlement_id: int) -> List[ApprovalNode]:
    conn = get_conn()
    try:
        rows = conn.execute("""
            SELECT id, node_no, settlement_id, node_name, node_order,
                   status, approver, approval_time, approval_opinion, created_at
            FROM approval_nodes
            WHERE settlement_id = ?
            ORDER BY node_order ASC
        """, [settlement_id]).fetchall()

        nodes = []
        for row in rows:
            (nid, node_no, sid, node_name, node_order,
             status, approver, approval_time, opinion, created_at) = row

            nodes.append(ApprovalNode(
                id=int(nid),
                node_no=node_no,
                settlement_id=int(sid),
                node_name=node_name,
                node_order=int(node_order),
                status=status,
                approver=approver,
                approval_time=approval_time if isinstance(approval_time, datetime) else None,
                approval_opinion=opinion,
                created_at=created_at if isinstance(created_at, datetime) else datetime.now(),
            ))

        return nodes
    finally:
        conn.close()


def get_amount_checks_duckdb(settlement_id: Optional[int] = None) -> List[AmountCheck]:
    conn = get_conn()
    try:
        where_clause = ""
        params: list = []
        if settlement_id:
            where_clause = "WHERE settlement_id = ?"
            params.append(settlement_id)

        rows = conn.execute(f"""
            SELECT id, check_no, settlement_id, check_date, order_amount,
                   refund_amount, service_fee, expected_settlement, actual_settlement,
                   difference, is_consistent, check_note, created_at
            FROM amount_checks
            {where_clause}
            ORDER BY check_date DESC
            LIMIT 50
        """, params).fetchall()

        checks = []
        for row in rows:
            (cid, check_no, sid, check_date, order_amt, refund_amt,
             svc_fee, expected, actual, diff, is_consistent, note, created_at) = row

            checks.append(AmountCheck(
                id=int(cid),
                check_no=check_no,
                settlement_id=int(sid),
                check_date=check_date if isinstance(check_date, date) else check_date.date(),
                order_amount=Decimal(str(order_amt)),
                refund_amount=Decimal(str(refund_amt)),
                service_fee=Decimal(str(svc_fee)),
                expected_settlement=Decimal(str(expected)),
                actual_settlement=Decimal(str(actual)),
                difference=Decimal(str(diff)),
                is_consistent=bool(is_consistent),
                check_note=note,
                created_at=created_at if isinstance(created_at, datetime) else datetime.now(),
            ))

        return checks
    finally:
        conn.close()


def get_caliber_diffs_duckdb(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    conn = get_conn()
    try:
        total = conn.execute("SELECT COUNT(*) FROM caliber_diffs").fetchone()[0]

        offset = (page - 1) * page_size
        rows = conn.execute("""
            SELECT cd.id, cd.diff_no, cd.order_id, cd.cs_amount, cd.payment_amount,
                   cd.difference, cd.diff_type, cd.is_resolved, cd.resolution, cd.created_at,
                   o.order_no, m.merchant_name
            FROM caliber_diffs cd
            LEFT JOIN orders o ON cd.order_id = o.id
            LEFT JOIN merchants m ON o.merchant_id = m.id
            ORDER BY cd.created_at DESC
            LIMIT ? OFFSET ?
        """, [page_size, offset]).fetchall()

        diffs = []
        for row in rows:
            (did, diff_no, oid, cs_amt, pay_amt, diff, diff_type,
             is_resolved, resolution, created_at, order_no, merchant_name) = row

            diffs.append(CaliberDiffDetail(
                id=int(did),
                diff_no=diff_no,
                order_id=int(oid),
                cs_amount=Decimal(str(cs_amt)) if cs_amt is not None else None,
                payment_amount=Decimal(str(pay_amt)) if pay_amt is not None else None,
                difference=Decimal(str(diff)) if diff is not None else None,
                diff_type=diff_type,
                is_resolved=bool(is_resolved),
                resolution=resolution,
                created_at=created_at if isinstance(created_at, datetime) else datetime.now(),
                order_no=order_no or f"ORD{oid:010d}",
                merchant_name=merchant_name,
            ))

        return {
            "items": diffs,
            "total": int(total or 0),
            "page": page,
            "page_size": page_size,
        }
    finally:
        conn.close()


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


def generate_download_data_duckdb(
    merchant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_rules: bool = True,
) -> Dict[str, Any]:
    mid = merchant_id or 1
    trend = get_settlement_trend_duckdb(mid, start_date, end_date)
    orders = get_order_details_duckdb(mid, page=1, page_size=1000)
    checks = get_amount_checks_duckdb()
    diffs = get_caliber_diffs_duckdb(page=1, page_size=1000)

    result = {
        "trend_data": [item.model_dump(mode="json") for item in trend.trend_data],
        "affected_ranges": trend.affected_ranges,
        "orders": [item.model_dump(mode="json") for item in orders["items"]],
        "amount_checks": [item.model_dump(mode="json") for item in checks],
        "caliber_diffs": [item.model_dump(mode="json") for item in diffs["items"]],
    }

    if include_rules:
        result["settlement_rules"] = SETTLEMENT_RULES

    return result
