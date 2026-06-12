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
    db.commit()

    return {"message": "Test data initialized successfully",
            "accounts": {
                "manager": {"username": "manager", "password": "123456"},
                "staff": {"username": "staff1", "password": "123456"}
            }}
