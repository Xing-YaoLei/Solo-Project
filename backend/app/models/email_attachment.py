from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.invoice import Invoice


class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    message_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sender: Mapped[str | None] = mapped_column(String(255), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    linked_invoice_id: Mapped[UUID | None] = mapped_column(ForeignKey("invoices.id"), nullable=True)

    linked_invoice: Mapped[Invoice | None] = relationship("Invoice")
