from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from .database import engine, Base, SessionLocal
from .config import settings
from .models import User, ApprovalNode
from .utils.auth import get_password_hash
from .routers import auth, contracts, reconciliation, bills, approval, exceptions, timelines, exports, validation


def create_tables():
    Base.metadata.create_all(bind=engine)


def init_test_data():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(
                    username="admin",
                    email="admin@example.com",
                    full_name="系统管理员",
                    hashed_password=get_password_hash("admin123"),
                    role="admin",
                    department="IT部",
                    is_active=True
                ),
                User(
                    username="manager",
                    email="manager@example.com",
                    full_name="项目经理",
                    hashed_password=get_password_hash("manager123"),
                    role="manager",
                    department="项目部",
                    is_active=True
                ),
                User(
                    username="sales",
                    email="sales@example.com",
                    full_name="销售人员",
                    hashed_password=get_password_hash("sales123"),
                    role="sales",
                    department="销售部",
                    is_active=True
                ),
                User(
                    username="designer",
                    email="designer@example.com",
                    full_name="设计师",
                    hashed_password=get_password_hash("designer123"),
                    role="designer",
                    department="设计部",
                    is_active=True
                ),
                User(
                    username="finance",
                    email="finance@example.com",
                    full_name="财务人员",
                    hashed_password=get_password_hash("finance123"),
                    role="finance",
                    department="财务部",
                    is_active=True
                ),
                User(
                    username="user",
                    email="user@example.com",
                    full_name="普通用户",
                    hashed_password=get_password_hash("user123"),
                    role="user",
                    department="业务部",
                    is_active=True
                ),
            ]
            db.add_all(users)
            db.commit()
            print("测试用户数据初始化完成")

        if db.query(ApprovalNode).count() == 0:
            admin = db.query(User).filter(User.username == "admin").first()
            manager = db.query(User).filter(User.username == "manager").first()
            finance = db.query(User).filter(User.username == "finance").first()

            approval_nodes = [
                ApprovalNode(
                    node_name="项目主管审批",
                    node_code="PROJECT_MANAGER_APPROVAL",
                    approver_role="manager",
                    approver_id=manager.id if manager else None,
                    approval_type="and",
                    sort_order=1,
                    is_active=1,
                    description="项目主管对账单进行初步审核"
                ),
                ApprovalNode(
                    node_name="财务审核",
                    node_code="FINANCE_REVIEW",
                    approver_role="finance",
                    approver_id=finance.id if finance else None,
                    approval_type="and",
                    sort_order=2,
                    is_active=1,
                    description="财务人员对金额进行审核"
                ),
                ApprovalNode(
                    node_name="总经理审批",
                    node_code="GENERAL_MANAGER_APPROVAL",
                    approver_role="admin",
                    approver_id=admin.id if admin else None,
                    approval_type="and",
                    sort_order=3,
                    is_active=1,
                    description="总经理最终审批"
                ),
            ]
            db.add_all(approval_nodes)
            db.commit()
            print("审批节点数据初始化完成")

    except Exception as e:
        db.rollback()
        print(f"初始化测试数据失败: {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="家装管理系统 API",
        description="家装项目合同、账单、对账管理系统后端API",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(contracts.router)
    app.include_router(reconciliation.router)
    app.include_router(bills.router)
    app.include_router(approval.router)
    app.include_router(exceptions.router)
    app.include_router(timelines.router)
    app.include_router(exports.router)
    app.include_router(validation.router)

    @app.get("/health", tags=["系统"])
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }

    @app.get("/", tags=["系统"])
    async def root():
        return {
            "message": "家装管理系统 API",
            "version": "1.0.0",
            "docs": "/docs"
        }

    return app


create_tables()
init_test_data()

app = create_app()
