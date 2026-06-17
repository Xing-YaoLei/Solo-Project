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

    def _shift_date_sql(col):
        if settings.USE_SQLITE:
            return f"datetime({col}, :shift)"
        else:
            return f"{col} + CAST(:shift AS INTERVAL)"

    def _create_and_advance(title, desc, loc, cat, prio, creator, worker, stages, days_ago=0, photos=None, completion_photos=None):
        order = create_work_order(db, WorkOrderCreate(
            title=title,
            description=desc,
            location=loc,
            category=cat,
            priority=prio,
            reporter_name="报修人测试",
            reporter_phone="13800138000",
            photos=photos,
        ), creator)

        for stage in stages:
            if stage == "assign" and worker:
                order = assign_work_order(db, order.id, WorkOrderAssign(assigned_to=worker.id, remark="测试派工"), manager)
            elif stage == "start" and worker:
                order = start_work_order(db, order.id, worker, "开始处理")
            elif stage == "complete" and worker:
                complete_data = {"remark": "已处理完成"}
                if completion_photos:
                    complete_data["photos"] = completion_photos
                order = complete_work_order(db, order.id, WorkOrderComplete(**complete_data), worker)
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
            for col in ["created_at", "completed_at", "deadline", "closed_at"]:
                db.execute(text(f"UPDATE work_orders SET {col} = {_shift_date_sql(col)} WHERE id = :oid AND {col} IS NOT NULL"), params)
            db.execute(text(f"UPDATE status_logs SET created_at = {_shift_date_sql('created_at')} WHERE work_order_id = :oid"), params)
            db.execute(text(f"UPDATE review_records SET review_time = {_shift_date_sql('review_time')} WHERE work_order_id = :oid"), params)
            db.execute(text(f"UPDATE communications SET created_at = {_shift_date_sql('created_at')} WHERE work_order_id = :oid"), params)
            db.execute(text(f"UPDATE work_order_photos SET created_at = {_shift_date_sql('created_at')} WHERE work_order_id = :oid"), params)
            db.commit()
            db.refresh(order)

        return order

    sample_photos = {
        "corridor_light": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20office%20corridor%20with%20broken%20ceiling%20lights%2C%20dim%20lighting%2C%20realistic%20photo&image_size=square_hd", "caption": "三楼走廊灯不亮", "photo_type": "scene"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=broken%20fluorescent%20lamp%20fixture%20on%20ceiling%2C%20close%20up%2C%20realistic&image_size=square", "caption": "故障灯具特写", "photo_type": "scene"},
        ],
        "corridor_light_fixed": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20office%20corridor%20with%20new%20LED%20ceiling%20lights%2C%20well%20lit%2C%20realistic%20photo&image_size=square_hd", "caption": "更换LED灯管后照明恢复", "photo_type": "completion"},
        ],
        "ac_unit": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=office%20meeting%20room%20with%20ceiling%20air%20conditioner%2C%20warm%20uncomfortable%20atmosphere%2C%20realistic&image_size=square_hd", "caption": "会议室空调", "photo_type": "scene"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=air%20conditioner%20indoor%20unit%20displaying%20error%20code%2C%20close%20up%2C%20realistic&image_size=square", "caption": "空调控制面板显示异常", "photo_type": "scene"},
        ],
        "ac_unit_fixed": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AC%20technician%20repairing%20ceiling%20air%20conditioner%2C%20tools%20on%20table%2C%20cold%20air%20flowing%2C%20realistic&image_size=square_hd", "caption": "清洗滤网、补加冷媒后制冷恢复", "photo_type": "completion"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=air%20conditioner%20remote%20control%20showing%2022%20degrees%20celcius%2C%20close%20up%2C%20realistic&image_size=square", "caption": "遥控器显示22℃正常", "photo_type": "completion"},
        ],
        "fire_light": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20underground%20parking%20garage%20with%20broken%20emergency%20exit%20signs%2C%20dim%20red%20light%2C%20realistic&image_size=square_hd", "caption": "地下车库出口指示灯不亮", "photo_type": "scene"},
        ],
        "tile_falling": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=exterior%20building%20wall%20with%20loose%20and%20falling%20tiles%2C%20safety%20hazard%2C%20realistic%20photo&image_size=square_hd", "caption": "外墙瓷砖脱落", "photo_type": "scene"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=broken%20ceramic%20tile%20on%20ground%20near%20building%2C%20close%20up%2C%20realistic&image_size=square", "caption": "脱落的瓷砖碎块", "photo_type": "scene"},
        ],
        "tile_falling_fixed": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=worker%20on%20scaffold%20repairing%20building%20exterior%20wall%20tiles%2C%20safety%20harness%2C%20realistic&image_size=square_hd", "caption": "搭设脚手架重新粘贴瓷砖", "photo_type": "completion"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=repaired%20building%20exterior%20wall%20with%20new%20tiles%2C%20clean%20surface%2C%20realistic&image_size=square", "caption": "修复后外墙平整完好", "photo_type": "completion"},
        ],
        "water_leak": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=public%20restroom%20faucet%20leaking%20water%2C%20water%20dripping%2C%20realistic%20photo&image_size=square_hd", "caption": "水龙头滴水", "photo_type": "scene"},
        ],
        "water_leak_fixed": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=plumber%20replacing%20restroom%20faucet%20cartridge%2C%20wrench%20in%20hand%2C%20realistic&image_size=square_hd", "caption": "更换阀芯", "photo_type": "completion"},
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20bathroom%20faucet%20no%20leak%2C%20clean%20dry%20sink%2C%20close%20up%2C%20realistic&image_size=square", "caption": "修复后无漏水", "photo_type": "completion"},
        ],
        "pipe_burst": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=burst%20water%20pipe%20spraying%20water%20in%20garden%20irrigation%20system%2C%20realistic&image_size=square_hd", "caption": "喷灌水管爆裂", "photo_type": "scene"},
        ],
        "pipe_burst_fixed": [
            {"url": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gardener%20repairing%20irrigation%20pipe%20with%20pipe%20clamp%2C%20garden%20background%2C%20realistic&image_size=square_hd", "caption": "安装管箍修复漏水点", "photo_type": "completion"},
        ],
    }

    _create_and_advance(
        "1号楼走廊灯不亮", "三楼走廊三个灯不亮，晚上很黑",
        "1号楼3楼走廊", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start"], days_ago=0,
        photos=sample_photos["corridor_light"]
    )
    _create_and_advance(
        "2号楼卫生间漏水", "男卫生间水龙头一直在滴水",
        "2号楼2楼卫生间", WorkOrderCategory.PLUMBING, WorkOrderPriority.MEDIUM,
        manager, worker2, ["assign", "start", "complete"], days_ago=1,
        photos=sample_photos["water_leak"],
        completion_photos=sample_photos["water_leak_fixed"]
    )
    _create_and_advance(
        "3号楼空调不制冷", "会议室空调吹出来的风不冷",
        "3号楼5楼会议室", WorkOrderCategory.HVAC, WorkOrderPriority.HIGH,
        manager, worker1, ["assign", "start", "complete", "review_fail"], days_ago=2,
        photos=sample_photos["ac_unit"],
        completion_photos=sample_photos["ac_unit_fixed"]
    )
    _create_and_advance(
        "地下车库消防指示灯坏了", "B1层多个安全出口指示灯不亮",
        "地下车库B1层", WorkOrderCategory.ELECTRICAL, WorkOrderPriority.URGENT,
        manager, worker2, [], days_ago=0,
        photos=sample_photos["fire_light"]
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
        manager, worker2, ["assign", "start", "complete", "review_fail", "start", "complete"], days_ago=4,
        photos=sample_photos["tile_falling"],
        completion_photos=sample_photos["tile_falling_fixed"]
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
        manager, worker1, ["assign", "start", "complete", "review_pass"], days_ago=14,
        photos=sample_photos["pipe_burst"],
        completion_photos=sample_photos["pipe_burst_fixed"]
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
