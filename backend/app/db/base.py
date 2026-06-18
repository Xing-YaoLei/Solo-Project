from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func, TIMESTAMP
from datetime import datetime
import uuid

try:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    TIMESTAMPTZ = TIMESTAMP(timezone=True)
except Exception:
    PG_UUID = None
    TIMESTAMPTZ = TIMESTAMP(timezone=True)

try:
    from sqlalchemy.dialects.postgresql import UUID
except Exception:
    UUID = None


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class UUIDPrimaryKeyMixin:
    try:
        id: Mapped[uuid.UUID] = mapped_column(
            UUID(as_uuid=True) if UUID else String(36),
            primary_key=True,
            default=uuid.uuid4,
        )
    except Exception:
        id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


from sqlalchemy import String
