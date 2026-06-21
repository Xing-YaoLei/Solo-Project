from datetime import date, datetime, timedelta
import random
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import engine, Base, SessionLocal
from app.models import (
    Merchant, Settlement, Order, CustomerServiceRecord, PaymentFlow,
    ApprovalNode, AmountCheck, CaliberDiff,
)

logger = logging.getLogger(__name__)


def init_postgres() -> bool:
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL tables created/verified successfully")

        db = SessionLocal()
        try:
            merchant_count = db.query(Merchant).count()
            if merchant_count == 0:
                _seed_data(db)
            return True
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"PostgreSQL initialization failed: {e}")
        return False


def _seed_data(db: Session):
    now = datetime.now()
    today = date.today()

    merchants = [
        Merchant(
            id=1, merchant_code="M001", merchant_name="快跑腿便利超市",
            contact_person="王经理", phone="13800138001",
            settlement_cycle=7, status="active",
            created_at=now, updated_at=now,
        ),
        Merchant(
            id=2, merchant_code="M002", merchant_name="美食速递餐饮",
            contact_person="李店长", phone="13800138002",
            settlement_cycle=7, status="active",
            created_at=now, updated_at=now,
        ),
        Merchant(
            id=3, merchant_code="M003", merchant_name="鲜果优选水果店",
            contact_person="张老板", phone="13800138003",
            settlement_cycle=14, status="active",
            created_at=now, updated_at=now,
        ),
    ]
    db.add_all(merchants)
    db.flush()

    settlement_id = 1
    order_id = 1
    cs_id = 1
    flow_id = 1
    approval_id = 1
    check_id = 1
    diff_id = 1

    base_amount = 50000
    anomaly_days = {7: "order_delay", 14: "cs_missing", 21: "caliber_change"}

    for day_offset in range(29, -1, -1):
        d = today - timedelta(days=day_offset)
        day_idx = 29 - day_offset

        variation = random.uniform(-0.15, 0.15)
        amount = base_amount * (1 + variation)

        has_anomaly = day_idx in anomaly_days
        anomaly_type = anomaly_days.get(day_idx)
        if has_anomaly:
            amount = amount * 0.7

        anomaly_desc_map = {
            "order_delay": "订单系统延迟，部分订单未按时结算",
            "cs_missing": "客服记录缺失，退款金额核对异常",
            "caliber_change": "支付流水口径变化，结算金额调整",
        }
        anomaly_desc = anomaly_desc_map.get(anomaly_type)

        order_count = max(1, int(amount / 150))
        refund_amount = Decimal(str(round(random.uniform(500, 3000), 2)))
        service_fee = Decimal(str(round(amount * 0.02, 2)))
        actual = Decimal(str(round(amount - float(refund_amount) - float(service_fee), 2)))

        settlement = Settlement(
            id=settlement_id,
            settlement_no=f"SETT{d.strftime('%Y%m%d')}",
            merchant_id=1,
            settlement_date=d,
            total_amount=Decimal(str(round(amount, 2))),
            order_count=order_count,
            refund_amount=refund_amount,
            service_fee=service_fee,
            actual_settlement=actual,
            status=random.choice(["pending", "approved", "paid"]),
            payment_status=random.choice(["unpaid", "paid"]),
            has_anomaly=has_anomaly,
            anomaly_type=anomaly_type,
            anomaly_desc=anomaly_desc,
            review_note=None,
            created_at=now,
            updated_at=now,
        )
        db.add(settlement)

        daily_orders = min(order_count, 8)
        for oi in range(daily_orders):
            order_date = datetime.combine(d, datetime.min.time()) + timedelta(
                hours=random.randint(8, 22), minutes=random.randint(0, 59)
            )
            order_amount = Decimal(str(round(random.uniform(50, 500), 2)))
            has_delay = random.random() < 0.15
            delay_hours = random.randint(1, 48) if has_delay else 0

            order = Order(
                id=order_id,
                order_no=f"ORD{d.strftime('%Y%m%d')}{oi:04d}",
                merchant_id=1,
                settlement_id=settlement_id,
                order_date=order_date,
                amount=order_amount,
                status=random.choice(["completed", "refunded", "pending"]),
                payment_method=random.choice(["wechat", "alipay", "cash"]),
                has_delay=has_delay,
                delay_hours=delay_hours,
                created_at=now,
            )
            db.add(order)

            cs_count = random.randint(0, 1)
            for ci in range(cs_count):
                cs_record = CustomerServiceRecord(
                    id=cs_id,
                    record_no=f"CS{order_id:06d}{ci}",
                    order_id=order_id,
                    record_date=order_date + timedelta(hours=random.randint(1, 24)),
                    record_type=random.choice(["refund", "complaint", "inquiry"]),
                    amount=Decimal(str(round(random.uniform(10, 200), 2))),
                    description="客户咨询/退款记录",
                    handler=random.choice(["客服A", "客服B", "客服C"]),
                    is_missing=False,
                    created_at=now,
                )
                db.add(cs_record)
                cs_id += 1

            flow_count = 1
            for fi in range(flow_count):
                payment_flow = PaymentFlow(
                    id=flow_id,
                    flow_no=f"PF{order_id:06d}{fi}",
                    order_id=order_id,
                    flow_date=order_date + timedelta(minutes=random.randint(1, 30)),
                    amount=order_amount,
                    flow_type=random.choice(["pay", "refund"]),
                    channel=random.choice(["wechat", "alipay", "bank"]),
                    caliber_version="v2" if day_idx >= 15 and day_idx <= 20 else "v1",
                    created_at=now,
                )
                db.add(payment_flow)
                flow_id += 1

            order_id += 1

        if day_idx % 3 == 0:
            order_amt = Decimal(str(round(random.uniform(30000, 80000), 2)))
            refund = Decimal(str(round(random.uniform(500, 3000), 2)))
            svc_fee = (order_amt * Decimal("0.02")).quantize(Decimal("0.01"))
            expected = (order_amt - refund - svc_fee).quantize(Decimal("0.01"))
            is_consistent = random.random() > 0.3
            if is_consistent:
                actual_amt = expected
                diff = Decimal("0")
            else:
                diff = Decimal(str(round(random.uniform(-500, 500), 2)))
                actual_amt = (expected + diff).quantize(Decimal("0.01"))

            check = AmountCheck(
                id=check_id,
                check_no=f"CHK{d.strftime('%Y%m%d')}",
                settlement_id=settlement_id,
                check_date=d,
                order_amount=order_amt,
                refund_amount=refund,
                service_fee=svc_fee,
                expected_settlement=expected,
                actual_settlement=actual_amt,
                difference=abs(diff),
                is_consistent=is_consistent,
                check_note=None if is_consistent else "客服退款记录与支付流水存在差异，需进一步核对",
                created_at=now,
            )
            db.add(check)
            check_id += 1

        settlement_id += 1

    approval_data = [
        (1, "财务初审", 1, "approved", "张三", now - timedelta(days=3), "单据齐全，金额核对无误"),
        (2, "业务复核", 2, "approved", "李四", now - timedelta(days=2), "订单量与业务数据一致"),
        (3, "财务终审", 3, "pending", None, None, None),
        (4, "总经理审批", 4, "pending", None, None, None),
    ]
    for node_no, node_name, node_order, status, approver, approval_time, opinion in approval_data:
        node = ApprovalNode(
            id=approval_id,
            node_no=f"APR001-{node_no:02d}",
            settlement_id=1,
            node_name=node_name,
            node_order=node_order,
            status=status,
            approver=approver,
            approval_time=approval_time,
            approval_opinion=opinion,
            created_at=now,
        )
        db.add(node)
        approval_id += 1

    for di in range(87):
        cs_amt = Decimal(str(round(random.uniform(50, 500), 2)))
        pay_amt = (cs_amt * Decimal(str(round(random.uniform(0.8, 1.2), 2)))).quantize(Decimal("0.01"))
        diff = abs(cs_amt - pay_amt).quantize(Decimal("0.01"))
        caliber_diff = CaliberDiff(
            id=diff_id,
            diff_no=f"DIFF{today.strftime('%Y%m%d')}{di:05d}",
            order_id=di + 1,
            cs_amount=cs_amt,
            payment_amount=pay_amt,
            difference=diff,
            diff_type=random.choice(["amount_mismatch", "record_missing", "caliber_mismatch"]),
            is_resolved=random.random() < 0.4,
            resolution=None if random.random() >= 0.4 else "已确认差异原因，按支付流水口径执行",
            created_at=now - timedelta(days=random.randint(0, 30)),
        )
        db.add(caliber_diff)
        diff_id += 1

    db.commit()
    logger.info(
        f"PostgreSQL seed data inserted: merchants=3, settlements={settlement_id-1}, "
        f"orders={order_id-1}, cs_records={cs_id-1}, payment_flows={flow_id-1}, "
        f"approvals={approval_id-1}, checks={check_id-1}, diffs={diff_id-1}"
    )
