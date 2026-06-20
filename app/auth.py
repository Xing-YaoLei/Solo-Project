from datetime import datetime
from typing import Optional, Dict, Any

from flask import session
from models.database import SessionLocal
from models import UserAccount


class AuthContext:
    @staticmethod
    def login(username: str, password: str) -> Optional[UserAccount]:
        db = SessionLocal()
        try:
            user = db.query(UserAccount).filter(
                UserAccount.username == username,
                UserAccount.is_active == True,
            ).first()
            if user and user.check_password(password):
                user.last_login = datetime.now()
                db.commit()
                return user
            return None
        finally:
            db.close()

    @staticmethod
    def set_session_user(user: UserAccount) -> None:
        session["user_id"] = user.id
        session["username"] = user.username
        session["full_name"] = user.full_name or user.username
        session["role"] = user.role
        session["assigned_zone"] = user.assigned_zone or ""

    @staticmethod
    def clear_session() -> None:
        session.clear()

    @staticmethod
    def get_current_user() -> Dict[str, Any]:
        return {
            "user_id": session.get("user_id"),
            "username": session.get("username"),
            "full_name": session.get("full_name"),
            "role": session.get("role", "frontline"),
            "assigned_zone": session.get("assigned_zone", ""),
            "is_authenticated": session.get("user_id") is not None,
            "is_management": session.get("role") == "management",
        }

    @staticmethod
    def get_accessible_zones() -> list:
        user = AuthContext.get_current_user()
        if user["is_management"]:
            return None
        zones = user.get("assigned_zone", "")
        if not zones:
            return []
        return [z.strip() for z in zones.split(",") if z.strip()]
