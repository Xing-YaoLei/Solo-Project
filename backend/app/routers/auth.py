from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from app.security import verify_password, create_access_token, get_password_hash, get_current_user, require_role
from app.config import settings

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role,
            "user_id": user.id,
            "store_id": user.store_id
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    hashed_password = get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        store_id=user_in.store_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/me", response_model=schemas.UserWithStore)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_data = schemas.UserWithStore.model_validate(current_user)
    if current_user.store:
        user_data.store_name = current_user.store.name
    return user_data


@router.get("/users", response_model=list[schemas.UserWithStore])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: models.UserRole = None,
    store_id: int = None,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    if store_id:
        query = query.filter(models.User.store_id == store_id)
    users = query.offset(skip).limit(limit).all()
    result = []
    for user in users:
        user_data = schemas.UserWithStore.model_validate(user)
        if user.store:
            user_data.store_name = user.store.name
        result.append(user_data)
    return result


@router.post("/init-data")
def init_test_data(db: Session = Depends(get_db)):
    if db.query(models.Store).count() > 0:
        return {"message": "Data already initialized"}

    stores = [
        models.Store(code="ST001", name="南京东路店", city="上海", address="南京东路100号", monthly_sales_target=100000),
        models.Store(code="ST002", name="人民广场店", city="上海", address="人民广场200号", monthly_sales_target=120000),
        models.Store(code="ST003", name="陆家嘴店", city="上海", address="陆家嘴环路300号", monthly_sales_target=150000),
        models.Store(code="ST004", name="西湖店", city="杭州", address="西湖区文三路100号", monthly_sales_target=90000),
        models.Store(code="ST005", name="观前街店", city="苏州", address="观前街150号", monthly_sales_target=80000),
    ]
    db.add_all(stores)
    db.flush()

    manager = models.User(
        username="manager",
        email="manager@coffee.com",
        hashed_password=get_password_hash("123456"),
        full_name="张经理",
        role=models.UserRole.MANAGER,
        phone="13800138000"
    )
    db.add(manager)
    db.flush()

    staffs = [
        models.User(username="staff1", email="staff1@coffee.com", hashed_password=get_password_hash("123456"),
                    full_name="李店员", role=models.UserRole.STAFF, phone="13800138001", store_id=1),
        models.User(username="staff2", email="staff2@coffee.com", hashed_password=get_password_hash("123456"),
                    full_name="王店员", role=models.UserRole.STAFF, phone="13800138002", store_id=2),
        models.User(username="staff3", email="staff3@coffee.com", hashed_password=get_password_hash("123456"),
                    full_name="赵店员", role=models.UserRole.STAFF, phone="13800138003", store_id=3),
        models.User(username="staff4", email="staff4@coffee.com", hashed_password=get_password_hash("123456"),
                    full_name="陈店员", role=models.UserRole.STAFF, phone="13800138004", store_id=4),
        models.User(username="staff5", email="staff5@coffee.com", hashed_password=get_password_hash("123456"),
                    full_name="刘店员", role=models.UserRole.STAFF, phone="13800138005", store_id=5),
    ]
    db.add_all(staffs)
    db.flush()

    from datetime import datetime, timedelta
    now = datetime.now()

    reports = [
        models.LossReport(
            report_no=f"LR{now.strftime('%Y%m%d')}000001",
            title="牛奶原料报损",
            category=models.LossCategory.RAW_MATERIAL,
            loss_date=now - timedelta(days=2),
            cost_amount=1500.00,
            sale_amount=3000.00,
            quantity=50,
            unit="L",
            description="冷链运输故障导致牛奶变质",
            store_id=1,
            created_by=2,
            responsible_staff_id=2,
            status=models.LossStatus.PENDING_REVIEW,
            is_abnormal=False,
            loss_rate=1.5,
        ),
        models.LossReport(
            report_no=f"LR{now.strftime('%Y%m%d')}000002",
            title="咖啡机故障咖啡豆报损",
            category=models.LossCategory.RAW_MATERIAL,
            loss_date=now - timedelta(days=1),
            cost_amount=800.00,
            sale_amount=1600.00,
            quantity=20,
            unit="kg",
            description="咖啡机压力不稳定导致咖啡豆萃取失败",
            store_id=1,
            created_by=2,
            responsible_staff_id=2,
            status=models.LossStatus.REVIEWED,
            is_abnormal=False,
            loss_rate=0.8,
        ),
        models.LossReport(
            report_no=f"LR{now.strftime('%Y%m%d')}000003",
            title="月饼礼盒过期报损",
            category=models.LossCategory.FINISHED_PRODUCT,
            loss_date=now,
            cost_amount=6000.00,
            sale_amount=12000.00,
            quantity=100,
            unit="盒",
            description="中秋礼盒未及时销售过期，金额较大",
            store_id=1,
            created_by=2,
            responsible_staff_id=2,
            status=models.LossStatus.FOLLOWING,
            is_abnormal=True,
            abnormal_type=models.AbnormalType.LARGE_AMOUNT,
            loss_rate=6.0,
        ),
        models.LossReport(
            report_no=f"LR{now.strftime('%Y%m%d')}000004",
            title="打包杯破损",
            category=models.LossCategory.PACKAGING,
            loss_date=now - timedelta(days=3),
            cost_amount=500.00,
            sale_amount=1000.00,
            quantity=500,
            unit="个",
            description="仓库搬运时打包杯箱子掉落破损",
            store_id=2,
            created_by=3,
            responsible_staff_id=3,
            status=models.LossStatus.PENDING_APPROVAL,
            is_abnormal=False,
            loss_rate=0.4,
        ),
        models.LossReport(
            report_no=f"LR{now.strftime('%Y%m%d')}000005",
            title="冰淇淋机故障原料报损",
            category=models.LossCategory.EQUIPMENT,
            loss_date=now - timedelta(days=5),
            cost_amount=2500.00,
            sale_amount=5000.00,
            quantity=1,
            unit="台",
            description="冰淇淋机压缩机损坏，维修期间原料融化",
            store_id=3,
            created_by=4,
            responsible_staff_id=4,
            status=models.LossStatus.APPROVED,
            is_abnormal=False,
            loss_rate=1.7,
        ),
    ]
    db.add_all(reports)
    db.flush()

    reviews = [
        models.Review(
            review_opinion="经核实，冷链运输故障属于不可抗力因素，责任认定合理，建议后续加强运输环节监控。",
            result=models.ReviewResult.CONFIRMED,
            verified_amount=1500.00,
            cost_verified=True,
            store_verified=True,
            follow_up_days=3,
            loss_report_id=2,
            reviewer_id=1,
            review_time=now - timedelta(days=1, hours=2),
        ),
        models.Review(
            review_opinion="金额较大，需要责任人跟进整改，查明具体原因并提交改进措施。",
            result=models.ReviewResult.NEEDS_FOLLOW_UP,
            verified_amount=6000.00,
            cost_verified=True,
            store_verified=True,
            follow_up_days=7,
            loss_report_id=3,
            reviewer_id=1,
            review_time=now - timedelta(hours=5),
        ),
        models.Review(
            review_opinion="搬运操作不规范导致的破损，建议加强仓库管理培训。",
            result=models.ReviewResult.CONFIRMED,
            verified_amount=500.00,
            cost_verified=True,
            store_verified=True,
            follow_up_days=3,
            loss_report_id=4,
            reviewer_id=1,
            review_time=now - timedelta(days=2, hours=3),
        ),
        models.Review(
            review_opinion="设备故障属于正常损耗，已安排维修，同意上报审批。",
            result=models.ReviewResult.CONFIRMED,
            verified_amount=2500.00,
            cost_verified=True,
            store_verified=True,
            follow_up_days=3,
            loss_report_id=5,
            reviewer_id=1,
            review_time=now - timedelta(days=4, hours=6),
        ),
    ]
    db.add_all(reviews)
    db.flush()

    approvals = [
        models.Approval(
            approval_opinion="情况属实，设备故障不可避免，同意报损。后续请定期检查设备状态。",
            result=models.ApprovalResult.APPROVED,
            loss_report_id=5,
            approver_id=1,
            approval_time=now - timedelta(days=3, hours=10),
        ),
    ]
    db.add_all(approvals)
    db.flush()

    communications = [
        models.Communication(
            message="已联系供应商，他们承认运输过程中温控设备出现问题，愿意承担50%损失。",
            message_type="comment",
            loss_report_id=1,
            sender_id=2,
            created_at=now - timedelta(days=1, hours=20),
        ),
        models.Communication(
            message="好的，收到。请与供应商保持沟通，尽快落实赔偿事宜。",
            message_type="comment",
            loss_report_id=1,
            sender_id=1,
            created_at=now - timedelta(days=1, hours=18),
        ),
        models.Communication(
            message="正在盘点剩余库存，预计明天可以完成整改报告。",
            message_type="comment",
            loss_report_id=3,
            sender_id=2,
            created_at=now - timedelta(hours=3),
        ),
        models.Communication(
            message="好的，请在整改报告中说明改进措施，避免类似问题再次发生。",
            message_type="comment",
            loss_report_id=3,
            sender_id=1,
            created_at=now - timedelta(hours=2),
        ),
    ]
    db.add_all(communications)
    db.flush()

    todo_items = [
        models.TodoItem(
            title="跟进报损单: 牛奶原料报损",
            description="复核意见: 经核实，冷链运输故障属于不可抗力因素，责任认定合理。",
            loss_report_id=1,
            assignee_id=2,
            created_by=1,
            is_completed=False,
        ),
        models.TodoItem(
            title="跟进报损单: 月饼礼盒过期报损（异常）",
            description="复核意见: 金额较大，需要责任人跟进整改，查明具体原因并提交改进措施。",
            loss_report_id=3,
            assignee_id=2,
            created_by=1,
            is_completed=False,
        ),
        models.TodoItem(
            title="提交报损单整改报告",
            description="针对月饼礼盒过期问题，提交改进措施和预防方案。",
            loss_report_id=3,
            assignee_id=2,
            created_by=1,
            is_completed=False,
        ),
    ]
    db.add_all(todo_items)

    db.commit()

    return {"message": "Test data initialized successfully",
            "accounts": {
                "manager": {"username": "manager", "password": "123456"},
                "staff": {"username": "staff1", "password": "123456"}
            },
            "data_summary": {
                "stores": 5,
                "users": 6,
                "loss_reports": 5,
                "reviews": 4,
                "approvals": 1,
                "communications": 4,
                "todo_items": 3,
            }}
