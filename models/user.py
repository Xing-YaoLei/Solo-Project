from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from werkzeug.security import generate_password_hash, check_password_hash

from models.database import Base


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(64), nullable=True)
    role = Column(String(32), default="frontline", comment="management/frontline")
    assigned_zone = Column(String(256), nullable=True, comment="负责区域,多个用逗号分隔")
    phone = Column(String(32), nullable=True)
    email = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def zone_list(self):
        if not self.assigned_zone:
            return []
        return [z.strip() for z in self.assigned_zone.split(",") if z.strip()]

    @property
    def is_management(self) -> bool:
        return self.role == "management"
