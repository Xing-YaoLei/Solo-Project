from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_code = Column(String(50), unique=True, nullable=False, index=True, comment="教室编号")
    building = Column(String(100), comment="教学楼")
    room_number = Column(String(20), comment="房间号")
    room_type = Column(String(50), comment="教室类型")
    capacity = Column(Integer, default=0, comment="容量")
    equipment = Column(String(500), comment="设备")
    building_floor = Column(Integer, comment="楼层")
    area = Column(String(20), comment="校区")
    is_active = Column(Boolean, default=True, comment="是否可用")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    schedules = relationship("Schedule", back_populates="classroom")
    conflicts = relationship("ClassroomConflict", back_populates="classroom")

    def to_dict(self):
        return {
            "id": self.id,
            "room_code": self.room_code,
            "building": self.building,
            "room_number": self.room_number,
            "room_type": self.room_type,
            "capacity": self.capacity,
            "equipment": self.equipment,
            "building_floor": self.building_floor,
            "area": self.area,
            "is_active": self.is_active,
            "remark": self.remark,
        }
