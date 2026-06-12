from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class RectificationTask(Base):
    __tablename__ = "rectification_tasks_backup"

    id = Column(Integer, primary_key=True, index=True)
