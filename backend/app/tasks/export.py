from ..celery_app import celery
from sqlalchemy.orm import Session
import pandas as pd
from datetime import datetime
from ..database import SessionLocal
from ..models.models import Order
from ..config import settings
import os


@celery.task
def export_orders_to_excel(filters: dict, user_id: int):
    db: Session = SessionLocal()
    try:
        query = db.query(Order)

        if filters.get("status"):
            query = query.filter(Order.status == filters["status"])
        if filters.get("assignee_id"):
            query = query.filter(Order.assignee_id == filters["assignee_id"])
        if filters.get("start_date"):
            query = query.filter(Order.created_at >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(Order.created_at <= filters["end_date"])

        orders = query.all()

        data = []
        for order in orders:
            assignee = order.assignee.full_name if order.assignee else ""
            creator = order.creator.full_name if order.creator else ""
            dispatch_rule = order.dispatch_rule.name if order.dispatch_rule else ""

            data.append({
                "工单号": order.order_no,
                "标题": order.title,
                "描述": order.description or "",
                "状态": order.status,
                "优先级": order.priority,
                "审计类型": order.audit_type or "",
                "审计项": order.audit_item or "",
                "位置": order.location or "",
                "派工规则": dispatch_rule,
                "处理人": assignee,
                "创建人": creator,
                "截止时间": order.deadline.strftime("%Y-%m-%d %H:%M:%S") if order.deadline else "",
                "首次解决": "是" if order.first_resolved else "否",
                "处理次数": order.processing_count,
                "创建时间": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            })

        df = pd.DataFrame(data)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"orders_export_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        df.to_excel(filepath, index=False, engine="openpyxl")

        print(f"[导出] 用户 {user_id} 导出工单数据，文件: {filepath}")

        download_url = f"/uploads/{filename}"

        return {"status": "completed", "filepath": filepath, "filename": filename, "url": download_url, "count": len(orders)}
    finally:
        db.close()
