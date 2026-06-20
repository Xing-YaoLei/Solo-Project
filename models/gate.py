from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from models.database import Base


class GateRecord(Base):
    __tablename__ = "gate_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("data_batches.id"), nullable=True)
    record_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(16), nullable=False, index=True)
    zone = Column(String(64), nullable=False, index=True)
    gate_id = Column(String(64), nullable=False)
    reservation_id = Column(String(128), nullable=True, index=True)
    ticket_type = Column(String(32), nullable=True, comment="票种: adult/child/student/senior")
    pass_type = Column(String(16), nullable=True, comment="in/out")
    passenger_name = Column(String(64), nullable=True)
    id_card_hash = Column(String(128), nullable=True)
    status = Column(String(16), default="success", comment="success/fail/refund")
    swiped_at = Column(DateTime, default=datetime.now, index=True)

    batch = relationship("DataBatch")
