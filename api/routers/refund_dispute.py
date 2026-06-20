from fastapi import APIRouter, Query
from sqlalchemy import text

from api.utils.database import async_session
from api.schemas.common import ApiResponse
from api.schemas.dispute import RefundDispute, SampleDetail

router = APIRouter()


@router.get("/", response_model=ApiResponse[dict])
async def list_disputes(
    status: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
):
    async with async_session() as session:
        where = "WHERE 1=1"
        params: dict = {}

        if status:
            where += " AND rd.status = :status"
            params["status"] = status

        count_result = await session.execute(
            text(f"SELECT COUNT(*) FROM refund_disputes rd {where}"),
            params,
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * pageSize
        result = await session.execute(
            text(f"""
                SELECT rd.id, rd.order_id, o.buyer_name, o.amount,
                       rd.reason, rd.status, rd.created_at,
                       o.check_in_code
                FROM refund_disputes rd
                JOIN orders o ON rd.order_id = o.id
                {where}
                ORDER BY rd.created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": pageSize, "offset": offset},
        )
        rows = result.fetchall()

        disputes = []
        for row in rows:
            has_gate = False
            has_payment = False

            gate_result = await session.execute(
                text("SELECT COUNT(*) FROM gate_records WHERE order_id = :oid"),
                {"oid": row[1]},
            )
            has_gate = (gate_result.scalar() or 0) > 0

            payment_result = await session.execute(
                text("SELECT COUNT(*) FROM payment_records WHERE order_id = :oid"),
                {"oid": row[1]},
            )
            has_payment = (payment_result.scalar() or 0) > 0

            disputes.append(
                RefundDispute(
                    disputeId=row[0],
                    orderId=row[1],
                    buyerName=row[2],
                    amount=row[3],
                    reason=row[4],
                    status=row[5],
                    createTime=row[6],
                    checkInCode=row[7],
                    hasGateRecord=has_gate,
                    hasPaymentRecord=has_payment,
                )
            )

        return ApiResponse(data={"items": disputes, "total": total})


@router.get("/{disputeId}", response_model=ApiResponse[RefundDispute])
async def get_dispute(disputeId: str):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT rd.id, rd.order_id, o.buyer_name, o.amount,
                       rd.reason, rd.status, rd.created_at,
                       o.check_in_code
                FROM refund_disputes rd
                JOIN orders o ON rd.order_id = o.id
                WHERE rd.id = :did
            """),
            {"did": disputeId},
        )
        row = result.fetchone()

        if not row:
            return ApiResponse(code=404, message="争议记录不存在", data=None)

        has_gate = False
        has_payment = False

        gate_result = await session.execute(
            text("SELECT COUNT(*) FROM gate_records WHERE order_id = :oid"),
            {"oid": row[1]},
        )
        has_gate = (gate_result.scalar() or 0) > 0

        payment_result = await session.execute(
            text("SELECT COUNT(*) FROM payment_records WHERE order_id = :oid"),
            {"oid": row[1]},
        )
        has_payment = (payment_result.scalar() or 0) > 0

        data = RefundDispute(
            disputeId=row[0],
            orderId=row[1],
            buyerName=row[2],
            amount=row[3],
            reason=row[4],
            status=row[5],
            createTime=row[6],
            checkInCode=row[7],
            hasGateRecord=has_gate,
            hasPaymentRecord=has_payment,
        )
        return ApiResponse(data=data)


@router.get("/{disputeId}/sample", response_model=ApiResponse[SampleDetail])
async def get_dispute_sample(disputeId: str):
    async with async_session() as session:
        dispute_result = await session.execute(
            text("SELECT order_id FROM refund_disputes WHERE id = :did"),
            {"did": disputeId},
        )
        dispute_row = dispute_result.fetchone()

        if not dispute_row:
            return ApiResponse(code=404, message="争议记录不存在", data=None)

        order_id = dispute_row[0]

        payment_result = await session.execute(
            text("""
                SELECT transaction_id, amount, pay_time, pay_method, status
                FROM payment_records
                WHERE order_id = :oid
            """),
            {"oid": order_id},
        )
        payment_row = payment_result.fetchone()
        payment_record = None
        if payment_row:
            payment_record = {
                "transactionId": payment_row[0],
                "amount": payment_row[1],
                "payTime": payment_row[2],
                "payMethod": payment_row[3],
                "status": payment_row[4],
            }

        checkin_result = await session.execute(
            text("""
                SELECT check_in_code, scan_time, scanner, location, status
                FROM check_in_records
                WHERE order_id = :oid
            """),
            {"oid": order_id},
        )
        checkin_row = checkin_result.fetchone()
        checkin_record = None
        if checkin_row:
            checkin_record = {
                "checkInCode": checkin_row[0],
                "scanTime": checkin_row[1],
                "scanner": checkin_row[2],
                "location": checkin_row[3],
                "status": checkin_row[4],
            }

        gate_result = await session.execute(
            text("""
                SELECT id, gate_code, pass_time, direction, device_id
                FROM gate_records
                WHERE order_id = :oid
            """),
            {"oid": order_id},
        )
        gate_row = gate_result.fetchone()
        gate_record = None
        if gate_row:
            gate_record = {
                "recordId": gate_row[0],
                "gateCode": gate_row[1],
                "passTime": gate_row[2],
                "direction": gate_row[3],
                "deviceId": gate_row[4],
            }

        data = SampleDetail(
            orderId=order_id,
            paymentRecord=payment_record,
            checkInRecord=checkin_record,
            gateRecord=gate_record,
        )
        return ApiResponse(data=data)
