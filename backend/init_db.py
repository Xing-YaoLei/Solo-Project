from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models.models import User, UserRole, DispatchRule
from app.auth import get_password_hash

Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

try:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@example.com",
            full_name="系统管理员",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            phone="13800138000",
            department="信息部",
        )
        db.add(admin)

    auditor = db.query(User).filter(User.username == "auditor").first()
    if not auditor:
        auditor = User(
            username="auditor",
            email="auditor@example.com",
            full_name="审计员张三",
            hashed_password=get_password_hash("auditor123"),
            role=UserRole.AUDITOR,
            phone="13800138001",
            department="审计部",
        )
        db.add(auditor)

    handler = db.query(User).filter(User.username == "handler").first()
    if not handler:
        handler = User(
            username="handler",
            email="handler@example.com",
            full_name="处理员李四",
            hashed_password=get_password_hash("handler123"),
            role=UserRole.HANDLER,
            phone="13800138002",
            department="运维部",
        )
        db.add(handler)

    reviewer = db.query(User).filter(User.username == "reviewer").first()
    if not reviewer:
        reviewer = User(
            username="reviewer",
            email="reviewer@example.com",
            full_name="复核员王五",
            hashed_password=get_password_hash("reviewer123"),
            role=UserRole.REVIEWER,
            phone="13800138003",
            department="质量部",
        )
        db.add(reviewer)

    db.commit()

    default_rule = db.query(DispatchRule).filter(DispatchRule.name == "默认派工规则").first()
    if not default_rule:
        default_rule = DispatchRule(
            name="默认派工规则",
            description="系统默认派工规则，适用于一般合规问题",
            department="运维部",
            default_assignee_id=handler.id if handler else 3,
            priority=0,
            handling_time_limit=24,
            is_active=True,
        )
        db.add(default_rule)

    high_priority_rule = db.query(DispatchRule).filter(DispatchRule.name == "高优先级派工规则").first()
    if not high_priority_rule:
        high_priority_rule = DispatchRule(
            name="高优先级派工规则",
            description="高优先级合规问题，4小时内处理",
            department="运维部",
            default_assignee_id=handler.id if handler else 3,
            priority=10,
            handling_time_limit=4,
            is_active=True,
        )
        db.add(high_priority_rule)

    db.commit()
    print("数据库初始化完成！")
    print("默认账号: admin / admin123")
    print("审计员账号: auditor / auditor123")
    print("处理员账号: handler / handler123")
    print("复核员账号: reviewer / reviewer123")
finally:
    db.close()
