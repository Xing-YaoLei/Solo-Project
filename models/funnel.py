from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship

from models.database import Base


class ReservationFunnel(Base):
    __tablename__ = "reservation_funnel"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("data_batches.id"), nullable=True)
    funnel_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(16), nullable=False, index=True)
    zone = Column(String(64), nullable=False, index=True)

    reservation_count = Column(Integer, default=0, comment="预约数量")
    reminder_sent = Column(Integer, default=0, comment="已发提醒")
    reminder_confirmed = Column(Integer, default=0, comment="提醒后确认")
    checked_in = Column(Integer, default=0, comment="已检票入场")
    in_zone = Column(Integer, default=0, comment="到达区域内(摄像头)")
    consumed = Column(Integer, default=0, comment="已消费(商户)")
    cancelled = Column(Integer, default=0, comment="取消预约")
    no_show = Column(Integer, default=0, comment="未到场")

    checkin_rate = Column(Numeric(5, 4), default=0, comment="到场率=checked_in/reservation")
    in_zone_rate = Column(Numeric(5, 4), default=0, comment="到区域率=in_zone/reservation")
    conversion_rate = Column(Numeric(5, 4), default=0, comment="消费转化率=consumed/checked_in")

    arrival_status = Column(String(16), nullable=True, comment="normal/warning/critical")
    reminder_list = Column(Text, nullable=True, comment="需重点提醒的预约单号JSON数组")
    remark = Column(Text, nullable=True, comment="时段冲突等说明")

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    batch = relationship("DataBatch")
