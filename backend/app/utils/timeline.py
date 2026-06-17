from sqlalchemy.orm import Session
from ..models import StatusTimeline


def create_timeline(
    db: Session,
    operation_type: str,
    status: str,
    previous_status: str = None,
    contract_id: int = None,
    bill_id: int = None,
    reconciliation_diff_id: int = None,
    exception_order_id: int = None,
    operator_id: int = None,
    remark: str = None,
):
    timeline = StatusTimeline(
        contract_id=contract_id,
        bill_id=bill_id,
        reconciliation_diff_id=reconciliation_diff_id,
        exception_order_id=exception_order_id,
        status=status,
        previous_status=previous_status,
        operator_id=operator_id,
        operation_type=operation_type,
        remark=remark,
    )
    db.add(timeline)
    db.commit()
    return timeline
