from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import api_router
from app.services.user_service import init_default_users
from app.services.dispatch_service import create_dispatch_rule
from app.services.work_order_service import create_work_order, assign_work_order, start_work_order, complete_work_order, review_work_order, add_communication
from app.models import DispatchRule, WorkOrderCategory, WorkOrderPriority, UserRole, WorkOrderStatus
from app.schemas import DispatchRuleCreate, WorkOrderCreate, WorkOrderAssign, WorkOrderComplete, WorkOrderReview

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        init_default_users(db)
        _init_default_dispatch_rules(db)
        _init_sample_work_orders(db)
    finally:
        db.close()


def _init_default_dispatch_rules(db):
    from sqlalchemy import func
    from app.models import User
    count = db.query(func.count(DispatchRule.id)).scalar()
    if count == 0:
        worker1 = db.query(User).filter(User.username == "worker1").first()
        worker2 = db.query(User).filter(User.username == "worker2").first()
        rules = [
            {
                "name": "电气类-高优先级",
                "category": WorkOrderCategory.ELECTRICAL,
                "priority": WorkOrderPriority.HIGH,
                "processing_hours": 4,
                "description": "电气类高优先级工单，4小时内处理",
                "default_assignee_id": worker1.id if worker1 else None,
            },
            {
                "name": "电气类-普通",
                "category": WorkOrderCategory.ELECTRICAL,
                "priority": WorkOrderPriority.MEDIUM,
                "processing_hours": 24,
                "description": "电气类普通工单，24小时内处理",
            },
            {
                "name": "水暖类-普通",
                "category": WorkOrderCategory.PLUMBING,
                "priority": WorkOrderPriority.MEDIUM,
                "processing_hours": 24,
                "description": "水暖类普通工单，24小时内处理",
                "default_assignee_id": worker2.id if worker2 else None,
            },
            {
                "name": "空调类-普通",
                "category": WorkOrderCategory.HVAC,
                "priority": WorkOrderPriority.MEDIUM,
                "processing_hours": 48,
                "description": "空调类普通工单，48小时内处理",
            },
            {
                "name": "土建类-普通",
                "category": WorkOrderCategory.CIVIL,
                "priority": WorkOrderPriority.MEDIUM,
                "processing_hours": 72,
                "description": "土建类普通工单，72小时内处理",
            },
        ]
        for rule_data in rules:
            create_dispatch_rule(db, DispatchRuleCreate(**rule_data))


def _init_sample_work_orders(db):
    from sqlalchemy import func
    from app.models import WorkOrder, User

    count = db.query(func.count(WorkOrder.id)).scalar()
    if count > 0:
        return

    admin = db.query(User).filter(User.username == "admin").first()
    manager = db.query(User).filter(User.username == "manager").first()
    worker1 = db.query(User).filter(User.username == "worker1").first()
    worker2 = db.query(User).filter(User.username == "worker2").first()

    def _create_and_advance(title, desc, loc, cat, prio, creator, worker, stages, days_ago=0):
        order = create_work_order(db, WorkOrderCreate(
            title=title,
            description=desc,
            location=loc,
            category=cat,
            priority=prio,
            reporter_name="报修人测试",
            reporter_phone="13800138000",
        ), creator)

        for stage in stages:
            if stage == "assign" and worker:
                order = assign_work_order(db, order.id, WorkOrderAssign(assigned_to=worker.id, remark="测试派工"), manager)
            elif stage == "start" and worker:
                order = start_work_order(db, order.id, worker, "开始处理")
            elif stage == "complete" and worker:
                order = complete_work_order(db, order.id, WorkOrderComplete(remark="已处理完成"), worker)
            elif stage == "review_pass":
                order = review_work_order(db, order.id, WorkOrderReview(is_passed=True, comment="符合要求，通过"), manager)
            elif stage == "review_fail":
                order = review_work_order(db, order.id, WorkOrderReview(is_passed=False, comment="处理不合格，需要重新处理"), manager)
                add_communication(db, order.id, "这个地方还需要重新处理一下，主要是安全问题。", manager)
                add_communication(db, order.id, "收到，我马上回去重新处理。", worker)

        if days_ago > 0:
            from sqlalchemy import text
            shift = f"-{days_ago} days"
            params = {"oid": order.id, "shift": shift}
            for col in ["created_at", "assigned_at", "started_at", "completed_at", "deadline", "closed_at"]:
                db.execute(text(f"UPDATE work_orders SET {col} = datetime({col}, :shift) WHERE id = :oid AND {col} IS NOT NULL"), params)
            db.execute(text("UPDATE status_logs SET created_at = datetime(created_at, :shift) WHERE work_order_id = :oid"), params)
            db.execute(text("UPDATE review_records SET created_at = datetime(review_records.created_at, :shift) WHERE work_order_id = :oid"), params)
            db.execute(text("UPDATE communications SET created_at = datetime(communications.created_at, :shift) WHERE work_order_id = :oid"), params)
            db.commit()
            db.refresh(order)

        return order

    _create_and_advance(
        "1号楼走廊灯不亮", "三楼走廊三个灯不亮，晚上很黑",
        "1号楼3楼走廊", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start"], days_ago=0
    )
    _create_and_advance(
        "2号楼卫生间漏水", "男卫生间水龙头一直在滴水",
        "2号楼2楼卫生间", WorkOrderCategory.PLUMBING, WorkOrderPriority.MEDIUM,
        manager, worker2, ["assign", "start", "complete"], days_ago=1
    )
    _create_and_advance(
        "3号楼空调不制冷", "会议室空调吹出来的风不冷",
        "3号楼5楼会议室", WorkOrderCategory.HVAC, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_fail"], days_ago=2
    )
    _create_and_advance(
        "地下车库消防指示灯坏了", "B1层多个安全出口指示灯不亮",
        "地下车库B1层", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.URGENT,
        manager, worker2, [], days_ago=0
    )
    _create_and_advance(
        "园区路灯故障", "东门附近两个路灯不亮",
        "园区东门", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.MEDIUM,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=3
    )
    _create_and_advance(
        "办公室门锁损坏", "行政部办公室门锁无法正常关闭",
        "1号楼2楼行政部", WorkOrderCategory.CIVIL, WorkOrderPriority.MEDIUM,
        manager, worker2, ["assign", "start", "complete", "review_pass"], days_ago=5
    )
    _create_and_advance(
        "电梯轿厢照明异常", "3号电梯灯闪烁",
        "3号楼电梯", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=7
    )
    _create_and_advance(
        "外墙瓷砖脱落", "2号楼南侧墙面有瓷砖松动",
        "2号楼南外墙", WorkOrderCategory.CIVIL, WorkOrderPriority.URGENT,
        manager, worker2, ["assign", "start", "complete", "review_fail", "start", "complete"], days_ago=4
    )
    _create_and_advance(
        "茶水间饮水机故障", "无法加热，指示灯不亮",
        "1号楼4楼茶水间", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.LOW,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=10
    )
    _create_and_advance(
        "停车场道闸反应慢", "南门道闸抬杆慢，经常需要等很久",
        "园区南门", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.MEDIUM,
        manager, worker2, ["assign", "start", "complete", "review_pass"], days_ago=12
    )
    _create_and_advance(
        "绿化区水管爆裂", "西北角绿化喷灌水管漏水",
        "园区西北角绿化区", WorkOrderCategory.PLUMBING, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=14
    )
    _create_and_advance(
        "会议室投影不显示", "会议时投影突然无信号",
        "2号楼3楼大会议室", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.MEDIUM,
        manager, worker2, ["assign", "start", "complete", "review_pass"], days_ago=18
    )
    _create_and_advance(
        "消防通道杂物堆积", "安全通道有纸箱堆放，需要清理",
        "1号楼B1消防通道", WorkOrderCategory.CLEANING, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=20
    )
    _create_and_advance(
        "公共区域清洁", "大厅地面有污渍，需要彻底清洁",
        "1号楼1楼大厅", WorkOrderCategory.CLEANING, WorkOrderPriority.LOW,
        manager, worker2, ["assign", "start", "complete", "review_pass"], days_ago=22
    )
    _create_and_advance(
        "门禁系统刷卡无反应", "A栋大门门禁坏了",
        "A栋大门", WorkOrderCategory.SECURITY, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=25
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "服务运行正常"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
