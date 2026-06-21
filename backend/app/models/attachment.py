import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class AttachmentCategory(str, enum.Enum):
    CONTRACT = "contract"
    INVOICE = "invoice"
    RECEIPT = "receipt"
    POA = "poa"
    COURT_DOCUMENT = "court_document"
    EVIDENCE = "evidence"
    OTHER = "other"


class Attachment(BaseModel):
    __tablename__ = "attachments"

    quote_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("quotes.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    exception_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("exception_records.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    payment_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[AttachmentCategory] = mapped_column(Enum(AttachmentCategory), default=AttachmentCategory.OTHER)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    quote = relationship("Quote", back_populates="attachments")
