from sqlalchemy.orm import Session
from app.models import ShortageOrder, ShortageActionLog
from app.schemas.shortage_order import ShortageHandleRequest
from app.models import User


def handle_shortage(
    db: Session,
    order: ShortageOrder,
    data: ShortageHandleRequest,
    current_user: User,
):
    action = data.action
    status_map = {
        "supplement": "supplemented",
        "retry": "processing",
        "close": "closed",
    }
    new_status = status_map.get(action)
    if new_status:
        order.status = new_status

    log = ShortageActionLog(
        shortage_order_id=order.id,
        action=action,
        operator_id=current_user.id,
        operator=current_user.full_name,
        remark=data.remark,
        supplement_quantity=data.supplement_quantity,
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order
