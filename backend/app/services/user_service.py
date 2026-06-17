from sqlalchemy.orm import Session
from typing import Optional, List

from ..models import User, UserRole
from ..schemas import UserCreate, UserUpdate
from ..core.security import get_password_hash, verify_password


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
) -> tuple[List[User], int]:
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users, total


def get_workers(db: Session) -> List[User]:
    return db.query(User).filter(
        User.role == UserRole.WORKER,
        User.is_active == True
    ).order_by(User.full_name).all()


def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        phone=user_in.phone,
        department=user_in.department,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def init_default_users(db: Session) -> None:
    admin = get_user_by_username(db, "admin")
    if not admin:
        create_user(db, UserCreate(
            username="admin",
            full_name="系统管理员",
            email="admin@example.com",
            password="admin123",
            role=UserRole.ADMIN,
            department="管理部",
        ))

    manager = get_user_by_username(db, "manager")
    if not manager:
        create_user(db, UserCreate(
            username="manager",
            full_name="张经理",
            email="manager@example.com",
            password="manager123",
            role=UserRole.MANAGER,
            department="运维部",
        ))

    worker1 = get_user_by_username(db, "worker1")
    if not worker1:
        create_user(db, UserCreate(
            username="worker1",
            full_name="李师傅",
            email="worker1@example.com",
            password="worker123",
            role=UserRole.WORKER,
            phone="13800138001",
            department="维修班",
        ))

    worker2 = get_user_by_username(db, "worker2")
    if not worker2:
        create_user(db, UserCreate(
            username="worker2",
            full_name="王师傅",
            email="worker2@example.com",
            password="worker123",
            role=UserRole.WORKER,
            phone="13800138002",
            department="维修班",
        ))
