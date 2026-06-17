from datetime import datetime, timedelta
from typing import Optional, Union
import base64
import hashlib
import hmac
from jose import jwt

from app.core.config import settings

try:
    import bcrypt
    _HAS_BCRYPT = True
except ImportError:
    _HAS_BCRYPT = False

ALGORITHM = "HS256"


def _hash_password_pbkdf2(password: str) -> str:
    salt = hashlib.sha256(password.encode()).digest()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return "pbkdf2$" + base64.b64encode(dk).decode()


def _verify_password_pbkdf2(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith("pbkdf2$"):
        return False
    stored_hash = hashed_password.split("$", 1)[1]
    salt = hashlib.sha256(plain_password.encode()).digest()
    dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt, 100000)
    computed_hash = base64.b64encode(dk).decode()
    return hmac.compare_digest(stored_hash, computed_hash)


def create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    if additional_claims:
        to_encode.update(additional_claims)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
        if _HAS_BCRYPT:
            try:
                return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
            except Exception:
                return False
        return False
    if hashed_password.startswith("pbkdf2$"):
        return _verify_password_pbkdf2(plain_password, hashed_password)
    return False


def get_password_hash(password: str) -> str:
    if _HAS_BCRYPT:
        try:
            return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
        except Exception:
            pass
    return _hash_password_pbkdf2(password)
