from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .api import api_router
from .services.user_service import init_default_users
from .services.dispatch_service import create_dispatch_rule
from .models import DispatchRule, WorkOrderCategory, WorkOrderPriority

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
    finally:
        db.close()


def _init_default_dispatch_rules(db):
    from sqlalchemy import func
    count = db.query(func.count(DispatchRule.id)).scalar()
    if count == 0:
        rules = [
            {
                "name": "电气类-高优先级",
                "category": WorkOrderCategory.ELECTRICAL,
                "priority": WorkOrderPriority.HIGH,
                "processing_hours": 4,
                "description": "电气类高优先级工单，4小时内处理",
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
            create_dispatch_rule(db, DispatchRule(**rule_data))


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "服务运行正常"}
