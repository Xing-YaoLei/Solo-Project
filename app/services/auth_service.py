from __future__ import annotations

from datetime import datetime
import hashlib
import yaml
import bcrypt
from pathlib import Path

from app.config import settings


class AuthService:
    def __init__(self) -> None:
        self._users_config: dict | None = None

    @property
    def users_config(self) -> dict:
        if self._users_config is None:
            with open(settings.streamlit_users_file, "r", encoding="utf-8") as f:
                self._users_config = yaml.safe_load(f)
        return self._users_config

    def verify_credentials(self, username: str, password: str) -> bool:
        creds = self.users_config.get("credentials", {})
        if username not in creds:
            return False
        stored_hash = creds[username].get("password", "")
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        except (ValueError, TypeError):
            return False

    def get_role(self, username: str) -> str:
        creds = self.users_config.get("credentials", {})
        if username not in creds:
            return "guest"
        roles_cfg = self.users_config.get("roles", {})
        if username in roles_cfg and "overview" in roles_cfg[username]:
            return "admin"
        if username == "admin":
            return "admin"
        if username in roles_cfg:
            return "staff"
        staff_users = [k for k in creds.keys() if k != "admin"]
        if username in staff_users:
            return "staff"
        return "guest"

    def get_allowed_stores(self, username: str) -> list[str] | None:
        role = self.get_role(username)
        if role == "admin":
            return None
        creds = self.users_config.get("credentials", {})
        user_info = creds.get(username, {})
        name = user_info.get("name", "")
        stores = []
        for store_id in ["store_01", "store_02", "store_03"]:
            if store_id.replace("store_", "") in name or store_id in name:
                stores.append(store_id)
        if not stores:
            parts = name.split("-")
            if len(parts) > 1:
                stores.append(parts[-1].lower().replace("门店", "store_"))
        return stores if stores else ["store_01"]

    def get_allowed_pharmacist_ids(self, username: str) -> list[str] | None:
        role = self.get_role(username)
        if role == "admin":
            return None
        return [username]

    def can_access_overview(self, username: str) -> bool:
        return self.get_role(username) == "admin"

    def can_access_analysis(self, username: str) -> bool:
        return self.get_role(username) == "admin"

    def can_access_followup(self, username: str) -> bool:
        return self.get_role(username) in ("admin", "staff")

    def can_annotate_prescription(self, username: str) -> bool:
        return self.get_role(username) in ("admin", "staff")

    def can_import_data(self, username: str) -> bool:
        return self.get_role(username) == "admin"

    @staticmethod
    def generate_annotation_id(prescription_id: str, pharmacist_id: str) -> str:
        raw = f"{prescription_id}_{pharmacist_id}_{datetime.now().isoformat()}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]
